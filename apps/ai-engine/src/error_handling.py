"""Error handling utilities with Langfuse integration and retry logic.

This module provides:
1. Decorators for automatic error tracking with Langfuse
2. Retry logic with exponential backoff
3. Error context enrichment
4. Fallback mechanisms for agent failures
"""

import asyncio
import functools
import logging
import time
import traceback
from collections.abc import Callable
from typing import Any, TypeVar

from .config import get_settings
from .exceptions import (
    AIEngineError,
    get_error_code,
    get_suggestion,
    get_user_message,
    is_retryable,
)
from .langfuse_init import get_langfuse, is_langfuse_enabled

logger = logging.getLogger(__name__)

T = TypeVar("T")


# -----------------------------------------------------------------------------
# Retry Configuration
# -----------------------------------------------------------------------------


class RetryConfig:
    """Configuration for retry behavior."""

    def __init__(
        self,
        *,
        max_attempts: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
    ) -> None:
        """Initialize retry configuration.

        Args:
            max_attempts: Maximum number of retry attempts
            base_delay: Initial delay in seconds
            max_delay: Maximum delay in seconds
            exponential_base: Base for exponential backoff
            jitter: Add random jitter to delay
        """
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter


# Default retry configuration
DEFAULT_RETRY_CONFIG = RetryConfig()

# Retry configuration for different error types
RETRY_CONFIGS = {
    "rate_limit": RetryConfig(
        max_attempts=5,
        base_delay=5.0,
        max_delay=120.0,
    ),
    "timeout": RetryConfig(
        max_attempts=3,
        base_delay=2.0,
        max_delay=30.0,
    ),
    "service_unavailable": RetryConfig(
        max_attempts=4,
        base_delay=3.0,
        max_delay=60.0,
    ),
}


def get_retry_config_for_error(error: Exception) -> RetryConfig:
    """Get retry configuration based on error type.

    Args:
        error: The exception to get config for

    Returns:
        RetryConfig for the error type
    """
    error_code = get_error_code(error)

    if error_code == "RATE_LIMIT_EXCEEDED":
        return RETRY_CONFIGS["rate_limit"]
    if error_code == "LLM_TIMEOUT":
        return RETRY_CONFIGS["timeout"]
    if error_code == "SERVICE_UNAVAILABLE":
        return RETRY_CONFIGS["service_unavailable"]

    return DEFAULT_RETRY_CONFIG


def calculate_delay(attempt: int, config: RetryConfig) -> float:
    """Calculate delay for next retry attempt.

    Args:
        attempt: Current attempt number (0-indexed)
        config: Retry configuration

    Returns:
        Delay in seconds
    """
    delay = min(
        config.base_delay * (config.exponential_base ** attempt),
        config.max_delay,
    )

    if config.jitter:
        import random
        delay = delay * (0.5 + random.random() * 0.5)

    return delay


# -----------------------------------------------------------------------------
# Error Tracking with Langfuse
# -----------------------------------------------------------------------------


def track_error_context(
    span: Any,
    error: Exception,
    context: dict[str, Any] | None = None,
) -> None:
    """Enrich Langfuse span with error context.

    Args:
        span: Langfuse span to annotate
        error: The exception that occurred
        context: Additional context about the error
    """
    if span is None:
        return

    try:
        error_info = {
            "error_code": get_error_code(error),
            "error_type": type(error).__name__,
            "error_message": str(error),
            "retryable": is_retryable(error),
        }

        if isinstance(error, AIEngineError):
            error_info["details"] = error.details
            if error.suggestion:
                error_info["suggestion"] = error.suggestion

        if context:
            error_info["context"] = context

        # Update span metadata with error info
        if hasattr(span, "metadata"):
            span.metadata = span.metadata or {}
            span.metadata["error"] = error_info

        # End span with error level
        span.end(level="ERROR", status_message=str(error))

    except Exception as e:
        # Don't let error tracking failures break the main flow
        logger.warning("Failed to track error in Langfuse: %s", e)


