"""Response models for AI Engine API."""

from typing import Any

from pydantic import BaseModel, Field

# -----------------------------------------------------------------------------
# Error Response Models
# -----------------------------------------------------------------------------


class ErrorDetail(BaseModel):
    """Detailed error information."""

    field: str | None = Field(default=None, description="Field that caused the error")
    message: str = Field(..., description="Error message")
    code: str | None = Field(default=None, description="Error code for the field")


class ErrorResponse(BaseModel):
    """Standardized error response for API errors."""

    error: bool = Field(default=True, description="Error flag")
    error_code: str = Field(..., description="Unique error code for programmatic handling")
    message: str = Field(..., description="User-friendly error message")
    suggestion: str | None = Field(default=None, description="Actionable suggestion for the user")
    details: dict[str, Any] | None = Field(default=None, description="Additional technical details")
    retryable: bool | None = Field(default=None, description="Whether the request can be retried")
    request_id: str | None = Field(default=None, description="Request ID for support reference")


class ValidationErrorResponse(BaseModel):
    """Response for input validation errors."""

    error: bool = Field(default=True, description="Error flag")
    error_code: str = Field(default="VALIDATION_ERROR", description="Error code")
    message: str = Field(default="Request validation failed", description="Error message")
    errors: list[ErrorDetail] = Field(
        default_factory=list, description="List of validation errors"
    )


class RateLimitErrorResponse(BaseModel):
    """Response for rate limit errors."""

    error: bool = Field(default=True, description="Error flag")
    error_code: str = Field(default="RATE_LIMIT_EXCEEDED", description="Error code")
    message: str = Field(..., description="Error message")
    retry_after: int | None = Field(
        default=None, description="Seconds until retry is allowed"
    )
    limit: int | None = Field(default=None, description="Rate limit that was exceeded")
    reset_time: str | None = Field(default=None, description="Time when limit resets")


class ServiceUnavailableErrorResponse(BaseModel):
    """Response for service unavailable errors."""

    error: bool = Field(default=True, description="Error flag")
    error_code: str = Field(default="SERVICE_UNAVAILABLE", description="Error code")
    message: str = Field(
        default="Service temporarily unavailable. Please try again later.",
        description="Error message"
    )
    service: str | None = Field(default=None, description="Name of unavailable service")
    estimated_recovery: str | None = Field(
        default=None, description="Estimated time for service recovery"
    )


# -----------------------------------------------------------------------------
# Standard Response Models
# -----------------------------------------------------------------------------


class Citation(BaseModel):
    """Legal citation reference."""

    source: str = Field(..., description="Source of the citation (e.g., Civil Code)")
    article: str = Field(..., description="Article or section number")
    url: str | None = Field(default=None, description="URL to the source")


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
    content: str | None = Field(
        default=None, description="Generated document content (markdown)"
    )
    metadata: dict[str, Any] | None = Field(
        default=None, description="Additional metadata about the generation"
    )
    error: str | None = Field(default=None, description="Error message if failed")


class ClarificationQuestion(BaseModel):
    """A single clarification question."""

    question: str = Field(..., description="The specific question to ask the user")
    question_type: str = Field(
        ..., description="Type of information needed (e.g., 'timeline', 'documents', 'parties')"
    )
    options: list[str] | None = Field(
        default=None, description="Optional predefined options for the user to choose from"
    )
    hint: str | None = Field(default=None, description="Optional hint or example to help the user answer")


class ClarificationInfo(BaseModel):
    """Clarification information when more details are needed."""

    needs_clarification: bool = Field(..., description="Whether clarification is needed")
    questions: list[ClarificationQuestion] = Field(
        default_factory=list, description="List of specific follow-up questions"
    )
    context_summary: str = Field(
        ..., description="Summary of what we understand so far"
    )
    next_steps: str = Field(..., description="Explanation of what happens after clarification")


class AnswerResponse(BaseModel):
    """Response to a legal question."""

    answer: str = Field(..., description="Answer to the question in markdown format")
    citations: list[Citation] = Field(
        default_factory=list, description="Legal citations supporting the answer"
    )
    confidence: float = Field(
        default=0.0, ge=0.0, le=1.0, description="Confidence score of the answer"
    )
    clarification: ClarificationInfo | None = Field(
        default=None, description="Clarification information if more details are needed"
    )
    query_type: str | None = Field(
        default=None, description="Type of query (e.g., 'case_law', 'statute_interpretation')"
    )
    key_terms: list[str] | None = Field(
        default=None, description="Key legal terms extracted from the query"
    )


class Ruling(BaseModel):
    """Legal ruling/case information."""

    id: str = Field(..., description="Ruling identifier")
    title: str = Field(..., description="Ruling title or case name")
    court: str = Field(..., description="Court that issued the ruling")
    date: str = Field(..., description="Date of the ruling (ISO format)")
    summary: str = Field(..., description="Brief summary of the ruling")
    url: str | None = Field(default=None, description="URL to full ruling")
    relevance_score: float = Field(
        default=0.0, ge=0.0, le=1.0, description="Relevance to search query"
    )


class SearchRulingsResponse(BaseModel):
    """Response from ruling search."""

    results: list[Ruling] = Field(
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
    legal_basis: list[str] = Field(..., description="List of legal basis references")
    notes: str | None = Field(default=None, description="Additional notes")


class ClassificationResponse(BaseModel):
    """Response from case classification."""

    identified_grounds: list[LegalGround] = Field(
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

    embeddings: list[list[float]] = Field(
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
    metadata: dict[str, Any] | None = Field(
        default=None, description="Additional metadata about the chunk"
    )


class SemanticSearchResponse(BaseModel):
    """Response from semantic vector search."""

    results: list[SemanticSearchResult] = Field(
        ..., description="List of relevant text chunks with similarity scores"
    )
    query: str = Field(..., description="Original search query")
    total: int = Field(..., description="Total number of results found")


class QAResponse(BaseModel):
    """Response from simple Q&A endpoint."""

    answer: str = Field(..., description="Answer to the question")
    citations: list[Citation] = Field(
        default_factory=list, description="Legal citations supporting the answer"
    )


class GenerateTitleResponse(BaseModel):
    """Response from title generation endpoint."""

    title: str = Field(
        ...,
        description="Generated title for the chat session (3-6 words)",
        min_length=3,
        max_length=50,
    )
    session_id: str = Field(..., description="Session ID for tracking")
