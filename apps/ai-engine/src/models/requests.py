"""Request models for AI Engine API."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class DocumentType(str, Enum):
    """Types of legal documents that can be generated."""

    LAWSUIT = "LAWSUIT"
    COMPLAINT = "COMPLAINT"
    CONTRACT = "CONTRACT"
    OTHER = "OTHER"


class GenerateDocumentRequest(BaseModel):
    """Request to generate a legal document."""

    description: str = Field(
        ...,
        description="Natural language description of the document to generate",
        min_length=10,
    )
    document_type: DocumentType = Field(
        ..., description="Type of legal document to generate"
    )
    context: Optional[dict] = Field(
        default=None,
        description="Additional context variables (e.g., defendant name, amounts)",
    )
    session_id: str = Field(..., description="User session ID for tracking")


class AskQuestionRequest(BaseModel):
    """Request to ask a legal question."""

    question: str = Field(..., description="Legal question to answer", min_length=5)
    session_id: str = Field(..., description="User session ID for tracking")
    mode: str = Field(
        default="SIMPLE",
        description="Response mode: LAWYER (detailed) or SIMPLE (layperson)",
    )


class SearchRulingsRequest(BaseModel):
    """Request to search for legal rulings."""

    query: str = Field(..., description="Search query", min_length=3)
    filters: Optional[dict] = Field(
        default=None,
        description="Search filters (date range, court type, etc.)",
    )
    limit: int = Field(default=10, ge=1, le=100, description="Maximum results")
