"""Legal AI Engine - FastAPI Service.

This service provides AI-powered legal assistance including:
- Document generation
- Legal Q&A
- Case law search
"""

import uuid
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from .models.requests import (
    AskQuestionRequest,
    GenerateDocumentRequest,
    SearchRulingsRequest,
)
from .models.responses import (
    AnswerResponse,
    Citation,
    DocumentGenerationStatus,
    GenerateDocumentResponse,
    Ruling,
    SearchRulingsResponse,
)
from .graphs.drafting_graph import drafting_graph

app = FastAPI(
    title="Legal AI Engine",
    description="AI-powered legal assistance platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for demo (will be replaced with proper state management)
from typing import Dict, Any

generation_tasks: Dict[str, Dict[str, Any]] = {}


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Legal AI Engine Running", "version": "0.1.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/api/v1/documents/generate", response_model=GenerateDocumentResponse)
async def generate_document(
    request: GenerateDocumentRequest, background_tasks: BackgroundTasks
):
    """Generate a legal document from natural language description.

    This endpoint initiates document generation and returns a task ID.
    Use the /api/v1/documents/status/{task_id} endpoint to check progress.
    """
    task_id = str(uuid.uuid4())

    # Store initial task state
    generation_tasks[task_id] = {
        "status": "PROCESSING",
        "request": request.model_dump(),
        "content": None,
        "error": None,
    }

    # Prepare input state for the graph
    initial_state = {
        "description": request.description,
        "document_type": request.document_type.value,
        "context": request.context or {},
        "draft_content": None,
        "error": None,
    }

    # Run graph in background
    background_tasks.add_task(run_graph_generation, task_id, initial_state)

    return GenerateDocumentResponse(
        task_id=task_id,
        status="PROCESSING",
        message="Document generation started",
    )


async def run_graph_generation(task_id: str, state: dict):
    """Run the LangGraph generation flow in the background."""
    try:
        result = await drafting_graph.ainvoke(state)

        # Check for errors in result state
        if result.get("error"):
            generation_tasks[task_id]["status"] = "FAILED"
            generation_tasks[task_id]["error"] = result["error"]
        else:
            generation_tasks[task_id]["status"] = "COMPLETED"
            generation_tasks[task_id]["content"] = result.get("draft_content")

    except Exception as e:
        generation_tasks[task_id]["status"] = "FAILED"
        generation_tasks[task_id]["error"] = str(e)


@app.get("/api/v1/documents/status/{task_id}", response_model=DocumentGenerationStatus)
async def get_document_status(task_id: str):
    """Get the status of a document generation task."""
    if task_id not in generation_tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    task = generation_tasks[task_id]

    # TODO: Replace with actual task status from LangGraph
    # For demo, simulate completion
    if task["status"] == "PROCESSING":
        # Task is still running (or graph is slow)
        pass

    return DocumentGenerationStatus(
        task_id=task_id,
        status=str(task["status"]),
        content=task.get("content"),  # type: ignore
        metadata=task.get("request"),  # type: ignore
        error=task.get("error"),  # type: ignore
    )


@app.post("/api/v1/qa/ask", response_model=AnswerResponse)
async def ask_question(request: AskQuestionRequest):
    """Ask a legal question and receive an answer with citations.

    The AI will provide answers tailored to the specified mode:
    - LAWYER: Detailed, technical legal analysis
    - SIMPLE: Layperson-friendly explanation
    """
    # TODO: Implement actual Q&A with RAG using PydanticAI
    # For now, return a mock response

    mock_answer = f"""Based on your question: "{request.question}"

This is a placeholder answer. The actual implementation will use:
- PydanticAI for structured responses
- RAG (Retrieval Augmented Generation) for accurate citations
- Polish legal database for authoritative sources

Mode: {request.mode}
"""

    return AnswerResponse(
        answer=mock_answer,
        citations=[
            Citation(
                source="Polish Civil Code",
                article="Art. 118",
                url="https://example.com/civil-code",
            )
        ],
        confidence=0.85,
    )


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
