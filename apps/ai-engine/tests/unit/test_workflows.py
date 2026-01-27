"""Unit tests for LangGraph workflows.

These tests verify:
- State schema creation
- Workflow graph compilation
- Conditional edge routing logic
- Orchestration service interface
"""

import pytest

from src.workflows.states import (
    CaseAnalysisState,
    ComplexQAState,
    DocumentGenerationState,
    WorkflowMetadata,
    create_case_analysis_state,
    create_complex_qa_state,
    create_document_generation_state,
    LegalGround,
    RetrievedContext,
    LegalCitation,
    ClarificationQuestion,
)
from src.workflows.case_analysis_workflow import (
    CaseAnalysisWorkflow,
    case_analysis_workflow,
    should_clarify,
    after_clarify,
)
from src.workflows.document_generation_workflow import (
    DocumentGenerationWorkflow,
    document_generation_workflow,
    should_revise,
)
from src.workflows.complex_qa_workflow import (
    ComplexQAWorkflow,
    complex_qa_workflow,
    should_clarify as qa_should_clarify,
)
from src.workflows.orchestration import (
    WorkflowOrchestrator,
    WorkflowType,
    get_orchestrator,
)


# -----------------------------------------------------------------------------
# Pydantic Model Tests
# -----------------------------------------------------------------------------


class TestLegalGround:
    """Tests for LegalGround model."""

    def test_create_legal_ground(self):
        """Test creating a valid LegalGround."""
        ground = LegalGround(
            name="Breach of Contract",
            description="The defendant failed to fulfill contractual obligations",
            confidence_score=0.85,
            legal_basis=["Art. 471 KC", "Art. 355 KC"],
            notes="Requires evidence of contract existence",
        )

        assert ground.name == "Breach of Contract"
        assert ground.confidence_score == 0.85
        assert len(ground.legal_basis) == 2


class TestRetrievedContext:
    """Tests for RetrievedContext model."""

    def test_create_retrieved_context(self):
        """Test creating a valid RetrievedContext."""
        context = RetrievedContext(
            content="Statute of limitations is 10 years",
            source="Polish Civil Code",
            article="Art. 118",
            similarity=0.92,
            url="https://isap.sejm.gov.pl/",
        )

        assert context.source == "Polish Civil Code"
        assert context.similarity == 0.92


class TestLegalCitation:
    """Tests for LegalCitation model."""

    def test_create_legal_citation(self):
        """Test creating a valid LegalCitation."""
        citation = LegalCitation(
            source="Supreme Court",
            article="III CZP 45/23",
            url="https://sn.pl/orzeczenia",
        )

        assert citation.source == "Supreme Court"
        assert citation.article == "III CZP 45/23"


class TestClarificationQuestion:
    """Tests for ClarificationQuestion model."""

    def test_create_clarification_question(self):
        """Test creating a valid ClarificationQuestion."""
        question = ClarificationQuestion(
            question="When did the breach occur?",
            question_type="timeline",
            options=["Less than 1 year ago", "1-3 years ago", "More than 3 years ago"],
            hint="Select the closest time range",
        )

        assert question.question_type == "timeline"
        assert len(question.options) == 3


class TestWorkflowMetadata:
    """Tests for WorkflowMetadata model."""

    def test_create_workflow_metadata(self):
        """Test creating valid WorkflowMetadata."""
        metadata = WorkflowMetadata(
            session_id="test-session",
            user_id="test-user",
            current_step="classify",
            iteration_count=1,
        )

        assert metadata.session_id == "test-session"
        assert metadata.current_step == "classify"
        assert metadata.iteration_count == 1


# -----------------------------------------------------------------------------
# State Creation Tests
# -----------------------------------------------------------------------------


class TestCaseAnalysisState:
    """Tests for CaseAnalysisState creation and manipulation."""

    def test_create_case_analysis_state(self):
        """Test creating initial CaseAnalysisState."""
        state = create_case_analysis_state(
            case_description="Employer fired me without notice",
            session_id="test-session",
            user_id="test-user",
        )

        assert state["case_description"] == "Employer fired me without notice"
        assert state["metadata"]["session_id"] == "test-session"
        assert state["metadata"]["user_id"] == "test-user"
        assert state["metadata"]["current_step"] == "classify"
        assert state["next_step"] == "classify"
        assert state["needs_clarification"] is False
        assert state["legal_grounds"] == []
        assert state["clarification_questions"] == []

    def test_case_analysis_state_with_legal_grounds(self):
        """Test updating state with legal grounds."""
        state = create_case_analysis_state(
            case_description="Test case",
            session_id="test",
        )

        ground = {
            "name": "Wrongful Termination",
            "description": "Employer violated labor law",
            "confidence_score": 0.8,
            "legal_basis": ["Art. 52 KP"],
            "notes": None,
        }

        state["legal_grounds"] = [ground]
        state["classification_confidence"] = 0.8

        assert len(state["legal_grounds"]) == 1
        assert state["legal_grounds"][0]["name"] == "Wrongful Termination"
        assert state["classification_confidence"] == 0.8


