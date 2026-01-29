"""Complex Q&A Workflow using LangGraph.

This workflow orchestrates:
1. Query Analyzer - Understand the question type and extract key terms
2. Research Node - Deep legal research (statutes, case law, commentary)
3. Clarification Agent - Gather missing information if needed
4. Q&A Agent - Generate comprehensive answer
5. Citation Formatter - Format and validate citations

The workflow routes between clarification and research based on query completeness.
"""

import time
from typing import Any, Literal

from langgraph.graph import END, StateGraph
from pydantic_ai import RunContext

from ..agents.clarification_agent import generate_clarifications
from ..agents.dependencies import get_model_deps
from ..agents.qa_agent import (
    get_qa_agent,
    get_query_analyzer_agent,
    retrieve_context_tool,
)
from ..langfuse_init import is_langfuse_enabled, update_current_trace
from .states import (
    ComplexQAState,
    create_complex_qa_state,
)

# -----------------------------------------------------------------------------
# Workflow Nodes
# -----------------------------------------------------------------------------


async def analyze_query_node(state: ComplexQAState) -> ComplexQAState:
    """Analyze the query to extract key information.

    This node uses the query analyzer agent to:
    1. Determine query type
    2. Extract key legal terms
    3. Refine the question for better search
    4. Check if clarification is needed
    """
    try:
        deps = get_model_deps()
        analyzer = get_query_analyzer_agent()

        result = await analyzer.run(state["question"], deps=deps)
        analysis = result.output

        state["query_type"] = analysis.query_type
        state["key_terms"] = analysis.key_terms
        state["question_refined"] = analysis.question_refined
        state["needs_clarification"] = analysis.needs_clarification
        state["metadata"]["current_step"] = "analyze_query"
        state["next_step"] = "check_clarification"

        return state

    except Exception as e:
        state["error"] = str(e)
        state["next_step"] = "error"
        return state


async def check_clarification_node(state: ComplexQAState) -> ComplexQAState:
    """Determine if clarification is needed.

    This decision node checks:
    1. needs_clarification flag from analysis
    2. Whether user has already provided responses
    """
    needs_clarification = state.get("needs_clarification", False)
    has_responses = bool(state.get("user_responses"))

    if needs_clarification and not has_responses:
        state["next_step"] = "clarify"
    else:
        state["next_step"] = "research"

    return state


async def clarify_node(state: ComplexQAState) -> ComplexQAState:
    """Generate clarification questions.

    This node uses the clarification agent to generate
    targeted follow-up questions.
    """
    try:
        metadata = state.get("metadata", {})
        result = await generate_clarifications(
            question=state["question"],
            query_type=state.get("query_type", "general"),
            mode=state.get("mode", "SIMPLE"),
            session_id=metadata.get("session_id", "default"),
            user_id=metadata.get("user_id"),
        )

        state["clarification_questions"] = result.get("questions", [])
        state["metadata"]["current_step"] = "clarify"
        state["next_step"] = "await_clarification"

        return state

    except Exception:
        # Clarification failure is not fatal - proceed to research
        state["clarification_questions"] = []
        state["next_step"] = "research"
        return state


async def research_node(state: ComplexQAState) -> ComplexQAState:
    """Perform deep legal research.

    This node:
    1. Retrieves relevant legal context from vector store
    2. Separates statute and case law references
    3. Collects commentary if available
    """
    try:
        deps = get_model_deps()

        # Retrieve context using the refined question
        contexts = await retrieve_context_tool(
            RunContext(deps),  # type: ignore
            query=state.get("question_refined", state["question"]),
            limit=5,
        )

        # Separate into statute and case law references
        statute_refs = []
        case_law_refs = []

        for ctx in contexts:
            source_lower = ctx.get("source", "").lower()
            if any(k in source_lower for k in ["kodeks", "ustawa", "art.", "dz.u."]):
                statute_refs.append(ctx)
            elif any(k in source_lower for k in ["sad", "wyrok", "orzeczenie", "sygnatura"]):
                case_law_refs.append(ctx)

        state["retrieved_contexts"] = contexts
        state["statute_references"] = statute_refs
        state["case_law_references"] = case_law_refs
        state["metadata"]["current_step"] = "research"
        state["next_step"] = "generate_answer"

        return state

    except Exception:
        # Research failure is not fatal - proceed with empty context
        state["retrieved_contexts"] = []
        state["statute_references"] = []
        state["case_law_references"] = []
        state["next_step"] = "generate_answer"
        return state


