"""Model selection service for cost-effective AI operations.

This module implements intelligent model selection to optimize costs:
- Use GPT-4o-mini for simple tasks (classification, clarification)
- Use GPT-4o for complex reasoning (document drafting, complex Q&A)
- Fallback logic for reliability

Pricing (approximate):
- GPT-4o-mini: ~$0.15/1M input tokens, $0.60/1M output tokens
- GPT-4o: ~$2.50/1M input tokens, $10/1M output tokens

Cost savings: ~94% for simple tasks using mini model.
"""

from dataclasses import dataclass
from enum import Enum

from ..config import get_settings


class ModelTier(str, Enum):
    """Model complexity tiers."""

    FAST = "fast"  # GPT-4o-mini for simple tasks
    BALANCED = "balanced"  # GPT-4o for general use
    COMPLEX = "complex"  # GPT-4o for complex reasoning


class ModelName(str, Enum):
    """Available model names."""

    GPT_4O_MINI = "gpt-4o-mini"
    GPT_4O = "gpt-4o"


@dataclass(frozen=True)
class ModelConfig:
    """Configuration for a model."""

    name: ModelName
    max_tokens: int
    tier: ModelTier
    cost_per_1m_input: float
    cost_per_1m_output: float


# Model configurations
MODEL_CONFIGS: dict[ModelName, ModelConfig] = {
    ModelName.GPT_4O_MINI: ModelConfig(
        name=ModelName.GPT_4O_MINI,
        max_tokens=128000,
        tier=ModelTier.FAST,
        cost_per_1m_input=0.15,
        cost_per_1m_output=0.60,
    ),
    ModelName.GPT_4O: ModelConfig(
        name=ModelName.GPT_4O,
        max_tokens=128000,
        tier=ModelTier.BALANCED,
        cost_per_1m_input=2.50,
        cost_per_1m_output=10.0,
    ),
}


@dataclass
class TaskComplexity:
    """Complexity assessment for a task."""

    tier: ModelTier
    confidence: float
    reason: str


def assess_task_complexity(
    operation: str,
    prompt_length: int = 0,
    context_length: int = 0,
    has_structured_output: bool = False,
    expected_output_tokens: int = 0,
) -> TaskComplexity:
    """Assess task complexity to determine appropriate model tier.

    Args:
        operation: Type of operation (qa, classify, draft, etc.)
        prompt_length: Length of input prompt in characters
        context_length: Length of context/retrieved content
        has_structured_output: Whether output needs complex structure
        expected_output_tokens: Expected token count for output

    Returns:
        TaskComplexity with recommended tier and confidence
    """
    # Simple operations suitable for fast model
    simple_operations = {
        "classify",
        "clarify",
        "query_analyze",
        "extract",
        "summarize_short",
    }

    # Complex operations requiring full model
    complex_operations = {
        "draft",
        "complex_qa",
        "document_generation",
        "legal_analysis",
    }

    total_input_chars = prompt_length + context_length
    estimated_input_tokens = total_input_chars // 4  # Rough estimate

    # Check for simple operations
    if operation in simple_operations:
        if estimated_input_tokens < 1000 and expected_output_tokens < 500:
            return TaskComplexity(
                tier=ModelTier.FAST,
                confidence=0.9,
                reason="Simple operation with small input/output",
            )

    # Check for complex operations
    if operation in complex_operations:
        return TaskComplexity(
            tier=ModelTier.BALANCED,
            confidence=0.95,
            reason=f"Complex operation type: {operation}",
        )

    # Default heuristic based on token estimates
    if estimated_input_tokens > 8000 or expected_output_tokens > 2000:
        return TaskComplexity(
            tier=ModelTier.BALANCED,
            confidence=0.8,
            reason="Large token count requires balanced model",
        )

    # Mid-range operations - use balanced model for Q&A
    if operation == "qa":
        return TaskComplexity(
            tier=ModelTier.BALANCED,
            confidence=0.85,
            reason="Q&A benefits from balanced model quality",
        )

    # Default to fast model for general operations
    return TaskComplexity(
        tier=ModelTier.FAST,
        confidence=0.7,
        reason="Default to fast model for cost optimization",
    )


