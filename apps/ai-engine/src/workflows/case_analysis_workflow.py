"""Case Analysis Workflow using LangGraph.

This workflow orchestrates:
1. Classifier Agent - Identify legal grounds
2. Research Node - Find relevant context
3. Clarification Agent - Gather missing information
4. Decision Logic - Route based on completeness

The workflow uses conditional edges to decide:
- If clarification needed -> clarify branch
- If enough info -> research branch
- Always completes with final analysis

Enhanced with structured error handling and Langfuse tracking.
Uses the official PydanticAI + Langfuse integration pattern:
https://langfuse.com/integrations/frameworks/pydantic-ai
"""

import time
from typing import Any, Literal

from langgraph.graph import END, StateGraph

from ..agents.clarification_agent import clarification_agent
from ..agents.classifier_agent import classify_case
from ..error_handling import build_error_response
from ..exceptions import WorkflowExecutionError
from ..langfuse_init import is_langfuse_enabled, update_current_trace
from .states import CaseAnalysisState, create_case_analysis_state

# -----------------------------------------------------------------------------
# Workflow Nodes
# -----------------------------------------------------------------------------


async def classify_node(state: CaseAnalysisState) -> CaseAnalysisState:
    """Classify the case to identify legal grounds.

    This node uses the classifier agent to analyze the case description
    and identify applicable legal grounds with confidence scores.

    The classifier agent has instrument=True for automatic Langfuse tracing.
    """

    metadata = state.get("metadata", {})

    try:
        case_description = state["case_description"]

        # Call the classifier agent (automatically traced via instrument=True)
        result, _agent_metadata = await classify_case(
            case_description=case_description,
            session_id=metadata.get("session_id", "default"),
            user_id=metadata.get("user_id"),
        )

        # Convert LegalGround objects to dicts for state
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

        # Update state
        state["legal_grounds"] = legal_grounds
        state["classification_confidence"] = result.overall_confidence
        state["metadata"]["current_step"] = "classify"
        state["metadata"]["iteration_count"] = state["metadata"].get("iteration_count", 0) + 1
        state["next_step"] = "check_clarification"

        return state

    except Exception as e:
        # Convert to structured error
        if not isinstance(e, WorkflowExecutionError):
            e = WorkflowExecutionError(
                workflow="case_analysis",
                step="classify",
                reason=str(e),
            )

        state["error"] = build_error_response(e, include_details=True)
        state["next_step"] = "error"
        return state


async def check_clarification_node(state: CaseAnalysisState) -> CaseAnalysisState:
    """Determine if clarification is needed based on classification.

    This decision node checks:
    1. Low confidence score (< 0.6) -> needs clarification
    2. No legal grounds identified -> needs clarification
    3. Otherwise -> proceed to research
    """
    confidence = state.get("classification_confidence", 0.0)
    grounds = state.get("legal_grounds", [])
    user_responses = state.get("user_responses", {})

    # If we already have user responses, skip clarification
    if user_responses:
        state["needs_clarification"] = False
        state["next_step"] = "research"
        return state

    # Decision logic for clarification
    needs_clarification = (
        confidence < 0.6  # Low confidence
        or len(grounds) == 0  # No grounds identified
        or any(g.get("confidence_score", 0) < 0.5 for g in grounds)  # Any low-confidence ground
    )

    state["needs_clarification"] = needs_clarification

    if needs_clarification:
        state["next_step"] = "clarify"
    else:
        state["next_step"] = "research"

    return state


async def clarify_node(state: CaseAnalysisState) -> CaseAnalysisState:
    """Generate clarification questions using the clarification agent.

    This node uses the clarification agent to generate targeted
    follow-up questions based on the classification results.

    The clarification agent has instrument=True for automatic Langfuse tracing.
    """
    metadata = state.get("metadata", {})

    try:
        agent = clarification_agent()

        # Build prompt with classification context
        grounds_summary = "\n".join([
            f"- {g.get('name', 'Unknown')}: {g.get('description', '')}"
            for g in state.get("legal_grounds", [])
        ])

        prompt = f"""Based on the following case analysis, generate clarification questions
to gather more information and improve confidence.

Case Description: {state['case_description']}

Identified Legal Grounds:
{grounds_summary}

Confidence: {state.get('classification_confidence', 0.0):.2f}

Generate 2-4 specific questions to improve the analysis."""

        result = await agent.run(prompt)
        response = result.output

        # Convert questions to dicts
        questions = [
            {
                "question": q.question,
                "question_type": q.question_type,
                "options": q.options,
                "hint": q.hint,
            }
            for q in response.questions
        ]

        state["clarification_questions"] = questions
        state["metadata"]["current_step"] = "clarify"
        state["next_step"] = "await_clarification"  # Pause for user input

        return state

    except Exception as e:
        # Convert to structured error
        if not isinstance(e, WorkflowExecutionError):
            e = WorkflowExecutionError(
                workflow="case_analysis",
                step="clarify",
                reason=str(e),
            )

        state["error"] = build_error_response(e, include_details=True)
        state["next_step"] = "error"
        return state


