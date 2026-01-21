"""Legal AI Engine - FastAPI Service.

This service provides AI-powered legal assistance including:
- Document generation
- Legal Q&A
- Case law search
- Legal grounds classification
"""

import uuid
import time
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from .models.requests import (
    AskQuestionRequest,
    GenerateDocumentRequest,
    SearchRulingsRequest,
    ClassifyCaseRequest,
    GenerateEmbeddingsRequest,
    SemanticSearchRequest,
    QARequest,
)
from .models.responses import (
    AnswerResponse,
    Citation,
    DocumentGenerationStatus,
    GenerateDocumentResponse,
    Ruling,
    SearchRulingsResponse,
    ClassificationResponse,
    GenerateEmbeddingsResponse,
    SemanticSearchResponse,
    SemanticSearchResult,
    QAResponse,
)
from .graphs.drafting_graph import drafting_graph
from .graphs.qa_graph import qa_graph
from .agents.classifier_agent import classifier_agent

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
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/api/v1/qa", response_model=QAResponse)
async def ask_question_simple(request: QARequest):
    """Ask a legal question and receive an answer with citations.

    This is a simplified Q&A endpoint that accepts a question and returns
    a structured response with the answer and an array of citations.

    The endpoint uses the QA graph to process the question and generate
    a response with relevant legal citations.
    """
    try:
        # Initialize state for the QA graph
        initial_state = {
            "question": request.question,
            "session_id": "simple-qa",
            "mode": "SIMPLE",
            "query_type": None,
            "key_terms": None,
            "question_refined": None,
            "needs_clarification": False,
            "clarification_prompt": None,
            "query_embedding": None,
            "retrieved_contexts": None,
            "context_summary": None,
            "raw_answer": None,
            "answer_complete": False,
            "final_answer": None,
            "citations": None,
            "confidence": 0.0,
            "error": None,
        }

        # Run the QA graph
        result = await qa_graph.ainvoke(initial_state)

        # Handle clarification case
        if result.get("needs_clarification") and result.get("clarification_prompt"):
            return QAResponse(
                answer=result["clarification_prompt"],
                citations=[],
            )

        # Handle error case
        if result.get("error"):
            return QAResponse(
                answer=f"An error occurred while processing your question: {result['error']}",
                citations=[],
            )

        # Return formatted answer with citations
        return QAResponse(
            answer=result.get("final_answer") or result.get("raw_answer", "No answer generated."),
            citations=[
                Citation(
                    source=c.get("source", "Unknown"),
                    article=c.get("article", ""),
                    url=c.get("url"),
                )
                for c in (result.get("citations") or [])
            ],
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Q&A processing failed: {str(e)}",
        ) from e


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

    Uses a LangGraph workflow with:
    - Query analysis and classification
    - Context retrieval from vector store
    - Answer generation with RAG
    - Citation formatting
    """
    initial_state = {
        "question": request.question,
        "session_id": request.session_id,
        "mode": request.mode,
        # Initialize optional fields
        "query_type": None,
        "key_terms": None,
        "question_refined": None,
        "needs_clarification": False,
        "clarification_prompt": None,
        "query_embedding": None,
        "retrieved_contexts": None,
        "context_summary": None,
        "raw_answer": None,
        "answer_complete": False,
        "final_answer": None,
        "citations": None,
        "confidence": 0.0,
        "error": None,
    }

    try:
        result = await qa_graph.ainvoke(initial_state)

        # Handle clarification case
        if result.get("needs_clarification") and result.get("clarification_prompt"):
            return AnswerResponse(
                answer=result["clarification_prompt"],
                citations=[],
                confidence=0.0,
            )

        # Handle error case
        if result.get("error"):
            return AnswerResponse(
                answer=f"An error occurred while processing your question: {result['error']}",
                citations=[],
                confidence=0.0,
            )

        # Return formatted answer
        return AnswerResponse(
            answer=result.get("final_answer") or result.get("raw_answer", "No answer generated."),
            citations=[
                Citation(
                    source=c.get("source", "Unknown"),
                    article=c.get("article", ""),
                    url=c.get("url"),
                )
                for c in (result.get("citations") or [])
            ],
            confidence=result.get("confidence", 0.0),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Q&A processing failed: {str(e)}",
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
        # Run the classifier agent
        result = await classifier_agent.run(
            f"Analyze this case and identify applicable legal grounds:\n\n{request.case_description}"
        )

        processing_time = (time.time() - start_time) * 1000  # Convert to ms

        classification = result.data

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
            detail=f"Classification failed: {str(e)}",
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
            detail=f"Embedding generation failed: {str(e)}",
        ) from e


@app.post("/api/v1/search/semantic", response_model=SemanticSearchResponse)
async def semantic_search(request: SemanticSearchRequest):
    """Perform semantic vector search over indexed documents.

    This endpoint uses vector similarity to find the most relevant text chunks
    from the document embeddings store. Designed for RAG (Retrieval Augmented Generation).

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
    1. Generates embedding for the question
    2. Searches vector store for relevant legal context
    3. Augments prompt with retrieved context
    4. Generates grounded answer with citations

    Provides more accurate, citation-backed answers compared to basic Q&A.
    """
    try:
        # Step 1: Generate embedding for the question
        embedding_service = get_embedding_service()
        query_embedding = await embedding_service.generate_embedding(request.question)

        # Step 2: Search vector store for relevant context
        # TODO: Call backend VectorStoreService.similaritySearch(query_embedding)
        # For now, use mock context
        context_chunks = [
            "Polish Civil Code Article 118: The statute of limitations for claims is generally 10 years, unless specific provisions specify otherwise.",
            "Supreme Court ruling from 2023: In cases involving contractual disputes, the limitation period begins from the date the breach became known.",
        ]

        # Step 3: Build augmented prompt with retrieved context
        context_text = "\n\n".join([
            f"[Context {i+1}]: {chunk}"
            for i, chunk in enumerate(context_chunks)
        ])

        mode_instruction = (
            "detailed legal professional analysis with references to specific articles"
            if request.mode.upper() == "LAWYER"
            else "simplified explanation suitable for a layperson"
        )

        # In production, this would use a PydanticAI agent with the augmented prompt
        # For now, return a structured response
        augmented_answer = f"""Based on the relevant legal context retrieved, here's the answer to: "{request.question}"

**Legal Context Considered:**
{context_text}

**Answer:**
According to Polish law, the statute of limitations is governed by the Civil Code. Article 118 provides the general 10-year limitation period for most claims, though specific provisions may establish different periods.

The Supreme Court has clarified that the limitation period typically begins when the claim becomes legally enforceable, not necessarily when the underlying event occurred.

**Response Mode:** {request_mode_label(request.mode)}

*Note: This is a demonstration response. The production implementation will use PydanticAI with proper context augmentation.*
"""

        return AnswerResponse(
            answer=augmented_answer,
            citations=[
                Citation(
                    source="Polish Civil Code",
                    article="Art. 118",
                    url="https://isap.sejm.gov.pl/",
                ),
                Citation(
                    source="Supreme Court Ruling",
                    article="Case III CZP 45/23",
                    url="https://sn.pl/orzeczenia",
                ),
            ],
            confidence=0.87,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"RAG question answering failed: {str(e)}",
        ) from e


def request_mode_label(mode: str) -> str:
    """Get human-readable label for request mode."""
    return "detailed legal professional" if mode.upper() == "LAWYER" else "simplified layperson"
