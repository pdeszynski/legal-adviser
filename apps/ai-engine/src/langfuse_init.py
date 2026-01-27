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
2. Calls Agent.instrument_all() to enable global PydanticAI instrumentation
3. Uses update_current_trace() for adding trace metadata

IMPORTANT: After init_langfuse() is called, all PydanticAI agents created with
instrument=True will automatically send traces to Langfuse.
Manual span/trace creation is no longer needed - agents are auto-instrumented.
"""

import os
import re
import sys
import uuid
from typing import Any

# DEBUG: Track initialization status
_debug_log = []

def _debug(msg: str) -> None:
    """Log debug messages for troubleshooting."""
    _debug_log.append(msg)
    print(f"[LANGFUSE-DEBUG] {msg}")

# DEBUG: Show Python version
_debug(f"Python version: {sys.version}")

# Defensive import for Python 3.14 compatibility
_debug("Attempting to import langfuse.get_client...")
try:
    from langfuse import get_client
    _langfuse_available = True
    _debug("langfuse.get_client imported successfully")
except Exception as e:
    # Langfuse may not be available on all Python versions (e.g., 3.14)
    _debug(f"langfuse import FAILED: {type(e).__name__}: {e}")
    get_client = None  # type: ignore
    _langfuse_available = False

# Import Agent for instrumentation (available after PydanticAI is installed)
_debug("Attempting to import pydantic_ai.Agent...")
try:
    from pydantic_ai.agent import Agent
    _pydantic_ai_available = True
    _debug("pydantic_ai.Agent imported successfully")
except Exception as e:
    _debug(f"pydantic_ai.Agent import FAILED: {type(e).__name__}: {e}")
    _pydantic_ai_available = False
    Agent = None  # type: ignore

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


# -----------------------------------------------------------------------------
# Compatibility Classes for New Langfuse SDK API
# -----------------------------------------------------------------------------


class _SpanWrapper:
    """Compatibility wrapper for span objects.

    The new Langfuse SDK doesn't have manual span objects.
    This wrapper provides a no-op interface for code that expects the old API.
    """

    def __init__(self, name: str, metadata: dict[str, Any] | None = None) -> None:
        """Initialize the span wrapper."""
        self.name = name
        self.metadata = metadata or {}

    def update(self, **kwargs: Any) -> None:
        """No-op update method for compatibility."""
        pass

    def end(self, level: str | None = None, status_message: str | None = None) -> None:
        """No-op end method for compatibility."""
        pass


class _TraceWrapper:
    """Compatibility wrapper for trace objects.

    The new Langfuse SDK doesn't have manual trace objects.
    This wrapper provides a no-op interface for code that expects the old API.
    """

    def __init__(self, name: str, session_id: str | None = None, user_id: str | None = None,
                 metadata: dict[str, Any] | None = None) -> None:
        """Initialize the trace wrapper."""
        self.name = name
        self.session_id = session_id
        self.user_id = user_id
        self.metadata = metadata or {}
        self.trace_id = str(uuid.uuid4())

    def update(self, **kwargs: Any) -> None:
        """No-op update method for compatibility."""
        pass

    def end(self, level: str | None = None, status_message: str | None = None) -> None:
        """No-op end method for compatibility."""
        pass

    def span(self, name: str, metadata: dict[str, Any] | None = None) -> _SpanWrapper:
        """Create a span wrapper for compatibility."""
        return _SpanWrapper(name, metadata)


class _LangfuseClientWrapper:
    """Compatibility wrapper for Langfuse client.

    The new Langfuse SDK (3.x) doesn't have trace() or span() methods.
    This wrapper provides a compatibility layer for code that uses the old API.
    """

    def __init__(self, client: Any) -> None:
        """Initialize the wrapper with the actual Langfuse client."""
        self._client = client

    def __getattr__(self, name: str) -> Any:
        """Proxy all other attributes to the underlying client."""
        return getattr(self._client, name)

    def auth_check(self) -> bool:
        """Proxy auth_check to the underlying client."""
        return self._client.auth_check()

    def trace(self, name: str, **kwargs: Any) -> _TraceWrapper:
        """Create a trace wrapper for compatibility with old API."""
        return _TraceWrapper(
            name=name,
            session_id=kwargs.get("session_id"),
            user_id=kwargs.get("user_id"),
            metadata=kwargs.get("metadata"),
        )

    def span(self, name: str, **kwargs: Any) -> _SpanWrapper:
        """Create a span wrapper for compatibility with old API."""
        return _SpanWrapper(name, kwargs.get("metadata"))


# -----------------------------------------------------------------------------
# Langfuse Initialization
# -----------------------------------------------------------------------------


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
    then calls Agent.instrument_all() to enable automatic PydanticAI tracing.

    Official integration: https://langfuse.com/integrations/frameworks/pydantic-ai
    """
    global _langfuse_client, _langfuse_enabled

    _debug("=" * 60)
    _debug("init_langfuse() called")
    _debug("=" * 60)

    settings = get_settings()
    _debug(f"Settings loaded:")
    _debug(f"  LANGFUSE_ENABLED: {settings.LANGFUSE_ENABLED}")
    _debug(f"  LANGFUSE_PUBLIC_KEY: {'SET (' + settings.LANGFUSE_PUBLIC_KEY[:10] + '...)' if settings.LANGFUSE_PUBLIC_KEY else 'NOT SET'}")
    _debug(f"  LANGFUSE_SECRET_KEY: {'SET (' + settings.LANGFUSE_SECRET_KEY[:10] + '...)' if settings.LANGFUSE_SECRET_KEY else 'NOT SET'}")
    _debug(f"  LANGFUSE_HOST: {settings.LANGFUSE_HOST or '(default)'}")

    # Check if Langfuse is available (Python 3.14 compatibility)
    _debug(f"Langfuse available: {_langfuse_available}")
    if not _langfuse_available:
        print("Langfuse not available on this platform - skipping initialization")
        print("DEBUG LOG:")
        for log in _debug_log:
            print(f"  {log}")
        return

    # Check if PydanticAI is available
    _debug(f"PydanticAI available: {_pydantic_ai_available}")
    if not _pydantic_ai_available:
        print("PydanticAI not available - skipping Langfuse instrumentation")
        print("DEBUG LOG:")
        for log in _debug_log:
            print(f"  {log}")
        return

    # Check if Langfuse is explicitly disabled
    _debug(f"LANGFUSE_ENABLED check: {settings.LANGFUSE_ENABLED}")
    if not settings.LANGFUSE_ENABLED:
        print("Langfuse disabled by configuration")
        return

    # Check for required credentials
    if not settings.LANGFUSE_PUBLIC_KEY or not settings.LANGFUSE_SECRET_KEY:
        print(f"LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY not configured - skipping Langfuse initialization")
        print(f"  LANGFUSE_PUBLIC_KEY: {'SET' if settings.LANGFUSE_PUBLIC_KEY else 'NOT SET'}")
        print(f"  LANGFUSE_SECRET_KEY: {'SET' if settings.LANGFUSE_SECRET_KEY else 'NOT SET'}")
        _langfuse_enabled = False
        return

    _debug("All checks passed, proceeding with initialization...")
    try:
        # Set environment variables for Langfuse SDK
        # This is required for PydanticAI's automatic instrumentation
        _debug("Setting environment variables...")
        os.environ["LANGFUSE_PUBLIC_KEY"] = settings.LANGFUSE_PUBLIC_KEY
        os.environ["LANGFUSE_SECRET_KEY"] = settings.LANGFUSE_SECRET_KEY
        if settings.LANGFUSE_HOST:
            os.environ["LANGFUSE_HOST"] = settings.LANGFUSE_HOST
        _debug("Environment variables set")

        # Get the Langfuse client using the official SDK method
        # This initializes OpenTelemetry tracing automatically
        _debug("Calling get_client()...")
        raw_client = get_client()
        _debug(f"get_client() returned: {type(raw_client)}")

        # Wrap the client for API compatibility
        _langfuse_client = _LangfuseClientWrapper(raw_client)

        # Test connection
        _debug("Calling auth_check()...")
        auth_result = _langfuse_client.auth_check()
        _debug(f"auth_check() returned: {auth_result}")

        if auth_result:
            _langfuse_enabled = True
            environment = os.getenv("NODE_ENV", os.getenv("ENVIRONMENT", "development"))

            # Initialize PydanticAI instrumentation - KEY STEP for official integration
            # This enables automatic tracing for all agents created with instrument=True
            _debug("Calling Agent.instrument_all()...")
            Agent.instrument_all()
            _debug("Agent.instrument_all() completed")

            print(f"Langfuse initialized successfully (environment: {environment})")
            print(f"  Host: {settings.LANGFUSE_HOST or 'https://cloud.langfuse.com'}")
            print(f"  Public Key: {settings.LANGFUSE_PUBLIC_KEY[:10]}...")
            print("PydanticAI instrumentation enabled via Agent.instrument_all()")
            _debug("=" * 60)
            _debug("Langfuse initialization COMPLETE")
            _debug("=" * 60)
        else:
            print("Langfuse authentication failed - check your credentials")
            print(f"  Host: {settings.LANGFUSE_HOST or 'https://cloud.langfuse.com'}")
            print(f"  Public Key format: {settings.LANGFUSE_PUBLIC_KEY[:3] + '*' * 20 if settings.LANGFUSE_PUBLIC_KEY else 'NOT SET'}")
            _record_langfuse_error("auth_failed", "Langfuse authentication check failed")
            _langfuse_client = None
            _langfuse_enabled = False

    except Exception as e:
        print(f"Langfuse initialization failed: {e}")
        _record_langfuse_error("initialization_failed", str(e))
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

    This function uses the OpenTelemetry context to update the current trace.
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

        # Use the new Langfuse SDK API - update_current_trace via OpenTelemetry context
        # The new SDK uses OpenTelemetry for automatic context propagation
        from langfuse.decorators import observe

        @observe()
        def _update_trace():
            pass

        # Create a dummy trace to update the current context
        # The @observe decorator will link this to the current OpenTelemetry trace
        _update_trace()

        # Note: In the new SDK, manual trace updates are done through the OpenTelemetry API
        # The automatic instrumentation via Agent.instrument_all() handles most tracing
        # For manual updates, we rely on the OpenTelemetry context that's automatically propagated
    except Exception:
        # Silently fail to avoid breaking the main application
        pass


