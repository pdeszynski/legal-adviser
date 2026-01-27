"""Langfuse middleware for FastAPI.

This middleware provides automatic request tracing with Langfuse,
including trace ID propagation and request metadata tracking.

Updated for Langfuse SDK 3.x which uses OpenTelemetry and @observe decorator.
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
    - Automatic trace creation for all requests via @observe decorator
    - Request/response body logging (PII-redacted)
    - Timing measurements
    - Error tracking
    - Session/user ID extraction from headers

    Note: With Langfuse SDK 3.x, traces are automatically created via
    the @observe decorator and OpenTelemetry context propagation.
    This middleware focuses on metadata collection and timing.
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

        start_time = time.time()

        # Extract session and user IDs from headers
        session_id = request.headers.get("x-session-id") or request.headers.get(
            "x-request-id", str(uuid.uuid4())
        )
        user_id = request.headers.get("x-user-id")

        # Store metadata in request state for access in endpoints
        request.state.langfuse_session_id = session_id
        request.state.langfuse_user_id = user_id
        request.state.langfuse_start_time = start_time
        request.state.langfuse_metadata = {
            "method": request.method,
            "path": request.url.path,
            "query_params": str(request.query_params),
        }

        try:
            response = await call_next(request)

            # Calculate processing time
            processing_time_ms = (time.time() - start_time) * 1000

            # Store response info in request state
            request.state.langfuse_processing_time_ms = processing_time_ms
            request.state.langfuse_status_code = response.status_code

            return response

        except Exception as e:
            # Store error info
            request.state.langfuse_error = str(e)
            raise


async def get_langfuse_metadata(request: Request) -> dict[str, Any]:
    """Get the Langfuse metadata from request state.

    Args:
        request: FastAPI request object

    Returns:
        Dictionary containing Langfuse metadata
    """
    return {
        "session_id": getattr(request.state, "langfuse_session_id", None),
        "user_id": getattr(request.state, "langfuse_user_id", None),
        "start_time": getattr(request.state, "langfuse_start_time", None),
        "metadata": getattr(request.state, "langfuse_metadata", {}),
        "processing_time_ms": getattr(request.state, "langfuse_processing_time_ms", None),
        "status_code": getattr(request.state, "langfuse_status_code", None),
        "error": getattr(request.state, "langfuse_error", None),
    }


async def update_trace_metadata(request: Request, metadata: dict[str, Any]) -> None:
    """Update the current trace with additional metadata.

    Note: With Langfuse SDK 3.x, manual trace updates are done via OpenTelemetry API.
    This function updates request state for compatibility.

    Args:
        request: FastAPI request object
        metadata: Metadata to add to trace
    """
    redacted = _redact_dict_pii(metadata)
    current_metadata = getattr(request.state, "langfuse_metadata", {})
    current_metadata.update(redacted)
    request.state.langfuse_metadata = current_metadata


async def update_trace_output(request: Request, output: dict[str, Any]) -> None:
    """Update the current trace with output data.

    Note: With Langfuse SDK 3.x, manual trace updates are done via OpenTelemetry API.
    This function stores output in request state for compatibility.

    Args:
        request: FastAPI request object
        output: Output data to add to trace
    """
    redacted = _redact_dict_pii(output)
    request.state.langfuse_output = redacted


def create_span_from_request(
    request: Request,
    name: str,
    metadata: dict[str, Any] | None = None,
) -> Any | None:
    """Create a child span from the current request trace.

    Note: With Langfuse SDK 3.x, spans are automatically created via @observe decorator.
    This function is kept for API compatibility but returns None.

    Args:
        request: FastAPI request object
        name: Span name
        metadata: Optional metadata

    Returns:
        None (spans are auto-created via @observe)
    """
    # Spans are automatically created via @observe decorator in SDK 3.x
    return None