class TestDocumentGenerationState:
    """Tests for DocumentGenerationState creation and manipulation."""

    def test_create_document_generation_state(self):
        """Test creating initial DocumentGenerationState."""
        state = create_document_generation_state(
            document_type="lawsuit",
            description="Draft a lawsuit for unpaid wages",
            session_id="test-session",
        )

        assert state["document_type"] == "lawsuit"
        assert state["description"] == "Draft a lawsuit for unpaid wages"
        assert state["metadata"]["current_step"] == "classify_case"
        assert state["next_step"] == "classify_case"
        assert state["draft_iteration"] == 0
        assert state["approved"] is False
        assert state["max_iterations"] == 3

    def test_document_generation_state_with_context(self):
        """Test creating state with additional context."""
        context = {"employer": "ABC Corp", "amount": "50000 PLN"}

        state = create_document_generation_state(
            document_type="complaint",
            description="Test",
            context=context,
        )

        assert state["context"] == context
        assert state["context"]["employer"] == "ABC Corp"


class TestComplexQAState:
    """Tests for ComplexQAState creation and manipulation."""

    def test_create_complex_qa_state(self):
        """Test creating initial ComplexQAState."""
        state = create_complex_qa_state(
            question="What is the statute of limitations for contract disputes?",
            mode="LAWYER",
            session_id="test-session",
        )

        assert state["question"] == "What is the statute of limitations for contract disputes?"
        assert state["mode"] == "LAWYER"
        assert state["metadata"]["current_step"] == "analyze_query"
        assert state["next_step"] == "analyze_query"
        assert state["needs_clarification"] is False
        assert state["retrieved_contexts"] == []

    def test_complex_qa_state_default_mode(self):
        """Test creating state with default SIMPLE mode."""
        state = create_complex_qa_state(question="Test question")

        assert state["mode"] == "SIMPLE"


# -----------------------------------------------------------------------------
# Conditional Edge Tests
# -----------------------------------------------------------------------------


class TestCaseAnalysisConditionalEdges:
    """Tests for Case Analysis workflow conditional edges."""

    def test_should_clarify_with_low_confidence(self):
        """Test routing to clarification when confidence is low."""
        state: CaseAnalysisState = {
            "case_description": "Test",
            "classification_confidence": 0.5,
            "needs_clarification": True,
            "legal_grounds": [],
            "metadata": {"session_id": "test"},
            "next_step": "check",
        }

        result = should_clarify(state)
        assert result == "clarify"

    def test_should_clarify_with_high_confidence(self):
        """Test routing to research when confidence is high."""
        state: CaseAnalysisState = {
            "case_description": "Test",
            "classification_confidence": 0.85,
            "needs_clarification": False,
            "legal_grounds": [{"name": "Test"}],
            "metadata": {"session_id": "test"},
            "next_step": "check",
        }

        result = should_clarify(state)
        assert result == "research"

    def test_after_clarify_with_responses(self):
        """Test routing to research after user provides responses."""
        state: CaseAnalysisState = {
            "case_description": "Test",
            "user_responses": {"timeline": "2023", "amount": "10000"},
            "clarification_questions": [],
            "metadata": {"session_id": "test"},
            "next_step": "clarify",
        }

        result = after_clarify(state)
        assert result == "research"

    def test_after_clarify_without_responses(self):
        """Test routing to complete when no user responses."""
        state: CaseAnalysisState = {
            "case_description": "Test",
            "user_responses": {},
            "clarification_questions": [{"question": "When?"}],
            "metadata": {"session_id": "test"},
            "next_step": "clarify",
        }

        result = after_clarify(state)
        assert result == "complete"


class TestDocumentGenerationConditionalEdges:
    """Tests for Document Generation workflow conditional edges."""

    def test_should_revise_when_not_approved(self):
        """Test routing to revision when not approved."""
        state: DocumentGenerationState = {
            "document_type": "lawsuit",
            "description": "Test",
            "approved": False,
            "draft_iteration": 1,
            "max_iterations": 3,
            "metadata": {"session_id": "test"},
            "next_step": "check",
        }

        result = should_revise(state)
        assert result == "revise"

    def test_should_complete_when_approved(self):
        """Test routing to complete when approved."""
        state: DocumentGenerationState = {
            "document_type": "lawsuit",
            "description": "Test",
            "approved": True,
            "draft_iteration": 1,
            "max_iterations": 3,
            "metadata": {"session_id": "test"},
            "next_step": "check",
        }

        result = should_revise(state)
        assert result == "complete"

    def test_should_complete_at_max_iterations(self):
        """Test routing to complete when max iterations reached."""
        state: DocumentGenerationState = {
            "document_type": "lawsuit",
            "description": "Test",
            "approved": False,
            "draft_iteration": 3,
            "max_iterations": 3,
            "metadata": {"session_id": "test"},
            "next_step": "check",
        }

        result = should_revise(state)
        assert result == "complete"


