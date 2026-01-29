"""Streaming response support for real-time AI output.

This module provides streaming utilities for better UX by delivering
AI responses incrementally rather than waiting for complete generation.
"""

import asyncio
import json
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from typing import Any

from fastapi.responses import StreamingResponse


@dataclass
class StreamChunk:
    """A single chunk of streamed response data."""

    content: str  # Text content
    done: bool = False  # Whether this is the final chunk
    metadata: dict[str, Any] = field(default_factory=dict)  # Additional data


def to_json_chunk(chunk: StreamChunk) -> str:
    """Convert a StreamChunk to a JSON-formatted SSE chunk.

    Args:
        chunk: StreamChunk to convert

    Returns:
        JSON string formatted for Server-Sent Events
    """
    data = {
        "content": chunk.content,
        "done": chunk.done,
        "metadata": chunk.metadata,
    }
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


async def stream_from_agent(
    agent,
    prompt: str,
    deps,
    metadata: dict[str, Any] | None = None,
) -> AsyncGenerator[str, None]:
    """Stream response from a PydanticAI agent.

    Since PydanticAI doesn't support streaming natively, this simulates
    streaming by processing the complete response and yielding chunks.

    Args:
        agent: PydanticAI Agent instance
        prompt: The prompt to send
        deps: Dependencies for the agent
        metadata: Optional metadata to include in final chunk

    Yields:
        JSON-formatted SSE chunks
    """
    # Run the agent (non-streaming)
    result = await agent.run(prompt, deps=deps)

    # Get the response text based on result type
    if hasattr(result, "output"):
        # Structured output
        if hasattr(result.output, "answer"):
            response_text = result.output.answer
        elif hasattr(result.output, "content"):
            response_text = result.output.content
        else:
            response_text = str(result.output)
    else:
        response_text = str(result)

    # Simulate streaming by yielding chunks
    chunk_size = 50  # Characters per chunk
    delay = 0.02  # Delay between chunks for natural feel

    for i in range(0, len(response_text), chunk_size):
        chunk_text = response_text[i : i + chunk_size]
        chunk = StreamChunk(content=chunk_text, done=False)
        yield to_json_chunk(chunk)
        await asyncio.sleep(delay)

    # Final chunk with metadata
    final_metadata = metadata or {}
    if hasattr(result, "usage"):
        final_metadata["usage"] = result.usage

    final_chunk = StreamChunk(content="", done=True, metadata=final_metadata)
    yield to_json_chunk(final_chunk)


async def stream_qa_response(
    question: str,
    mode: str,
    session_id: str,
    user_id: str | None = None,
) -> AsyncGenerator[str, None]:
    """Stream a Q&A response with real-time output.

    Args:
        question: The legal question
        mode: Response mode (LAWYER or SIMPLE)
        session_id: Session ID for tracking
        user_id: Optional user ID

    Yields:
        JSON-formatted SSE chunks with answer content
    """
    from ..agents.qa_agent import answer_question
    from ..services.cost_monitoring import track_llm_call

    start_time = asyncio.get_event_loop().time()

    try:
        # Run the Q&A workflow
        result = await answer_question(
            question=question,
            mode=mode,
            session_id=session_id,
            user_id=user_id,
        )

        answer = result.get("answer", "")
        citations = result.get("citations", [])
        confidence = result.get("confidence", 0.0)

        # Stream the answer text
        chunk_size = 50
        for i in range(0, len(answer), chunk_size):
            chunk_text = answer[i : i + chunk_size]
            chunk = StreamChunk(
                content=chunk_text,
                done=False,
                metadata={"type": "answer"},
            )
            yield to_json_chunk(chunk)
            await asyncio.sleep(0.01)

        # Send citations as final metadata
        elapsed = (asyncio.get_event_loop().time() - start_time) * 1000

        final_chunk = StreamChunk(
            content="",
            done=True,
            metadata={
                "type": "complete",
                "citations": citations,
                "confidence": confidence,
                "processing_time_ms": elapsed,
            },
        )
        yield to_json_chunk(final_chunk)

        # Track cost (estimated from answer length)
        input_tokens = len(question) // 4
        output_tokens = len(answer) // 4
        model = "gpt-4o" if mode == "LAWYER" else "gpt-4o-mini"
        track_llm_call(
            operation="qa_stream",
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            user_id=user_id,
            session_id=session_id,
        )

    except Exception as e:
        # Send error chunk
        error_chunk = StreamChunk(
            content="",
            done=True,
            metadata={
                "type": "error",
                "error": str(e),
            },
        )
        yield to_json_chunk(error_chunk)


def create_streaming_response(
    stream_generator: AsyncGenerator[str, None],
    media_type: str = "text/event-stream",
) -> StreamingResponse:
    """Create a FastAPI StreamingResponse from an async generator.

    Args:
        stream_generator: Async generator yielding SSE chunks
        media_type: Media type for the response

    Returns:
        FastAPI StreamingResponse
    """
    return StreamingResponse(
        stream_generator,
        media_type=media_type,
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


class StreamingContext:
    """Context manager for tracking streaming operations.

    Useful for cleanup and metrics collection.
    """

    def __init__(
        self,
        operation: str,
        session_id: str,
        user_id: str | None = None,
    ) -> None:
        """Initialize streaming context.

        Args:
            operation: Operation type
            session_id: Session ID
            user_id: Optional user ID
        """
        self.operation = operation
        self.session_id = session_id
        self.user_id = user_id
        self.start_time = 0.0
        self.tokens_sent = 0
        self.chunks_sent = 0

    async def __aenter__(self) -> "StreamingContext":
        """Enter streaming context."""
        import time

        self.start_time = time.time()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Exit streaming context and record metrics."""
        import time

        time.time() - self.start_time

        # Record metrics
        from ..services.cost_monitoring import track_llm_call

        # Estimate tokens from chunks
        estimated_tokens = self.tokens_sent // 4

        track_llm_call(
            operation=f"{self.operation}_stream",
            model="gpt-4o",  # Will be refined based on actual usage
            input_tokens=estimated_tokens // 10,  # Rough estimate
            output_tokens=estimated_tokens,
            user_id=self.user_id,
            session_id=self.session_id,
        )

    def record_chunk(self, content: str) -> None:
        """Record a sent chunk for metrics.

        Args:
            content: Chunk content that was sent
        """
        self.chunks_sent += 1
        self.tokens_sent += len(content)


@asynccontextmanager
async def streaming_context(
    operation: str,
    session_id: str,
    user_id: str | None = None,
):
    """Create a streaming context for metrics tracking.

    Args:
        operation: Operation type
        session_id: Session ID
        user_id: Optional user ID

    Yields:
        StreamingContext instance
    """
    ctx = StreamingContext(operation, session_id, user_id)
    await ctx.__aenter__()
    try:
        yield ctx
    finally:
        await ctx.__aexit__(None, None, None)
