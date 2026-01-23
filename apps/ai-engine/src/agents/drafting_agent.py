from pydantic import BaseModel, Field
from pydantic_ai import Agent

from ..config import get_settings


class DraftResult(BaseModel):
    content: str = Field(
        description="The generated legal document content in Markdown format."
    )


SYSTEM_PROMPT = """You are an expert Polish lawyer (Radca Prawny).
Your task is to draft precise, professional legal documents in Polish.
Follow the structure appropriate for the requested document type.
Use Markdown for formatting.
Ensure all placeholders for missing information are clearly marked (e.g., [DATA]).
Adhere to formal legal Polish terminology.
"""


def get_drafting_agent() -> Agent:
    """Get or create the drafting agent.

    Lazy-loads the agent to avoid OpenAI client initialization errors
    when OPENAI_API_KEY is not configured.
    """
    settings = get_settings()
    return Agent(
        f"openai:{settings.OPENAI_MODEL}",
        system_prompt=SYSTEM_PROMPT,
    )


# Global variable for memoization
_drafting_agent: Agent | None = None


def drafting_agent() -> Agent:
    """Get the singleton drafting agent instance."""
    global _drafting_agent
    if _drafting_agent is None:
        _drafting_agent = get_drafting_agent()
    return _drafting_agent
