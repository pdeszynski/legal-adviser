"""Workflow orchestration service.

This module provides a unified interface for executing all LangGraph workflows.
It handles workflow selection, state management, and error recovery.
"""

from enum import Enum
from typing import Any

from .case_analysis_workflow import case_analysis_workflow
from .complex_qa_workflow import complex_qa_workflow
from .document_generation_workflow import (
    document_generation_workflow,
)


class WorkflowType(str, Enum):
    """Available workflow types."""

    CASE_ANALYSIS = "case_analysis"
    DOCUMENT_GENERATION = "document_generation"
    COMPLEX_QA = "complex_qa"


class WorkflowOrchestrator:
    """Central orchestrator for all LangGraph workflows.

    This class provides a unified interface for:
    - Selecting the appropriate workflow
    - Executing workflows with proper configuration
    - Handling errors and retries
    - Collecting telemetry
    """

    def __init__(self) -> None:
        """Initialize the orchestrator with all workflow instances."""
        self.case_analysis = case_analysis_workflow()
        self.document_generation = document_generation_workflow()
        self.complex_qa = complex_qa_workflow()

    async def run_case_analysis(
        self,
        case_description: str,
        session_id: str = "default",
        user_id: str | None = None,
        user_responses: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        """Run the Case Analysis workflow.

        Args:
            case_description: The case description to analyze
            session_id: Session ID for tracking
            user_id: User ID for observability
            user_responses: Optional pre-filled clarification responses

        Returns:
            Dictionary with analysis results including:
            - legal_grounds: List of identified legal grounds
            - classification_confidence: Overall confidence score
            - retrieved_contexts: Relevant legal contexts
            - clarification_questions: Questions if clarification needed
            - final_analysis: Comprehensive analysis report
            - recommendations: Action recommendations
        """
        return await self.case_analysis.run(
            case_description=case_description,
            session_id=session_id,
            user_id=user_id,
            user_responses=user_responses,
        )

    async def run_document_generation(
        self,
        document_type: str,
        description: str,
        context: dict[str, Any] | None = None,
        session_id: str = "default",
        user_id: str | None = None,
        max_iterations: int = 3,
    ) -> dict[str, Any]:
        """Run the Document Generation workflow.

        Args:
            document_type: Type of document to generate
            description: Description of document content
            context: Additional context variables
            session_id: Session ID for tracking
            user_id: User ID for observability
            max_iterations: Maximum revision iterations

        Returns:
            Dictionary with generation results including:
            - final_document: The generated document content
            - draft_iteration: Number of iterations performed
            - approved: Whether document was approved
            - review_feedback: Feedback from review process
            - legal_grounds: Legal grounds identified for drafting
        """
        return await self.document_generation.run(
            document_type=document_type,
            description=description,
            context=context,
            session_id=session_id,
            user_id=user_id,
            max_iterations=max_iterations,
        )

    async def run_complex_qa(
        self,
        question: str,
        mode: str = "SIMPLE",
        session_id: str = "default",
        user_id: str | None = None,
        user_responses: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        """Run the Complex Q&A workflow.

        Args:
            question: The legal question to answer
            mode: Response mode ("LAWYER" or "SIMPLE")
            session_id: Session ID for tracking
            user_id: User ID for observability
            user_responses: Optional pre-filled clarification responses

        Returns:
            Dictionary with Q&A results including:
            - answer: The comprehensive answer
            - citations: Formatted legal citations
            - confidence: Answer confidence score
            - query_type: Detected query type
            - key_terms: Key legal terms extracted
            - clarification_questions: Questions if clarification needed
        """
        return await self.complex_qa.run(
            question=question,
            mode=mode,
            session_id=session_id,
            user_id=user_id,
            user_responses=user_responses,
        )

    async def run_workflow(
        self,
        workflow_type: WorkflowType | str,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Run a workflow by type.

        This is a generic entry point that routes to the appropriate
        workflow based on the workflow_type parameter.

        Args:
            workflow_type: The workflow to execute
            **kwargs: Workflow-specific parameters

        Returns:
            Dictionary with workflow results

        Raises:
            ValueError: If workflow_type is not recognized
        """
        workflow = WorkflowType(workflow_type)

        match workflow:
            case WorkflowType.CASE_ANALYSIS:
                return await self.run_case_analysis(**kwargs)
            case WorkflowType.DOCUMENT_GENERATION:
                return await self.run_document_generation(**kwargs)
            case WorkflowType.COMPLEX_QA:
                return await self.run_complex_qa(**kwargs)
            case _:
                raise ValueError(f"Unknown workflow type: {workflow_type}")


# Singleton instance
_orchestrator: WorkflowOrchestrator | None = None


def get_orchestrator() -> WorkflowOrchestrator:
    """Get the singleton WorkflowOrchestrator instance."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = WorkflowOrchestrator()
    return _orchestrator