async def research_node(state: CaseAnalysisState) -> CaseAnalysisState:
    """Research legal context based on classification.

    This node retrieves relevant legal context from the vector store
    based on the identified legal grounds.
    """
    try:
        # TODO: Integrate with actual vector store service
        # For now, mock retrieval
        mock_contexts = [
            {
                "content": "Polish Civil Code Article 471: The debtor is liable for non-performance or improper performance of an obligation, unless it is caused by circumstances beyond their control.",
                "source": "Polish Civil Code",
                "article": "Art. 471 KC",
                "similarity": 0.89,
                "url": "https://isap.sejm.gov.pl/",
            },
            {
                "content": "Supreme Court ruling: In contractual disputes, the limitation period is 10 years from the date the breach became known.",
                "source": "Supreme Court",
                "article": "III CZP 45/23",
                "similarity": 0.82,
                "url": "https://sn.pl/orzeczenia",
            },
        ]

        state["retrieved_contexts"] = mock_contexts
        state["research_summary"] = f"Retrieved {len(mock_contexts)} relevant legal contexts."
        state["metadata"]["current_step"] = "research"
        state["next_step"] = "complete"

        return state

    except Exception as e:
        # Convert to structured error
        if not isinstance(e, WorkflowExecutionError):
            e = WorkflowExecutionError(
                workflow="case_analysis",
                step="research",
                reason=str(e),
            )

        state["error"] = build_error_response(e, include_details=True)
        state["next_step"] = "error"
        return state


async def complete_node(state: CaseAnalysisState) -> CaseAnalysisState:
    """Generate final analysis combining all results.

    This node produces the final output with:
    - Legal grounds analysis
    - Research findings
    - Recommendations
    """
    try:
        grounds = state.get("legal_grounds", [])
        contexts = state.get("retrieved_contexts", [])

        # Build final analysis
        analysis_parts = [
            "# Case Analysis Report\n",
            "## Identified Legal Grounds\n",
        ]

        # Add legal grounds
        analysis_parts.extend([
            f"### {ground.get('name', 'Unknown')}\n"
            f"**Confidence**: {ground.get('confidence_score', 0):.2f}\n\n"
            f"{ground.get('description', '')}\n\n"
            f"**Legal Basis**: {', '.join(ground.get('legal_basis', []))}\n"
            for ground in grounds
        ])

        if contexts:
            analysis_parts.append("\n## Relevant Legal Context\n")
            analysis_parts.extend([
                f"- **{ctx.get('source', 'Unknown')} - {ctx.get('article', 'N/A')}**: "
                f"{ctx.get('content', '')[:200]}...\n"
                for ctx in contexts
            ])

        # Generate recommendations based on confidence
        confidence = state.get("classification_confidence", 0.0)
        if confidence >= 0.8:
            recommendations = "Strong case basis. Proceed with formal legal action preparation."
        elif confidence >= 0.6:
            recommendations = "Moderate case basis. Additional documentation recommended."
        else:
            recommendations = "Limited case basis. Comprehensive fact-finding required before proceeding."

        analysis_parts.append(f"\n## Recommendations\n\n{recommendations}")

        state["final_analysis"] = "".join(analysis_parts)
        state["recommendations"] = recommendations
        state["metadata"]["current_step"] = "complete"
        state["next_step"] = END  # type: ignore

        return state

    except Exception as e:
        # Convert to structured error
        if not isinstance(e, WorkflowExecutionError):
            e = WorkflowExecutionError(
                workflow="case_analysis",
                step="complete",
                reason=str(e),
            )

        state["error"] = build_error_response(e, include_details=True)
        state["next_step"] = "error"
        return state


# -----------------------------------------------------------------------------
# Conditional Edge Functions
# -----------------------------------------------------------------------------


def should_clarify(state: CaseAnalysisState) -> Literal["clarify", "research"]:
    """Route to clarification or research based on needs_clarification flag."""
    if state.get("needs_clarification", False):
        return "clarify"
    return "research"


