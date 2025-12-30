"""Response models for AI Engine API."""

from typing import List, Optional
from pydantic import BaseModel, Field


class Citation(BaseModel):
    """Legal citation reference."""

    source: str = Field(..., description="Source of the citation (e.g., Civil Code)")
    article: str = Field(..., description="Article or section number")
    url: Optional[str] = Field(default=None, description="URL to the source")


class GenerateDocumentResponse(BaseModel):
    """Response from document generation."""

    task_id: str = Field(..., description="Task ID for tracking generation status")
    status: str = Field(
        default="PROCESSING", description="Current status of the generation"
    )
    message: str = Field(
        default="Document generation started", description="Status message"
    )


class DocumentGenerationStatus(BaseModel):
    """Status of document generation task."""

    task_id: str = Field(..., description="Task ID")
    status: str = Field(..., description="PROCESSING, COMPLETED, or FAILED")
    content: Optional[str] = Field(
        default=None, description="Generated document content (markdown)"
    )
    metadata: Optional[dict] = Field(
        default=None, description="Additional metadata about the generation"
    )
    error: Optional[str] = Field(default=None, description="Error message if failed")


class AnswerResponse(BaseModel):
    """Response to a legal question."""

    answer: str = Field(..., description="Answer to the question in markdown format")
    citations: List[Citation] = Field(
        default_factory=list, description="Legal citations supporting the answer"
    )
    confidence: float = Field(
        default=0.0, ge=0.0, le=1.0, description="Confidence score of the answer"
    )


class Ruling(BaseModel):
    """Legal ruling/case information."""

    id: str = Field(..., description="Ruling identifier")
    title: str = Field(..., description="Ruling title or case name")
    court: str = Field(..., description="Court that issued the ruling")
    date: str = Field(..., description="Date of the ruling (ISO format)")
    summary: str = Field(..., description="Brief summary of the ruling")
    url: Optional[str] = Field(default=None, description="URL to full ruling")
    relevance_score: float = Field(
        default=0.0, ge=0.0, le=1.0, description="Relevance to search query"
    )


class SearchRulingsResponse(BaseModel):
    """Response from ruling search."""

    results: List[Ruling] = Field(
        default_factory=list, description="List of matching rulings"
    )
    total: int = Field(..., description="Total number of results found")
    query: str = Field(..., description="Original search query")
