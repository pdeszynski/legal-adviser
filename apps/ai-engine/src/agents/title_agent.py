"""Title generation agent for chat sessions.

This agent generates concise, descriptive titles for chat sessions
based on the first user message. Uses a lightweight approach
with simple prompts to minimize cost and latency.
"""

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel

from ..config import get_settings
from ..langfuse_init import is_langfuse_enabled, update_current_trace
from .dependencies import ModelDeps, get_model_deps


class GeneratedTitle(BaseModel):
    """Result from the title generation agent."""

    title: str = Field(
        ...,
        description="A 3-6 word title summarizing the conversation topic",
        min_length=3,
        max_length=50,
    )


# System prompt for title generation
TITLE_GENERATION_PROMPT = """You are a title generator for legal chat conversations.

Your task is to create a concise, descriptive title (3-6 words) that captures
the main topic of the user's first message.

Guidelines:
- Use clear, professional language
- Focus on the legal topic or document type
- Examples: "Employment Contract Review", "Lease Agreement Questions",
  "Unpaid Wages Claim", "Tenancy Rights Inquiry", "Contract Dispute"
- Avoid: "Hello", "Question", "Help", "Legal Advice"
- Maximum 50 characters
- Capitalize first letter of each word (Title Case)"""

# Global agent instance (lazy-loaded)
_title_agent: Agent[GeneratedTitle, ModelDeps] | None = None


def get_title_agent() -> Agent[GeneratedTitle, ModelDeps]:
    """Get or create the title generation agent.

    This agent generates short, descriptive titles for chat sessions
    based on the first user message.

    Returns:
        Agent with instrument=True for automatic Langfuse tracing
    """
    global _title_agent
    if _title_agent is None:
        settings = get_settings()
        # Use gpt-4o-mini for faster, cheaper title generation
        model_name = "gpt-4o-mini" if settings.OPENAI_MODEL == "gpt-4o" else settings.OPENAI_MODEL

        _title_agent = Agent(
            OpenAIModel(model_name),
            system_prompt=TITLE_GENERATION_PROMPT,
            deps_type=ModelDeps,
            output_type=GeneratedTitle,
            instrument=True,
        )
    return _title_agent


async def generate_title(first_message: str, session_id: str = "title-gen") -> str:
    """Generate a title for a chat session based on the first message.

    Args:
        first_message: The first user message in the session
        session_id: Session ID for tracking

    Returns:
        A 3-6 word title describing the conversation topic

    Raises:
        AgentExecutionError: If title generation fails
    """
    from ..exceptions import AgentExecutionError
    from ..langfuse_init import _redact_dict_pii

    # Update trace metadata
    if is_langfuse_enabled():
        update_current_trace(
            input=_redact_dict_pii({"message": first_message}),
            session_id=session_id,
            metadata={"operation": "title_generation"},
        )

    try:
        agent = get_title_agent()
        deps = get_model_deps()

        # Run the agent with truncated message if needed
        # Title generation only needs the first ~200 characters
        truncated_message = (
            first_message[:200] + "..." if len(first_message) > 200 else first_message
        )

        result = await agent.run(
            f"Generate a title for this conversation:\n\n{truncated_message}",
            deps=deps,
        )

        # Type cast needed because pydantic_ai's Agent.run() returns Any for output
        output: GeneratedTitle = result.output  # type: ignore[assignment]
        title = output.title.strip()

        # Post-process: ensure title meets requirements
        if len(title) > 50:
            title = title[:47] + "..."

        # Update trace with output
        if is_langfuse_enabled():
            update_current_trace(output={"title": title})

        return title

    except Exception as e:
        # Convert to structured error
        raise AgentExecutionError(
            agent="title_agent",
            reason=str(e),
        ) from e


def generate_fallback_title(first_message: str) -> str:
    """Generate a simple fallback title from the first message.

    Used when AI generation fails. Takes the first meaningful words
    from the message and truncates to ~50 characters.

    Args:
        first_message: The first user message

    Returns:
        A simple title derived from the message
    """
    import re

    # Remove common greetings and prefixes
    cleaned = re.sub(
        r'^(hi|hello|hey|czesc|czesc\'|dzi[\- ]?eki[\- ]?dobry|dobry|dzień dobry|good morning)[,!\s]*',
        '',
        first_message,
        flags=re.IGNORECASE,
    ).strip()

    # Extract first few meaningful words (skip articles, prepositions)
    words = cleaned.split()[:8]

    # Filter out short words and common filler words
    skip_words = {
        "i", "a", "w", "z", "na", "do", "o", "u", "za", "przez",
        "the", "an", "is", "are", "for", "to", "of", "in", "at",
    }

    meaningful_words = [w for w in words if len(w) > 2 and w.lower() not in skip_words]

    if meaningful_words:
        title = " ".join(meaningful_words[:6])
        if len(title) > 50:
            title = title[:47] + "..."
        return title.capitalize()

    # Final fallback: truncate original message
    if len(first_message) > 50:
        return first_message[:47] + "..."
    return first_message
