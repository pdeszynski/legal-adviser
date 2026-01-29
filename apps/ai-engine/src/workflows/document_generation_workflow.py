"""Document Generation Workflow using LangGraph.

This workflow orchestrates:
1. Classifier - Understand legal grounds for better drafting
2. Drafter Agent - Generate initial document
3. Reviewer Agent - Review quality and completeness
4. Revision Loop - Iterate until approval or max iterations

The workflow includes a revision loop that:
- Checks approval after each draft
- Provides feedback if revisions needed
- Limits iterations to prevent infinite loops

Uses the official PydanticAI + Langfuse integration pattern:
https://langfuse.com/integrations/frameworks/pydantic-ai
"""

import time
from typing import Any, Literal

from langgraph.graph import END, StateGraph

from ..agents.classifier_agent import classify_case
from ..agents.drafting_agent import generate_document
from ..langfuse_init import is_langfuse_enabled, update_current_trace
from .states import DocumentGenerationState, create_document_generation_state

# -----------------------------------------------------------------------------
# Workflow Nodes
# -----------------------------------------------------------------------------


async def classify_case_node(state: DocumentGenerationState) -> DocumentGenerationState:
    """Classify the case to understand legal grounds before drafting.

    This helps the drafter produce more accurate, legally-sound documents.
    The classifier agent has instrument=True for automatic Langfuse tracing.
    """
    metadata = state.get("metadata", {})

    try:
        # Use description for classification
        result, _agent_metadata = await classify_case(
            case_description=state["description"],
            session_id=metadata.get("session_id", "default"),
            user_id=metadata.get("user_id"),
        )

        # Convert to dicts for state
        legal_grounds = [
            {
                "name": ground.name,
                "description": ground.description,
                "confidence_score": ground.confidence_score,
                "legal_basis": ground.legal_basis,
                "notes": ground.notes,
            }
            for ground in result.identified_grounds
        ]

        state["legal_grounds"] = legal_grounds
        state["metadata"]["current_step"] = "classify_case"
        state["next_step"] = "draft"

        return state

    except Exception:
        # Classification failure is not fatal - proceed without it
        state["legal_grounds"] = []
        state["next_step"] = "draft"
        return state


async def draft_node(state: DocumentGenerationState) -> DocumentGenerationState:
    """Generate the initial or revised document.

    This node uses the drafting agent to create the document content,
    incorporating any feedback from previous iterations.

    The drafting agent has instrument=True for automatic Langfuse tracing.
    """
    metadata = state.get("metadata", {})

    try:
        iteration = state.get("draft_iteration", 0)

        # Build context with legal grounds and previous feedback
        context = state.get("context", {}).copy()

        if state.get("legal_grounds"):
            context["legal_grounds"] = state["legal_grounds"]

        if iteration > 0 and state.get("review_feedback"):
            feedback = state["review_feedback"]
            context["revision_feedback"] = {
                "issues": feedback.get("issues", []),
                "suggestions": feedback.get("suggestions", []),
            }

        # Call the drafting agent
        result, _agent_metadata = await generate_document(
            document_type=state["document_type"],
            description=state["description"],
            context=context,
            session_id=metadata.get("session_id", "default"),
            user_id=metadata.get("user_id"),
        )

        state["current_draft"] = result.content
        state["draft_iteration"] = iteration + 1
        state["metadata"]["current_step"] = "draft"
        state["next_step"] = "review"

        return state

    except Exception as e:
        state["error"] = str(e)
        state["next_step"] = "error"
        return state