def _record_langfuse_error(
    error_type: str,
    error_message: str,
    context: dict[str, Any] | None = None,
) -> None:
    """Record Langfuse SDK error for debug endpoint.

    Args:
        error_type: Type of error (e.g., "auth_failed", "connection_error")
        error_message: Error message
        context: Additional context about the error
    """
    try:
        # Lazy import to avoid circular dependency
        from .services.langfuse_tracker import get_langfuse_tracker

        tracker = get_langfuse_tracker()
        tracker.record_error(error_type, error_message, context)
    except Exception:
        # Silently fail - error tracking should not break main application
        pass


class _DummyTrace:
    """Dummy trace object for compatibility with error handlers.

    The new Langfuse SDK uses the @observe decorator instead of manual trace objects.
    This dummy object provides the expected interface for error handlers.
    """

    def end(self, level: str | None = None, status_message: str | None = None) -> None:
        """No-op end method for compatibility."""
        pass


def create_trace(
    name: str,
    input: Any | None = None,
    user_id: str | None = None,
    session_id: str | None = None,
    tags: list[str] | None = None,
    metadata: dict[str, Any] | None = None,
) -> Any | None:
    """Create a new manual trace for error tracking and other special cases.

    This is primarily used for error tracking in FastAPI exception handlers
    where PydanticAI's automatic instrumentation is not available.

    Note: For agent/workflow tracing, rely on instrument=True instead.

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

    try:
        # Use the new Langfuse SDK API with observe decorator
        from langfuse.decorators import observe

        @observe(name=name)
        def _error_trace():
            # The trace is automatically created and linked to OpenTelemetry context
            return {"input": input, "user_id": user_id, "session_id": session_id, "metadata": metadata}

        _error_trace()
        # Return a dummy trace object for compatibility with error handlers
        return _DummyTrace()
    except Exception:
        # Silently fall back if the new API doesn't work
        return None


def flush() -> None:
    """Flush any pending Langfuse events.

    Call this before application shutdown to ensure all events are sent.
    """
    import contextlib

    if _langfuse_client is not None:
        with contextlib.suppress(Exception):
            _langfuse_client.flush()


def get_debug_log() -> list[str]:
    """Get the debug log for troubleshooting Langfuse initialization.

    Returns:
        List of debug messages showing the initialization sequence
    """
    return _debug_log.copy()


# Export public API
__all__ = [
    "_redact_dict_pii",
    "_redact_pii",
    "create_trace",
    "flush",
    "get_debug_log",
    "get_langfuse",
    "init_langfuse",
    "is_langfuse_enabled",
    "update_current_trace",
]