def select_model_for_task(
    operation: str,
    prompt_length: int = 0,
    context_length: int = 0,
    has_structured_output: bool = False,
    expected_output_tokens: int = 0,
) -> str:
    """Select the appropriate model for a task.

    Args:
        operation: Type of operation
        prompt_length: Length of input prompt in characters
        context_length: Length of context/retrieved content
        has_structured_output: Whether output needs complex structure
        expected_output_tokens: Expected token count for output

    Returns:
        Model name as string (e.g., "openai:gpt-4o-mini")
    """
    settings = get_settings()

    # Check if model override is configured
    configured_model = settings.OPENAI_MODEL
    if configured_model and configured_model != "gpt-4o":
        # User has explicitly set a model
        return f"openai:{configured_model}"

    # Auto-select based on task complexity
    complexity = assess_task_complexity(
        operation=operation,
        prompt_length=prompt_length,
        context_length=context_length,
        has_structured_output=has_structured_output,
        expected_output_tokens=expected_output_tokens,
    )

    match complexity.tier:
        case ModelTier.FAST:
            return "openai:gpt-4o-mini"
        case ModelTier.BALANCED | ModelTier.COMPLEX:
            return "openai:gpt-4o"


def estimate_cost(
    model: str,
    input_tokens: int,
    output_tokens: int,
) -> float:
    """Estimate the cost of an API call in USD.

    Args:
        model: Model name (e.g., "gpt-4o-mini", "gpt-4o")
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens

    Returns:
        Estimated cost in USD
    """
    # Extract model name from "openai:model-name" format
    model_name = model.split(":")[-1] if ":" in model else model

    try:
        model_enum = ModelName(model_name)
        config = MODEL_CONFIGS[model_enum]

        input_cost = (input_tokens / 1_000_000) * config.cost_per_1m_input
        output_cost = (output_tokens / 1_000_000) * config.cost_per_1m_output

        return input_cost + output_cost
    except (ValueError, KeyError):
        # Unknown model - return 0
        return 0.0


def calculate_savings(
    input_tokens: int,
    output_tokens: int,
    using_mini: bool = True,
) -> dict[str, float]:
    """Calculate cost savings from using mini model.

    Args:
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens
        using_mini: Whether currently using mini model

    Returns:
        Dictionary with cost comparison data
    """
    mini_cost = estimate_cost("gpt-4o-mini", input_tokens, output_tokens)
    full_cost = estimate_cost("gpt-4o", input_tokens, output_tokens)

    savings = full_cost - mini_cost
    savings_percent = (savings / full_cost * 100) if full_cost > 0 else 0

    return {
        "mini_cost": mini_cost,
        "full_cost": full_cost,
        "savings": savings,
        "savings_percent": savings_percent,
        "using_mini": using_mini,
    }


# Model tier overrides for specific operations
OPERATION_MODEL_OVERRIDES: dict[str, ModelTier] = {
    # Always use balanced for document drafting
    "draft": ModelTier.BALANCED,
    "document_generation": ModelTier.BALANCED,
    # Use fast for classification
    "classify": ModelTier.FAST,
    "query_analyze": ModelTier.FAST,
    # Use fast for clarification
    "clarify": ModelTier.FAST,
}


def get_model_for_operation(operation: str) -> str:
    """Get the model name for a specific operation type.

    This is a simplified interface that uses predefined operation tiers.

    Args:
        operation: The operation type

    Returns:
        Model name string with "openai:" prefix
    """
    tier = OPERATION_MODEL_OVERRIDES.get(operation)

    if tier == ModelTier.FAST:
        return "openai:gpt-4o-mini"
    if tier == ModelTier.BALANCED:
        return "openai:gpt-4o"

    # Default to settings
    settings = get_settings()
    return f"openai:{settings.OPENAI_MODEL}"
