"""Q&A Agent using PydanticAI with tool-based architecture.

This agent implements legal question answering using PydanticAI's tool system
for context retrieval and citation formatting.

Langfuse integration follows the official pattern:
- Uses instrument=True for automatic OpenTelemetry tracing
- Traces are automatically exported to Langfuse
- See: https://langfuse.com/integrations/frameworks/pydantic-ai

Enhanced with structured error handling and retry logic.
"""

from typing import Any

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel

from ..config import get_settings
from ..error_handling import with_resilience, safe_agent_run
from ..exceptions import (
    AgentExecutionError,
    RetrievalError,
    LLMTimeoutError,
    LLMContextLengthExceededError,
)
from ..langfuse_init import (
    _redact_dict_pii,
    is_langfuse_enabled,
    update_current_trace,
    start_as_current_span,
)
from .clarification_agent import generate_clarifications
from .dependencies import ModelDeps, get_model_deps
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
        )
    return _qa_agent_simple


async def answer_question(
    question: str,
    mode: str = "SIMPLE",
    session_id: str = "default",
    conversation_history: list[dict[str, Any]] | None = None,
    user_id: str | None = None,
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
        user_id: User ID for observability

    Returns:
        Dictionary with answer, citations, confidence, and optional clarification info
    """
    import time

    start_time = time.time()
    settings = get_settings()

    # Update current trace with workflow metadata
    # PydanticAI agents will automatically create child spans
    if is_langfuse_enabled():
        update_current_trace(
            name="qa_workflow",
            input=question,
            user_id=user_id,
            session_id=session_id,
            metadata={
                "mode": mode,
                "question_length": len(question),
            },
        )

    try:
        deps = get_model_deps()

        # Step 1: Analyze the query (automatically traced via instrument=True)
        with start_as_current_span(
            "query_analysis",
            input={"question": question[:200]},
            session_id=session_id,
            user_id=user_id,
        ) as analysis_span:
            analyzer = get_query_analyzer_agent()
            analysis_result = await analyzer.run(question, deps=deps)
            analysis = analysis_result.output

            if analysis_span:
                analysis_span.update(
                    output={
                        "query_type": analysis.query_type,
                        "key_terms": analysis.key_terms,
                        "needs_clarification": analysis.needs_clarification,
                    }
                )

        # Step 2: Check if clarification is needed
        if analysis.needs_clarification:
            with start_as_current_span("clarification") as clarification_span:
                # Use the clarification agent to generate structured questions
                clarification_result = await generate_clarifications(
                    question=question,
                    query_type=analysis.query_type,
                    mode=mode,
                )

                if clarification_span:
                    clarification_span.update(output=clarification_result)

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
        with start_as_current_span("context_retrieval") as retrieval_span:
            contexts = await retrieve_context_tool(
                query=analysis.question_refined,
                limit=5,
            )
            if retrieval_span:
                retrieval_span.update(
                    output={"contexts_count": len(contexts)}
                )

        # Step 4: Generate answer with context (automatically traced via instrument=True)
        qa_agent = get_qa_agent(mode)

        # Build context string for the prompt using helper
        context_text = format_contexts_for_prompt(contexts)

        # Build augmented prompt with conversation history if available
        history_context = ""
        if conversation_history:
            history_context = "\n\nPrevious conversation:\n" + "\n".join(
                [
                    f"{m.get('role', 'user')}: {m.get('content', '')}"
                    for m in conversation_history[-5:]
                ]
            )

        augmented_prompt = f"""Question: {question}
{history_context}

Refined Question: {analysis.question_refined}

Legal Context:
{context_text}

Please provide a comprehensive answer based on the above context."""

        result = await qa_agent.run(augmented_prompt, deps=deps)
        qa_result = result.output

        # Extract citations from retrieved contexts using helper
        context_citations_data = extract_citations_from_contexts(contexts)
        context_citations = [
            LegalCitation(
                source=c["source"],
                article=c.get("article", ""),
                url=c.get("url"),
            )
            for c in context_citations_data
        ]

        # Combine citations (agent-generated + context-based)
        all_citations = qa_result.citations + context_citations

        response = {
            "answer": qa_result.answer,
            "citations": [
                {
                    "source": c.source,
                    "article": c.article,
                    "url": c.url,
                }
                for c in all_citations
            ],
            "confidence": qa_result.confidence,
            "clarification": None,
            "query_type": qa_result.query_type,
            "key_terms": qa_result.key_terms,
            "needs_clarification": False,
        }

        # Add processing time
        processing_time_ms = (time.time() - start_time) * 1000
        response["processing_time_ms"] = processing_time_ms

        if is_langfuse_enabled():
            update_current_trace(
                output={
                    "answer_length": len(qa_result.answer),
                    "confidence": qa_result.confidence,
                    "citations_count": len(all_citations),
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
