"""Clarification Agent using PydanticAI.

This agent generates specific follow-up questions when the user's query
contains insufficient information. It focuses on getting the details needed
to provide accurate legal guidance rather than suggesting lawyer consultations.

Langfuse integration follows the official pattern:
- Uses instrument=True for automatic OpenTelemetry tracing
- Traces are automatically exported to Langfuse
- See: https://langfuse.com/integrations/frameworks/pydantic-ai

Conversation History Support:
This agent accepts conversation_history parameter containing previous messages.
History format: [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
The agent uses this context to avoid asking questions already answered in previous turns.
"""

import logging
import time
import uuid
from typing import Any

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel

from ..config import get_settings
from ..langfuse_init import is_langfuse_enabled, update_current_trace
from ..models.dto import (
    ClarificationQuestionDto,
    ClarificationQuestionType,
    ClarificationRequestDto,
)

logger = logging.getLogger(__name__)


class ClarificationQuestion(BaseModel):
    """A single clarification question."""

    question: str = Field(..., description="The specific question to ask the user")
    question_type: str = Field(
        ...,
        description="Type of information needed (e.g., 'timeline', 'documents', 'parties', 'specific_amount')",
    )
    options: list[str] | None = Field(
        default=None,
        description="Optional predefined options for the user to choose from",
    )
    hint: str | None = Field(
        default=None,
        description="Optional hint or example to help the user answer",
    )


class ClarificationResponse(BaseModel):
    """Response containing clarification questions."""

    needs_clarification: bool = Field(
        ..., description="Whether clarification is needed"
    )
    questions: list[ClarificationQuestion] = Field(
        ...,
        description="List of specific follow-up questions to ask the user",
    )
    context_summary: str = Field(
        ..., description="Summary of what we understand so far"
    )
    next_steps: str = Field(
        ...,
        description="Explanation of what will happen after clarification",
    )


CLARIFICATION_SYSTEM_PROMPT = """You are a Polish legal assistant helping to gather necessary information for legal questions.

Your task is to identify what specific information is missing from the user's query and generate targeted follow-up questions.

CONVERSATION HISTORY AWARENESS:
You will receive previous conversation messages showing prior Q&A exchanges.
Use this context to:
- Check if the user has already provided information you might otherwise ask for
- Reference previous answers when formulating new questions
- Avoid repeating questions already answered in the conversation
- Build upon the conversation flow naturally

IMPORTANT RULES:
1. NEVER suggest consulting a lawyer as the first response
2. Focus on getting the specific details needed to help the user
3. Ask 2-4 specific, actionable questions maximum
4. Only suggest lawyer consultation for clearly out-of-scope queries (e.g., criminal defense, complex litigation)
5. If conversation history shows previous answers, acknowledge them and only ask for NEW information

Types of information that often need clarification:
- Timeline: When did this happen? When was the contract signed?
- Parties: Who is involved? (individuals, companies, government)
- Documents: Do you have a written contract, email, or other evidence?
- Specific amounts: What is the value? What are the damages claimed?
- Jurisdiction: Which court? Which country/region?
- Previous actions: Have you sent any formal notices? Filed complaints?

For each question:
- Be specific and direct
- Provide helpful hints or examples when appropriate
- Consider offering predefined options for common scenarios
- Use plain Polish language (avoid excessive legalese)

Your output should help users provide the missing information needed for accurate legal guidance.
"""


def get_clarification_agent() -> Agent[ClarificationResponse]:
    """Get or create the clarification agent.

    This agent analyzes incomplete queries and generates specific follow-up questions
    to gather the information needed for accurate legal guidance.

    Lazy-loads the agent to avoid OpenAI client initialization errors
    when OPENAI_API_KEY is not configured.

    Returns:
        Agent with instrument=True for automatic Langfuse tracing
    """
    settings = get_settings()
    return Agent(  # type: ignore[call-arg]
        OpenAIModel(settings.OPENAI_MODEL),
        system_prompt=CLARIFICATION_SYSTEM_PROMPT,
        output_type=ClarificationResponse,  # type: ignore[call-arg]
        instrument=True,  # Enable automatic Langfuse tracing
        name="legal-clarification",  # Descriptive name for Langfuse traces
    )


# Global variable for memoization
_clarification_agent: Agent[ClarificationResponse] | None = None


def clarification_agent() -> Agent[ClarificationResponse]:
    """Get the singleton clarification agent instance."""
    global _clarification_agent
    if _clarification_agent is None:
        _clarification_agent = get_clarification_agent()
    return _clarification_agent


