"""Clarification Agent using PydanticAI.

This agent generates specific follow-up questions when the user's query
contains insufficient information. It focuses on getting the details needed
to provide accurate legal guidance rather than suggesting lawyer consultations.

Langfuse integration follows the official pattern:
- Uses instrument=True for automatic OpenTelemetry tracing
- Traces are automatically exported to Langfuse
- See: https://langfuse.com/integrations/frameworks/pydantic-ai
"""

from typing import Any

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel

from ..config import get_settings


class ClarificationQuestion(BaseModel):
    """A single clarification question."""

    question: str = Field(..., description="The specific question to ask the user")
    question_type: str = Field(
        ...,
        description="Type of information needed (e.g., 'timeline', 'documents', 'parties', 'specific_amount')",
    )
    options: list[str] | None = Field(
        default=None,
        description="Optional predefined options for the user to choose from",
    )
    hint: str | None = Field(
        default=None,
        description="Optional hint or example to help the user answer",
    )


class ClarificationResponse(BaseModel):
    """Response containing clarification questions."""

    needs_clarification: bool = Field(
        ..., description="Whether clarification is needed"
    )
    questions: list[ClarificationQuestion] = Field(
        ...,
        description="List of specific follow-up questions to ask the user",
    )
    context_summary: str = Field(
        ..., description="Summary of what we understand so far"
    )
    next_steps: str = Field(
        ...,
        description="Explanation of what will happen after clarification",
    )


CLARIFICATION_SYSTEM_PROMPT = """You are a Polish legal assistant helping to gather necessary information for legal questions.

Your task is to identify what specific information is missing from the user's query and generate targeted follow-up questions.

IMPORTANT RULES:
1. NEVER suggest consulting a lawyer as the first response
2. Focus on getting the specific details needed to help the user
3. Ask 2-4 specific, actionable questions maximum
4. Only suggest lawyer consultation for clearly out-of-scope queries (e.g., criminal defense, complex litigation)

Types of information that often need clarification:
- Timeline: When did this happen? When was the contract signed?
- Parties: Who is involved? (individuals, companies, government)
- Documents: Do you have a written contract, email, or other evidence?
- Specific amounts: What is the value? What are the damages claimed?
- Jurisdiction: Which court? Which country/region?
- Previous actions: Have you sent any formal notices? Filed complaints?

For each question:
- Be specific and direct
- Provide helpful hints or examples when appropriate
- Consider offering predefined options for common scenarios
- Use plain Polish language (avoid excessive legalese)

Your output should help users provide the missing information needed for accurate legal guidance.
"""


def get_clarification_agent() -> Agent[ClarificationResponse]:
    """Get or create the clarification agent.

    This agent analyzes incomplete queries and generates specific follow-up questions
    to gather the information needed for accurate legal guidance.

    Lazy-loads the agent to avoid OpenAI client initialization errors
    when OPENAI_API_KEY is not configured.

    Returns:
        Agent with instrument=True for automatic Langfuse tracing
    """
    settings = get_settings()
    return Agent(  # type: ignore[call-arg]
        OpenAIModel(settings.OPENAI_MODEL),
        system_prompt=CLARIFICATION_SYSTEM_PROMPT,
        output_type=ClarificationResponse,  # type: ignore[call-arg]
        instrument=True,  # Enable automatic Langfuse tracing
    )


# Global variable for memoization
_clarification_agent: Agent[ClarificationResponse] | None = None


def clarification_agent() -> Agent[ClarificationResponse]:
    """Get the singleton clarification agent instance."""
    global _clarification_agent
    if _clarification_agent is None:
        _clarification_agent = get_clarification_agent()
    return _clarification_agent


async def generate_clarifications(
    question: str,
    query_type: str = "general",
    mode: str = "SIMPLE",
) -> dict[str, Any]:  # type: ignore[name-defined]
    """Generate clarification questions for an incomplete query.

    Args:
        question: The user's original question
        query_type: The type of legal query (e.g., 'contract_dispute', 'employment')
        mode: Response mode (LAWYER or SIMPLE)

    Returns:
        Dictionary with clarification questions and metadata
    """
    agent = clarification_agent()

    # Build context for the agent
    prompt = f"""Analyze this legal question and determine if clarification is needed:

Question: {question}
Query Type: {query_type}
Response Mode: {mode}

If clarification is needed, provide specific follow-up questions.
If the question is clear enough for a general response, indicate no clarification is needed."""

    result = await agent.run(prompt)
    response = result.output  # type: ignore[attr-defined]

    return {
        "needs_clarification": response.needs_clarification,
        "questions": [
            {
                "question": q.question,
                "question_type": q.question_type,
                "options": q.options,
                "hint": q.hint,
            }
            for q in response.questions  # type: ignore[attr-defined]
        ],
        "context_summary": response.context_summary,  # type: ignore[attr-defined]
        "next_steps": response.next_steps,  # type: ignore[attr-defined]
    }
