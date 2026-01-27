"""State schemas for LangGraph workflows.

This module defines TypedDict state schemas for each workflow.
LangGraph uses these states to pass data between nodes in the graph.
"""

from typing import Any, Required, TypedDict

from pydantic import BaseModel

# -----------------------------------------------------------------------------
# Pydantic Models for State Fields
# -----------------------------------------------------------------------------


class LegalGround(BaseModel):
    """A single legal ground identified in the case."""

    name: str
    description: str
    confidence_score: float
    legal_basis: list[str]
    notes: str | None = None


class RetrievedContext(BaseModel):
    """A retrieved context chunk from the vector store."""

    content: str
    source: str
    article: str | None = None
    similarity: float
    url: str | None = None


class LegalCitation(BaseModel):
    """A legal citation reference."""

    source: str
    article: str
    url: str | None = None


class ClarificationQuestion(BaseModel):
    """A single clarification question."""

    question: str
    question_type: str
    options: list[str] | None = None
    hint: str | None = None


class RevisionFeedback(BaseModel):
    """Feedback for document revision."""

    approved: bool
    issues: list[str]
    suggestions: list[str]
    needs_revision: bool


class WorkflowMetadata(BaseModel):
    """Metadata for workflow execution tracking."""

    session_id: str
    user_id: str | None = None
    start_time: float | None = None
    current_step: str = "init"
    iteration_count: int = 0


# -----------------------------------------------------------------------------
# Workflow State Schemas (TypedDict for LangGraph)
# -----------------------------------------------------------------------------


class CaseAnalysisState(TypedDict, total=False):
    """State for Case Analysis Workflow.

    This workflow combines:
    - Classifier Agent: Identify legal grounds
    - Research Agent: Find relevant case law and statutes
    - Clarification Agent: Gather missing information

    Flow:
    1. classify: Analyze case description
    2. check_clarification: Decide if more info needed
    3. research: Find relevant legal context (if enough info)
    4. clarify: Generate follow-up questions (if needed)
    5. complete: Finalize with results
    """

    # Input
    case_description: Required[str]

    # Classification results
    legal_grounds: list[dict[str, Any]]  # List[LegalGround.model_dump()]
    classification_confidence: float

    # Research results
    retrieved_contexts: list[dict[str, Any]]  # List[RetrievedContext.model_dump()]
    research_summary: str | None

    # Clarification
    needs_clarification: bool
    clarification_questions: list[dict[str, Any]]  # List[ClarificationQuestion.model_dump()]
    user_responses: dict[str, str]  # User answers to clarification questions

    # Final output
    final_analysis: str | None
    recommendations: str | None

    # Workflow control
    metadata: dict[str, Any]  # WorkflowMetadata.model_dump()
    next_step: str  # For conditional routing
    error: str | None


class DocumentGenerationState(TypedDict, total=False):
    """State for Document Generation Workflow.

    This workflow combines:
    - Drafter Agent: Generate initial document
    - Reviewer Agent: Review and provide feedback
    - Revision loop: Iterate until approval

    Flow:
    1. classify_case: Understand legal grounds first
    2. draft: Generate initial document
    3. review: Review quality and completeness
    4. check_approval: Decide if revision needed
    5. revise: Generate revised version (loop back to review)
    6. complete: Finalize approved document
    """

    # Input
    document_type: Required[str]
    description: Required[str]
    context: dict[str, Any]  # Additional context variables

    # Classification (for better drafting)
    legal_grounds: list[dict[str, Any]] | None

    # Drafting
    current_draft: str | None
    draft_iteration: int

    # Review
    review_feedback: dict[str, Any]  # RevisionFeedback.model_dump()
    approved: bool

    # Final output
    final_document: str | None

    # Workflow control
    metadata: dict[str, Any]  # WorkflowMetadata.model_dump()
    max_iterations: int
    next_step: str
    error: str | None


class ComplexQAState(TypedDict, total=False):
    """State for Complex Q&A Workflow.

    This workflow combines:
    - Researcher Agent: Deep legal research
    - Q&A Agent: Generate comprehensive answer
    - Citation Formatter: Format and validate citations

    Flow:
    1. analyze_query: Understand the question
    2. check_clarification: Decide if more info needed
    3. research: Deep legal research (statutes, case law, commentary)
    4. generate_answer: Create comprehensive response
    5. format_citations: Ensure proper citation format
    6. complete: Finalize with formatted output
    """

    # Input
    question: Required[str]
    mode: str  # "LAWYER" or "SIMPLE"
    query_type: str  # Auto-detected

    # Analysis
    key_terms: list[str]
    question_refined: str

    # Clarification
    needs_clarification: bool
    clarification_questions: list[dict[str, Any]]
    user_responses: dict[str, str] | None

    # Research
    retrieved_contexts: list[dict[str, Any]]
    statute_references: list[dict[str, Any]]
    case_law_references: list[dict[str, Any]]

    # Answer generation
    answer: str | None
    raw_citations: list[dict[str, Any]]  # Before formatting

    # Citation formatting
    formatted_citations: list[dict[str, Any]]

    # Final output
    final_answer: str | None
    confidence: float

    # Workflow control
    metadata: dict[str, Any]  # WorkflowMetadata.model_dump()
    next_step: str
    error: str | None


# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------


def create_case_analysis_state(
    case_description: str,
    session_id: str,
    user_id: str | None = None,
) -> CaseAnalysisState:
    """Create initial state for Case Analysis workflow."""
    return {
        "case_description": case_description,
        "metadata": WorkflowMetadata(
            session_id=session_id,
            user_id=user_id,
            current_step="classify",
            iteration_count=0,
        ).model_dump(),
        "next_step": "classify",
        "needs_clarification": False,
        "legal_grounds": [],
        "retrieved_contexts": [],
        "clarification_questions": [],
        "user_responses": {},
    }


def create_document_generation_state(
    document_type: str,
    description: str,
    context: dict[str, Any] | None = None,
    session_id: str = "default",
    user_id: str | None = None,
) -> DocumentGenerationState:
    """Create initial state for Document Generation workflow."""
    return {
        "document_type": document_type,
        "description": description,
        "context": context or {},
        "metadata": WorkflowMetadata(
            session_id=session_id,
            user_id=user_id,
            current_step="classify_case",
            iteration_count=0,
        ).model_dump(),
        "next_step": "classify_case",
        "draft_iteration": 0,
        "approved": False,
        "max_iterations": 3,
    }


def create_complex_qa_state(
    question: str,
    mode: str = "SIMPLE",
    session_id: str = "default",
    user_id: str | None = None,
) -> ComplexQAState:
    """Create initial state for Complex Q&A workflow."""
    return {
        "question": question,
        "mode": mode,
        "query_type": "general",
        "metadata": WorkflowMetadata(
            session_id=session_id,
            user_id=user_id,
            current_step="analyze_query",
            iteration_count=0,
        ).model_dump(),
        "next_step": "analyze_query",
        "needs_clarification": False,
        "retrieved_contexts": [],
        "statute_references": [],
        "case_law_references": [],
        "raw_citations": [],
        "formatted_citations": [],
        "key_terms": [],
    }
