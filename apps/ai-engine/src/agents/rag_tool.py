"""RAG (Retrieval Augmented Generation) tool for PydanticAI agents.

This module provides a vector search tool that queries the backend's
vector store for relevant legal context. It integrates with:
- PydanticAI agents for tool-based context retrieval
- Langfuse for observability and tracing
- Backend VectorStoreService via REST API
"""

from functools import lru_cache
from typing import Any

import httpx
from pydantic import BaseModel, Field, ValidationError
from pydantic_ai import RunContext

from ..config import get_settings
from ..langfuse_init import is_langfuse_enabled
from ..services.embedding_service import EmbeddingService
from .dependencies import ModelDeps


# -----------------------------------------------------------------------------
# Pydantic Models for RAG Tool
# -----------------------------------------------------------------------------


class RetrievedContext(BaseModel):
    """A retrieved context chunk from the vector store."""

    content: str = Field(..., description="Content of the retrieved chunk")
    source: str = Field(default="document", description="Source of the content")
    article: str | None = Field(default=None, description="Article or section")
    similarity: float = Field(..., description="Similarity score", ge=0.0, le=1.0)
    url: str | None = Field(default=None, description="URL to the source")
    document_id: str | None = Field(default=None, description="Document ID")
    chunk_index: int | None = Field(default=None, description="Chunk index")


class VectorSearchRequest(BaseModel):
    """Request for vector search."""

    query_embedding: list[float] = Field(..., description="Query embedding vector")
    limit: int = Field(default=5, description="Maximum number of results", ge=1, le=20)
    threshold: float = Field(
        default=0.7, description="Minimum similarity score", ge=0.0, le=1.0
    )
    document_id: str | None = Field(default=None, description="Filter by document ID")


class VectorSearchResult(BaseModel):
    """A single vector search result."""

    id: str
    document_id: str
    content_chunk: str
    chunk_index: int
    similarity: float
    metadata: dict[str, Any] | None = None


class VectorSearchResponse(BaseModel):
    """Response from vector search."""

    results: list[VectorSearchResult]
    total: int
    query: str


# -----------------------------------------------------------------------------
# HTTP Client for Backend API
# -----------------------------------------------------------------------------


@lru_cache
def _get_http_client() -> httpx.AsyncClient:
    """Get or create the HTTP client singleton for backend requests.

    The client is cached and reused for efficient connection pooling.
    """
    settings = get_settings()
    backend_url = getattr(settings, "BACKEND_URL", "http://localhost:3001")
    timeout = httpx.Timeout(10.0, connect=5.0)
    return httpx.AsyncClient(base_url=backend_url, timeout=timeout)


async def _get_http_client_with_deps() -> httpx.AsyncClient:
    """Get HTTP client, ensuring it's available.

    This version is used within agent contexts and handles
    the case where the client hasn't been initialized yet.
    """
    try:
        return _get_http_client()
    except Exception:
        # Fallback: create a new client if cached one failed
        settings = get_settings()
        backend_url = getattr(settings, "BACKEND_URL", "http://localhost:3001")
        return httpx.AsyncClient(base_url=backend_url, timeout=10.0)


# -----------------------------------------------------------------------------
# RAG Tool Implementation
# -----------------------------------------------------------------------------


@lru_cache
def _get_embedding_service() -> EmbeddingService:
    """Get or create the EmbeddingService singleton."""
    return EmbeddingService()


