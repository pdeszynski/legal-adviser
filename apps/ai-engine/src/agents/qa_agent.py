"""Q&A Agent using PydanticAI with tool-based architecture.

This agent implements legal question answering using PydanticAI's tool system
for context retrieval and citation formatting.

Langfuse integration follows the official pattern:
- Uses instrument=True for automatic OpenTelemetry tracing
- Traces are automatically exported to Langfuse
- See: https://langfuse.com/integrations/frameworks/pydantic-ai

Enhanced with structured error handling and retry logic.

Conversation History Support:
This agent accepts conversation_history parameter containing previous messages.
History format: [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
The agent uses this context to provide answers that reference previous exchanges.
"""

import logging
from typing import Any

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel

from ..auth import UserContext
from ..config import get_settings

logger = logging.getLogger(__name__)
from ..exceptions import (
    AgentExecutionError,
    LLMContextLengthExceededError,
    LLMTimeoutError,
    RetrievalError,
)
from ..langfuse_init import (
    _redact_dict_pii,
    is_langfuse_enabled,
    update_current_trace,
)
from .clarification_agent import generate_clarifications
from .dependencies import ModelDeps, get_model_deps_with_user, get_openai_client
from .rag_tool import (
    extract_citations_from_contexts,
    format_contexts_for_prompt,
    retrieve_context_tool,
)

# -----------------------------------------------------------------------------
# Output Models
# -----------------------------------------------------------------------------


class RetrievedContext(BaseModel):
    """A retrieved context chunk from the vector store."""

    content: str = Field(..., description="Content of the retrieved chunk")
    source: str = Field(..., description="Source of the content")
    article: str | None = Field(default=None, description="Article or section")
    similarity: float = Field(..., description="Similarity score", ge=0.0, le=1.0)
    url: str | None = Field(default=None, description="URL to the source")


class LegalCitation(BaseModel):
    """A legal citation reference."""

    source: str = Field(..., description="Source of the citation")
    article: str = Field(..., description="Article or section number")
    url: str | None = Field(default=None, description="URL to the source")


class QAResult(BaseModel):
    """Result from the Q&A agent."""

    answer: str = Field(..., description="The answer to the legal question")
    citations: list[LegalCitation] = Field(
        default_factory=list, description="Legal citations supporting the answer"
    )
    confidence: float = Field(
        ...,
        description="Confidence score of the answer",
        ge=0.0,
        le=1.0,
    )
    query_type: str = Field(
        ..., description="Type of query (statute_interpretation, case_law, etc.)"
    )
    key_terms: list[str] = Field(
        default_factory=list, description="Key legal terms extracted"
    )


class QueryAnalysis(BaseModel):
    """Result of query analysis."""

    query_type: str = Field(
        ...,
        description="One of: statute_interpretation, case_law, procedural, general_advice",
    )
    key_terms: list[str] = Field(..., description="Important legal terms (3-5 terms)")
    question_refined: str = Field(..., description="Expanded question for search")
    needs_clarification: bool = Field(
        ..., description="Whether clarification is needed"
    )
    clarification_prompt: str | None = Field(
        default=None, description="Prompt if clarification is needed"
    )


# -----------------------------------------------------------------------------
# Agents
# -----------------------------------------------------------------------------
# Note: retrieve_context_tool is now imported from rag_tool module
# and provides real vector search via the backend's VectorStoreService


QUERY_ANALYZER_SYSTEM_PROMPT = """You are a legal query analyzer. Analyze the user's question and provide:
1. query_type: One of "statute_interpretation", "case_law", "procedural", "general_advice"
2. key_terms: List of important legal terms (3-5 terms)
3. question_refined: An expanded version of the question for better semantic search
4. needs_clarification: boolean - true if the question is too vague
5. clarification_prompt: null unless needs_clarification is true

Be precise and practical. Focus on extracting the core legal concepts."""

QA_SYSTEM_PROMPT_LAWYER = """You are an expert Polish lawyer (Radca Prawny) providing detailed legal Q&A.

Your task is to provide comprehensive legal answers with:
- Detailed analysis with references to specific articles and case law
- Professional legal terminology
- Consideration of multiple legal perspectives
- Clear identification of relevant legal principles

Important guidelines:
- Base your answer on the provided legal context
- Use proper Polish legal terminology and citations
- If the context is insufficient, explicitly state what additional information is needed
- Reference specific articles from relevant codes (Civil Code, Labor Code, etc.)
- Consider both statutory law and case law
- Provide nuanced analysis suitable for legal professionals

Your output should be structured, precise, and immediately useful for legal professionals."""

QA_SYSTEM_PROMPT_SIMPLE = """You are an expert Polish lawyer (Radca Prawny) providing legal Q&A to the general public.

Your task is to provide clear, accessible legal answers with:
- Simplified explanations suitable for laypersons
- Avoiding excessive legal jargon
- Practical, actionable advice
- Clear identification of key legal issues

Important guidelines:
- Base your answer on the provided legal context
- Explain legal concepts in plain language
- If the context is insufficient, explicitly state what additional information is needed
- Reference specific articles from relevant codes when available
- Provide practical guidance for the user's situation
- Recommend consulting a qualified lawyer for complex matters

Your output should be clear, helpful, and easy to understand for non-lawyers."""


