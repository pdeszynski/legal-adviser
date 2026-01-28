"""PydanticAI dependency injection system for LLM models and services.

This module provides centralized dependency management for PydanticAI agents,
following PydanticAI's dependency injection patterns.

Note on OpenAI Client Usage:
- PydanticAI agents (via Agent class) handle chat completions internally
- Embeddings are not yet supported by PydanticAI v1.31, so we use OpenAI's API directly
- All embedding operations go through EmbeddingService for abstraction
- When PydanticAI adds native embedder support, we can migrate to it

Langfuse Integration:
- Agents are created with instrument=True for automatic OpenTelemetry tracing
- Traces are automatically exported to Langfuse via langfuse.get_client()
- See: https://langfuse.com/integrations/frameworks/pydantic-ai
"""

from functools import lru_cache

from pydantic_ai import Agent

from ..auth import UserContext
from ..config import get_settings


@lru_cache
def get_openai_client() -> "AsyncOpenAI":  # type: ignore[name-defined]
    """Get or create the OpenAI client singleton.

    This client is used for embeddings generation only, as PydanticAI v1.31
    doesn't have native embedder support. All chat completions go through
    PydanticAI Agent instances.

    The client is cached and reused for efficient connection pooling.

    Returns:
        AsyncOpenAI: Configured OpenAI client for embeddings
    """
    from openai import AsyncOpenAI

    settings = get_settings()
    return AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


class ModelDeps:
    """Dependency container for model-related dependencies.

    This class can be passed to PydanticAI agents to provide
    access to models, clients, and user context.

    Example:
        ```python
        agent = Agent(
            "openai:gpt-4o",
            deps_type=ModelDeps,
            instrument=True,  # Enable Langfuse tracing
        )

        @agent.system_prompt
        async def system_prompt(ctx: RunContext[ModelDeps]) -> str:
            return "You are a helpful legal assistant."
        ```
    """

    def __init__(self, user: UserContext | None = None) -> None:
        """Initialize dependencies with cached models and clients.

        Args:
            user: Optional authenticated user context from JWT token
        """
        self.settings = get_settings()
        self.openai_client = get_openai_client()
        self.user = user


@lru_cache
def get_model_deps() -> ModelDeps:
    """Get or create the ModelDeps singleton.

    This is the primary dependency injection function.
    Use this to get the dependency container for PydanticAI agents.

    Note: This returns a singleton without user context.
    For user-context-aware deps, use get_model_deps_with_user().

    Returns:
        ModelDeps: Cached dependency container
    """
    return ModelDeps()


def get_model_deps_with_user(user: UserContext | None) -> ModelDeps:
    """Get ModelDeps with user context.

    Use this when you need to pass authenticated user information
    to PydanticAI agents.

    Args:
        user: UserContext from validated JWT token, or None for anonymous

    Returns:
        ModelDeps: Dependency container with user context
    """
    return ModelDeps(user=user)


def create_agent(
    system_prompt: str,
    deps_type: type | None = None,
    model: str | None = None,
    instrument: bool = True,
) -> Agent:
    """Factory function to create PydanticAI agents with consistent configuration.

    This helper function ensures all agents use the same model configuration
    and dependency injection pattern. Langfuse instrumentation is enabled by default.

    Args:
        system_prompt: System prompt for the agent
        deps_type: Optional dependency type for the agent
        model: Optional model override (e.g., "openai:gpt-4o-mini")
        instrument: Enable Langfuse instrumentation (default: True)

    Returns:
        Configured PydanticAI Agent instance with Langfuse tracing enabled
    """
    if model is None:
        settings = get_settings()
        model = f"openai:{settings.OPENAI_MODEL}"

    return Agent(
        model,
        system_prompt=system_prompt,
        deps_type=deps_type or ModelDeps,
        instrument=instrument,
    )


def create_agent_for_operation(
    operation: str,
    system_prompt: str,
    deps_type: type | None = None,
    instrument: bool = True,
) -> Agent:
    """Create an agent with model selection based on operation type.

    This factory automatically selects the appropriate model based on
    the operation complexity, using faster models for simple tasks.

    Args:
        operation: Operation type (qa, classify, draft, etc.)
        system_prompt: System prompt for the agent
        deps_type: Optional dependency type for the agent
        instrument: Enable Langfuse instrumentation (default: True)

    Returns:
        Configured PydanticAI Agent instance with model selected for the operation
    """
    # Import here to avoid circular import
    from ..services.model_selection import get_model_for_operation

    model = get_model_for_operation(operation)
    return Agent(
        model,
        system_prompt=system_prompt,
        deps_type=deps_type or ModelDeps,
        instrument=instrument,
    )


def get_model_name_from_agent(agent: Agent) -> str:
    """Extract the model name from a PydanticAI agent.

    Args:
        agent: PydanticAI Agent instance

    Returns:
        Model name string (e.g., "gpt-4o-mini")
    """
    # PydanticAI stores model internally - access via __dict__ for now
    model_attr = getattr(agent, "model", None)
    if model_attr:
        # Remove "openai:" prefix if present
        return str(model_attr).split(":")[-1]
    return "unknown"
