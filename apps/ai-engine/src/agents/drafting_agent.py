from pydantic import BaseModel, Field
from pydantic_ai import Agent
from ..config import get_settings

settings = get_settings()


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

drafting_agent = Agent(
    f"openai:{settings.OPENAI_MODEL}",
    system_prompt=SYSTEM_PROMPT,
)