# Global agent instances (lazy-loaded)
_query_analyzer_agent: Agent[QueryAnalysis, ModelDeps] | None = None
_qa_agent_lawyer: Agent[QAResult, ModelDeps] | None = None
_qa_agent_simple: Agent[QAResult, ModelDeps] | None = None


def get_query_analyzer_agent() -> Agent[QueryAnalysis, ModelDeps]:
    """Get or create the query analyzer agent.

    This agent analyzes questions to extract key information
    before context retrieval.

    Returns:
        Agent with instrument=True for automatic Langfuse tracing
    """
    global _query_analyzer_agent
    if _query_analyzer_agent is None:
        settings = get_settings()
        _query_analyzer_agent = Agent(
            OpenAIModel(settings.OPENAI_MODEL),
            system_prompt=QUERY_ANALYZER_SYSTEM_PROMPT,
            deps_type=ModelDeps,
            output_type=QueryAnalysis,
            instrument=True,  # Enable automatic Langfuse tracing
            name="legal-query-analyzer",  # Descriptive name for Langfuse traces
        )
    return _query_analyzer_agent


def get_qa_agent(mode: str = "SIMPLE") -> Agent[QAResult, ModelDeps]:
    """Get or create the Q&A agent for the specified mode.

    Args:
        mode: Either "LAWYER" for detailed professional answers
              or "SIMPLE" for layperson-friendly answers

    Returns:
        Configured Q&A agent with instrument=True for automatic Langfuse tracing
    """
    global _qa_agent_lawyer, _qa_agent_simple

    if mode.upper() == "LAWYER":
        if _qa_agent_lawyer is None:
            settings = get_settings()
            _qa_agent_lawyer = Agent(
                OpenAIModel(settings.OPENAI_MODEL),
                system_prompt=QA_SYSTEM_PROMPT_LAWYER,
                deps_type=ModelDeps,
                output_type=QAResult,
                instrument=True,  # Enable automatic Langfuse tracing
                name="legal-qa-lawyer",  # Descriptive name for Langfuse traces
            )
        return _qa_agent_lawyer
    if _qa_agent_simple is None:
        settings = get_settings()
        _qa_agent_simple = Agent(
            OpenAIModel(settings.OPENAI_MODEL),
            system_prompt=QA_SYSTEM_PROMPT_SIMPLE,
            deps_type=ModelDeps,
            output_type=QAResult,
            instrument=True,  # Enable automatic Langfuse tracing
            name="legal-qa-simple",  # Descriptive name for Langfuse traces
        )
    return _qa_agent_simple


