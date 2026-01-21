"""Q&A LangGraph workflow for legal question answering.

This graph implements a RAG-based Q&A flow inspired by Flowise.ai patterns:
- Query Analysis: Analyze and classify the user's question
- Context Retrieval: Fetch relevant legal context from vector store
- Answer Generation: Generate a comprehensive answer with context
- Citation Formatting: Extract and format legal citations
"""

from typing import TypedDict, Optional, List, Dict, Any
from langgraph.graph import StateGraph, END
from openai import AsyncOpenAI
from ..config import get_settings
from ..services.embedding_service import EmbeddingService

# -----------------------------------------------------------------------------
# State Definition
# -----------------------------------------------------------------------------


class QAState(TypedDict):
    """State for the Q&A workflow.

    Tracks the question, analysis, retrieved context, generated answer,
    and citation information throughout the workflow.
    """

    # Input
    question: str
    session_id: str
    mode: str  # "LAWYER" for detailed, "SIMPLE" for layperson

    # Query Analysis Node Output
    query_type: Optional[str]  # e.g., "statute_interpretation", "case_law", "procedural"
    key_terms: Optional[List[str]]  # Extracted legal terms
    question_refined: Optional[str]  # Refined/expanded question
    needs_clarification: bool  # Whether the question needs more info
    clarification_prompt: Optional[str]  # Prompt to ask user for clarification

    # Context Retrieval Node Output
    query_embedding: Optional[List[float]]  # Embedding vector for semantic search
    retrieved_contexts: Optional[List[Dict[str, Any]]]  # Retrieved chunks
    context_summary: Optional[str]  # Summary of retrieved context

    # Answer Generation Node Output
    raw_answer: Optional[str]  # Generated answer before citation formatting
    answer_complete: bool  # Whether the answer is complete

    # Citation Formatting Node Output
    final_answer: Optional[str]  # Final formatted answer with citations
    citations: Optional[List[Dict[str, Any]]]  # Extracted citations
    confidence: float  # Confidence score

    # Error handling
    error: Optional[str]


# -----------------------------------------------------------------------------
# Nodes
# -----------------------------------------------------------------------------


