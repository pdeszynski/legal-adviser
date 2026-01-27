"""Legal Grounds Classifier Agent using PydanticAI.

This agent analyzes case descriptions and identifies applicable legal grounds
with confidence scores. It returns structured classification results.

Langfuse integration follows the official pattern:
- Uses instrument=True for automatic OpenTelemetry tracing
- Traces are automatically exported to Langfuse
- See: https://langfuse.com/integrations/frameworks/pydantic-ai
"""

from typing import Any

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel

from ..config import get_settings
from ..langfuse_init import is_langfuse_enabled, update_current_trace


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
    return Agent(
        OpenAIModel(settings.OPENAI_MODEL),
        system_prompt=CLASSIFIER_SYSTEM_PROMPT,
        output_type=ClassificationResult,
        instrument=True,  # Enable automatic Langfuse tracing
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
) -> tuple[ClassificationResult, dict[str, Any]]:
    """Classify a case description to identify legal grounds.

    This function wraps the classifier agent with Langfuse observability.
    The agent itself uses instrument=True for automatic tracing.

    Args:
        case_description: The case description to analyze
        session_id: Session ID for tracking
        user_id: User ID for observability

    Returns:
        Tuple of (classification result, metadata dict)
    """
    import time

    start_time = time.time()
    settings = get_settings()

    # Update current trace with metadata (PydanticAI automatically creates trace)
    if is_langfuse_enabled():
        update_current_trace(
            input=case_description,
            user_id=user_id,
            session_id=session_id,
            metadata={
                "description_length": len(case_description),
                "model": settings.OPENAI_MODEL,
            },
        )

    try:
        agent = classifier_agent()
        result = await agent.run(case_description)
        classification = result.output

        processing_time_ms = (time.time() - start_time) * 1000

        metadata = {
            "processing_time_ms": processing_time_ms,
            "model": settings.OPENAI_MODEL,
            "grounds_count": len(classification.identified_grounds),
            "overall_confidence": classification.overall_confidence,
        }

        # Update trace with output
        if is_langfuse_enabled():
            update_current_trace(
                output={
                    "grounds_count": len(classification.identified_grounds),
                    "overall_confidence": classification.overall_confidence,
                    "summary": (
                        classification.summary[:200] if classification.summary else ""
                    ),
                    "processing_time_ms": processing_time_ms,
                },
            )

        return classification, metadata

    except Exception as e:
        # Error is automatically tracked by PydanticAI's instrumentation
        raise
