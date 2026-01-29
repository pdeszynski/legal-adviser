"""Legal AI Engine - FastAPI Service.

This service provides AI-powered legal assistance including:
- Document generation
- Legal Q&A
- Case law search
- Legal grounds classification

Features distributed tracing with Sentry for APM and Langfuse for AI observability.
"""

import asyncio
import logging
import time
import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import sentry_sdk
from dotenv import load_dotenv
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Load environment variables from .env file before other imports
# This ensures OPENAI_API_KEY is available for PydanticAI's OpenAIModel
_env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

# CRITICAL: Initialize Langfuse BEFORE importing agent modules
# This ensures Agent.instrument_all() is called before any agents are created
# Following the official integration pattern: https://langfuse.com/integrations/frameworks/pydantic-ai
from .langfuse_init import init_langfuse

init_langfuse()

# JWT Authentication imports
from .auth import UserContext, get_current_user, get_current_user_optional
from .exceptions import (
    AIEngineError,
    RateLimitError,
    ServiceUnavailableError,
    ValidationError,
)
from .langfuse_init import flush
from .models.requests import (
    AskQuestionRequest,
    ClassifyCaseRequest,
    GenerateDocumentRequest,
    GenerateEmbeddingsRequest,
    GenerateTitleRequest,
    QARequest,
    SearchRulingsRequest,
    SemanticSearchRequest,
)
from .models.responses import (
    AnswerResponse,
    Citation,
    ClassificationResponse,
    DocumentGenerationStatus,
    ErrorResponse,
    GenerateDocumentResponse,
    GenerateEmbeddingsResponse,
    GenerateTitleResponse,
    QAResponse,
    RateLimitErrorResponse,
    Ruling,
    SearchRulingsResponse,
    SemanticSearchResponse,
    SemanticSearchResult,
    ServiceUnavailableErrorResponse,
    ValidationErrorResponse,
)
from .sentry_init import init_sentry
from .services.cost_monitoring import get_cost_summary_dict
from .services.streaming import create_streaming_response, stream_qa_response
from .services.streaming_enhanced import (
    create_enhanced_streaming_response,
    stream_clarification_answer,
    stream_qa_enhanced,
)

# Initialize Sentry for error tracking and APM
init_sentry()

# Import workflows AFTER Langfuse initialization
# Workflows import agents at module level, so this must come after init_langfuse()
# Import agent modules AFTER Langfuse initialization
# This is critical: Agent.instrument_all() must be called before agents are created
from .agents.classifier_agent import classifier_agent as get_classifier_agent
from .agents.qa_agent import answer_question
from .workflows import get_orchestrator

# Configure logging with DEBUG level for more verbose output
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Global state for startup tracking
startup_complete = False
startup_status: dict[str, str] = {}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Lifespan context manager for startup/shutdown events with graceful shutdown."""
    global startup_complete, startup_status

    # Startup
    logger.info("Legal AI Engine starting up...")
    startup_status["phase"] = "initializing"
    startup_status["message"] = "Initializing AI Engine components..."

    try:
        # Validate configuration before starting services
        startup_status["phase"] = "validating_config"
        startup_status["message"] = "Validating configuration..."

        from .validate_config import validate_all_config

        # Use non-strict mode: log errors but don't fail startup
        # This allows the service to start for development even with missing config
        config_validation = validate_all_config(strict=False)

        # Store validation results in startup status
        startup_status["config_validation"] = config_validation

        if not config_validation["valid"]:
            logger.warning(
                "Configuration validation found %d error(s) and %d warning(s). "
                "Service will start but some features may not work correctly.",
                len(config_validation["errors"]),
                len(config_validation["warnings"]),
            )
            # Don't fail startup for missing config in development
            # In production, you may want to set strict=True

        # Initialize ML models and agents (lazy load)
        startup_status["phase"] = "loading_models"
        startup_status["message"] = "Loading ML models and agents..."

        # Pre-load classifier agent to verify dependencies

        startup_status["phase"] = "ready"
        startup_status["message"] = "AI Engine is ready"

        logger.info("AI Engine startup complete")
        startup_complete = True
    except Exception:
        logger.exception("AI Engine startup failed")
        startup_status["phase"] = "failed"
        startup_status["message"] = "Startup failed"
        startup_status["error"] = "Initialization error"

    yield

    # Shutdown - wait for in-flight requests to complete
    logger.info("Legal AI Engine shutting down gracefully...")
    logger.info("Active generation tasks: %d", len(generation_tasks))

    # Flush Langfuse events before shutdown with timeout
    try:
        # Use asyncio.wait_for to prevent hanging on Langfuse flush
        await asyncio.wait_for(asyncio.to_thread(flush), timeout=2.0)
    except TimeoutError:
        logger.warning("Langfuse flush timed out after 2 seconds - continuing shutdown")
    except Exception as e:
        logger.warning("Langfuse flush failed: %s - continuing shutdown", e)

    logger.info("Shutdown complete")


app = FastAPI(
    title="Legal AI Engine",
    description="AI-powered legal assistance platform with Langfuse observability",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Add Langfuse middleware for AI request tracing
try:
    from .langfuse_middleware import LangfuseMiddleware
    app.add_middleware(LangfuseMiddleware)
except ImportError:
    logger.warning("Langfuse middleware not available - skipping")


# CORS middleware - must be added before route definitions
from .config import get_settings

settings = get_settings()
_cors_origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",  # Always allow local development
]

# Dedupe origins while preserving order
cors_origins = list(dict.fromkeys(_cors_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,  # Required for Authorization cookies/headers
    allow_methods=["GET", "POST", "OPTIONS"],  # Explicitly allow required methods
    allow_headers=["Authorization", "Content-Type"],  # Explicitly allow required headers
)

logger.info("CORS configured for origins: %s", cors_origins)


# Middleware for distributed tracing
@app.middleware("http")
async def sentry_middleware(request: Request, call_next):
    """Middleware to propagate Sentry traces for distributed tracing."""
    # Log incoming request details for debugging
    logger.debug(
        "Incoming request: %s %s - Headers: %s",
        request.method,
        request.url.path,
        dict(request.headers),
    )

    # Extract sentry-trace header from incoming request
    sentry_trace = request.headers.get("sentry-trace")

    if sentry_trace:
        # Continue the trace from the incoming header
        with sentry_sdk.continue_trace({"sentry-trace": sentry_trace}):
            response = await call_next(request)
    else:
        # No trace to continue, proceed normally
        response = await call_next(request)

    # Log response details
    logger.debug(
        "Outgoing response: %s - Status: %s",
        request.url.path,
        response.status_code,
    )

    return response


# Global exception handler for validation errors (422)
@app.exception_handler(422)
async def validation_exception_handler(request: Request, exc: HTTPException):
    """Handle validation errors with detailed logging."""
    logger.error(
        "Validation error on %s %s: %s",
        request.method,
        request.url.path,
        exc.detail,
    )
    return HTTPException(
        status_code=422,
        detail={
            "message": "Request validation failed",
            "errors": exc.detail,
            "path": request.url.path,
            "method": request.method,
        },
    )


# Helper function to extract user_id from JWT for error handlers
def _extract_user_id_from_request(request: Request) -> str | None:
    """Extract user_id from JWT token in Authorization header.

    This is used by exception handlers which don't have access to
    FastAPI's dependency injection system.

    Args:
        request: FastAPI Request object

    Returns:
        User ID (UUID) if token is valid, None otherwise
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None

    # Extract token from "Bearer <token>" format
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    token = parts[1]

    try:
        from .auth import validate_jwt_token
        user_context = validate_jwt_token(token)
        return user_context.id
    except Exception:
        # Token validation failed - return None for anonymous/invalid
        return None