def after_clarify(state: CaseAnalysisState) -> Literal["research", "complete"]:
    """After clarification, decide whether to research or complete directly."""
    # If user provided responses, go to research
    if state.get("user_responses"):
        return "research"
    # Otherwise, complete with current info (user will provide responses later)
    return "complete"


# -----------------------------------------------------------------------------
# Workflow Builder
# -----------------------------------------------------------------------------


def build_case_analysis_graph() -> StateGraph:
    """Build the Case Analysis StateGraph.

    Returns:
        Compiled StateGraph ready for execution
    """
    # Create the graph with state schema
    workflow = StateGraph(CaseAnalysisState)

    # Add nodes
    workflow.add_node("classify", classify_node)
    workflow.add_node("check_clarification", check_clarification_node)
    workflow.add_node("clarify", clarify_node)
    workflow.add_node("research", research_node)
    workflow.add_node("complete", complete_node)
    workflow.add_node("error", lambda s: {**s, "next_step": END})  # type: ignore

    # Define edges
    workflow.set_entry_point("classify")
    workflow.add_edge("classify", "check_clarification")

    # Conditional routing from check_clarification
    workflow.add_conditional_edges(
        "check_clarification",
        should_clarify,
        {
            "clarify": "clarify",
            "research": "research",
        },
    )

    # After clarification, either research or complete
    workflow.add_conditional_edges(
        "clarify",
        after_clarify,
        {
            "research": "research",
            "complete": "complete",
        },
    )

    workflow.add_edge("research", "complete")
    workflow.add_edge("complete", END)
    workflow.add_edge("error", END)

    return workflow.compile()


# Compile the graph once for reuse
_case_analysis_graph: StateGraph | None = None


def get_case_analysis_graph() -> StateGraph:
    """Get or create the compiled Case Analysis graph."""
    global _case_analysis_graph
    if _case_analysis_graph is None:
        _case_analysis_graph = build_case_analysis_graph()
    return _case_analysis_graph


# -----------------------------------------------------------------------------
# Workflow Wrapper Class
# -----------------------------------------------------------------------------


class CaseAnalysisWorkflow:
    """Wrapper class for Case Analysis workflow execution.

    This class provides a clean interface for running the workflow
    with proper observability and error handling.

    Uses the official PydanticAI + Langfuse integration pattern.
    """

    def __init__(self) -> None:
        """Initialize the workflow with compiled graph."""
        self.graph = get_case_analysis_graph()

    async def run(
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
            user_responses: Optional pre-filled responses to clarification questions

        Returns:
            Dictionary containing the workflow results
        """

        start_time = time.time()

        # Create initial state
        state = create_case_analysis_state(
            case_description=case_description,
            session_id=session_id,
            user_id=user_id,
        )

        # Add user responses if provided
        if user_responses:
            state["user_responses"] = user_responses

        try:
            # Run the workflow (agents are automatically traced via instrument=True)
            result = await self.graph.ainvoke(state)

            processing_time_ms = (time.time() - start_time) * 1000

            # Prepare output
            output = {
                "legal_grounds": result.get("legal_grounds", []),
                "classification_confidence": result.get("classification_confidence", 0.0),
                "retrieved_contexts": result.get("retrieved_contexts", []),
                "clarification_questions": result.get("clarification_questions", []),
                "final_analysis": result.get("final_analysis"),
                "recommendations": result.get("recommendations"),
                "needs_clarification": result.get("needs_clarification", False),
                "processing_time_ms": processing_time_ms,
                "error": result.get("error"),
            }

            # Update trace with workflow-level metadata
            if is_langfuse_enabled():
                update_current_trace(
                    output={
                        "grounds_count": len(output["legal_grounds"]),
                        "confidence": output["classification_confidence"],
                        "needs_clarification": output["needs_clarification"],
                        "processing_time_ms": processing_time_ms,
                    }
                )

            return output

        except Exception as e:

            # Convert to structured workflow error
            if not isinstance(e, WorkflowExecutionError):
                e = WorkflowExecutionError(
                    workflow="case_analysis",
                    step="execution",
                    reason=str(e),
                )

            raise


# Singleton instance
_case_analysis_workflow: CaseAnalysisWorkflow | None = None


def case_analysis_workflow() -> CaseAnalysisWorkflow:
    """Get the singleton CaseAnalysisWorkflow instance."""
    global _case_analysis_workflow
    if _case_analysis_workflow is None:
        _case_analysis_workflow = CaseAnalysisWorkflow()
    return _case_analysis_workflow
