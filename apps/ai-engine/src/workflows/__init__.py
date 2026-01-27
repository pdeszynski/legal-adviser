"""LangGraph workflows for multi-step AI scenarios.

This module provides StateGraph-based workflows that orchestrate
PydanticAI agents for complex legal AI scenarios.

Workflows:
- CaseAnalysisWorkflow: Classifier + Research + Clarification
- DocumentGenerationWorkflow: Drafter + Reviewer + Revision loop
- ComplexQAWorkflow: Researcher + Q&A + Citation formatter
"""

from .case_analysis_workflow import CaseAnalysisWorkflow, case_analysis_workflow
from .complex_qa_workflow import ComplexQAWorkflow, complex_qa_workflow
from .document_generation_workflow import (
    DocumentGenerationWorkflow,
    document_generation_workflow,
)
from .orchestration import WorkflowOrchestrator, WorkflowType, get_orchestrator
from .states import (
    CaseAnalysisState,
    ComplexQAState,
    DocumentGenerationState,
    WorkflowMetadata,
)

__all__ = [
    "CaseAnalysisState",
    "CaseAnalysisWorkflow",
    "ComplexQAState",
    "ComplexQAWorkflow",
    "DocumentGenerationState",
    "DocumentGenerationWorkflow",
    "WorkflowMetadata",
    "WorkflowOrchestrator",
    "WorkflowType",
    "case_analysis_workflow",
    "complex_qa_workflow",
    "document_generation_workflow",
    "get_orchestrator",
    "states",
]
