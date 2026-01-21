"""Legal Grounds Classifier Agent using PydanticAI.

This agent analyzes case descriptions and identifies applicable legal grounds
with confidence scores. It returns structured classification results.
"""

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from typing import List, Optional
from ..config import get_settings

settings = get_settings()


class LegalGround(BaseModel):
    """A single legal ground identified in the case."""

    name: str = Field(..., description="Name of the legal ground (e.g., 'Breach of Contract')")
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
    legal_basis: List[str] = Field(
        ...,
        description="List of legal basis references (e.g., 'Art. 471 Kodeks Cywilny')",
    )
    notes: Optional[str] = Field(
        default=None,
        description="Additional notes or considerations for this legal ground",
    )


class ClassificationResult(BaseModel):
    """Complete classification result for a case description."""

    identified_grounds: List[LegalGround] = Field(
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

classifier_agent = Agent(
    f"openai:{settings.OPENAI_MODEL}",
    system_prompt=CLASSIFIER_SYSTEM_PROMPT,
    output_type=ClassificationResult,
)
