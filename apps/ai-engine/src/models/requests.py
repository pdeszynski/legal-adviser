"""Request models for AI Engine API."""

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class ConversationMetadata(BaseModel):
    """Additional conversation metadata for Langfuse observability.

    This metadata provides richer context for traces, enabling:
    - Better usage pattern analysis
    - Improved debugging and monitoring
    - Enhanced user behavior understanding
    """

    # Message count information
    message_count: int | None = Field(
        default=None,
        description="Total number of messages in the conversation (including current)",
    )
    is_first_message: bool | None = Field(
        default=None,
        description="Whether this is the first message in a new conversation",
    )

    # Language/locale preference
    language: str | None = Field(
        default=None,
        description="Language preference (e.g., 'en', 'pl', 'de')",
    )
    locale: str | None = Field(
        default=None,
        description="Full locale string (e.g., 'en-US', 'pl-PL', 'de-DE')",
    )

    # Client-side information
    user_agent: str | None = Field(
        default=None,
        description="Client user agent string for platform detection",
    )
    platform: str | None = Field(
        default=None,
        description="Client platform (e.g., 'web', 'mobile', 'desktop')",
    )

    # Query type/category (if pre-classified)
    query_category: str | None = Field(
        default=None,
        description="Pre-classified query category (e.g., 'EMPLOYMENT_LAW', 'CONTRACT_REVIEW')",
    )

    # Conversation timing
    conversation_start_time: str | None = Field(
        default=None,
        description="ISO timestamp of when the conversation started",
    )


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
    context: dict[str, Any] | None = Field(
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
    conversation_history: list[dict[str, str]] | None = Field(
        default=None,
        description="Conversation history as list of {role, content} messages for context",
    )
    conversation_metadata: ConversationMetadata | None = Field(
        default=None,
        description="Additional conversation metadata for Langfuse observability",
    )


class SearchRulingsRequest(BaseModel):
    """Request to search for legal rulings."""

    query: str = Field(..., description="Search query", min_length=3)
    filters: dict[str, Any] | None = Field(
        default=None,
        description="Search filters (date range, court type, etc.)",
    )
    limit: int = Field(default=10, ge=1, le=100, description="Maximum results")


class ClassifyCaseRequest(BaseModel):
    """Request to classify a case and identify legal grounds."""

    case_description: str = Field(
        ...,
        description="Detailed description of the legal case",
        min_length=20,
    )
    session_id: str = Field(..., description="User session ID for tracking")
    context: dict[str, Any] | None = Field(
        default=None,
        description="Additional context (e.g., document types, parties involved)",
    )


class GenerateEmbeddingsRequest(BaseModel):
    """Request to generate embeddings for text chunks."""

    texts: list[str] = Field(
        ..., description="List of text chunks to generate embeddings for", min_length=1
    )
    model: str = Field(
        default="text-embedding-3-small",
        description="OpenAI embedding model to use",
    )


class SemanticSearchRequest(BaseModel):
    """Request to perform semantic vector search."""

    query: str = Field(..., description="Search query", min_length=3)
    limit: int = Field(default=5, ge=1, le=20, description="Maximum results to return")
    threshold: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Minimum similarity threshold (0-1)",
    )


class QARequest(BaseModel):
    """Request to ask a legal question (simplified API)."""

    question: str = Field(..., description="Legal question to answer", min_length=5)


class GenerateTitleRequest(BaseModel):
    """Request to generate a chat session title."""

    first_message: str = Field(
        ...,
        description="First user message in the chat session",
        min_length=5,
    )
    session_id: str = Field(
        ...,
        description="Session ID for tracking",
    )


class ClarificationAnswer(BaseModel):
    """A single clarification answer from the user."""

    question: str = Field(..., description="The question that was asked")
    question_type: str = Field(..., description="Type of question (e.g., timeline, parties)")
    answer: str = Field(..., description="The user's answer to the question")


class ClarificationAnswerRequest(BaseModel):
    """Request to submit clarification answers and get an AI response."""

    original_question: str = Field(
        ...,
        description="The original question that prompted clarification",
        min_length=5,
    )
    session_id: str = Field(..., description="User session ID for tracking")
    mode: str = Field(
        default="SIMPLE",
        description="Response mode: LAWYER (detailed) or SIMPLE (layperson)",
    )
    answers: list[ClarificationAnswer] = Field(
        ...,
        description="List of clarification answers from the user",
        min_length=1,
    )
    conversation_history: list[dict[str, str]] | None = Field(
        default=None,
        description="Conversation history as list of {role, content} messages for context",
    )
    conversation_metadata: ConversationMetadata | None = Field(
        default=None,
        description="Additional conversation metadata for Langfuse observability",
    )
