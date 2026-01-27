"""Legal AI Engine - FastAPI Service.

This service provides AI-powered legal assistance including:
- Document generation
- Legal Q&A
- Case law search
- Legal grounds classification

Features distributed tracing with Sentry for APM and Langfuse for AI observability.
"""

import asyncio
import json
import logging
import signal
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import sentry_sdk
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file before other imports
# This ensures OPENAI_API_KEY is available for PydanticAI's OpenAIModel
_env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

from .agents.classifier_agent import classifier_agent as get_classifier_agent
from .agents.qa_agent import answer_question
from .error_handling import build_error_response
from .exceptions import (
    AIEngineError,
    RateLimitError,
    ServiceUnavailableError,
    ValidationError,
    LLMTimeoutError,
    BackendConnectionError,
    get_error_code,
    get_user_message,
    get_suggestion,
)
from .langfuse_init import flush, init_langfuse
from .models.requests import (
    AskQuestionRequest,
    ClassifyCaseRequest,
    GenerateDocumentRequest,
    GenerateEmbeddingsRequest,
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
    QAResponse,
    Ruling,
    RateLimitErrorResponse,
    SearchRulingsResponse,
    SemanticSearchResponse,
    SemanticSearchResult,
    ServiceUnavailableErrorResponse,
    ValidationErrorResponse,
)
from .sentry_init import init_sentry
from .services.cost_monitoring import get_cost_summary_dict
from .services.streaming import create_streaming_response, stream_qa_response
from .workflows import get_orchestrator

# Initialize Sentry for error tracking and APM
init_sentry()

# Initialize Langfuse for AI observability
init_langfuse()

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

# Global state for graceful shutdown and startup tracking
shutdown_event = asyncio.Event()
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

    # Set up signal handlers for graceful shutdown
    def handle_shutdown(signum, _frame):
        logger.info("Received signal %s, initiating graceful shutdown...", signum)
        shutdown_event.set()

    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)

    yield

    # Shutdown - wait for in-flight requests to complete
    logger.info("Legal AI Engine shutting down gracefully...")
    logger.info("Active generation tasks: %d", len(generation_tasks))

    # Flush Langfuse events before shutdown
    flush()


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


# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

    # Track error in Langfuse using the new pattern
    from .langfuse_init import is_langfuse_enabled, create_trace
    if is_langfuse_enabled():
        trace = create_trace(
            name=f"error:{exc.error_code}",
            session_id=request.headers.get("x-session-id"),
            user_id=request.headers.get("x-user-id"),
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

    # Track in Langfuse using the new pattern
    from .langfuse_init import is_langfuse_enabled, create_trace
    if is_langfuse_enabled():
        trace = create_trace(
            name="error:unhandled",
            session_id=request.headers.get("x-session-id"),
            user_id=request.headers.get("x-user-id"),
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


# -----------------------------------------------------------------------------
# Streaming Endpoints
# -----------------------------------------------------------------------------


@app.post("/api/v1/qa/stream")
async def ask_question_stream(request: AskQuestionRequest, http_request: Request):
    """Stream a legal Q&A response for real-time user feedback.

    Returns Server-Sent Events (SSE) with incremental chunks of the answer.
    The client receives response text progressively rather than waiting for
    the complete generation.

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
    user_id = http_request.headers.get("x-user-id")

    async def generate() -> AsyncGenerator[str, None]:
        async for chunk in stream_qa_response(
            question=request.question,
            mode=request.mode,
            session_id=request.session_id,
            user_id=user_id,
        ):
            yield chunk

    return create_streaming_response(generate())


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
        content=task.get("content"),  # type: ignore
        metadata=task.get("request"),  # type: ignore
        error=task.get("error"),  # type: ignore
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

        logger.info(
            "Received Q&A request: question_length=%d, mode=%s, session_id=%s, user_id=%s",
            len(request.question),
            request.mode,
            request.session_id,
            user_id,
        )
        logger.debug("Q&A request body: %s", request.model_dump())

        result = await answer_question(
            question=request.question,
            mode=request.mode,
            session_id=request.session_id,
            user_id=user_id,
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