async def generate_answer_node(state: ComplexQAState) -> ComplexQAState:
    """Generate comprehensive answer using Q&A agent.

    This node uses the Q&A agent to produce a detailed answer
    with proper citations.
    """
    try:
        deps = get_model_deps()
        mode = state.get("mode", "SIMPLE")
        qa_agent = get_qa_agent(mode)

        # Build context string
        contexts = state.get("retrieved_contexts", [])
        if contexts:
            context_text = "\n\n".join([
                f"[{ctx['source']} - {ctx.get('article', 'N/A')}]: {ctx['content']}"
                for ctx in contexts
            ])
        else:
            context_text = "No specific legal context was retrieved for this question."

        # Incorporate user responses if available
        user_context = ""
        if state.get("user_responses"):
            user_context = "\n\nAdditional Information Provided:\n" + "\n".join([
                f"- {k}: {v}" for k, v in state["user_responses"].items()
            ])

        augmented_prompt = f"""Question: {state['question']}
{user_context}

Refined Question: {state.get('question_refined', state['question'])}
Query Type: {state.get('query_type', 'general')}
Key Terms: {', '.join(state.get('key_terms', []))}

Legal Context:
{context_text}

Please provide a comprehensive answer based on the above context."""

        result = await qa_agent.run(augmented_prompt, deps=deps)
        qa_result = result.output

        state["answer"] = qa_result.answer
        state["raw_citations"] = [
            {"source": c.source, "article": c.article, "url": c.url}
            for c in qa_result.citations
        ]
        state["confidence"] = qa_result.confidence
        state["metadata"]["current_step"] = "generate_answer"
        state["next_step"] = "format_citations"

        return state

    except Exception as e:
        state["error"] = str(e)
        state["next_step"] = "error"
        return state


async def format_citations_node(state: ComplexQAState) -> ComplexQAState:
    """Format and validate citations.

    This node:
    1. Merges agent-generated citations with retrieved context citations
    2. Validates citation format
    3. Removes duplicates
    """
    try:
        # Gather citations from multiple sources
        citations: list[dict[str, Any]] = []

        # Agent-generated citations
        citations.extend(state.get("raw_citations", []))

        # Context-based citations
        citations.extend([
            {
                "source": ctx.get("source", ""),
                "article": ctx.get("article", ""),
                "url": ctx.get("url"),
            }
            for ctx in state.get("retrieved_contexts", [])
        ])

        # Deduplicate by source + article
        seen = set()
        formatted = []
        for cit in citations:
            key = (cit.get("source", ""), cit.get("article", ""))
            if key not in seen and key[0]:
                seen.add(key)
                formatted.append(cit)

        state["formatted_citations"] = formatted
        state["final_answer"] = state.get("answer", "")
        state["metadata"]["current_step"] = "format_citations"
        state["next_step"] = "complete"

        return state

    except Exception:
        # Citation formatting failure is not fatal
        state["formatted_citations"] = state.get("raw_citations", [])
        state["final_answer"] = state.get("answer", "")
        state["next_step"] = "complete"
        return state


async def complete_node(state: ComplexQAState) -> ComplexQAState:
    """Finalize the workflow output.

    This node produces the final structured response.
    """
    try:
        state["next_step"] = END  # type: ignore
        return state

    except Exception as e:
        state["error"] = str(e)
        state["next_step"] = "error"
        return state


# -----------------------------------------------------------------------------
# Conditional Edge Functions
# -----------------------------------------------------------------------------


def should_clarify(state: ComplexQAState) -> Literal["clarify", "research"]:
    """Route to clarification or research."""
    if state.get("needs_clarification", False) and not state.get("user_responses"):
        return "clarify"
    return "research"


# -----------------------------------------------------------------------------
# Workflow Builder
# -----------------------------------------------------------------------------


