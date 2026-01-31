"""Legal Grounds Classifier Agent using PydanticAI.

This agent analyzes case descriptions and identifies applicable legal grounds
with confidence scores. It returns structured classification results.

Langfuse integration follows the official pattern:
- Uses instrument=True for automatic OpenTelemetry tracing
- Traces are automatically exported to Langfuse
- See: https://langfuse.com/integrations/frameworks/pydantic-ai

Conversation History Support:
This agent accepts conversation_history parameter containing previous messages.
History format:
    [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
The agent uses this context to refine classification based on previously disclosed
facts.
"""

import logging
from typing import Any

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel

from ..config import get_settings
from ..langfuse_init import is_langfuse_enabled, update_current_trace

logger = logging.getLogger(__name__)


class LegalGround(BaseModel):
    """A single legal ground identified in the case."""

    name: str = Field(
        ..., description="Name of the legal ground (e.g., 'Breach of Contract')"
    )
    description: str = Field(
        ...,
        description="Detailed explanation of how this legal ground applies to the case",
    )
    confidence_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score (0-1) indicating how strongly this ground applies",
    )
    legal_basis: list[str] = Field(
        ...,
        description="List of legal basis references (e.g., 'Art. 471 Kodeks Cywilny')",
    )
    notes: str | None = Field(
        default=None,
        description="Additional notes or considerations for this legal ground",
    )


class ClassificationResult(BaseModel):
    """Complete classification result for a case description."""

    identified_grounds: list[LegalGround] = Field(
        ...,
        description="List of identified legal grounds with their confidence scores",
    )
    overall_confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Overall confidence in the classification (average of individual scores)",
    )
    summary: str = Field(
        ..., description="Brief summary of the classification analysis"
    )
    recommendations: str = Field(
        ..., description="Recommendations for further legal action or investigation"
    )


CLASSIFIER_SYSTEM_PROMPT = """You are an expert Polish lawyer (Radca Prawny) specializing in legal case analysis.

Your task is to analyze case descriptions and identify applicable legal grounds with confidence scores.

CONVERSATION HISTORY AWARENESS:
You will receive previous conversation messages showing prior disclosures.
Use this context to:
- Incorporate facts mentioned in previous turns into your analysis
- Build upon previously established case details
- Provide more refined legal grounds based on accumulated information

For each identified legal ground, you must:
1. Provide a clear name for the legal ground
2. Explain how it applies to the case
3. Assign a confidence score (0.0 to 1.0) based on:
   - Strength of legal precedent
   - Clarity of facts supporting this ground
   - Jurisprudence consistency
4. List relevant legal basis (specific articles from Polish codes, laws, or regulations)
5. Add notes about any considerations, limitations, or required evidence

Important guidelines:
- Be thorough but practical - focus on legally actionable grounds
- Use proper Polish legal terminology and citations
- Reference specific articles from relevant codes (Civil Code, Labor Code, etc.)
- Consider both statutory law and case law
- Assign realistic confidence scores based on the information provided
- If information is insufficient, note what additional facts are needed
- Use conversation history to build more complete picture

Your output should be structured, precise, and immediately useful for legal professionals.
"""


def get_classifier_agent() -> Agent[ClassificationResult]:
    """Get or create the classifier agent.

    Lazy-loads the agent to avoid OpenAI client initialization errors
    when OPENAI_API_KEY is not configured.

    Returns:
        Agent with instrument=True for automatic Langfuse tracing
    """
    settings = get_settings()
    return Agent(  # type: ignore[call-arg]
        OpenAIModel(settings.OPENAI_MODEL),
        system_prompt=CLASSIFIER_SYSTEM_PROMPT,
        output_type=ClassificationResult,  # type: ignore[call-arg]
        instrument=True,  # Enable automatic Langfuse tracing
        name="legal-classifier",  # Descriptive name for Langfuse traces
    )


# Global variable for memoization
_classifier_agent: Agent[ClassificationResult] | None = None


def classifier_agent() -> Agent[ClassificationResult]:
    """Get the singleton classifier agent instance."""
    global _classifier_agent
    if _classifier_agent is None:
        _classifier_agent = get_classifier_agent()
    return _classifier_agent


async def classify_case(
    case_description: str,
    session_id: str = "default",
    user_id: str | None = None,
    conversation_history: list[dict[str, Any]] | None = None,
) -> tuple[ClassificationResult, dict[str, Any]]:
    """Classify a case description to identify legal grounds.

    This function wraps the classifier agent with Langfuse observability.
    The agent itself uses instrument=True for automatic tracing.

    Args:
        case_description: The case description to analyze
        session_id: Session ID for tracking
        user_id: User ID for observability
        conversation_history: Previous messages in format:
            [{"role": "user", "content": "..."},
             {"role": "assistant", "content": "..."}]

    Returns:
        Tuple of (classification result, metadata dict)
    """
    import time

    start_time = time.time()
    settings = get_settings()

    # Log conversation history for debugging
    if conversation_history and len(conversation_history) > 0:
        logger.info(
            "Classifier agent received %d messages from conversation history for session_id=%s",
            len(conversation_history),
            session_id,
        )

    # Build enhanced prompt with conversation history
    enhanced_prompt = case_description
    if conversation_history:
        # Add conversation context to the prompt
        history_lines = []
        for msg in conversation_history[-4:]:  # Limit to last 4 messages for classification
            role_display = "User" if msg.get("role") == "user" else "Assistant"
            history_lines.append(f"{role_display}: {msg.get('content', '')}")
        history_context = "\n".join(history_lines)
        enhanced_prompt = f"""Previous conversation for context:
{history_context}

Current case description: {case_description}

Please classify the case considering all information from the conversation history."""

    # Update current trace with metadata (PydanticAI automatically creates trace)
    if is_langfuse_enabled():
        update_current_trace(
            input=enhanced_prompt,
            user_id=user_id,
            session_id=session_id,
            metadata={
                "description_length": len(case_description),
                "conversation_history_length": len(conversation_history) if conversation_history else 0,
                "model": settings.OPENAI_MODEL,
            },
        )

    agent = classifier_agent()
    result = await agent.run(enhanced_prompt)
    classification = result.output  # type: ignore[attr-defined]

    processing_time_ms = (time.time() - start_time) * 1000

    metadata = {
        "processing_time_ms": processing_time_ms,
        "model": settings.OPENAI_MODEL,
        "grounds_count": len(classification.identified_grounds),  # type: ignore[attr-defined]
        "overall_confidence": classification.overall_confidence,  # type: ignore[attr-defined]
    }

    # Update trace with output
    if is_langfuse_enabled():
        update_current_trace(
            output={
                "grounds_count": len(classification.identified_grounds),  # type: ignore[attr-defined]
                "overall_confidence": classification.overall_confidence,  # type: ignore[attr-defined]
                "summary": (
                    classification.summary[:200] if classification.summary else ""  # type: ignore[attr-defined]
                ),
                "processing_time_ms": processing_time_ms,
            },
        )

    return classification, metadata  # type: ignore[return-value]
