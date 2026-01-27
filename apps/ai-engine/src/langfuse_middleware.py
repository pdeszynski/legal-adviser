"""Langfuse middleware for FastAPI.

This middleware provides automatic request tracing with Langfuse,
including trace ID propagation and request metadata tracking.
"""

import time
import uuid
from typing import Any, ClassVar

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from .langfuse_init import _redact_dict_pii, is_langfuse_enabled


class LangfuseMiddleware(BaseHTTPMiddleware):
    """Middleware for automatic Langfuse tracing of HTTP requests.

    Features:
    - Automatic trace creation for all requests
    - Request/response body logging (PII-redacted)
    - Timing measurements
    - Error tracking
    - Session/user ID extraction from headers
    """

    # Paths that should not be traced
    EXCLUDED_PATHS: ClassVar[set[str]] = {
        "/health",
        "/health/ready",
        "/health/live",
        "/docs",
        "/redoc",
        "/openapi.json",
    }

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request with Langfuse tracing.

        Args:
            request: Incoming HTTP request
            call_next: Next middleware/handler in chain

        Returns:
            HTTP response
        """
        # Skip excluded paths
        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)

        # Skip if Langfuse is not enabled
        if not is_langfuse_enabled():
            return await call_next(request)

        from .langfuse_init import get_langfuse

        langfuse = get_langfuse()
        if langfuse is None:
            return await call_next(request)

        start_time = time.time()

        # Extract session and user IDs from headers
        session_id = request.headers.get("x-session-id") or request.headers.get(
            "x-request-id", str(uuid.uuid4())
        )
        user_id = request.headers.get("x-user-id")

        # Extract existing trace ID for distributed tracing
        existing_trace_id = request.headers.get("x-langfuse-trace-id")

        # Create trace
        trace = langfuse.trace(
            name=f"{request.method} {request.url.path}",
            session_id=session_id,
            user_id=user_id,
            trace_id=existing_trace_id,  # Continue existing trace if provided
            metadata={
                "method": request.method,
                "path": request.url.path,
                "query_params": str(request.query_params),
            },
        )

        # Store trace in request state for access in endpoints
        request.state.langfuse_trace = trace
        request.state.langfuse_start_time = start_time

        try:
            response = await call_next(request)

            # Calculate processing time
            processing_time_ms = (time.time() - start_time) * 1000

            # Update trace with response info
            trace.update(
                output={
                    "status_code": response.status_code,
                    "processing_time_ms": round(processing_time_ms, 2),
                }
            )
            trace.metadata["processing_time_ms"] = processing_time_ms
            trace.metadata["status_code"] = response.status_code

            # Set trace ID in response header for distributed tracing
            response.headers["x-langfuse-trace-id"] = trace.trace_id or ""

            trace.end()

            return response

        except Exception as e:
            # End trace with error
            trace.end(level="ERROR", status_message=str(e))
            raise


async def get_langfuse_trace(request: Request) -> Any | None:
    """Get the Langfuse trace from request state.

    Args:
        request: FastAPI request object

    Returns:
        Langfuse trace or None
    """
    return getattr(request.state, "langfuse_trace", None)


async def update_trace_metadata(request: Request, metadata: dict[str, Any]) -> None:
    """Update the current trace with additional metadata.

    Args:
        request: FastAPI request object
        metadata: Metadata to add to trace
    """
    trace = await get_langfuse_trace(request)
    if trace:
        redacted = _redact_dict_pii(metadata)
        trace.metadata.update(redacted)  # type: ignore


async def update_trace_output(request: Request, output: dict[str, Any]) -> None:
    """Update the current trace with output data.

    Args:
        request: FastAPI request object
        output: Output data to add to trace
    """
    trace = await get_langfuse_trace(request)
    if trace:
        redacted = _redact_dict_pii(output)
        trace.update(output=redacted)


def create_span_from_request(
    request: Request,
    name: str,
    metadata: dict[str, Any] | None = None,
) -> Any | None:
    """Create a child span from the current request trace.

    Args:
        request: FastAPI request object
        name: Span name
        metadata: Optional metadata

    Returns:
        Langfuse span or None
    """
    trace = getattr(request.state, "langfuse_trace", None)
    if trace is None:
        return None

    return trace.span(name=name, metadata=metadata or {})