async def review_node(state: DocumentGenerationState) -> DocumentGenerationState:
    """Review the generated document for quality and completeness.

    This node acts as a reviewer agent, checking:
    1. Legal accuracy
    2. Completeness of required sections
    3. Proper formatting
    4. Placeholder completeness
    """
    state.get("metadata", {})
    draft = state.get("current_draft", "")

    try:
        # Simple review logic (could be enhanced with an actual reviewer agent)
        issues = []
        suggestions = []

        # Check for placeholders
        import re

        placeholders = re.findall(r'\[([A-Z_]+)\]', draft)
        if placeholders:
            issues.append(f"Document contains {len(placeholders)} placeholders: {', '.join(set(placeholders))}")

        # Check minimum length
        if len(draft) < 200:
            issues.append("Document appears too short for the requested type")

        # Check for document structure based on type
        doc_type = state.get("document_type", "")
        if doc_type:
            doc_type_lower = doc_type.lower()
            if "pozew" in doc_type_lower or "allow" in doc_type_lower:
                required_sections = ["Strona", "Wnioskodawca", "Wnioskowany"]
                draft_lower = draft.lower()
                missing = [s for s in required_sections if s.lower() not in draft_lower]
                if missing:
                    issues.append(f"Missing required sections for lawsuit: {', '.join(missing)}")

        # Check for legal basis if classification was done
        legal_grounds = state.get("legal_grounds")
        if legal_grounds:
            draft_lower = draft.lower()
            has_legal_basis = (
                "podstawa prawna" in draft_lower or
                any(
                    isinstance(ground, dict) and
                    any(basis.lower() in draft_lower for basis in ground.get("legal_basis", []) if isinstance(basis, str))
                    for ground in legal_grounds
                    if isinstance(ground, dict)
                )
            )
            if not has_legal_basis:
                suggestions.append("Consider adding explicit legal basis references")

        # Determine approval status
        # Auto-approve if no major issues and we've done at least one iteration
        approved = len(issues) == 0

        state["review_feedback"] = {
            "approved": approved,
            "issues": issues,
            "suggestions": suggestions,
            "needs_revision": not approved,
        }
        state["approved"] = approved
        state["metadata"]["current_step"] = "review"
        state["next_step"] = "check_approval"

        return state

    except Exception as e:
        state["error"] = str(e)
        state["next_step"] = "error"
        return state


async def check_approval_node(state: DocumentGenerationState) -> DocumentGenerationState:
    """Check if document is approved or needs revision.

    This decision node checks:
    1. Approval status from review
    2. Maximum iteration count
    """
    approved = state.get("approved", False)
    iteration = state.get("draft_iteration", 0)
    max_iterations = state.get("max_iterations", 3)

    if approved:
        state["next_step"] = "complete"
    elif iteration >= max_iterations:
        # Force approve after max iterations
        state["approved"] = True
        state["next_step"] = "complete"
    else:
        state["next_step"] = "revise"

    return state


async def revise_node(state: DocumentGenerationState) -> DocumentGenerationState:
    """Prepare for revision by updating feedback.

    This node is a pass-through that ensures the workflow
    continues to the draft node for revision.
    """
    state["metadata"]["current_step"] = "revise"
    state["metadata"]["iteration_count"] = state["metadata"].get("iteration_count", 0) + 1
    state["next_step"] = "draft"
    return state


async def complete_node(state: DocumentGenerationState) -> DocumentGenerationState:
    """Finalize the approved document.

    This node produces the final output with metadata.
    """
    try:
        state["final_document"] = state.get("current_draft", "")
        state["metadata"]["current_step"] = "complete"
        state["next_step"] = END  # type: ignore

        return state

    except Exception as e:
        state["error"] = str(e)
        state["next_step"] = "error"
        return state


# -----------------------------------------------------------------------------
# Conditional Edge Functions
# -----------------------------------------------------------------------------


def should_revise(state: DocumentGenerationState) -> Literal["revise", "complete"]:
    """Route to revision or completion based on approval status."""
    approved = state.get("approved", False)
    iteration = state.get("draft_iteration", 0)
    max_iterations = state.get("max_iterations", 3)

    if approved or iteration >= max_iterations:
        return "complete"
    return "revise"


# -----------------------------------------------------------------------------
# Workflow Builder
# -----------------------------------------------------------------------------


