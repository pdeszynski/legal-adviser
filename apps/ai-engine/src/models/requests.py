"""Request models for AI Engine API."""

from enum import Enum
from typing import Any

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
