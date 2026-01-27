"""Sentry initialization for AI Engine error tracking and APM.

This module initializes Sentry for error tracking and performance monitoring.
It should be imported and called at application startup.
"""

import os

try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.starlette import StarletteIntegration
    from sentry_sdk.tracing import Span

    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False
    Span = None  # type: ignore[misc,assignment]


def init_sentry() -> None:
    """Initialize Sentry SDK for error tracking and APM.

    Sentry will only be initialized if SENTRY_DSN is configured.
    In development mode, events are not sent to Sentry.

    Features enabled:
    - Error tracking
    - Performance monitoring (traces)
    - Distributed tracing (via sentry-trace header)
    - Database query tracking
    - HTTP request tracking
    """
    if not SENTRY_AVAILABLE:
        print("Sentry SDK not available - skipping initialization")
        return

    dsn = os.getenv("SENTRY_DSN")
    if not dsn:
        print("SENTRY_DSN not configured - skipping Sentry initialization")
        return

    environment = os.getenv("NODE_ENV", os.getenv("ENVIRONMENT", "development"))

    # Don't send events in development
    if environment == "development":
        print("Development mode detected - Sentry initialized in read-only mode")

    # Get trace sample rate from environment or use defaults
    traces_sample_rate_str = os.getenv("SENTRY_TRACES_SAMPLE_RATE")
    if traces_sample_rate_str:
        traces_sample_rate = float(traces_sample_rate_str)
    else:
        traces_sample_rate = 1.0 if environment == "development" else 0.1

    # Get profiling sample rate (production only)
    profiles_sample_rate_str = os.getenv("SENTRY_PROFILES_SAMPLE_RATE")
    if profiles_sample_rate_str:
        profiles_sample_rate = float(profiles_sample_rate_str)
    else:
        profiles_sample_rate = 0.1 if environment == "production" else 0

    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        # Performance monitoring
        traces_sample_rate=traces_sample_rate,
        # Profiling (production only for performance insights)
        profiles_sample_rate=profiles_sample_rate,
        # Filter out development events
        before_send_transaction=lambda event, _hint: None
        if environment == "development"
        else event,
        before_send=_filter_development_events,
        integrations=[
            FastApiIntegration(),
            StarletteIntegration(),
        ],
        # Custom tags for better filtering in Sentry
        initial_scope={
            "tags": {
                "service": "ai-engine",
                "runtime": "python",
            }
        },
    )

    print(f"Sentry initialized with APM features (environment: {environment})")


def _filter_development_events(event, _hint):
    """Filter out events from development environment.

    Args:
        event: The event to be sent
        hint: Event hint with additional information

    Returns:
        None if development, otherwise the event
    """
    environment = os.getenv("NODE_ENV", os.getenv("ENVIRONMENT", "development"))

    if environment == "development":
        return None

    return event


def capture_exception(error: Exception, context: dict | None = None) -> None:
    """Capture an exception in Sentry.

    Args:
        error: The exception to capture
        context: Additional context to include with the event
    """
    if not SENTRY_AVAILABLE:
        return

    environment = os.getenv("NODE_ENV", os.getenv("ENVIRONMENT", "development"))

    # Don't send in development
    if environment == "development":
        return

    if context:
        sentry_sdk.set_context("custom", context)

    sentry_sdk.capture_exception(error)


def capture_message(message: str, level: str = "info") -> None:
    """Capture a message in Sentry.

    Args:
        message: The message to send
        level: Log level (info, warning, error)
    """
    if not SENTRY_AVAILABLE:
        return

    environment = os.getenv("NODE_ENV", os.getenv("ENVIRONMENT", "development"))

    # Don't send in development
    if environment == "development":
        return

    sentry_sdk.capture_message(message, level=level)


def set_user(user_id: str, email: str | None = None, **kwargs) -> None:
    """Set user context for Sentry events.

    Args:
        user_id: User ID
        email: User email (optional)
        **kwargs: Additional user attributes
    """
    if not SENTRY_AVAILABLE:
        return

    user_data = {"id": user_id, **kwargs}
    if email:
        user_data["email"] = email

    sentry_sdk.set_user(user_data)