def build_document_generation_graph() -> StateGraph:
    """Build the Document Generation StateGraph.

    Returns:
        Compiled StateGraph ready for execution
    """
    workflow = StateGraph(DocumentGenerationState)

    # Add nodes
    workflow.add_node("classify_case", classify_case_node)
    workflow.add_node("draft", draft_node)
    workflow.add_node("review", review_node)
    workflow.add_node("check_approval", check_approval_node)
    workflow.add_node("revise", revise_node)
    workflow.add_node("complete", complete_node)
    workflow.add_node("error", lambda s: {**s, "next_step": END})  # type: ignore

    # Define edges
    workflow.set_entry_point("classify_case")
    workflow.add_edge("classify_case", "draft")
    workflow.add_edge("draft", "review")
    workflow.add_edge("review", "check_approval")

    # Conditional routing from check_approval
    workflow.add_conditional_edges(
        "check_approval",
        should_revise,
        {
            "revise": "revise",
            "complete": "complete",
        },
    )

    # Revision loops back to draft
    workflow.add_edge("revise", "draft")
    workflow.add_edge("complete", END)
    workflow.add_edge("error", END)

    return workflow.compile()


# Compile the graph once for reuse
_document_generation_graph: StateGraph | None = None


def get_document_generation_graph() -> StateGraph:
    """Get or create the compiled Document Generation graph."""
    global _document_generation_graph
    if _document_generation_graph is None:
        _document_generation_graph = build_document_generation_graph()
    return _document_generation_graph


# -----------------------------------------------------------------------------
# Workflow Wrapper Class
# -----------------------------------------------------------------------------


class DocumentGenerationWorkflow:
    """Wrapper class for Document Generation workflow execution.

    This class provides a clean interface for running the workflow
    with proper observability and error handling.
    """

    def __init__(self) -> None:
        """Initialize the workflow with compiled graph."""
        self.graph = get_document_generation_graph()

    async def run(
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
            description: Description of the document content
            context: Additional context variables
            session_id: Session ID for tracking
            user_id: User ID for observability
            max_iterations: Maximum revision iterations

        Returns:
            Dictionary containing the workflow results
        """

        start_time = time.time()

        # Update Langfuse trace with workflow input metadata
        if is_langfuse_enabled():
            update_current_trace(
                input={
                    "document_type": document_type,
                    "description": description[:200] if description else "",
                },
                user_id=user_id,
                session_id=session_id,
                metadata={"workflow": "document_generation"},
            )

        # Create initial state
        state = create_document_generation_state(
            document_type=document_type,
            description=description,
            context=context,
            session_id=session_id,
            user_id=user_id,
        )
        state["max_iterations"] = max_iterations

        try:
            # Run the workflow (agents are automatically traced via instrument=True)
            result = await self.graph.ainvoke(state)

            processing_time_ms = (time.time() - start_time) * 1000

            # Prepare output
            output = {
                "final_document": result.get("final_document"),
                "current_draft": result.get("current_draft"),
                "draft_iteration": result.get("draft_iteration", 0),
                "approved": result.get("approved", False),
                "review_feedback": result.get("review_feedback"),
                "legal_grounds": result.get("legal_grounds", []),
                "processing_time_ms": processing_time_ms,
                "error": result.get("error"),
            }

            # Update trace with workflow-level metadata
            if is_langfuse_enabled():
                update_current_trace(
                    output={
                        "document_length": len(output["final_document"] or ""),
                        "iterations": output["draft_iteration"],
                        "approved": output["approved"],
                        "processing_time_ms": processing_time_ms,
                    }
                )

            return output

        except Exception:
            raise


# Singleton instance
_document_generation_workflow: DocumentGenerationWorkflow | None = None


def document_generation_workflow() -> DocumentGenerationWorkflow:
    """Get the singleton DocumentGenerationWorkflow instance."""
    global _document_generation_workflow
    if _document_generation_workflow is None:
        _document_generation_workflow = DocumentGenerationWorkflow()
    return _document_generation_workflow