# Custom exception handlers for AI Engine errors
@app.exception_handler(AIEngineError)
async def ai_engine_exception_handler(request: Request, exc: AIEngineError):
    """Handle all AI Engine custom exceptions with structured responses."""
    # Log error with context
    logger.error(
        "AI Engine error on %s %s: [%s] %s",
        request.method,
        request.url.path,
        exc.error_code,
        exc.message,
        exc_info=True,
    )

    # Extract user_id from JWT for Langfuse tracking
    user_id = _extract_user_id_from_request(request)

    # Track error in Langfuse using the new pattern
    # Note: session_id is in request body, not accessible in global error handlers.
    # Use placeholder for error traces - actual requests will have proper session_id in agent traces.
    from .langfuse_init import create_trace, is_langfuse_enabled
    if is_langfuse_enabled():
        trace = create_trace(
            name=f"error:{exc.error_code}",
            session_id="error-handler",  # Placeholder: session_id only in request body
            user_id=user_id,
            metadata={
                "path": request.url.path,
                "method": request.method,
                "error_code": exc.error_code,
                "retryable": exc.retryable,
            },
        )
        if trace:
            trace.end(level="ERROR", status_message=str(exc))

    # Build error response
    status_code = 500
    if exc.error_code == "RATE_LIMIT_EXCEEDED":
        status_code = 429
    elif exc.error_code in ("VALIDATION_ERROR", "INPUT_VALIDATION_ERROR", "MISSING_REQUIRED_FIELD"):
        status_code = 400
    elif exc.error_code == "SERVICE_UNAVAILABLE":
        status_code = 503
    elif exc.error_code == "LLM_AUTH_ERROR":
        status_code = 401

    return JSONResponse(
        status_code=status_code,
        content=ErrorResponse(
            error_code=exc.error_code,
            message=exc.message,
            suggestion=exc.suggestion,
            details=exc.details if exc.details else None,
            retryable=exc.retryable,
            request_id=request.headers.get("x-request-id"),
        ).model_dump(),
    )


@app.exception_handler(RateLimitError)
async def rate_limit_exception_handler(request: Request, exc: RateLimitError):
    """Handle rate limit errors with retry-after header."""
    logger.warning(
        "Rate limit exceeded on %s %s: %s",
        request.method,
        request.url.path,
        exc.message,
    )

    retry_after = exc.details.get("reset_time", 60)
    if isinstance(retry_after, str):
        # Parse reset time if it's a string
        try:
            from datetime import datetime
            retry_after = int(datetime.fromisoformat(retry_after).timestamp() - time.time())
            retry_after = max(1, retry_after)
        except Exception:
            retry_after = 60

    return JSONResponse(
        status_code=429,
        headers={"Retry-After": str(retry_after)},
        content=RateLimitErrorResponse(
            message=exc.message,
            retry_after=retry_after,
            limit=exc.details.get("limit"),
            reset_time=exc.details.get("reset_time"),
        ).model_dump(),
    )


@app.exception_handler(ServiceUnavailableError)
async def service_unavailable_exception_handler(request: Request, exc: ServiceUnavailableError):
    """Handle service unavailable errors."""
    logger.error(
        "Service unavailable on %s %s: %s",
        request.method,
        request.url.path,
        exc.message,
    )

    return JSONResponse(
        status_code=503,
        content=ServiceUnavailableErrorResponse(
            message=exc.message,
            service=exc.details.get("service"),
            estimated_recovery=exc.details.get("estimated_recovery"),
        ).model_dump(),
    )


@app.exception_handler(ValidationError)
async def validation_error_exception_handler(request: Request, exc: ValidationError):
    """Handle validation errors from input validation."""
    logger.warning(
        "Validation error on %s %s: %s",
        request.method,
        request.url.path,
        exc.message,
    )

    return JSONResponse(
        status_code=400,
        content=ValidationErrorResponse(
            message=exc.message,
            errors=[
                {
                    "field": exc.details.get("field"),
                    "message": exc.message,
                    "code": exc.error_code,
                }
            ],
        ).model_dump(),
    )


# Global fallback exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all uncaught exceptions with user-friendly responses."""
    # Generate request ID for support reference
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())

    # Log full error with stack trace
    logger.exception(
        "Unhandled exception on %s %s (request_id: %s): %s",
        request.method,
        request.url.path,
        request_id,
        exc,
    )

    # Extract user_id from JWT for Langfuse tracking
    user_id = _extract_user_id_from_request(request)

    # Track in Langfuse using the new pattern
    # Note: session_id is in request body, not accessible in global error handlers.
    # Use placeholder for error traces - actual requests will have proper session_id in agent traces.
    from .langfuse_init import create_trace, is_langfuse_enabled
    if is_langfuse_enabled():
        trace = create_trace(
            name="error:unhandled",
            session_id="error-handler",  # Placeholder: session_id only in request body
            user_id=user_id,
            metadata={
                "path": request.url.path,
                "method": request.method,
                "exception_type": type(exc).__name__,
                "request_id": request_id,
            },
        )
        if trace:
            trace.end(level="ERROR", status_message=str(exc))

    # Build user-friendly response (don't expose technical details in production)
    from .config import get_settings
    settings = get_settings()

    # In production, hide technical details
    if settings.LOG_LEVEL != "DEBUG":
        message = "An unexpected error occurred. Please try again or contact support."
        details = None
    else:
        message = str(exc)
        details = {"exception_type": type(exc).__name__}

    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error_code="INTERNAL_ERROR",
            message=message,
            suggestion="Please try again. If the problem persists, contact support with request ID: " + request_id,
            details=details,
            retryable=True,
            request_id=request_id,
        ).model_dump(),
    )


# In-memory storage for demo (will be replaced with proper state management)
generation_tasks: dict[str, dict[str, Any]] = {}

