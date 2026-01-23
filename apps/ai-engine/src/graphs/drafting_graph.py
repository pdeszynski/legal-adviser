from typing import Any, Dict, Optional, TypedDict

from langgraph.graph import END, StateGraph

from ..agents.drafting_agent import DraftResult, drafting_agent


class DraftingState(TypedDict):
    description: str
    document_type: str
    context: Dict[str, Any]
    draft_content: Optional[str]
    error: Optional[str]


async def generate_draft_node(state: DraftingState):
    """
    Node that invokes the drafting agent to generate the document content.
    """
    try:
        user_prompt = (
            f"Please draft a legal document.\n"
            f"Type: {state['document_type']}\n"
            f"Description: {state['description']}\n"
            f"Context variables: {state.get('context', {})}"
        )

        # PydanticAI agent run (lazy-loaded)
        agent = drafting_agent()
        result = await agent.run(user_prompt, output_type=DraftResult)
        return {"draft_content": result.data.content, "error": None}
    except Exception as e:
        return {"error": str(e), "draft_content": None}


# Build the StateGraph
builder = StateGraph(DraftingState)
builder.add_node("generate_draft", generate_draft_node)
builder.set_entry_point("generate_draft")
builder.add_edge("generate_draft", END)

drafting_graph = builder.compile()