async def answer_question(
    question: str,
    mode: str = "SIMPLE",
    session_id: str = "default",
    conversation_history: list[dict[str, Any]] | None = None,
    user_id: str | None = None,
    user: UserContext | None = None,
) -> dict[str, Any]:
    """Complete Q&A workflow using PydanticAI agents.

    This function orchestrates the full Q&A flow:
    1. Query analysis to extract key terms
    2. Generate clarifications if needed (using the clarification agent)
    3. Context retrieval from vector store
    4. Answer generation with retrieved context

    Langfuse tracing is handled automatically via instrument=True on agents.
    Additional metadata is added using update_current_trace().

    Args:
        question: The legal question to answer
        mode: Either "LAWYER" or "SIMPLE"
        session_id: Session ID for tracking
        conversation_history: Previous messages for multi-turn clarification
        user_id: User ID for observability (legacy, prefer user parameter)
        user: Full UserContext from JWT validation (includes roles, email)

    Returns:
        Dictionary with answer, citations, confidence, and optional clarification info
    """
    import time

    start_time = time.time()
    settings = get_settings()

    # Use user.id if available, otherwise fall back to user_id for observability
    effective_user_id = user.id if user else user_id

    # Update current trace with workflow metadata
    # PydanticAI agents will automatically create child spans
    if is_langfuse_enabled():
        trace_metadata = {
            "mode": mode,
            "question_length": len(question),
        }
        # Add user role if available for observability
        if user:
            trace_metadata["user_roles"] = user.roles
            trace_metadata["user_role_level"] = user.role_level

        update_current_trace(
            input=question,
            user_id=effective_user_id,
            session_id=session_id,
            metadata=trace_metadata,
        )

    try:
        # Get dependencies with user context if available
        deps = get_model_deps_with_user(user)

        # Step 1: Analyze the query (automatically traced via instrument=True)
        analyzer = get_query_analyzer_agent()
        analysis_result = await analyzer.run(question, deps=deps)
        analysis = analysis_result.output

        # Log conversation history for debugging
        if conversation_history and len(conversation_history) > 0:
            logger.info(
                "Q&A agent received %d messages from conversation history for session_id=%s",
                len(conversation_history),
                session_id,
            )

        # Step 2: Check if clarification is needed
        if analysis.needs_clarification:
            # Use the clarification agent to generate structured questions
            clarification_result = await generate_clarifications(
                question=question,
                query_type=analysis.query_type,
                mode=mode,
                conversation_history=conversation_history,
                session_id=session_id,
                user_id=effective_user_id,
            )

            if clarification_result.get("needs_clarification"):
                result = {
                    "answer": "",  # No answer yet, need clarification first
                    "citations": [],
                    "confidence": 0.0,
                    "clarification": {
                        "needs_clarification": True,
                        "questions": clarification_result.get("questions", []),
                        "context_summary": clarification_result.get(
                            "context_summary", ""
                        ),
                        "next_steps": clarification_result.get("next_steps", ""),
                    },
                    "query_type": analysis.query_type,
                    "key_terms": analysis.key_terms,
                    "needs_clarification": True,
                }

                if is_langfuse_enabled():
                    update_current_trace(output=_redact_dict_pii(result))
                return result

        # Step 3: Retrieve context using the RAG tool
        contexts = await retrieve_context_tool(
            query=analysis.question_refined,
            limit=5,
        )

        # Step 4: Generate answer with context using OpenAI API directly
        # This ensures conversation history is properly formatted in the messages array
        openai_client = get_openai_client()

        # Select system prompt based on mode
        system_prompt = QA_SYSTEM_PROMPT_LAWYER if mode.upper() == "LAWYER" else QA_SYSTEM_PROMPT_SIMPLE

        # Build context string for the prompt
        context_text = format_contexts_for_prompt(contexts)

        # Prepare messages with conversation history
        # Start with system prompt
        api_messages = [
            {"role": "system", "content": system_prompt},
        ]

        # Add conversation history if provided (exclude system messages)
        if conversation_history:
            # Filter out system messages from history and limit to recent messages
            # to avoid token limits while maintaining context
            history_messages = [
                {"role": msg["role"], "content": msg["content"]}
                for msg in conversation_history
                if msg.get("role") in ("user", "assistant")
            ]

            # Limit history to last 10 messages to manage token usage
            if len(history_messages) > 10:
                history_messages = history_messages[-10:]

            api_messages.extend(history_messages)
            logger.info(
                "Added %d messages from conversation history to session_id=%s",
                len(history_messages),
                session_id,
            )

        # Build the current user message with question and context
        user_message = f"""Question: {question}

Refined Question: {analysis.question_refined}

Legal Context:
{context_text}

Please provide a comprehensive answer based on the above context."""

        api_messages.append({"role": "user", "content": user_message})

        # Call OpenAI API directly (non-streaming)
        llm_response = await openai_client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=api_messages,
        )

        # Extract answer from response
        full_answer = llm_response.choices[0].message.content or ""

        # Estimate confidence based on context quality and answer length
        confidence = min(0.95, 0.5 + (len(contexts) * 0.1) + min(0.2, len(full_answer) / 1000))

        # Extract citations from retrieved contexts
        context_citations_data = extract_citations_from_contexts(contexts)
        context_citations = [
            LegalCitation(
                source=c["source"],
                article=c.get("article", ""),
                url=c.get("url"),
            )
            for c in context_citations_data
        ]

        response = {
            "answer": full_answer,
            "citations": [
                {
                    "source": c.source,
                    "article": c.article,
                    "url": c.url,
                }
                for c in context_citations
            ],
            "confidence": confidence,
            "clarification": None,
            "query_type": analysis.query_type,
            "key_terms": analysis.key_terms,
            "needs_clarification": False,
        }

        # Add processing time
        processing_time_ms = (time.time() - start_time) * 1000
        response["processing_time_ms"] = processing_time_ms

        if is_langfuse_enabled():
            update_current_trace(
                output={
                    "answer_length": len(full_answer),
                    "confidence": confidence,
                    "citations_count": len(context_citations),
                    "processing_time_ms": processing_time_ms,
                    "model": settings.OPENAI_MODEL,
                }
            )

        return response

    except Exception as e:
        # Convert to structured error if not already
        if not isinstance(e, AgentExecutionError):
            # Map common errors to structured exceptions
            error_message = str(e).lower()
            if "timeout" in error_message or "timed out" in error_message:
                e = LLMTimeoutError(
                    timeout_seconds=60.0,
                    model=settings.OPENAI_MODEL,
                )
            elif "context length" in error_message or "too long" in error_message:
                e = LLMContextLengthExceededError(
                    model=settings.OPENAI_MODEL,
                    input_tokens=len(question.split()),  # Approximate
                    max_tokens=128000,  # GPT-4o context limit
                )
            elif "retriev" in error_message or "vector" in error_message:
                e = RetrievalError(
                    query=question[:100],
                    reason=str(e),
                )
            else:
                e = AgentExecutionError(
                    agent=f"qa_agent_{mode.lower()}",
                    reason=str(e),
                )

        # Error is automatically tracked by PydanticAI's instrumentation
        raise