def build_complex_qa_graph() -> StateGraph:
    """Build the Complex Q&A StateGraph.

    Returns:
        Compiled StateGraph ready for execution
    """
    workflow = StateGraph(ComplexQAState)

    # Add nodes
    workflow.add_node("analyze_query", analyze_query_node)
    workflow.add_node("check_clarification", check_clarification_node)
    workflow.add_node("clarify", clarify_node)
    workflow.add_node("research", research_node)
    workflow.add_node("generate_answer", generate_answer_node)
    workflow.add_node("format_citations", format_citations_node)
    workflow.add_node("complete", complete_node)
    workflow.add_node("error", lambda s: {**s, "next_step": END})  # type: ignore

    # Define edges
    workflow.set_entry_point("analyze_query")
    workflow.add_edge("analyze_query", "check_clarification")

    # Conditional routing for clarification
    workflow.add_conditional_edges(
        "check_clarification",
        should_clarify,
        {
            "clarify": "clarify",
            "research": "research",
        },
    )

    workflow.add_edge("clarify", "research")
    workflow.add_edge("research", "generate_answer")
    workflow.add_edge("generate_answer", "format_citations")
    workflow.add_edge("format_citations", "complete")
    workflow.add_edge("complete", END)
    workflow.add_edge("error", END)

    return workflow.compile()


# Compile the graph once for reuse
_complex_qa_graph: StateGraph | None = None


def get_complex_qa_graph() -> StateGraph:
    """Get or create the compiled Complex Q&A graph."""
    global _complex_qa_graph
    if _complex_qa_graph is None:
        _complex_qa_graph = build_complex_qa_graph()
    return _complex_qa_graph


# -----------------------------------------------------------------------------
# Workflow Wrapper Class
# -----------------------------------------------------------------------------


class ComplexQAWorkflow:
    """Wrapper class for Complex Q&A workflow execution.

    This class provides a clean interface for running the workflow
    with proper observability and error handling.
    """

    def __init__(self) -> None:
        """Initialize the workflow with compiled graph."""
        self.graph = get_complex_qa_graph()

    async def run(
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
            user_responses: Optional pre-filled responses to clarification questions

        Returns:
            Dictionary containing the workflow results
        """

        start_time = time.time()

        # Update Langfuse trace with workflow input metadata
        if is_langfuse_enabled():
            update_current_trace(
                input=question,
                user_id=user_id,
                session_id=session_id,
                metadata={"workflow": "complex_qa", "mode": mode},
            )

        # Create initial state
        state = create_complex_qa_state(
            question=question,
            mode=mode,
            session_id=session_id,
            user_id=user_id,
        )

        # Add user responses if provided
        if user_responses:
            state["user_responses"] = user_responses

        try:
            # Run the workflow
            result = await self.graph.ainvoke(state)

            processing_time_ms = (time.time() - start_time) * 1000

            # Prepare output
            output = {
                "answer": result.get("final_answer"),
                "citations": result.get("formatted_citations", []),
                "confidence": result.get("confidence", 0.0),
                "query_type": result.get("query_type", "general"),
                "key_terms": result.get("key_terms", []),
                "clarification_questions": result.get("clarification_questions", []),
                "needs_clarification": result.get("needs_clarification", False),
                "statute_references": result.get("statute_references", []),
                "case_law_references": result.get("case_law_references", []),
                "processing_time_ms": processing_time_ms,
                "error": result.get("error"),
            }

            # Update trace with workflow-level metadata
            if is_langfuse_enabled():
                update_current_trace(
                    output={
                        "answer_length": len(output["answer"] or ""),
                        "confidence": output["confidence"],
                        "needs_clarification": output["needs_clarification"],
                    }
                )

            return output

        except Exception:
            raise


# Singleton instance
_complex_qa_workflow: ComplexQAWorkflow | None = None


def complex_qa_workflow() -> ComplexQAWorkflow:
    """Get the singleton ComplexQAWorkflow instance."""
    global _complex_qa_workflow
    if _complex_qa_workflow is None:
        _complex_qa_workflow = ComplexQAWorkflow()
    return _complex_qa_workflow
