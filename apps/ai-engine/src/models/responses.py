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


class LegalGround(BaseModel):
    """A single legal ground identified in the case."""

    name: str = Field(..., description="Name of the legal ground")
    description: str = Field(..., description="Explanation of how this ground applies")
    confidence_score: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence score (0-1)"
    )
    legal_basis: List[str] = Field(
        ..., description="List of legal basis references"
    )
    notes: Optional[str] = Field(default=None, description="Additional notes")


class ClassificationResponse(BaseModel):
    """Response from case classification."""

    identified_grounds: List[LegalGround] = Field(
        ..., description="Identified legal grounds with confidence scores"
    )
    overall_confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Overall confidence in classification"
    )
    summary: str = Field(..., description="Summary of the classification")
    recommendations: str = Field(..., description="Recommendations for further action")
    case_description: str = Field(..., description="Original case description")
    processing_time_ms: float = Field(
        ..., description="Time taken to process the classification"
    )


class GenerateEmbeddingsResponse(BaseModel):
    """Response from embeddings generation."""

    embeddings: List[List[float]] = Field(
        ..., description="List of embedding vectors (one per input text)"
    )
    model: str = Field(..., description="Model used for generation")
    total_tokens: int = Field(..., description="Total tokens used")


class SemanticSearchResult(BaseModel):
    """A single semantic search result."""

    id: str = Field(..., description="Embedding/document ID")
    document_id: str = Field(..., description="Source document ID")
    content_chunk: str = Field(..., description="Relevant text chunk")
    chunk_index: int = Field(..., description="Index of the chunk in the document")
    similarity: float = Field(..., ge=0.0, le=1.0, description="Similarity score")
    metadata: Optional[dict] = Field(
        default=None, description="Additional metadata about the chunk"
    )


class SemanticSearchResponse(BaseModel):
    """Response from semantic vector search."""

    results: List[SemanticSearchResult] = Field(
        ..., description="List of relevant text chunks with similarity scores"
    )
    query: str = Field(..., description="Original search query")
    total: int = Field(..., description="Total number of results found")


class QAResponse(BaseModel):
    """Response from simple Q&A endpoint."""

    answer: str = Field(..., description="Answer to the question")
    citations: List[Citation] = Field(
        default_factory=list, description="Legal citations supporting the answer"
    )