async def retrieve_context_tool(
    ctx: RunContext[ModelDeps] | None = None,
    query: str = "",
    limit: int = 5,
    threshold: float = 0.7,
) -> list[dict[str, Any]]:
    """Tool to retrieve relevant legal context from the vector store.

    This tool:
    1. Generates an embedding for the query using EmbeddingService
    2. Calls the backend's vector search endpoint
    3. Formats results for use in PydanticAI agents

    Args:
        ctx: PydanticAI run context with dependencies (optional, not used currently)
        query: The search query text
        limit: Maximum number of results to return (default: 5)
        threshold: Minimum similarity score (default: 0.7)

    Returns:
        List of retrieved context chunks with metadata

    Example:
        ```python
        contexts = await retrieve_context_tool(
            ctx=run_context,
            query="What is the statute of limitations for contract claims?",
            limit=5,
            threshold=0.7
        )
        ```
    """
    span = None
    if is_langfuse_enabled():
        from ..langfuse_init import get_langfuse

        client = get_langfuse()
        if client:
            span = client.span(
                name="retrieve_context",
                metadata={"query_length": len(query), "limit": limit, "threshold": threshold},
            )

    try:
        # Step 1: Generate embedding for the query using EmbeddingService
        embedding_service = _get_embedding_service()
        query_embedding = await embedding_service.generate_embedding(query)

        if span:
            span.update(
                output={
                    "embedding_model": embedding_service.default_model,
                    "embedding_dim": len(query_embedding),
                }
            )

        # Step 2: Call backend vector search endpoint
        http_client = await _get_http_client_with_deps()
        search_request = VectorSearchRequest(
            query_embedding=query_embedding,
            limit=limit,
            threshold=threshold,
        )

        response = await http_client.post(
            "/api/documents/vector-search",
            json=search_request.model_dump(),
        )

        if response.status_code != 200:
            if span:
                span.end(
                    level="ERROR",
                    status_message=f"Backend returned {response.status_code}",
                )
            # Return empty list on backend error rather than failing
            return []

        # Step 3: Parse and format results
        search_response = VectorSearchResponse(**response.json())

        if span:
            span.end(
                level="SUCCESS",
                output={"results_count": search_response.total, "avg_similarity": _calculate_avg_similarity(search_response.results)},
            )

        # Convert to format expected by agents
        contexts = []
        for result in search_response.results:
            # Extract metadata for citation formatting
            metadata = result.metadata or {}
            context = {
                "content": result.content_chunk,
                "source": metadata.get("source", "document"),
                "article": metadata.get("article"),
                "similarity": result.similarity,
                "url": metadata.get("url"),
                "document_id": result.document_id,
                "chunk_index": result.chunk_index,
            }
            contexts.append(context)

        return contexts

    except ValidationError as e:
        if span:
            span.end(level="ERROR", status_message=f"Validation error: {e!s}")
        # Return empty list on validation error
        return []
    except httpx.HTTPError as e:
        if span:
            span.end(level="ERROR", status_message=f"HTTP error: {e!s}")
        # Return empty list on network error
        return []
    except Exception as e:
        if span:
            span.end(level="ERROR", status_message=f"Unexpected error: {e!s}")
        # Return empty list on unexpected error
        return []


def _calculate_avg_similarity(results: list[VectorSearchResult]) -> float:
    """Calculate average similarity score from results."""
    if not results:
        return 0.0
    return sum(r.similarity for r in results) / len(results)


# -----------------------------------------------------------------------------
# Context Formatter for Agent Prompts
# -----------------------------------------------------------------------------


def format_contexts_for_prompt(
    contexts: list[dict[str, Any]], max_contexts: int | None = None
) -> str:
    """Format retrieved contexts for inclusion in agent prompts.

    Args:
        contexts: List of retrieved context chunks
        max_contexts: Maximum number of contexts to include (default: all)

    Returns:
        Formatted string suitable for inclusion in prompts

    Example:
        ```python
        contexts = await retrieve_context_tool(ctx, "contract law", limit=5)
        context_text = format_contexts_for_prompt(contexts, max_contexts=3)
        prompt = f"Based on this context:\\n\\n{context_text}\\n\\nAnswer the question."
        ```
    """
    if not contexts:
        return "No relevant legal context was retrieved for this query."

    contexts_to_format = contexts[:max_contexts] if max_contexts else contexts

    formatted_parts = []
    for i, ctx in enumerate(contexts_to_format, 1):
        source = ctx.get("source", "Unknown")
        article = ctx.get("article", "")
        similarity = ctx.get("similarity", 0.0)

        header = f"[Context {i}]"
        if article:
            header += f" {source} - {article}"
        else:
            header += f" {source}"

        header += f" (similarity: {similarity:.2f})"

        formatted_parts.append(f"{header}\n{ctx['content']}")

    return "\n\n".join(formatted_parts)


# -----------------------------------------------------------------------------
# Citation Extractor
# -----------------------------------------------------------------------------


def extract_citations_from_contexts(
    contexts: list[dict[str, Any]],
) -> list[dict[str, str | None]]:
    """Extract citation information from retrieved contexts.

    Args:
        contexts: List of retrieved context chunks

    Returns:
        List of citation dictionaries with source, article, and url

    Example:
        ```python
        contexts = await retrieve_context_tool(ctx, "contract law", limit=5)
        citations = extract_citations_from_contexts(contexts)
        # Returns: [{"source": "Civil Code", "article": "Art. 118", "url": "..."}]
        ```
    """
    citations = []
    seen = set()

    for ctx in contexts:
        source = ctx.get("source", "Unknown")
        article = ctx.get("article", "")

        # Deduplicate by source + article
        key = f"{source}:{article}"
        if key in seen:
            continue
        seen.add(key)

        citation = {
            "source": source,
            "article": article or "",
            "url": ctx.get("url"),
        }
        citations.append(citation)

    return citations
