"""Enhanced streaming support for real-time AI responses with SSE events.

This module provides streaming utilities with structured event types for
better client-side handling of real-time AI responses.

Event Types:
- token: Partial response content
- citation: Legal citation reference
- error: Error information
- done: Final completion event with metadata
"""

import asyncio
import json
import logging
from collections.abc import AsyncGenerator
from dataclasses import dataclass, field
from typing import Any

from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from ..auth import UserContext
from ..exceptions import AIEngineError

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# Event Models
# -----------------------------------------------------------------------------


@dataclass
class StreamEvent:
    """A single streaming event with type-based structure.

    Events are serialized to SSE format with explicit type field
    for client-side handling.

    Attributes:
        type: Event type (token, citation, error, done)
        content: Text content (for token events)
        metadata: Additional data (varies by event type)
    """

    type: str  # 'token', 'citation', 'error', 'done'
    content: str = ""  # Text content for token events
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_sse(self) -> str:
        """Convert event to Server-Sent Events format.

        Returns:
            SSE-formatted string with JSON data
        """
        data = {
            "type": self.type,
            "content": self.content,
            "metadata": self.metadata,
        }
        return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


def token_event(content: str) -> StreamEvent:
    """Create a token event with partial content.

    Args:
        content: Partial text content

    Returns:
        StreamEvent with type='token'
    """
    return StreamEvent(type="token", content=content)


def citation_event(source: str, article: str, url: str | None = None) -> StreamEvent:
    """Create a citation event.

    Args:
        source: Citation source (e.g., "Civil Code")
        article: Article or section number
        url: Optional URL to the source

    Returns:
        StreamEvent with type='citation'
    """
    return StreamEvent(
        type="citation",
        metadata={
            "source": source,
            "article": article,
            "url": url,
        },
    )


def error_event(error: str, error_code: str | None = None) -> StreamEvent:
    """Create an error event.

    Args:
        error: Error message
        error_code: Optional error code

    Returns:
        StreamEvent with type='error'
    """
    metadata = {"error": error}
    if error_code:
        metadata["error_code"] = error_code
    return StreamEvent(type="error", metadata=metadata)


def done_event(
    citations: list[dict[str, Any]] | None = None,
    confidence: float = 0.0,
    processing_time_ms: float = 0.0,
    query_type: str | None = None,
    key_terms: list[str] | None = None,
) -> StreamEvent:
    """Create a completion event with final metadata.

    Args:
        citations: List of legal citations
        confidence: Confidence score (0-1)
        processing_time_ms: Processing time in milliseconds
        query_type: Type of query
        key_terms: Key legal terms extracted

    Returns:
        StreamEvent with type='done'
    """
    metadata: dict[str, Any] = {
        "citations": citations or [],
        "confidence": confidence,
        "processing_time_ms": processing_time_ms,
    }
    if query_type:
        metadata["query_type"] = query_type
    if key_terms:
        metadata["key_terms"] = key_terms

    return StreamEvent(type="done", metadata=metadata)


# -----------------------------------------------------------------------------
# Streaming Generator
# -----------------------------------------------------------------------------