def create_error_trace(
    operation: str,
    session_id: str | None = None,
    user_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> Any | None:
    """Create a Langfuse trace for error tracking.

    Args:
        operation: Operation name (e.g., "qa_agent.run")
        session_id: Session ID for grouping
        user_id: User ID for analytics
        metadata: Additional metadata

    Returns:
        Langfuse trace or None if Langfuse disabled
    """
    if not is_langfuse_enabled():
        return None

    client = get_langfuse()
    if client is None:
        return None

    return client.trace(
        name=f"error:{operation}",
        session_id=session_id,
        user_id=user_id,
        metadata=metadata or {},
    )


# -----------------------------------------------------------------------------
# Retry Decorator
# -----------------------------------------------------------------------------


def with_retry(
    *,
    config: RetryConfig | None = None,
    operation_name: str | None = None,
    session_id: str | None = None,
    user_id: str | None = None,
):
    """Decorator for automatic retry with exponential backoff.

    Args:
        config: Retry configuration (uses default if None)
        operation_name: Operation name for logging/tracking
        session_id: Session ID for Langfuse tracking
        user_id: User ID for Langfuse tracking

    Example:
        ```python
        @with_retry(operation_name="qa_agent.run")
        async def my_function():
            # May fail with retryable errors
            pass
        ```
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        if asyncio.iscoroutinefunction(func):
            @functools.wraps(func)
            async def async_wrapper(*args: Any, **kwargs: Any) -> T:
                retry_config = config or DEFAULT_RETRY_CONFIG
                last_error: Exception | None = None
                operation = operation_name or func.__name__

                for attempt in range(retry_config.max_attempts):
                    try:
                        return await func(*args, **kwargs)
                    except Exception as e:
                        last_error = e

                        if not is_retryable(e):
                            # Non-retryable error, raise immediately
                            logger.error(
                                "Non-retryable error in %s: %s",
                                operation,
                                e,
                            )
                            raise

                        if attempt < retry_config.max_attempts - 1:
                            # Calculate delay and retry
                            delay = calculate_delay(attempt, retry_config)
                            logger.warning(
                                "Retryable error in %s (attempt %d/%d): %s. "
                                "Retrying in %.2fs...",
                                operation,
                                attempt + 1,
                                retry_config.max_attempts,
                                e,
                                delay,
                            )

                            # Track retry in Langfuse
                            if is_langfuse_enabled():
                                client = get_langfuse()
                                if client:
                                    span = client.span(
                                        name=f"{operation}.retry_{attempt}",
                                        session_id=session_id,
                                        user_id=user_id,
                                        metadata={
                                            "attempt": attempt + 1,
                                            "max_attempts": retry_config.max_attempts,
                                            "delay_seconds": delay,
                                            "error_code": get_error_code(e),
                                        },
                                    )
                                    span.end(level="WARNING")

                            await asyncio.sleep(delay)
                        else:
                            logger.error(
                                "Max retries exceeded for %s: %s",
                                operation,
                                e,
                            )

                # All retries exhausted
                if last_error:
                    # Create final error trace
                    if is_langfuse_enabled():
                        trace = create_error_trace(
                            operation,
                            session_id=session_id,
                            user_id=user_id,
                        )
                        if trace:
                            track_error_context(trace, last_error)

                    raise last_error
                raise RuntimeError("Retry logic failed without error")

            return async_wrapper
        @functools.wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> T:
            retry_config = config or DEFAULT_RETRY_CONFIG
            last_error: Exception | None = None
            operation = operation_name or func.__name__

            for attempt in range(retry_config.max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_error = e

                    if not is_retryable(e):
                        logger.error(
                            "Non-retryable error in %s: %s",
                            operation,
                            e,
                        )
                        raise

                    if attempt < retry_config.max_attempts - 1:
                        delay = calculate_delay(attempt, retry_config)
                        logger.warning(
                            "Retryable error in %s (attempt %d/%d): %s. "
                            "Retrying in %.2fs...",
                            operation,
                            attempt + 1,
                            retry_config.max_attempts,
                            e,
                            delay,
                        )
                        time.sleep(delay)
                    else:
                        logger.error(
                            "Max retries exceeded for %s: %s",
                            operation,
                            e,
                        )

            if last_error:
                raise last_error
            raise RuntimeError("Retry logic failed without error")

        return sync_wrapper

    return decorator


# -----------------------------------------------------------------------------
# Error Tracking Decorator
# -----------------------------------------------------------------------------


def with_error_tracking(
    *,
    operation: str | None = None,
    session_id: str | None = None,
    user_id: str | None = None,
    reraise: bool = True,
):
    """Decorator for automatic error tracking with Langfuse.

    Args:
        operation: Operation name for tracking
        session_id: Session ID for Langfuse
        user_id: User ID for Langfuse
        reraise: Whether to reraise the exception

    Example:
        ```python
        @with_error_tracking(operation_name="qa_agent.run")
        async def my_function():
            # Errors will be tracked in Langfuse
            pass
        ```
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        op_name = operation or func.__name__

        if asyncio.iscoroutinefunction(func):
            @functools.wraps(func)
            async def async_wrapper(*args: Any, **kwargs: Any) -> T:
                trace = None

                # Create Langfuse trace
                if is_langfuse_enabled():
                    trace = create_error_trace(
                        op_name,
                        session_id=session_id,
                        user_id=user_id,
                    )

                try:
                    result = await func(*args, **kwargs)

                    # End trace successfully
                    if trace:
                        trace.end()

                    return result

                except Exception as e:
                    logger.error(
                        "Error in %s: %s",
                        op_name,
                        e,
                        exc_info=True,
                    )

                    # Track error in Langfuse
                    if trace:
                        track_error_context(trace, e)

                    if reraise:
                        raise
                    return None  # type: ignore

            return async_wrapper
        @functools.wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> T:
            trace = None

            if is_langfuse_enabled():
                trace = create_error_trace(
                    op_name,
                    session_id=session_id,
                    user_id=user_id,
                )

            try:
                result = func(*args, **kwargs)

                if trace:
                    trace.end()

                return result

            except Exception as e:
                logger.error(
                    "Error in %s: %s",
                    op_name,
                    e,
                    exc_info=True,
                )

                if trace:
                    track_error_context(trace, e)

                if reraise:
                    raise
                return None  # type: ignore

        return sync_wrapper

    return decorator


# -----------------------------------------------------------------------------
# Combined Decorator: Retry + Error Tracking
# -----------------------------------------------------------------------------


def with_resilience(
    *,
    operation: str | None = None,
    session_id: str | None = None,
    user_id: str | None = None,
    retry_config: RetryConfig | None = None,
):
    """Decorator combining retry logic and error tracking.

    This is the recommended decorator for agent and workflow functions.
    It provides:
    1. Automatic retry for retryable errors
    2. Langfuse error tracking
    3. Detailed logging

    Args:
        operation: Operation name for tracking
        session_id: Session ID for Langfuse
        user_id: User ID for Langfuse
        retry_config: Retry configuration (uses default if None)

    Example:
        ```python
        @with_resilience(operation="qa_agent.run")
        async def my_agent_function():
            # Automatic retry and error tracking
            pass
        ```
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        # Apply error tracking first (outer decorator)
        tracked = with_error_tracking(
            operation=operation,
            session_id=session_id,
            user_id=user_id,
        )(func)

        # Apply retry (inner decorator)
        return with_retry(
            config=retry_config,
            operation_name=operation,
            session_id=session_id,
            user_id=user_id,
        )(tracked)

    return decorator


# -----------------------------------------------------------------------------
# Fallback Mechanisms
# -----------------------------------------------------------------------------


class FallbackConfig:
    """Configuration for fallback behavior."""

    def __init__(
        self,
        *,
        fallback_function: Callable[..., Any] | None = None,
        fallback_message: str | None = None,
        use_simplified_response: bool = False,
    ) -> None:
        """Initialize fallback configuration.

        Args:
            fallback_function: Alternative function to call on failure
            fallback_message: Message to return on failure
            use_simplified_response: Return simplified response on failure
        """
        self.fallback_function = fallback_function
        self.fallback_message = fallback_message
        self.use_simplified_response = use_simplified_response


def with_fallback(
    *,
    fallback_config: FallbackConfig,
    operation: str | None = None,
):
    """Decorator for fallback behavior on agent failure.

    Args:
        fallback_config: Fallback configuration
        operation: Operation name for logging

    Example:
        ```python
        @with_fallback(
            fallback_config=FallbackConfig(
                fallback_message="I apologize, but I'm having trouble processing your request right now. Please try again."
            ),
            operation="qa_agent.run"
        )
        async def my_agent_function():
            pass
        ```
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        op_name = operation or func.__name__

        if asyncio.iscoroutinefunction(func):
            @functools.wraps(func)
            async def async_wrapper(*args: Any, **kwargs: Any) -> T:
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    logger.warning(
                        "Primary function failed in %s, using fallback: %s",
                        op_name,
                        e,
                    )

                    # Track the failure in Langfuse
                    if is_langfuse_enabled():
                        client = get_langfuse()
                        if client:
                            span = client.span(
                                name=f"{op_name}.fallback",
                                metadata={
                                    "primary_error": get_error_code(e),
                                    "fallback_type": "fallback_function" if fallback_config.fallback_function else "fallback_message",
                                },
                            )
                            span.end(level="WARNING")

                    # Use fallback function if available
                    if fallback_config.fallback_function:
                        if asyncio.iscoroutinefunction(fallback_config.fallback_function):
                            return await fallback_config.fallback_function(*args, **kwargs)
                        return fallback_config.fallback_function(*args, **kwargs)  # type: ignore

                    # Return fallback message
                    if fallback_config.fallback_message:
                        # Return as dict for compatibility with agent responses
                        return {
                            "error": get_user_message(e),
                            "fallback_message": fallback_config.fallback_message,
                            "suggestion": get_suggestion(e),
                        }  # type: ignore

                    # Re-raise if no fallback configured
                    raise

            return async_wrapper
        @functools.wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> T:
            try:
                return func(*args, **kwargs)
            except Exception as e:
                logger.warning(
                    "Primary function failed in %s, using fallback: %s",
                    op_name,
                    e,
                )

                if fallback_config.fallback_function:
                    return fallback_config.fallback_function(*args, **kwargs)  # type: ignore

                if fallback_config.fallback_message:
                    return {
                        "error": get_user_message(e),
                        "fallback_message": fallback_config.fallback_message,
                        "suggestion": get_suggestion(e),
                    }  # type: ignore

                raise

        return sync_wrapper

    return decorator


# -----------------------------------------------------------------------------
# Error Response Builder
# -----------------------------------------------------------------------------


def build_error_response(
    error: Exception,
    include_details: bool = False,
) -> dict[str, Any]:
    """Build a standardized error response.

    Args:
        error: The exception to convert
        include_details: Whether to include technical details

    Returns:
        Dictionary with error information
    """
    response = {
        "error": True,
        "error_code": get_error_code(error),
        "message": get_user_message(error),
    }

    suggestion = get_suggestion(error)
    if suggestion:
        response["suggestion"] = suggestion

    if include_details and isinstance(error, AIEngineError):
        response["details"] = error.details

    # In development, include stack trace
    settings = get_settings()
    if settings.LOG_LEVEL == "DEBUG":
        response["traceback"] = traceback.format_exc()

    return response


# -----------------------------------------------------------------------------
# Agent-Specific Error Handling
# -----------------------------------------------------------------------------


async def safe_agent_run(
    agent_func: Callable[..., T],
    *args: Any,
    agent_name: str,
    session_id: str | None = None,
    user_id: str | None = None,
    **kwargs: Any,
) -> T:
    """Safely execute an agent function with error handling.

    This wrapper provides:
    1. Automatic retry for retryable errors
    2. Langfuse error tracking
    3. Graceful fallback behavior

    Args:
        agent_func: The agent function to execute
        *args: Positional arguments for the agent
        agent_name: Name of the agent (for logging/tracking)
        session_id: Session ID for Langfuse
        user_id: User ID for Langfuse
        **kwargs: Keyword arguments for the agent

    Returns:
        Agent result or fallback response

    Raises:
        Exception: If all retries fail and no fallback is available
    """
    trace = None

    if is_langfuse_enabled():
        trace = create_error_trace(
            f"{agent_name}.run",
            session_id=session_id,
            user_id=user_id,
        )

    try:
        result = await agent_func(*args, **kwargs)

        if trace:
            trace.end()

        return result

    except Exception as e:
        logger.error(
            "Agent %s failed: %s",
            agent_name,
            e,
            exc_info=True,
        )

        if trace:
            track_error_context(trace, e, {"agent": agent_name})

        # Re-raise for caller to handle
        raise