# Embedding service singleton
_embedding_service = None


def get_embedding_service():
    """Get or create the embedding service singleton."""
    global _embedding_service
    if _embedding_service is None:
        from .services.embedding_service import EmbeddingService

        _embedding_service = EmbeddingService()
    return _embedding_service


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Legal AI Engine Running", "version": "0.1.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint for process monitoring and load balancers.

    Returns:
        - status: "ok" if service is healthy, "starting" during initialization
        - service: Service name
        - version: Service version
        - uptime_seconds: Time since service started
        - active_tasks: Number of active document generation tasks
        - startup_phase: Current startup phase (initializing, loading_models,
          ready, failed)
        - startup_complete: Whether startup is complete

    This endpoint is designed for:
    - Process manager health checks (PM2, Kubernetes, etc.)
    - Load balancer probes
    - Monitoring systems (Prometheus, DataDog, etc.)
    - Startup probes to ensure service is ready before accepting traffic
    """
    import os

    import psutil

    # Get process uptime
    process = psutil.Process(os.getpid())
    uptime_seconds = time.time() - process.create_time()

    # Determine health status
    status = "ok" if startup_complete else "starting"
    if startup_status.get("phase") == "failed":
        status = "unhealthy"

    response = {
        "status": status,
        "service": "legal-ai-engine",
        "version": "0.1.0",
        "uptime_seconds": round(uptime_seconds, 2),
        "active_tasks": len(generation_tasks),
        "startup_complete": startup_complete,
        "startup_phase": startup_status.get("phase", "unknown"),
    }

    # Include startup message and error if available
    if startup_status.get("message"):
        response["startup_message"] = startup_status["message"]
    if startup_status.get("error"):
        response["error"] = startup_status["error"]

    # Return 503 if service failed to start
    if status == "unhealthy":
        raise HTTPException(
            status_code=503,
            detail=response,
        )

    return response


@app.get("/health/ready")
async def readiness_check():
    """Readiness check endpoint for Kubernetes-style probes.

    Returns 200 if the service is ready to accept traffic.
    Returns 503 if the service is still starting up or failed to start.
    """
    if not startup_complete:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "startup_phase": startup_status.get("phase", "unknown"),
                "startup_message": startup_status.get("message", "Starting up..."),
            },
        )
    return {"status": "ready", "startup_phase": startup_status.get("phase")}


@app.get("/health/live")
async def liveness_check():
    """Liveness check endpoint for Kubernetes-style probes.

    Returns 200 if the service is running and responsive.
    This is a lightweight check that doesn't verify startup completion.
    """
    return {"status": "alive", "uptime_seconds": round(time.time() - time.time(), 2)}


@app.get("/health/jwt")
async def jwt_health_check():
    """Health check for JWT validation service.

    Returns 200 if JWT validation is properly configured and operational.
    This endpoint verifies:
    - PyJWT library is installed
    - JWT_SECRET is configured
    - Token validation logic is working

    Returns:
        - status: "ok" if JWT validation is healthy
        - jwt_configured: Whether JWT_SECRET is set (not default)
        - algorithm: JWT algorithm being used
        - can_validate: Whether token validation logic works
    """
    from .auth import JWTValidationError, validate_jwt_token
    from .config import get_settings

    settings = get_settings()

    # Check if JWT_SECRET is configured (not default)
    jwt_configured = settings.JWT_SECRET != "secretKey"

    # Test token validation with a dummy token
    can_validate = False
    try:
        # Try to validate an invalid token - should raise JWTValidationError
        try:
            validate_jwt_token("invalid.token.here")
        except (JWTValidationError, Exception):
            # Expected to fail - this means validation logic is working
            can_validate = True
    except Exception:
        can_validate = False

    return {
        "status": "ok",
        "jwt_configured": jwt_configured,
        "algorithm": settings.JWT_ALGORITHM,
        "can_validate": can_validate,
    }


@app.get("/health/langfuse")
async def langfuse_health_check():
    """Health check for Langfuse observability service.

    Returns 200 if Langfuse configuration is valid and operational.
    This endpoint verifies:
    - Langfuse SDK is available
    - LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY are configured
    - Keys have valid format (pk- and sk- prefixes)
    - LANGFUSE_ENABLED is set correctly
    - LANGFUSE_HOST is configured (if custom)
    - Connection to Langfuse server is working

    Returns:
        - status: "ok" if Langfuse is healthy, "disabled" if explicitly disabled,
          "error" if configuration is invalid
        - enabled: Whether Langfuse is enabled in configuration
        - configured: Whether keys are properly configured
        - host: The Langfuse host URL (cloud or self-hosted)
        - sampling_rate: The configured sampling rate (0.0 to 1.0)
        - connection_status: "connected" if auth_check passed, "disconnected" otherwise
        - public_key_format: Valid format of the public key (pk-*)
        - secret_key_format: Valid format of the secret key (sk-*)
        - warnings: List of configuration warnings (non-critical issues)
        - errors: List of configuration errors (if any)

    The endpoint returns 200 even if Langfuse is disabled or misconfigured,
    but includes error details in the response. Use the response body to
    determine if action is needed.
    """
    from .config import get_settings
    from .langfuse_init import get_langfuse
    from .validate_config import validate_langfuse_config

    settings = get_settings()

    # Check if Langfuse is explicitly disabled
    if not settings.LANGFUSE_ENABLED:
        return {
            "status": "disabled",
            "enabled": False,
            "configured": False,
            "host": settings.LANGFUSE_HOST or "https://cloud.langfuse.com",
            "sampling_rate": settings.LANGFUSE_SAMPLING_RATE,
            "connection_status": "disabled",
            "public_key_format": None,
            "secret_key_format": None,
            "warnings": ["Langfuse is disabled by LANGFUSE_ENABLED=false"],
            "errors": [],
        }

    # Validate configuration
    try:
        validation_result = validate_langfuse_config(settings)
    except Exception as e:
        return {
            "status": "error",
            "enabled": True,
            "configured": False,
            "host": settings.LANGFUSE_HOST or "https://cloud.langfuse.com",
            "sampling_rate": settings.LANGFUSE_SAMPLING_RATE,
            "connection_status": "error",
            "public_key_format": None,
            "secret_key_format": None,
            "warnings": [],
            "errors": [str(e)],
        }

    if not validation_result["valid"]:
        return {
            "status": "error",
            "enabled": True,
            "configured": False,
            "host": settings.LANGFUSE_HOST or "https://cloud.langfuse.com",
            "sampling_rate": settings.LANGFUSE_SAMPLING_RATE,
            "connection_status": "invalid_config",
            "public_key_format": settings.LANGFUSE_PUBLIC_KEY[:2] + "-" if settings.LANGFUSE_PUBLIC_KEY else None,
            "secret_key_format": settings.LANGFUSE_SECRET_KEY[:2] + "-" if settings.LANGFUSE_SECRET_KEY else None,
            "warnings": validation_result.get("warnings", []),
            "errors": validation_result.get("errors", []),
        }

    # Check connection to Langfuse server
    connection_status = "disconnected"
    langfuse_client = get_langfuse()
    if langfuse_client is not None:
        try:
            # Test connection with auth_check
            if hasattr(langfuse_client, "auth_check"):
                if langfuse_client.auth_check():
                    connection_status = "connected"
            else:
                # Fallback: if client exists, assume connected
                connection_status = "connected"
        except Exception:
            connection_status = "error"

    return {
        "status": "ok" if connection_status == "connected" else "degraded",
        "enabled": True,
        "configured": True,
        "host": settings.LANGFUSE_HOST or "https://cloud.langfuse.com",
        "sampling_rate": settings.LANGFUSE_SAMPLING_RATE,
        "connection_status": connection_status,
        "public_key_format": settings.LANGFUSE_PUBLIC_KEY[:3] + "*" * 20 if settings.LANGFUSE_PUBLIC_KEY else None,
        "secret_key_format": settings.LANGFUSE_SECRET_KEY[:3] + "*" * 20 if settings.LANGFUSE_SECRET_KEY else None,
        "warnings": validation_result.get("warnings", []),
        "errors": [],
    }


@app.get("/api/v1/metrics/costs")
async def get_cost_metrics():
    """Get cost and usage metrics for monitoring.

    Returns:
        - today: Today's total cost, tokens, and requests
        - by_operation: Cost breakdown by operation type
        - by_model: Cost breakdown by model
        - uptime_hours: Service uptime
        - avg_cost_per_hour: Average cost per hour since startup
        - alerts: List of triggered cost alerts

    This endpoint is useful for:
    - Cost monitoring dashboards
    - Automated cost alerts
    - Usage analytics
    """
    return get_cost_summary_dict()


# Global conversation history metrics storage
_conv_history_metrics: dict[str, dict[str, int | float]] = {}


@app.get("/api/v1/metrics/conversation-history")
async def get_conversation_history_metrics():
    """Get conversation history metrics for monitoring.

    Returns aggregated statistics about conversation history
    being processed by the AI Engine. Useful for monitoring:
    - Average conversation length
    - Message count distribution
    - Total characters processed
    - Empty content detection
    - Role distribution

    Metrics are reset periodically and represent recent activity.

    Returns:
        - total_requests: Total number of requests processed
        - total_messages: Total number of history messages processed
        - total_characters: Total characters in conversation history
        - avg_messages_per_request: Average messages per request
        - avg_characters_per_request: Average characters per request
        - empty_content_count: Number of requests with empty content detected
        - message_count_distribution: Distribution of message counts
        - role_distribution: Distribution of message roles
        - truncated_count: Number of requests with history truncated (>10 messages)
    """
    from .services.metrics import get_conversation_history_metrics

    return get_conversation_history_metrics()


@app.get("/api/v1/metrics")
async def get_all_metrics():
    """Get all metrics in one endpoint for monitoring systems.

    Combines cost and conversation history metrics for
    simplified monitoring dashboard integration.

    Returns:
        - costs: Cost and usage metrics
        - conversation_history: Conversation history metrics
        - uptime: Service uptime in seconds
    """
    import psutil

    from .services.metrics import get_conversation_history_metrics

    process = psutil.Process()
    uptime_seconds = time.time() - process.create_time()

    return {
        "costs": get_cost_summary_dict(),
        "conversation_history": get_conversation_history_metrics(),
        "uptime_seconds": uptime_seconds,
    }


@app.get("/api/v1/debug/langfuse-status")
async def get_langfuse_status(
    user: UserContext = Depends(get_current_user),
):
    """Get Langfuse observability status for debugging.

    This endpoint helps diagnose Langfuse integration issues without
    logging into the Langfuse dashboard.

    Requires admin authentication (user with ADMIN or SUPER_ADMIN role).

    Returns:
        - connection_status: "connected" or "disconnected"
        - configuration: Langfuse configuration check (keys, sampling rate, etc.)
        - trace_counts: Number of traces sent in last hour/day/total
        - recent_traces: List of recent trace IDs for verification
        - last_successful_trace: Timestamp of last successful trace
        - seconds_since_last_trace: Seconds since last successful trace
        - recent_errors: List of recent Langfuse SDK errors
        - langfuse_available: Whether Langfuse SDK is available
        - langfuse_enabled: Whether Langfuse is enabled in config

    Raises:
        HTTPException 403: If user is not an admin
        HTTPException 401: If authentication is required but not provided
    """
    from .config import get_settings
    from .langfuse_init import get_debug_log, get_langfuse, is_langfuse_enabled
    from .services.langfuse_tracker import get_langfuse_tracker

    # Check admin authorization
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "INSUFFICIENT_PERMISSIONS",
                "message": "Admin access required for Langfuse debug endpoint",
            },
        )

    settings = get_settings()
    tracker = get_langfuse_tracker()
    langfuse_client = get_langfuse()

    # Check connection status
    connection_status = "disconnected"
    if is_langfuse_enabled() and langfuse_client is not None:
        try:
            # Use auth_check to verify connection
            if hasattr(langfuse_client, "auth_check"):
                if langfuse_client.auth_check():
                    connection_status = "connected"
            else:
                # Fallback: if enabled and client exists, assume connected
                connection_status = "connected"
        except Exception as e:
            logger.warning("Langfuse auth_check failed: %s", e)

    # Get trace counts
    trace_counts = tracker.get_trace_counts()

    # Get recent traces (limit to 10 for readability)
    recent_traces = tracker.get_recent_traces(limit=10)

    # Get recent errors (limit to 10)
    recent_errors = tracker.get_recent_errors(limit=10)

    # Get last successful trace info
    last_successful_trace = tracker.get_last_successful_trace_timestamp()
    seconds_since_last_trace = tracker.get_seconds_since_last_trace()

    # Check configuration
    has_public_key = bool(settings.LANGFUSE_PUBLIC_KEY)
    has_secret_key = bool(settings.LANGFUSE_SECRET_KEY)
    sampling_rate = settings.LANGFUSE_SAMPLING_RATE

    # Check if Langfuse SDK is available
    from .langfuse_init import _langfuse_available
    langfuse_available = _langfuse_available

    return {
        "connection_status": connection_status,
        "configuration": {
            "public_key_configured": has_public_key,
            "secret_key_configured": has_secret_key,
            "host": settings.LANGFUSE_HOST,
            "sampling_rate": sampling_rate,
            "enabled": settings.LANGFUSE_ENABLED,
            "session_id_header": settings.LANGFUSE_SESSION_ID_HEADER,
        },
        "trace_counts": trace_counts,
        "recent_traces": recent_traces,
        "last_successful_trace": last_successful_trace,
        "seconds_since_last_trace": seconds_since_last_trace,
        "recent_errors": recent_errors,
        "langfuse_available": langfuse_available,
        "langfuse_enabled": is_langfuse_enabled(),
        "debug_log": get_debug_log(),  # Include initialization debug log
    }


@app.get("/api/v1/debug/session-history/{session_id}")
async def get_session_history_debug(
    session_id: str,
    user: UserContext | None = Depends(get_current_user_optional),
):
    """Debug endpoint to inspect conversation history for a session.

    This endpoint returns detailed information about the conversation history
    that was received for a specific session ID. Useful for troubleshooting
    conversation history flow issues.

    Note: This is an AI Engine endpoint that shows what the AI Engine receives.
    For actual stored conversation history in the database, use the backend
    GraphQL API's chatMessages query.

    Authentication:
    - Optional: accepts JWT tokens for user context
    - Returns information about the session from AI Engine's perspective

    Returns:
        - session_id: The session ID being queried
        - user_id: User ID if authenticated
        - received_at: Timestamp when this debug query was made
        - notes: Information about the session from AI Engine logs
        - disclaimer: This endpoint only shows current request info, not stored history

    For actual stored conversation history:
    - Use GraphQL query: { chatMessages(sessionId: "uuid") { role content sequenceOrder } }
    - Or use the backend's getConversationHistory service method
    """
    from .auth import is_valid_uuid_v4

    # Validate session ID format
    if not is_valid_uuid_v4(session_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "INVALID_SESSION_ID",
                "message": "Session ID must be a valid UUID v4",
                "session_id": session_id,
            },
        )

    # Get user info
    user_id = user.id if user else None

    logger.info(
        "[DEBUG] Session history lookup: session_id=%s, user_id=%s",
        session_id,
        user_id or "anonymous",
    )

    return {
        "session_id": session_id,
        "user_id": user_id,
        "authenticated": user is not None,
        "received_at": time.time(),
        "notes": [
            "This is an AI Engine debug endpoint.",
            "It shows the session ID format validation.",
            "For actual stored conversation history, use the backend GraphQL API:",
            "  query { chatMessages(sessionId: \"" + session_id + "\") { role content sequenceOrder } }",
            "Or call the backend's getConversationHistory service method.",
        ],
        "session_id_valid": True,
        "session_id_format": "UUID v4",
        "disclaimer": "The AI Engine does not store conversation history.",
        "storage_location": "Conversation history is stored in the backend database (ChatMessage table).",
        "flow_explanation": [
            "1. Frontend sends message with sessionId to backend GraphQL mutation",
            "2. Backend fetches conversation history from database via getConversationHistory()",
            "3. Backend calls AI Engine with conversation_history in request body",
            "4. AI Engine logs received conversation history (see logs for [CONV_HISTORY])",
            "5. AI Engine uses conversation history for context in LLM calls",
        ],
        "logging_keywords": [
            "[CONV_HISTORY] - Search for this in AI Engine logs",
            "[CONVERSATION_HISTORY] - Search for this in backend logs",
            "CONV_HISTORY_METRIC - Search for metrics in logs",
        ],
    }


# -----------------------------------------------------------------------------
# Streaming Endpoints
# -----------------------------------------------------------------------------


@app.post("/api/v1/qa/stream")
async def ask_question_stream(
    request: AskQuestionRequest,
    http_request: Request,
    user: UserContext | None = Depends(get_current_user_optional),
):
    """Stream a legal Q&A response for real-time user feedback.

    Returns Server-Sent Events (SSE) with incremental chunks of the answer.
    The client receives response text progressively rather than waiting for
    the complete generation.

    Authentication:
    - Accepts JWT tokens from frontend (signed by backend)
    - Optional: works without auth for anonymous requests
    - Pass Authorization: Bearer <token> header

    Request Body (JSON):
        question: The legal question to answer (required)
        mode: Response mode - LAWYER (detailed) or SIMPLE (layperson), default: SIMPLE
        session_id: User session ID for tracking (must be valid UUID v4)

    SSE Format:
        data: {"content": "text chunk", "done": false, "metadata": {...}}

    Final chunk includes:
        done: true
        metadata.citations: Legal citations
        metadata.confidence: Answer confidence score
        metadata.processing_time_ms: Total processing time

    Uses PydanticAI agents with:
    - Query analysis and classification
    - Context retrieval from vector store
    - Streaming answer generation with RAG
    """
    from .auth import set_user_session_id

    # Set and validate session_id from request body on the user context
    user_with_session = set_user_session_id(user, request.session_id)

    # Use authenticated user ID if available, otherwise fall back to header
    user_id = user_with_session.id if user_with_session else http_request.headers.get("x-user-id")

    async def generate() -> AsyncGenerator[str, None]:
        async for chunk in stream_qa_response(
            question=request.question,
            mode=request.mode,
            session_id=request.session_id,
            user_id=user_id,
        ):
            yield chunk

    return create_streaming_response(generate())


@app.post("/api/v1/qa/ask-stream")
async def ask_question_stream_enhanced(
    request: AskQuestionRequest,
    http_request: Request,
    user: UserContext | None = Depends(get_current_user_optional),
):
    """Stream a legal Q&A response with structured SSE events.

    Enhanced streaming endpoint that sends typed events for better client-side
    handling of real-time AI responses. This is the UNIFIED streaming endpoint
    that handles both standard questions and clarification answers.

    Authentication:
    - Accepts JWT tokens from frontend (signed by backend)
    - Optional: works without auth for anonymous requests
    - Pass Authorization: Bearer <token> header

    Request Body (JSON):
        question: The legal question to answer (required)
        mode: Response mode - LAWYER (detailed) or SIMPLE (layperson), default: SIMPLE
        session_id: User session ID for tracking (must be valid UUID v4)
        message_type: Type of message - QUESTION or CLARIFICATION_ANSWER, default: QUESTION
        original_question: Original question (required for CLARIFICATION_ANSWER)
        clarification_answers: User's answers to clarification questions (required for CLARIFICATION_ANSWER)
        conversation_history: Optional conversation history as array of {role, content} objects
        conversation_metadata: Optional metadata for Langfuse observability

    SSE Event Format:
        data: {"type": "token", "content": "text chunk", "metadata": {}}
        data: {"type": "citation", "content": "", "metadata": {"source": "...", "article": "...", "url": "..."}}
        data: {"type": "error", "content": "", "metadata": {"error": "..."}}
        data: {"type": "done", "content": "", "metadata": {"citations": [...], "confidence": 0.0, "processing_time_ms": 123}}

    Event Types:
    - token: Partial response content as it's generated
    - citation: Legal citation reference when identified
    - error: Error information if processing fails
    - done: Final completion event with full metadata

    Client disconnection is handled gracefully - streaming stops if client
    disconnects during processing.

    Uses PydanticAI agents with:
    - Query analysis and classification
    - Context retrieval from vector store (RAG)
    - Answer generation with citations
    - Conversation history for context-aware responses
    - LangGraph workflow orchestration
    """
    from .auth import set_user_session_id
    from .models.requests import MessageType

    # Validate inputs
    if not request.question or len(request.question.strip()) < 3:
        raise HTTPException(
            status_code=400,
            detail={"error_code": "INVALID_INPUT", "message": "Question must be at least 3 characters long"},
        )

    mode = request.mode or "SIMPLE"
    if mode not in ("LAWYER", "SIMPLE"):
        mode = "SIMPLE"

    # Set and validate session_id from request body on the user context
    # This ensures session_id is a valid UUID v4 and is attached to UserContext
    user_with_session = set_user_session_id(user, request.session_id)

    # Log conversation history details for verification
    conversation_history = request.conversation_history or []
    history_size = len(conversation_history)

    message_type_str = request.message_type.value if hasattr(request.message_type, 'value') else str(request.message_type)
    logger.info(
        "[ASK_STREAM] Received request: session_id=%s, user_id=%s, message_type=%s, history_count=%d, question_length=%d",
        request.session_id,
        user_with_session.id if user_with_session else "anonymous",
        message_type_str,
        history_size,
        len(request.question),
    )

    # Check if this is a clarification answer request
    is_clarification_answer = request.message_type == MessageType.CLARIFICATION_ANSWER

    if is_clarification_answer:
        # Validate required fields for clarification answers
        if not request.original_question:
            raise HTTPException(
                status_code=400,
                detail={"error_code": "MISSING_ORIGINAL_QUESTION", "message": "original_question is required for CLARIFICATION_ANSWER message type"},
            )
        if not request.clarification_answers or len(request.clarification_answers) == 0:
            raise HTTPException(
                status_code=400,
                detail={"error_code": "MISSING_CLARIFICATION_ANSWERS", "message": "clarification_answers is required for CLARIFICATION_ANSWER message type"},
            )

        logger.info(
            "[ASK_STREAM] Processing CLARIFICATION_ANSWER: session_id=%s, answers_count=%d",
            request.session_id,
            len(request.clarification_answers),
        )

    async def generate() -> AsyncGenerator[str, None]:
        # Extract conversation metadata for Langfuse observability
        conversation_metadata = None
        if request.conversation_metadata:
            conversation_metadata = request.conversation_metadata.model_dump()

        if is_clarification_answer:
            # Convert ClarificationAnswer objects to dicts for the streaming function
            # We've already validated that clarification_answers is not None above
            answers_list = request.clarification_answers or []
            answers_dicts = [
                {
                    "question_id": a.question,  # Use question text as ID for compatibility
                    "question": a.question,
                    "question_type": a.question_type,
                    "answer": a.answer,
                }
                for a in answers_list
            ]

            async for event in stream_clarification_answer(
                original_question=request.original_question,
                answers=answers_dicts,
                mode=mode,
                session_id=request.session_id,
                user=user_with_session,
                request=http_request,
                messages=request.conversation_history,
                conversation_metadata=conversation_metadata,
            ):
                yield event
        else:
            async for event in stream_qa_enhanced(
                question=request.question,
                mode=mode,
                session_id=request.session_id,
                user=user_with_session,
                request=http_request,
                messages=request.conversation_history,
                conversation_metadata=conversation_metadata,
            ):
                yield event

    return create_enhanced_streaming_response(generate())


@app.post("/api/v1/qa", response_model=QAResponse)
async def ask_question_simple(request: QARequest):
    """Ask a legal question and receive an answer with citations.

    This is a simplified Q&A endpoint that accepts a question and returns
    a structured response with the answer and an array of citations.

    The endpoint uses PydanticAI agents to process the question and generate
    a response with relevant legal citations.
    """
    try:
        result = await answer_question(
            question=request.question,
            mode="SIMPLE",
            session_id="simple-qa",
        )

        return QAResponse(
            answer=result["answer"],
            citations=[
                Citation(
                    source=c.get("source", "Unknown"),
                    article=c.get("article", ""),
                    url=c.get("url"),
                )
                for c in result.get("citations", [])
            ],
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Q&A processing failed: {e!s}",
        ) from e


@app.post("/api/v1/documents/generate", response_model=GenerateDocumentResponse)
async def generate_document(
    request: GenerateDocumentRequest, background_tasks: BackgroundTasks
):
    """Generate a legal document from natural language description.

    This endpoint initiates document generation and returns a task ID.
    Use the /api/v1/documents/status/{task_id} endpoint to check progress.

    Uses PydanticAI agent for document generation.
    """
    task_id = str(uuid.uuid4())

    # Store initial task state
    generation_tasks[task_id] = {
        "status": "PROCESSING",
        "request": request.model_dump(),
        "content": None,
        "error": None,
    }

    # Run agent in background
    background_tasks.add_task(run_agent_generation, task_id, request)

    return GenerateDocumentResponse(
        task_id=task_id,
        status="PROCESSING",
        message="Document generation started",
    )


async def run_agent_generation(task_id: str, request: GenerateDocumentRequest):
    """Run the PydanticAI drafting agent in the background."""
    try:
        from .agents.drafting_agent import generate_document

        draft_result, metadata = await generate_document(
            document_type=request.document_type.value,
            description=request.description,
            context=request.context,
            session_id=request.session_id,
        )

        generation_tasks[task_id]["status"] = "COMPLETED"
        generation_tasks[task_id]["content"] = draft_result.content
        generation_tasks[task_id]["metadata"] = {
            **metadata,
            "sections_count": draft_result.metadata.sections_count,
            "word_count": draft_result.metadata.word_count,
            "quality_score": draft_result.quality_score,
            "placeholders": draft_result.place_holders,
        }

    except Exception as e:
        generation_tasks[task_id]["status"] = "FAILED"
        generation_tasks[task_id]["error"] = str(e)


@app.get("/api/v1/documents/status/{task_id}", response_model=DocumentGenerationStatus)
async def get_document_status(task_id: str):
    """Get the status of a document generation task."""
    if task_id not in generation_tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    task = generation_tasks[task_id]

    return DocumentGenerationStatus(
        task_id=task_id,
        status=str(task["status"]),
        content=task.get("content"),
        metadata=task.get("request"),
        error=task.get("error"),
    )


@app.post("/api/v1/qa/ask", response_model=AnswerResponse)
async def ask_question(request: AskQuestionRequest, http_request: Request):
    """Ask a legal question and receive an answer with citations.

    The AI will provide answers tailored to the specified mode:
    - LAWYER: Detailed, technical legal analysis
    - SIMPLE: Layperson-friendly explanation

    Uses PydanticAI agents with:
    - Query analysis and classification
    - Context retrieval from vector store
    - Answer generation with RAG
    - Citation formatting
    """
    try:
        # Extract user ID from headers for observability
        user_id = http_request.headers.get("x-user-id")

        # Log conversation history for debugging
        conversation_history = request.conversation_history or []
        logger.info(
            "Received Q&A request: question_length=%d, mode=%s, session_id=%s, user_id=%s, conversation_messages=%d",
            len(request.question),
            request.mode,
            request.session_id,
            user_id,
            len(conversation_history),
        )
        logger.debug("Q&A request body: %s", request.model_dump())

        result = await answer_question(
            question=request.question,
            mode=request.mode,
            session_id=request.session_id,
            user_id=user_id,
            conversation_history=conversation_history,
        )

        logger.debug("Q&A result: answer_length=%d, citations=%d", len(result.get("answer", "")), len(result.get("citations", [])))

        return AnswerResponse(
            answer=result["answer"],
            citations=[
                Citation(
                    source=c.get("source", "Unknown"),
                    article=c.get("article", ""),
                    url=c.get("url"),
                )
                for c in result.get("citations", [])
            ],
            confidence=result.get("confidence", 0.0),
        )

    except Exception as e:
        logger.exception("Q&A processing failed: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"Q&A processing failed: {e!s}",
        ) from e


@app.post("/api/v1/search/rulings", response_model=SearchRulingsResponse)
async def search_rulings(request: SearchRulingsRequest):
    """Search for legal rulings and case law.

    Returns relevant court rulings based on the search query and filters.
    """
    # TODO: Implement actual search integration
    # For now, return mock results

    mock_rulings = [
        Ruling(
            id="ruling-001",
            title=f"Mock ruling for: {request.query}",
            court="Supreme Court of Poland",
            date="2024-01-15",
            summary="This is a placeholder ruling summary.",
            url="https://example.com/ruling/001",
            relevance_score=0.92,
        )
    ]

    return SearchRulingsResponse(
        results=mock_rulings[: request.limit],
        total=len(mock_rulings),
        query=request.query,
    )


@app.post("/api/v1/classify", response_model=ClassificationResponse)
async def classify_case(request: ClassifyCaseRequest):
    """Analyze a case description and identify applicable legal grounds.

    Uses PydanticAI agent to analyze the case and return structured
    classification with confidence scores for each identified legal ground.

    The response includes:
    - List of identified legal grounds with individual confidence scores
    - Overall classification confidence
    - Summary and recommendations
    - Processing time metrics
    """
    start_time = time.time()

    try:
        # Run the classifier agent (lazy-loaded)
        agent = get_classifier_agent()
        result = await agent.run(
            f"Analyze this case and identify applicable legal grounds:\n\n{request.case_description}"
        )

        processing_time = (time.time() - start_time) * 1000  # Convert to ms

        classification = result.output

        return ClassificationResponse(
            identified_grounds=[
                {
                    "name": ground.name,
                    "description": ground.description,
                    "confidence_score": ground.confidence_score,
                    "legal_basis": ground.legal_basis,
                    "notes": ground.notes,
                }
                for ground in classification.identified_grounds
            ],
            overall_confidence=classification.overall_confidence,
            summary=classification.summary,
            recommendations=classification.recommendations,
            case_description=request.case_description,
            processing_time_ms=processing_time,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Classification failed: {e!s}",
        ) from e


@app.post("/api/v1/embeddings/generate", response_model=GenerateEmbeddingsResponse)
async def generate_embeddings(request: GenerateEmbeddingsRequest):
    """Generate embeddings for text chunks using OpenAI.

    This endpoint generates vector embeddings for one or more text chunks
    using OpenAI's text-embedding-3-small model (1536 dimensions).

    The embeddings can be stored in a vector database for semantic search
    and Retrieval Augmented Generation (RAG).
    """
    try:
        embedding_service = get_embedding_service()

        # Generate embeddings
        embeddings = await embedding_service.generate_embeddings(
            texts=request.texts,
            model=request.model,
        )

        return GenerateEmbeddingsResponse(
            embeddings=embeddings,
            model=request.model,
            total_tokens=sum(len(text.split()) for text in request.texts),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Embedding generation failed: {e!s}",
        ) from e


@app.post("/api/v1/search/semantic", response_model=SemanticSearchResponse)
async def semantic_search(request: SemanticSearchRequest):
    """Perform semantic vector search over indexed documents.

    This endpoint uses vector similarity to find relevant text chunks from
    the document embeddings store. Designed for RAG (Retrieval Augmented Generation).

    Note: This is a stub implementation. In production, this would query the backend's
    VectorStoreService which uses pgvector for similarity search.
    """
    # TODO: Implement actual semantic search by calling backend vector store
    # The backend should provide an endpoint that accepts query_embedding and returns
    # similar chunks from the document_embeddings table using pgvector cosine similarity

    # Mock results for demonstration
    mock_results = [
        SemanticSearchResult(
            id="emb-001",
            document_id="doc-123",
            content_chunk=f"Relevant legal content related to: {request.query[:50]}...",
            chunk_index=0,
            similarity=0.89,
            metadata={"source": "Polish Civil Code", "article": "Art. 118"},
        ),
        SemanticSearchResult(
            id="emb-002",
            document_id="doc-456",
            content_chunk="Additional relevant context from legal documents and rulings",
            chunk_index=1,
            similarity=0.76,
            metadata={"source": "Supreme Court Ruling", "date": "2023-05-15"},
        ),
    ]

    # Filter by threshold and limit
    filtered_results = [r for r in mock_results if r.similarity >= request.threshold][
        : request.limit
    ]

    return SemanticSearchResponse(
        results=filtered_results,
        query=request.query,
        total=len(filtered_results),
    )


@app.post("/api/v1/qa/ask-rag", response_model=AnswerResponse)
async def ask_question_with_rag(request: AskQuestionRequest):
    """Ask a legal question with RAG (Retrieval Augmented Generation).

    Enhanced Q&A that:
    1. Analyzes the query to extract key terms
    2. Searches vector store for relevant legal context
    3. Augments prompt with retrieved context
    4. Generates grounded answer with citations

    Provides more accurate, citation-backed answers compared to basic Q&A.

    Uses PydanticAI agents for the complete RAG workflow.
    """
    try:
        result = await answer_question(
            question=request.question,
            mode=request.mode,
            session_id=request.session_id,
        )

        return AnswerResponse(
            answer=result["answer"],
            citations=[
                Citation(
                    source=c.get("source", "Unknown"),
                    article=c.get("article", ""),
                    url=c.get("url"),
                )
                for c in result.get("citations", [])
            ],
            confidence=result.get("confidence", 0.0),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"RAG question answering failed: {e!s}",
        ) from e


# -----------------------------------------------------------------------------
# Protected Endpoints (require JWT authentication)
# -----------------------------------------------------------------------------


@app.post("/api/v1/qa/ask-authenticated")
async def ask_question_authenticated(
    request: AskQuestionRequest,
    user: "UserContext" = Depends(get_current_user),
):
    """Ask a legal question with JWT authentication required.

    This endpoint requires a valid JWT token from the backend.
    The user context (id, email, roles) is extracted from the token.

    Request headers:
        Authorization: Bearer <jwt_token>

    Returns:
        AnswerResponse with citations and confidence score

    Raises:
        HTTPException 401: If token is missing, invalid, or expired
    """
    try:
        result = await answer_question(
            question=request.question,
            mode=request.mode,
            session_id=request.session_id,
            user=user,  # Pass full UserContext to the agent
        )

        return AnswerResponse(
            answer=result["answer"],
            citations=[
                Citation(
                    source=c.get("source", "Unknown"),
                    article=c.get("article", ""),
                    url=c.get("url"),
                )
                for c in result.get("citations", [])
            ],
            confidence=result.get("confidence", 0.0),
        )

    except Exception as e:
        logger.exception("Authenticated Q&A processing failed: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"Q&A processing failed: {e!s}",
        ) from e


@app.get("/api/v1/auth/me")
async def get_current_user_info(
    user: "UserContext" = Depends(get_current_user),
):
    """Get current authenticated user information.

    This endpoint validates the JWT token and returns user context.
    Useful for testing authentication and getting user profile.

    Request headers:
        Authorization: Bearer <jwt_token>

    Returns:
        User context with id, username, email, roles, and computed properties
    """
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "roles": user.roles,
        "role_level": user.role_level,
        "is_admin": user.is_admin,
        "is_lawyer": user.is_lawyer,
    }


# -----------------------------------------------------------------------------
# LangGraph Workflow Endpoints
# -----------------------------------------------------------------------------


@app.post("/api/v1/workflows/case-analysis")
async def workflow_case_analysis(request: ClassifyCaseRequest, http_request: Request):
    """Run the Case Analysis workflow.

    This multi-step workflow:
    1. Classifies the case to identify legal grounds
    2. Researches relevant legal context
    3. Generates clarification questions if needed
    4. Produces a comprehensive analysis report

    Uses LangGraph for orchestration between PydanticAI agents.
    """
    try:
        user_id = http_request.headers.get("x-user-id")
        session_id = request.session_id if hasattr(request, "session_id") else "workflow"

        orchestrator = get_orchestrator()
        return await orchestrator.run_case_analysis(
            case_description=request.case_description,
            session_id=session_id,
            user_id=user_id,
        )


    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Case analysis workflow failed: {e!s}",
        ) from e


@app.post("/api/v1/workflows/document-generation")
async def workflow_document_generation(request: GenerateDocumentRequest, http_request: Request):
    """Run the Document Generation workflow.

    This multi-step workflow:
    1. Classifies the case for legal context
    2. Generates the initial document
    3. Reviews quality and completeness
    4. Iterates with revisions if needed
    5. Produces the final approved document

    Uses LangGraph for orchestration between PydanticAI agents.
    """
    try:
        user_id = http_request.headers.get("x-user-id")
        session_id = request.session_id if hasattr(request, "session_id") else "workflow"

        orchestrator = get_orchestrator()
        return await orchestrator.run_document_generation(
            document_type=request.document_type.value,
            description=request.description,
            context=request.context,
            session_id=session_id,
            user_id=user_id,
            max_iterations=3,
        )


    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Document generation workflow failed: {e!s}",
        ) from e


@app.post("/api/v1/workflows/complex-qa")
async def workflow_complex_qa(request: AskQuestionRequest, http_request: Request):
    """Run the Complex Q&A workflow.

    This multi-step workflow:
    1. Analyzes the query to extract key information
    2. Generates clarification questions if needed
    3. Performs deep legal research
    4. Generates a comprehensive answer
    5. Formats and validates citations

    Uses LangGraph for orchestration between PydanticAI agents.
    """
    try:
        user_id = http_request.headers.get("x-user-id")

        orchestrator = get_orchestrator()
        return await orchestrator.run_complex_qa(
            question=request.question,
            mode=request.mode,
            session_id=request.session_id,
            user_id=user_id,
        )


    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Complex Q&A workflow failed: {e!s}",
        ) from e


# -----------------------------------------------------------------------------
# Chat Session Title Generation Endpoint
# -----------------------------------------------------------------------------


@app.post("/api/v1/chat/generate-title", response_model=GenerateTitleResponse)
async def generate_chat_title(request: GenerateTitleRequest):
    """Generate a title for a chat session based on the first message.

    This endpoint creates a concise, descriptive title (3-6 words) that captures
    the main topic of the user's first message. Uses a lightweight model (gpt-4o-mini)
    for fast, cost-effective title generation.

    The title is used to help users identify and organize their chat sessions
    in the chat history view.

    Authentication:
    - Optional: works without auth for title generation
    - Can be called from backend service with internal auth

    Args:
        first_message: The first user message in the chat session (min 5 chars)
        session_id: Session ID for tracking and observability

    Returns:
        GenerateTitleResponse with:
        - title: A 3-6 word title describing the conversation topic
        - session_id: The provided session ID for tracking

    Examples:
        "Employment Contract Review"
        "Lease Agreement Questions"
        "Unpaid Wages Claim"
        "Tenancy Rights Inquiry"

    Fallback:
        If AI generation fails, returns a truncated version of the first message
        (first 50 characters with "..." suffix).
    """
    from .agents.title_agent import generate_fallback_title

    try:
        from .agents.title_agent import generate_title

        logger.info(
            "Title generation request: message_length=%d, session_id=%s",
            len(request.first_message),
            request.session_id,
        )

        # Generate title using AI agent
        title = await generate_title(
            first_message=request.first_message,
            session_id=request.session_id,
        )

        logger.info(
            "Title generated successfully: title='%s', session_id=%s",
            title,
            request.session_id,
        )

        return GenerateTitleResponse(
            title=title,
            session_id=request.session_id,
        )

    except Exception as e:
        logger.warning(
            "AI title generation failed, using fallback: error=%s, session_id=%s",
            str(e),
            request.session_id,
        )

        # Fallback to simple truncation
        fallback_title = generate_fallback_title(request.first_message)

        return GenerateTitleResponse(
            title=fallback_title,
            session_id=request.session_id,
        )