async def generate_clarifications(
    question: str,
    query_type: str = "general",
    mode: str = "SIMPLE",
    conversation_history: list[dict[str, Any]] | None = None,
    session_id: str = "default",
    user_id: str | None = None,
) -> dict[str, Any]:  # type: ignore[name-defined]
    """Generate clarification questions for an incomplete query.

    This function considers conversation history to avoid asking questions
    that have already been answered in previous turns.

    Args:
        question: The user's original question
        query_type: The type of legal query (e.g., 'contract_dispute', 'employment')
        mode: Response mode (LAWYER or SIMPLE)
        conversation_history: Previous messages in format:
            [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
        session_id: Session ID for Langfuse tracing
        user_id: User ID for Langfuse tracing

    Returns:
        Dictionary with clarification questions and metadata
    """
    start_time = time.time()
    settings = get_settings()
    agent = clarification_agent()

    # Log conversation history for debugging
    if conversation_history and len(conversation_history) > 0:
        logger.info(
            "Clarification agent received %d messages from conversation history for session_id=%s",
            len(conversation_history),
            session_id,
        )

    # Build context for the agent with conversation history
    history_context = ""
    if conversation_history:
        # Format conversation history for the prompt
        history_lines = []
        for msg in conversation_history[-6:]:  # Limit to last 6 messages for context
            role_display = "User" if msg.get("role") == "user" else "Assistant"
            history_lines.append(f"{role_display}: {msg.get('content', '')}")
        history_context = "\n\nPrevious conversation:\n" + "\n".join(history_lines)

    prompt = f"""Analyze this legal question and determine if clarification is needed:
{history_context}

Current Question: {question}
Query Type: {query_type}
Response Mode: {mode}

If clarification is needed, provide specific follow-up questions.
IMPORTANT: Check the conversation history above to avoid asking for information already provided.
If the question is clear enough for a general response, indicate no clarification is needed."""

    # Update trace with input metadata
    if is_langfuse_enabled():
        update_current_trace(
            input=question,
            user_id=user_id,
            session_id=session_id,
            metadata={
                "query_type": query_type,
                "mode": mode,
                "question_length": len(question),
                "conversation_history_length": len(conversation_history) if conversation_history else 0,
                "model": settings.OPENAI_MODEL,
            },
        )

    result = await agent.run(prompt)
    response = result.output  # type: ignore[attr-defined]

    processing_time_ms = (time.time() - start_time) * 1000

    # Update trace with output metadata
    if is_langfuse_enabled():
        update_current_trace(
            output={
                "needs_clarification": response.needs_clarification,  # type: ignore[attr-defined]
                "questions_count": len(response.questions),  # type: ignore[attr-defined]
                "processing_time_ms": processing_time_ms,
            }
        )

    return {
        "needs_clarification": response.needs_clarification,  # type: ignore[attr-defined]
        "questions": [
            {
                "question": q.question,
                "question_type": q.question_type,
                "options": q.options,
                "hint": q.hint,
            }
            for q in response.questions  # type: ignore[attr-defined]
        ],
        "context_summary": response.context_summary,  # type: ignore[attr-defined]
        "next_steps": response.next_steps,  # type: ignore[attr-defined]
    }


# -----------------------------------------------------------------------------
# DTO Conversion Helpers
# -----------------------------------------------------------------------------


def _question_type_to_enum(question_type: str) -> ClarificationQuestionType:
    """Convert a string question type to ClarificationQuestionType enum.

    Args:
        question_type: String question type from the agent

    Returns:
        ClarificationQuestionType enum value
    """
    # Normalize the question_type for matching
    normalized = question_type.lower().replace("-", "_").replace(" ", "_")

    # Map common variations to enum values
    type_mapping = {
        "timeline": ClarificationQuestionType.TIMELINE,
        "parties": ClarificationQuestionType.PARTIES,
        "documents": ClarificationQuestionType.DOCUMENTS,
        "amounts": ClarificationQuestionType.AMOUNTS,
        "specific_amount": ClarificationQuestionType.AMOUNTS,
        "jurisdiction": ClarificationQuestionType.JURISDICTION,
        "previous_actions": ClarificationQuestionType.PREVIOUS_ACTIONS,
        "contract_details": ClarificationQuestionType.CONTRACT_DETAILS,
        "employment_details": ClarificationQuestionType.EMPLOYMENT_DETAILS,
        "damages": ClarificationQuestionType.DAMAGES,
    }

    return type_mapping.get(normalized, ClarificationQuestionType.OTHER)


def to_clarification_request_dto(
    internal_response: dict[str, Any],
) -> ClarificationRequestDto:
    """Convert internal clarification response to ClarificationRequestDto.

    This function converts the internal dictionary format returned by
    generate_clarifications into a structured DTO with proper UUIDs
    and validation.

    Args:
        internal_response: Dictionary from generate_clarifications with keys:
            - needs_clarification: bool
            - questions: list of question dicts
            - context_summary: str
            - next_steps: str

    Returns:
        ClarificationRequestDto with structured question data
    """
    questions_dto: list[ClarificationQuestionDto] = []

    for q in internal_response.get("questions", []):
        # Generate UUID v4 for each question
        question_id = str(uuid.uuid4())

        # Convert question_type to enum
        question_type = _question_type_to_enum(q.get("question_type", "other"))

        questions_dto.append(
            ClarificationQuestionDto(
                question_id=question_id,
                question_text=q.get("question", ""),
                question_type=question_type,
                hint=q.get("hint"),
                options=q.get("options"),
            )
        )

    return ClarificationRequestDto(
        context_summary=internal_response.get("context_summary", ""),
        questions=questions_dto,
        next_steps=internal_response.get("next_steps", ""),
    )


def to_legacy_dict(dto: ClarificationRequestDto) -> dict[str, Any]:
    """Convert ClarificationRequestDto to legacy dictionary format.

    This maintains backward compatibility with existing code that expects
    the old dictionary format.

    Args:
        dto: ClarificationRequestDto to convert

    Returns:
        Dictionary in the legacy format
    """
    return {
        "type": "clarification",
        "questions": [
            {
                "question_id": q.question_id,
                "question": q.question_text,
                "question_type": q.question_type.value,
                "hint": q.hint,
                "options": q.options,
            }
            for q in dto.questions
        ],
        "context_summary": dto.context_summary,
        "next_steps": dto.next_steps,
    }