class TestComplexQAConditionalEdges:
    """Tests for Complex Q&A workflow conditional edges."""

    def test_should_clarify_when_needed(self):
        """Test routing to clarification when needed."""
        state: ComplexQAState = {
            "question": "Test",
            "mode": "SIMPLE",
            "needs_clarification": True,
            "user_responses": None,
            "metadata": {"session_id": "test"},
            "next_step": "check",
        }

        result = qa_should_clarify(state)
        assert result == "clarify"

    def test_should_research_with_responses(self):
        """Test routing to research when user has provided responses."""
        state: ComplexQAState = {
            "question": "Test",
            "mode": "SIMPLE",
            "needs_clarification": True,
            "user_responses": {"timeline": "2023"},
            "metadata": {"session_id": "test"},
            "next_step": "check",
        }

        result = qa_should_clarify(state)
        assert result == "research"

    def test_should_research_no_clarification_needed(self):
        """Test routing to research when no clarification needed."""
        state: ComplexQAState = {
            "question": "Test",
            "mode": "SIMPLE",
            "needs_clarification": False,
            "user_responses": None,
            "metadata": {"session_id": "test"},
            "next_step": "check",
        }

        result = qa_should_clarify(state)
        assert result == "research"


# -----------------------------------------------------------------------------
# Workflow Class Tests
# -----------------------------------------------------------------------------


class TestCaseAnalysisWorkflowClass:
    """Tests for CaseAnalysisWorkflow class."""

    def test_workflow_initialization(self):
        """Test that workflow can be initialized."""
        workflow = CaseAnalysisWorkflow()
        assert workflow.graph is not None

    def test_singleton_pattern(self):
        """Test that singleton returns same instance."""
        workflow1 = case_analysis_workflow()
        workflow2 = case_analysis_workflow()
        assert workflow1 is workflow2


class TestDocumentGenerationWorkflowClass:
    """Tests for DocumentGenerationWorkflow class."""

    def test_workflow_initialization(self):
        """Test that workflow can be initialized."""
        workflow = DocumentGenerationWorkflow()
        assert workflow.graph is not None

    def test_singleton_pattern(self):
        """Test that singleton returns same instance."""
        workflow1 = document_generation_workflow()
        workflow2 = document_generation_workflow()
        assert workflow1 is workflow2


class TestComplexQAWorkflowClass:
    """Tests for ComplexQAWorkflow class."""

    def test_workflow_initialization(self):
        """Test that workflow can be initialized."""
        workflow = ComplexQAWorkflow()
        assert workflow.graph is not None

    def test_singleton_pattern(self):
        """Test that singleton returns same instance."""
        workflow1 = complex_qa_workflow()
        workflow2 = complex_qa_workflow()
        assert workflow1 is workflow2


# -----------------------------------------------------------------------------
# Orchestration Tests
# -----------------------------------------------------------------------------


class TestWorkflowOrchestrator:
    """Tests for WorkflowOrchestrator."""

    def test_orchestrator_initialization(self):
        """Test that orchestrator initializes all workflows."""
        orchestrator = WorkflowOrchestrator()
        assert orchestrator.case_analysis is not None
        assert orchestrator.document_generation is not None
        assert orchestrator.complex_qa is not None

    def test_singleton_pattern(self):
        """Test that singleton returns same instance."""
        orchestrator1 = get_orchestrator()
        orchestrator2 = get_orchestrator()
        assert orchestrator1 is orchestrator2

    def test_workflow_type_enum(self):
        """Test WorkflowType enum values."""
        assert WorkflowType.CASE_ANALYSIS == "case_analysis"
        assert WorkflowType.DOCUMENT_GENERATION == "document_generation"
        assert WorkflowType.COMPLEX_QA == "complex_qa"

    def test_workflow_type_from_string(self):
        """Test creating WorkflowType from string."""
        workflow_type = WorkflowType("case_analysis")
        assert workflow_type == WorkflowType.CASE_ANALYSIS

    def test_run_workflow_invalid_type(self):
        """Test that invalid workflow type raises error."""
        orchestrator = WorkflowOrchestrator()

        with pytest.raises(ValueError):
            import asyncio

            asyncio.run(orchestrator.run_workflow("invalid_workflow"))