def set_context(name: str, data: dict) -> None:
    """Set additional context for Sentry events.

    Args:
        name: Context name
        data: Context data
    """
    if not SENTRY_AVAILABLE:
        return

    sentry_sdk.set_context(name, data)


def start_ai_span(operation: str, **kwargs) -> Span | None:
    """Start a custom span for AI operations tracking.

    Use this to track specific AI operations like PydanticAI agent runs,
    embedding generation, or LangGraph node execution.

    Args:
        operation: Operation name (e.g., "agent.run", "embedding.generate")
        **kwargs: Additional metadata to attach to the span

    Returns:
        Sentry Span object or None if Sentry unavailable

    Example:
        ```python
        span = start_ai_span("agent.run", agent="classifier", model="gpt-4")
        result = await agent.run(user_input)
        span?.set_data("result_length", len(result.output))
        span?.finish()
        ```
    """
    if not SENTRY_AVAILABLE:
        return None

    span = sentry_sdk.start_span(op="ai.operation", description=operation)

    # Set custom data
    for key, value in kwargs.items():
        span.set_data(key, value)

    return span


def start_db_span(operation: str, table: str | None = None, **kwargs) -> Span | None:
    """Start a custom span for database operations tracking.

    Args:
        operation: Operation type (e.g., "query", "insert", "update")
        table: Table name (optional)
        **kwargs: Additional metadata

    Returns:
        Sentry Span object or None if Sentry unavailable

    Example:
        ```python
        span = start_db_span("select", table="documents", query_type="vector_search")
        results = await db.execute(query)
        span?.set_data("rows_returned", len(results))
        span?.finish()
        ```
    """
    if not SENTRY_AVAILABLE:
        return None

    description = f"{operation}" + (f" on {table}" if table else "")
    span = sentry_sdk.start_span(op="db.query", description=description)

    if table:
        span.set_data("table", table)

    for key, value in kwargs.items():
        span.set_data(key, value)

    return span


def start_http_span(method: str, url: str, **kwargs) -> Span | None:
    """Start a custom span for HTTP client requests.

    Args:
        method: HTTP method (GET, POST, etc.)
        url: Request URL
        **kwargs: Additional metadata

    Returns:
        Sentry Span object or None if Sentry unavailable

    Example:
        ```python
        span = start_http_span("POST", "https://api.openai.com/v1/chat", model="gpt-4")
        response = await httpx.post(url, data)
        span?.set_http_status(response.status_code)
        span?.set_data("response_time_ms", response.elapsed_ms)
        span?.finish()
        ```
    """
    if not SENTRY_AVAILABLE:
        return None

    span = sentry_sdk.start_span(op="http.client", description=f"{method} {url}")

    for key, value in kwargs.items():
        span.set_data(key, value)

    return span


def set_transaction_name(name: str) -> None:
    """Set the transaction name for the current request.

    Use this to override the default transaction name with something
    more meaningful for filtering in Sentry.

    Args:
        name: Transaction name

    Example:
        ```python
        set_transaction_name("qa_graph.process_question")
        ```
    """
    if not SENTRY_AVAILABLE:
        return

    sentry_sdk.get_current_scope().set_transaction_name(name)


def set_measurement(name: str, value: float, unit: str = "") -> None:
    """Set a custom measurement for the current transaction.

    Measurements are numerical values that can be queried and graphed in Sentry.
    Useful for tracking custom metrics like "tokens_used", "documents_processed", etc.

    Args:
        name: Measurement name
        value: Numeric value
        unit: Unit (e.g., "ms", "seconds", "percent", "")

    Example:
        ```python
        set_measurement("tokens_used", 1250, "tokens")
        set_measurement("processing_time_ms", 523, "ms")
        ```
    """
    if not SENTRY_AVAILABLE:
        return

    sentry_sdk.get_current_scope().add_measurement(name, value, unit)
