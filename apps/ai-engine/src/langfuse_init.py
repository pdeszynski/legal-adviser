"""Langfuse initialization for AI Engine observability.

This module initializes Langfuse for comprehensive AI observability including:
- LLM call tracing (OpenAI, PydanticAI agents)
- LangGraph workflow execution tracking
- Token usage and cost monitoring
- Latency measurements
- User session tracking

PII redaction is applied to all traces for privacy compliance.

Integration follows the official PydanticAI + Langfuse pattern:
https://langfuse.com/integrations/frameworks/pydantic-ai

Key changes from manual integration:
1. Uses langfuse.get_client() for automatic OpenTelemetry initialization
2. Relies on PydanticAI's built-in instrument=True parameter
3. Uses @observe() decorator for custom function tracing
4. Uses update_current_trace() for adding trace metadata
"""

import os
import re
from contextlib import contextmanager
from typing import Any

# Defensive import for Python 3.14 compatibility
try:
    from langfuse import observe, get_client
    _langfuse_available = True
except Exception:
    # Langfuse may not be available on all Python versions (e.g., 3.14)
    observe = None  # type: ignore
    get_client = None  # type: ignore
    _langfuse_available = False

from .config import get_settings

# Singleton instance
_langfuse_client: Any = None
_langfuse_enabled = False