async def stream_qa_enhanced(
    question: str,
    mode: str,
    session_id: str,
    user: UserContext | None = None,
    request: Any | None = None,  # FastAPI Request for disconnect detection
) -> AsyncGenerator[str, None]:
    """Stream a Q&A response with structured events.

    This generator yields SSE-formatted events with type-based structure:
    - token events: Partial response content as it's generated
    - citation events: Legal citations as they're identified
    - error events: If an error occurs during processing
    - done event: Final completion with full metadata

    Client disconnection is handled gracefully by checking the request state.

    Args:
        question: The legal question
        mode: Response mode (LAWYER or SIMPLE)
        session_id: Session ID for tracking
        user: Optional authenticated user context
        request: FastAPI Request for detecting client disconnection

    Yields:
        SSE-formatted JSON events
    """
    import time

    from ..agents.qa_agent import answer_question
    from ..langfuse_init import is_langfuse_enabled, update_current_trace

    start_time = time.time()
    user_id = user.id if user else None

    logger.info(
        "Starting enhanced Q&A stream: session_id=%s, user_id=%s, mode=%s",
        session_id,
        user_id,
        mode,
    )

    try:
        # Check for client disconnection before processing
        if request and getattr(request, "is_disconnected", None) and await request.is_disconnected():
            logger.info("Client disconnected before processing")
            return

        # Run the Q&A workflow
        result = await answer_question(
            question=question,
            mode=mode,
            session_id=session_id,
            user_id=user_id,
            user=user,
        )

        # Check if clarification is needed (special case)
        if result.get("needs_clarification"):
            clarification = result.get("clarification", {})
            # Send clarification as token content
            event = token_event(
                json.dumps({
                    "type": "clarification",
                    "questions": clarification.get("questions", []),
                    "context_summary": clarification.get("context_summary", ""),
                    "next_steps": clarification.get("next_steps", ""),
                }, ensure_ascii=False)
            )
            yield event.to_sse()

            # Send done event for clarification case
            yield done_event(
                citations=[],
                confidence=0.0,
                processing_time_ms=(time.time() - start_time) * 1000,
            ).to_sse()
            return

        answer = result.get("answer", "")
        citations = result.get("citations", [])
        confidence = result.get("confidence", 0.0)
        query_type = result.get("query_type")
        key_terms = result.get("key_terms", [])

        # Stream the answer text in chunks
        chunk_size = 50  # Characters per chunk
        delay = 0.01  # Delay between chunks for natural feel

        for i in range(0, len(answer), chunk_size):
            # Check for client disconnection during streaming
            if (
                request
                and getattr(request, "is_disconnected", None)
                and await request.is_disconnected()
            ):
                logger.info("Client disconnected during streaming")
                return

            chunk_text = answer[i : i + chunk_size]
            yield token_event(chunk_text).to_sse()
            await asyncio.sleep(delay)

        # Send citations as individual events
        for citation in citations:
            yield citation_event(
                source=citation.get("source", "Unknown"),
                article=citation.get("article", ""),
                url=citation.get("url"),
            ).to_sse()

        # Send final done event with complete metadata
        processing_time_ms = (time.time() - start_time) * 1000
        yield done_event(
            citations=citations,
            confidence=confidence,
            processing_time_ms=processing_time_ms,
            query_type=query_type,
            key_terms=key_terms,
        ).to_sse()

        # Update Langfuse trace
        if is_langfuse_enabled():
            update_current_trace(
                output={
                    "answer_length": len(answer),
                    "confidence": confidence,
                    "citations_count": len(citations),
                    "processing_time_ms": processing_time_ms,
                    "streaming": True,
                }
            )

        logger.info(
            "Enhanced Q&A stream complete: session_id=%s, tokens=%d, time=%dms",
            session_id,
            len(answer.split()),
            int(processing_time_ms),
        )

    except AIEngineError as e:
        # Send structured error for known AI Engine errors
        logger.exception("AI Engine error in streaming: %s - %s", e.error_code, e.message)
        yield error_event(str(e), error_code=e.error_code).to_sse()

    except HTTPException as e:
        # Send error for HTTP exceptions (auth, validation)
        logger.exception("HTTP error in streaming: %s", e.detail)
        error_msg = (
            e.detail
            if isinstance(e.detail, str)
            else str(e.detail.get("message", "Unknown error"))
        )
        yield error_event(error_msg).to_sse()

    except Exception:
        # Send generic error for unexpected exceptions
        logger.exception("Unexpected error in streaming")
        yield error_event("An unexpected error occurred").to_sse()


def create_enhanced_streaming_response(
    stream_generator: AsyncGenerator[str, None],
) -> StreamingResponse:
    """Create a FastAPI StreamingResponse for enhanced SSE streaming.

    Args:
        stream_generator: Async generator yielding SSE events

    Returns:
        FastAPI StreamingResponse with proper headers for SSE
    """
    return StreamingResponse(
        stream_generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