class QAGraphNodes:
    """Container for Q&A graph nodes."""

    def __init__(self):
        """Initialize nodes with required services."""
        self.settings = get_settings()
        self.openai_client = AsyncOpenAI(api_key=self.settings.OPENAI_API_KEY)
        self.embedding_service = EmbeddingService()

    async def query_analysis_node(self, state: QAState) -> Dict[str, Any]:
        """Analyze the user's question to extract key information.

        - Classify query type
        - Extract key legal terms
        - Refine/expands the question for better retrieval
        - Determine if clarification is needed
        """
        question = state["question"]

        try:
            response = await self.openai_client.chat.completions.create(
                model=self.settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": """You are a legal query analyzer. Analyze the user's question and provide:
1. query_type: One of "statute_interpretation", "case_law", "procedural", "general_advice"
2. key_terms: List of important legal terms (3-5 terms)
3. question_refined: An expanded version of the question for better semantic search
4. needs_clarification: boolean - true if the question is too vague
5. clarification_prompt: null unless needs_clarification is true

Respond in JSON format.""",
                    },
                    {"role": "user", "content": f"Analyze this legal question: {question}"},
                ],
                response_format={"type": "json_object"},
            )

            result = eval(response.choices[0].message.content or "{}")

            return {
                "query_type": result.get("query_type", "general_advice"),
                "key_terms": result.get("key_terms", []),
                "question_refined": result.get("question_refined", question),
                "needs_clarification": result.get("needs_clarification", False),
                "clarification_prompt": result.get("clarification_prompt"),
                "error": None,
            }

        except Exception as e:
            return {
                "query_type": "general_advice",
                "key_terms": [],
                "question_refined": question,
                "needs_clarification": False,
                "clarification_prompt": None,
                "error": f"Query analysis failed: {str(e)}",
            }

    async def context_retrieval_node(self, state: QAState) -> Dict[str, Any]:
        """Retrieve relevant legal context from the vector store.

        - Generate embedding for the refined question
        - Search vector store for similar chunks
        - Summarize retrieved context
        """
        question = state.get("question_refined") or state["question"]

        try:
            # Generate embedding for semantic search
            embedding = await self.embedding_service.generate_embedding(question)

            # TODO: Call backend VectorStoreService with the embedding
            # For now, mock the retrieval
            mock_contexts = [
                {
                    "content": "Polish Civil Code Article 118: The statute of limitations for claims is generally 10 years, unless specific provisions specify otherwise.",
                    "source": "Polish Civil Code",
                    "article": "Art. 118",
                    "similarity": 0.89,
                },
                {
                    "content": "Supreme Court ruling from 2023: In cases involving contractual disputes, the limitation period begins from the date the breach became known to the injured party.",
                    "source": "Supreme Court",
                    "article": "III CZP 45/23",
                    "similarity": 0.82,
                },
            ]

            context_summary = "\n\n".join([
                f"[{ctx['source']} - {ctx.get('article', 'N/A')}]: {ctx['content']}"
                for ctx in mock_contexts
            ])

            return {
                "query_embedding": embedding,
                "retrieved_contexts": mock_contexts,
                "context_summary": context_summary,
                "error": None,
            }

        except Exception as e:
            return {
                "query_embedding": None,
                "retrieved_contexts": [],
                "context_summary": "",
                "error": f"Context retrieval failed: {str(e)}",
            }

    async def answer_generation_node(self, state: QAState) -> Dict[str, Any]:
        """Generate a comprehensive answer using retrieved context.

        - Uses the question and retrieved context
        - Adapts tone based on mode (LAWYER vs SIMPLE)
        - Ensures answer is grounded in retrieved context
        """
        question = state["question"]
        contexts = state.get("retrieved_contexts", [])
        mode = state.get("mode", "SIMPLE")
        context_summary = state.get("context_summary", "")

        try:
            mode_instruction = (
                "Provide a detailed legal professional analysis with references to specific articles, case law, and legal principles."
                if mode.upper() == "LAWYER"
                else "Provide a simplified explanation suitable for a layperson, avoiding excessive legal jargon."
            )

            response = await self.openai_client.chat.completions.create(
                model=self.settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": f"""You are a Polish legal expert providing Q&A services.

{mode_instruction}

Important guidelines:
- Base your answer ONLY on the provided legal context
- If the context is insufficient, explicitly state what additional information is needed
- For Polish law, always reference specific articles when available
- Be accurate and acknowledge uncertainty""",
                    },
                    {
                        "role": "user",
                        "content": f"""Question: {question}

Legal Context:
{context_summary}

Please provide a comprehensive answer based on the above context.""",
                    },
                ],
                temperature=0.3,  # Lower temperature for more factual answers
            )

            raw_answer = response.choices[0].message.content or ""

            return {
                "raw_answer": raw_answer,
                "answer_complete": len(contexts) > 0,
                "error": None,
            }

        except Exception as e:
            return {
                "raw_answer": None,
                "answer_complete": False,
                "error": f"Answer generation failed: {str(e)}",
            }

    async def citation_formatting_node(self, state: QAState) -> Dict[str, Any]:
        """Extract and format legal citations from the answer.

        - Parse citations from the raw answer
        - Format them consistently
        - Calculate confidence based on context quality
        """
        raw_answer = state.get("raw_answer", "")
        contexts = state.get("retrieved_contexts", [])
        question = state["question"]

        try:
            # Extract citations from contexts
            citations = []
            for ctx in contexts:
                if ctx.get("source") and ctx.get("article"):
                    citations.append({
                        "source": ctx["source"],
                        "article": ctx["article"],
                        "url": ctx.get("url"),
                    })

            # Calculate confidence based on retrieval quality
            avg_similarity = (
                sum(ctx.get("similarity", 0) for ctx in contexts) / len(contexts)
                if contexts
                else 0
            )
            confidence = min(0.95, avg_similarity + 0.1)

            # Format final answer with citations section
            if citations:
                citations_section = "\n\n**Sources:**\n" + "\n".join([
                    f"- {c['source']}, {c['article']}"
                    for c in citations
                ])
                final_answer = raw_answer + citations_section
            else:
                final_answer = raw_answer

            return {
                "final_answer": final_answer,
                "citations": citations,
                "confidence": confidence,
                "error": None,
            }

        except Exception as e:
            return {
                "final_answer": raw_answer,
                "citations": [],
                "confidence": 0.0,
                "error": f"Citation formatting failed: {str(e)}",
            }


# -----------------------------------------------------------------------------
# Conditional Edges
# -----------------------------------------------------------------------------


def should_ask_clarification(state: QAState) -> str:
    """Determine if we need to ask the user for clarification."""
    if state.get("needs_clarification"):
        return "clarification"
    return "retrieve_context"


def has_context(state: QAState) -> str:
    """Determine if we have sufficient context to answer."""
    contexts = state.get("retrieved_contexts") or []
    if len(contexts) == 0:
        return "no_context"
    return "generate_answer"


def should_format_citations(state: QAState) -> str:
    """Determine if we should format citations or return generic answer."""
    if state.get("answer_complete") and state.get("raw_answer"):
        return "format_citations"
    return "generic_answer"


# -----------------------------------------------------------------------------
# Generic Answer Node
# -----------------------------------------------------------------------------


async def generic_answer_node(state: QAState) -> Dict[str, Any]:
    """Generate a generic answer when context is insufficient."""
    return {
        "final_answer": """I apologize, but I don't have sufficient relevant legal context to provide a specific answer to your question.

This could be because:
- Your question may relate to a very specific legal area not in our database
- Additional details may be needed to provide accurate guidance
- The question may require consultation with a qualified legal professional

For complex legal matters, I recommend consulting with a qualified Polish attorney who can provide personalized advice based on your specific situation.""",
        "citations": [],
        "confidence": 0.3,
        "error": None,
    }


# -----------------------------------------------------------------------------
# Graph Builder
# -----------------------------------------------------------------------------


def build_qa_graph() -> StateGraph:
    """Build and compile the Q&A StateGraph.

    The graph flow:
    1. query_analysis: Analyze the question
    2. [Conditional] -> If needs clarification, END with clarification prompt
    3. context_retrieval: Fetch relevant legal context
    4. [Conditional] -> If no context, generic_answer
    5. answer_generation: Generate the answer
    6. [Conditional] -> If complete, citation_formatting else generic_answer
    7. citation_formatting: Format final answer with citations
    8. END
    """
    nodes = QAGraphNodes()

    # Create the graph builder
    builder = StateGraph(QAState)

    # Add all nodes
    builder.add_node("query_analysis", nodes.query_analysis_node)
    builder.add_node("context_retrieval", nodes.context_retrieval_node)
    builder.add_node("answer_generation", nodes.answer_generation_node)
    builder.add_node("citation_formatting", nodes.citation_formatting_node)
    builder.add_node("generic_answer", generic_answer_node)

    # Set entry point
    builder.set_entry_point("query_analysis")

    # Add edges
    builder.add_conditional_edges(
        "query_analysis",
        should_ask_clarification,
        {
            "clarification": END,  # Early exit with clarification prompt
            "retrieve_context": "context_retrieval",
        },
    )

    builder.add_conditional_edges(
        "context_retrieval",
        has_context,
        {
            "no_context": "generic_answer",
            "generate_answer": "answer_generation",
        },
    )

    builder.add_conditional_edges(
        "answer_generation",
        should_format_citations,
        {
            "format_citations": "citation_formatting",
            "generic_answer": "generic_answer",
        },
    )

    builder.add_edge("citation_formatting", END)
    builder.add_edge("generic_answer", END)

    return builder.compile()


# Compile the graph for import
qa_graph = build_qa_graph()