def _redact_pii(text: str) -> str:
    """Redact personally identifiable information from text.

    This function redacts common PII patterns:
    - Email addresses
    - Phone numbers (Polish and international formats)
    - PESEL numbers (Polish national ID)
    - NIP numbers (Polish tax ID)
    - Credit card numbers
    - Names (simple heuristic - common Polish names)

    Args:
        text: Input text potentially containing PII

    Returns:
        Text with PII redacted
    """
    if not text:
        return text

    # Email addresses
    text = re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "[REDACTED_EMAIL]", text)

    # Polish phone numbers (e.g., +48 123 456 789, 123-456-789)
    text = re.sub(r"(\+48\s?)?(\d{3}[-\s]?\d{3}[-\s]?\d{3})", "[REDACTED_PHONE]", text)

    # PESEL numbers (11 digits)
    text = re.sub(r"\b\d{11}\b", "[REDACTED_PESEL]", text)

    # NIP numbers (10 digits)
    text = re.sub(r"\b\d{10}\b", "[REDACTED_NIP]", text)

    # Credit card numbers (13-19 digits, groups of 4)
    text = re.sub(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b", "[REDACTED_CARD]", text)

    # Common Polish first names (sample list for heuristic redaction)
    polish_names = [
        "Jan", "Anna", "Maria", "Piotr", "Krystyna", "Andrzej", "Marta", "Tomasz",
        "Monika", "Michał", "Magdalena", "Krzysztof", "Joanna", "Paweł", "Katarzyna",
        "Marek", "Małgorzata", "Grzegorz", "Agnieszka", "Janusz", "Ewa",
    ]
    for name in polish_names:
        # Redact names when followed by surname pattern (capitalized word)
        text = re.sub(rf"\b{name}\s[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+\b", "[REDACTED_NAME]", text)

    return text


def _redact_dict_pii(data: dict[str, Any]) -> dict[str, Any]:
    """Recursively redact PII from dictionary values.

    Args:
        data: Dictionary potentially containing PII

    Returns:
        Dictionary with PII redacted from string values
    """
    redacted = {}
    for key, value in data.items():
        if isinstance(value, str):
            redacted[key] = _redact_pii(value)
        elif isinstance(value, dict):
            redacted[key] = _redact_dict_pii(value)
        elif isinstance(value, list):
            redacted[key] = [_redact_pii(str(item)) if isinstance(item, str) else item for item in value]
        else:
            redacted[key] = value
    return redacted


def init_langfuse() -> None:
    """Initialize Langfuse SDK for AI observability.

    Langfuse will only be initialized if LANGFUSE_PUBLIC_KEY and
    LANGFUSE_SECRET_KEY are configured.

    Features enabled:
    - LLM call tracing (OpenAI, PydanticAI)
    - LangGraph workflow tracking
    - Token usage and cost monitoring
    - User session tracking
    - PII redaction for all traces

    This initializes Langfuse using the official SDK's get_client() method,
    which automatically sets up OpenTelemetry tracing that PydanticAI agents
    can use with instrument=True.
    """
    global _langfuse_client, _langfuse_enabled

    settings = get_settings()

    # Check if Langfuse is available (Python 3.14 compatibility)
    if not _langfuse_available:
        print("Langfuse not available on this platform - skipping initialization")
        return

    # Check if Langfuse is explicitly disabled
    if not settings.LANGFUSE_ENABLED:
        print("Langfuse disabled by configuration")
        return

    # Check for required credentials
    if not settings.LANGFUSE_PUBLIC_KEY or not settings.LANGFUSE_SECRET_KEY:
        print("LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY not configured - skipping Langfuse initialization")
        _langfuse_enabled = False
        return

    try:
        # Set environment variables for Langfuse SDK
        # This is required for PydanticAI's automatic instrumentation
        os.environ["LANGFUSE_PUBLIC_KEY"] = settings.LANGFUSE_PUBLIC_KEY
        os.environ["LANGFUSE_SECRET_KEY"] = settings.LANGFUSE_SECRET_KEY
        if settings.LANGFUSE_HOST:
            os.environ["LANGFUSE_HOST"] = settings.LANGFUSE_HOST

        # Get the Langfuse client using the official SDK method
        # This initializes OpenTelemetry tracing automatically
        _langfuse_client = get_client()

        # Test connection
        if _langfuse_client.auth_check():
            _langfuse_enabled = True
            environment = os.getenv("NODE_ENV", os.getenv("ENVIRONMENT", "development"))
            print(f"Langfuse initialized successfully (environment: {environment})")
        else:
            print("Langfuse authentication failed")
            _langfuse_client = None
            _langfuse_enabled = False

    except Exception as e:
        print(f"Langfuse initialization failed: {e}")
        _langfuse_client = None
        _langfuse_enabled = False


def get_langfuse() -> Any:
    """Get the Langfuse client instance.

    Returns:
        Langfuse client or None if not initialized/disabled
    """
    return _langfuse_client


def is_langfuse_enabled() -> bool:
    """Check if Langfuse observability is enabled.

    Returns:
        True if Langfuse is initialized and enabled
    """
    return _langfuse_enabled and _langfuse_client is not None


def update_current_trace(
    input: Any | None = None,
    output: Any | None = None,
    user_id: str | None = None,
    session_id: str | None = None,
    tags: list[str] | None = None,
    metadata: dict[str, Any] | None = None,
    version: str | None = None,
) -> None:
    """Update the current Langfuse trace with additional context.

    This function wraps langfuse.update_current_trace() with PII redaction.
    Use this inside instrumented functions to add custom attributes.

    Args:
        input: Input data (will be PII-redacted if string/dict)
        output: Output data (will be PII-redacted if string/dict)
        user_id: User ID for user-level analytics
        session_id: Session ID for grouping related traces
        tags: List of tags for filtering
        metadata: Additional metadata (will be PII-redacted)
        version: Application version
    """
    if not is_langfuse_enabled() or _langfuse_client is None:
        return

    try:
        # Apply PII redaction
        if isinstance(input, str):
            input = _redact_pii(input)
        elif isinstance(input, dict):
            input = _redact_dict_pii(input)

        if isinstance(output, str):
            output = _redact_pii(output)
        elif isinstance(output, dict):
            output = _redact_dict_pii(output)

        if metadata:
            metadata = _redact_dict_pii(metadata)

        _langfuse_client.update_current_trace(
            input=input,
            output=output,
            user_id=user_id,
            session_id=session_id,
            tags=tags,
            metadata=metadata,
            version=version,
        )
    except Exception:
        # Silently fail to avoid breaking the main application
        pass


@contextmanager
def start_as_current_span(
    name: str,
    input: Any | None = None,
    user_id: str | None = None,
    session_id: str | None = None,
    metadata: dict[str, Any] | None = None,
):
    """Context manager for creating a custom span within a trace.

    This wraps langfuse.start_as_current_span() with PII redaction.
    Use this for custom instrumentation when @observe decorator is not suitable.

    Args:
        name: Span name
        input: Input data (will be PII-redacted if string/dict)
        user_id: User ID for analytics
        session_id: Session ID for grouping
        metadata: Additional metadata (will be PII-redacted)

    Yields:
        The span object for updating with output

    Example:
        with start_as_current_span("custom_operation", input=my_input) as span:
            result = do_work()
            span.update_trace(output=result)
    """
    if not is_langfuse_enabled() or _langfuse_client is None:
        yield None
        return

    # Apply PII redaction to input
    if isinstance(input, str):
        input = _redact_pii(input)
    elif isinstance(input, dict):
        input = _redact_dict_pii(input)

    if metadata:
        metadata = _redact_dict_pii(metadata)

    with _langfuse_client.start_as_current_span(
        name=name,
        input=input,
        session_id=session_id,
        user_id=user_id,
        metadata=metadata,
    ) as span:
        yield span


def create_trace(
    name: str,
    input: Any | None = None,
    user_id: str | None = None,
    session_id: str | None = None,
    tags: list[str] | None = None,
    metadata: dict[str, Any] | None = None,
) -> Any | None:
    """Create a new manual trace (useful for workflows).

    For most cases, use @observe() decorator instead.
    This is useful when you need a trace object to update later.

    Args:
        name: Trace name
        input: Input data (will be PII-redacted)
        user_id: User ID for analytics
        session_id: Session ID for grouping
        tags: List of tags
        metadata: Additional metadata (will be PII-redacted)

    Returns:
        Trace object or None if Langfuse disabled
    """
    if not is_langfuse_enabled() or _langfuse_client is None:
        return None

    # Apply PII redaction
    if isinstance(input, str):
        input = _redact_pii(input)
    elif isinstance(input, dict):
        input = _redact_dict_pii(input)

    if metadata:
        metadata = _redact_dict_pii(metadata)

    return _langfuse_client.trace(
        name=name,
        input=input,
        user_id=user_id,
        session_id=session_id,
        tags=tags,
        metadata=metadata,
    )


def flush() -> None:
    """Flush any pending Langfuse events.

    Call this before application shutdown to ensure all events are sent.
    """
    import contextlib

    if _langfuse_client is not None:
        with contextlib.suppress(Exception):
            _langfuse_client.flush()


# Export observe decorator for convenience
__all__ = [
    "init_langfuse",
    "get_langfuse",
    "is_langfuse_enabled",
    "update_current_trace",
    "start_as_current_span",
    "create_trace",
    "flush",
    "observe",  # Re-export from langfuse
    "_redact_pii",
    "_redact_dict_pii",
]
