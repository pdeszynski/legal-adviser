"""Structured exception classes for AI Engine error handling.

This module provides a hierarchy of custom exceptions for different failure modes:
- LLM API errors (OpenAI rate limits, timeouts, etc.)
- Tool failures (RAG retrieval, embedding generation)
- Validation errors (input validation, schema validation)
- Workflow errors (orchestration failures, state errors)
- Service unavailable errors (downstream service failures)

Each exception includes:
- Error code for programmatic handling
- User-friendly message
- Technical details for debugging
- Retry recommendation
"""

from typing import Any


# -----------------------------------------------------------------------------
# Base Exception
# -----------------------------------------------------------------------------


class AIEngineError(Exception):
    """Base exception for all AI Engine errors.

    All custom exceptions inherit from this class, allowing catch-all
    error handling with `except AIEngineError`.

    Attributes:
        message: User-friendly error message
        error_code: Unique error code for programmatic handling
        details: Additional technical details for debugging
        retryable: Whether the operation can be retried
        suggestion: Actionable suggestion for the user
    """

    def __init__(
        self,
        message: str,
        *,
        error_code: str,
        details: dict[str, Any] | None = None,
        retryable: bool = False,
        suggestion: str | None = None,
    ) -> None:
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        self.retryable = retryable
        self.suggestion = suggestion
        super().__init__(message)

    def to_dict(self) -> dict[str, Any]:
        """Convert exception to dictionary for API responses."""
        return {
            "error_code": self.error_code,
            "message": self.message,
            "details": self.details,
            "retryable": self.retryable,
            "suggestion": self.suggestion,
        }


# -----------------------------------------------------------------------------
# LLM API Errors
# -----------------------------------------------------------------------------


class LLMError(AIEngineError):
    """Base class for LLM-related errors."""

    def __init__(
        self,
        message: str,
        *,
        details: dict[str, Any] | None = None,
        retryable: bool = True,
        suggestion: str | None = None,
    ) -> None:
        super().__init__(
            message,
            error_code="LLM_ERROR",
            details=details,
            retryable=retryable,
            suggestion=suggestion or "Please try again. If the problem persists, contact support.",
        )


class RateLimitError(LLMError):
    """Raised when LLM API rate limit is exceeded."""

    def __init__(
        self,
        *,
        limit: int | None = None,
        reset_time: str | None = None,
        provider: str = "openai",
    ) -> None:
        message = f"Rate limit exceeded for {provider}. Please try again later."
        details = {"provider": provider}
        if limit:
            details["limit"] = limit
        if reset_time:
            details["reset_time"] = reset_time
            message = f"Rate limit exceeded for {provider}. Resets at {reset_time}."

        super().__init__(
            message,
            details=details,
            retryable=True,
            suggestion=f"Wait a moment before retrying. Rate limit resets {reset_time or 'shortly'}.",
        )
        self.error_code = "RATE_LIMIT_EXCEEDED"


class QuotaExceededError(LLMError):
    """Raised when LLM API quota is exhausted."""

    def __init__(
        self,
        *,
        quota_type: str = "tokens",
        current_usage: int | None = None,
        limit: int | None = None,
        provider: str = "openai",
    ) -> None:
        message = f"API quota exceeded for {provider}."
        details = {"provider": provider, "quota_type": quota_type}
        if current_usage is not None:
            details["current_usage"] = current_usage
        if limit is not None:
            details["limit"] = limit

        super().__init__(
            message,
            details=details,
            retryable=False,
            suggestion="Contact administrator to increase quota or try again later.",
        )
        self.error_code = "QUOTA_EXCEEDED"


class LLMTimeoutError(LLMError):
    """Raised when LLM API request times out."""

    def __init__(
        self,
        *,
        timeout_seconds: float,
        model: str,
    ) -> None:
        super().__init__(
            f"Request to {model} timed out after {timeout_seconds} seconds.",
            details={"timeout_seconds": timeout_seconds, "model": model},
            retryable=True,
            suggestion="Try again with a shorter prompt or simpler question.",
        )
        self.error_code = "LLM_TIMEOUT"


class LLMInvalidResponseError(LLMError):
    """Raised when LLM returns invalid or malformed response."""

    def __init__(
        self,
        *,
        model: str,
        issue: str,
        raw_response: str | None = None,
    ) -> None:
        details = {"model": model, "issue": issue}
        if raw_response:
            details["raw_response_preview"] = raw_response[:200]

        super().__init__(
            f"Invalid response from {model}: {issue}",
            details=details,
            retryable=True,
            suggestion="Try rephrasing your question.",
        )
        self.error_code = "LLM_INVALID_RESPONSE"


class LLMAuthenticationError(LLMError):
    """Raised when LLM API authentication fails."""

    def __init__(
        self,
        *,
        provider: str = "openai",
    ) -> None:
        super().__init__(
            f"Authentication failed for {provider} API.",
            details={"provider": provider},
            retryable=False,
            suggestion="This is a configuration error. Please contact support.",
        )
        self.error_code = "LLM_AUTH_ERROR"


class LLMContextLengthExceededError(LLMError):
    """Raised when input exceeds LLM context window."""

    def __init__(
        self,
        *,
        model: str,
        input_tokens: int,
        max_tokens: int,
    ) -> None:
        super().__init__(
            f"Input is too long for {model}. {input_tokens} tokens exceeds limit of {max_tokens}.",
            details={
                "model": model,
                "input_tokens": input_tokens,
                "max_tokens": max_tokens,
            },
            retryable=False,
            suggestion="Please shorten your input or break it into smaller parts.",
        )
        self.error_code = "CONTEXT_LENGTH_EXCEEDED"


# -----------------------------------------------------------------------------
# Tool Errors
# -----------------------------------------------------------------------------


class ToolError(AIEngineError):
    """Base class for tool-related errors."""

    def __init__(
        self,
        message: str,
        *,
        tool_name: str,
        details: dict[str, Any] | None = None,
        retryable: bool = True,
        suggestion: str | None = None,
    ) -> None:
        full_details = {"tool_name": tool_name, **(details or {})}
        super().__init__(
            message,
            error_code="TOOL_ERROR",
            details=full_details,
            retryable=retryable,
            suggestion=suggestion,
        )


class RetrievalError(ToolError):
    """Raised when vector store retrieval fails."""

    def __init__(
        self,
        *,
        query: str,
        reason: str,
    ) -> None:
        super().__init__(
            f"Failed to retrieve relevant documents: {reason}",
            tool_name="retrieve_context",
            details={"query_preview": query[:100]},
            retryable=True,
            suggestion="Try rephrasing your question or contact support if the issue persists.",
        )
        self.error_code = "RETRIEVAL_ERROR"


class EmbeddingGenerationError(ToolError):
    """Raised when embedding generation fails."""

    def __init__(
        self,
        *,
        text_count: int,
        reason: str,
    ) -> None:
        super().__init__(
            f"Failed to generate embeddings: {reason}",
            tool_name="generate_embeddings",
            details={"text_count": text_count},
            retryable=True,
            suggestion="Try with fewer documents or contact support.",
        )
        self.error_code = "EMBEDDING_ERROR"


# -----------------------------------------------------------------------------
# Validation Errors
# -----------------------------------------------------------------------------


class ValidationError(AIEngineError):
    """Base class for validation errors."""

    def __init__(
        self,
        message: str,
        *,
        field: str | None = None,
        details: dict[str, Any] | None = None,
        suggestion: str | None = None,
    ) -> None:
        full_details = details or {}
        if field:
            full_details["field"] = field

        super().__init__(
            message,
            error_code="VALIDATION_ERROR",
            details=full_details,
            retryable=False,
            suggestion=suggestion or "Please check your input and try again.",
        )


class InputValidationError(ValidationError):
    """Raised when user input validation fails."""

    def __init__(
        self,
        *,
        field: str,
        value: str,
        constraint: str,
    ) -> None:
        super().__init__(
            f"Invalid value for '{field}': {constraint}",
            field=field,
            details={"value_preview": str(value)[:100]},
            suggestion=f"Provide a valid {field}.",
        )
        self.error_code = "INPUT_VALIDATION_ERROR"


class MissingRequiredFieldError(ValidationError):
    """Raised when required field is missing."""

    def __init__(
        self,
        *,
        field: str,
    ) -> None:
        super().__init__(
            f"Required field '{field}' is missing.",
            field=field,
            suggestion=f"Please provide the '{field}' field.",
        )
        self.error_code = "MISSING_REQUIRED_FIELD"


class SchemaValidationError(ValidationError):
    """Raised when response schema validation fails."""

    def __init__(
        self,
        *,
        expected_type: str,
        received_type: str,
        field_path: str | None = None,
    ) -> None:
        message = f"Schema validation failed: expected {expected_type}, got {received_type}"
        if field_path:
            message = f"Schema validation failed at '{field_path}': expected {expected_type}, got {received_type}"

        super().__init__(
            message,
            field=field_path,
            details={
                "expected_type": expected_type,
                "received_type": received_type,
            },
            suggestion="This is an internal error. Please contact support.",
        )
        self.error_code = "SCHEMA_VALIDATION_ERROR"


# -----------------------------------------------------------------------------
# Workflow Errors
# -----------------------------------------------------------------------------


class WorkflowError(AIEngineError):
    """Base class for workflow-related errors."""

    def __init__(
        self,
        message: str,
        *,
        workflow: str,
        step: str | None = None,
        details: dict[str, Any] | None = None,
        retryable: bool = False,
        suggestion: str | None = None,
    ) -> None:
        full_details = {"workflow": workflow, **(details or {})}
        if step:
            full_details["step"] = step

        super().__init__(
            message,
            error_code="WORKFLOW_ERROR",
            details=full_details,
            retryable=retryable,
            suggestion=suggestion,
        )


class WorkflowStateError(WorkflowError):
    """Raised when workflow state is invalid."""

    def __init__(
        self,
        *,
        workflow: str,
        state_key: str,
        expected: str,
        actual: str,
    ) -> None:
        super().__init__(
            f"Invalid workflow state: {state_key} should be {expected}, got {actual}",
            workflow=workflow,
            details={
                "state_key": state_key,
                "expected": expected,
                "actual": actual,
            },
            retryable=False,
            suggestion="This is an internal error. Please try again or contact support.",
        )
        self.error_code = "WORKFLOW_STATE_ERROR"


class WorkflowExecutionError(WorkflowError):
    """Raised when workflow execution fails."""

    def __init__(
        self,
        *,
        workflow: str,
        step: str,
        reason: str,
    ) -> None:
        super().__init__(
            f"Workflow execution failed at step '{step}': {reason}",
            workflow=workflow,
            step=step,
            retryable=True,
            suggestion="Try again. If the problem persists, contact support.",
        )
        self.error_code = "WORKFLOW_EXECUTION_ERROR"


class MaxIterationsExceededError(WorkflowError):
    """Raised when workflow exceeds maximum iterations."""

    def __init__(
        self,
        *,
        workflow: str,
        max_iterations: int,
        actual_iterations: int,
    ) -> None:
        super().__init__(
            f"Workflow exceeded maximum iterations ({max_iterations}). Stopped after {actual_iterations}.",
            workflow=workflow,
            details={
                "max_iterations": max_iterations,
                "actual_iterations": actual_iterations,
            },
            retryable=False,
            suggestion="Contact support to increase iteration limit or simplify your request.",
        )
        self.error_code = "MAX_ITERATIONS_EXCEEDED"


# -----------------------------------------------------------------------------
# Service Errors
# -----------------------------------------------------------------------------


class ServiceError(AIEngineError):
    """Base class for service-related errors."""

    def __init__(
        self,
        message: str,
        *,
        service: str,
        details: dict[str, Any] | None = None,
        retryable: bool = True,
        suggestion: str | None = None,
    ) -> None:
        full_details = {"service": service, **(details or {})}
        super().__init__(
            message,
            error_code="SERVICE_ERROR",
            details=full_details,
            retryable=retryable,
            suggestion=suggestion or "Please try again later.",
        )


class ServiceUnavailableError(ServiceError):
    """Raised when downstream service is unavailable."""

    def __init__(
        self,
        *,
        service: str,
        reason: str = "Service unavailable",
    ) -> None:
        super().__init__(
            f"{service} is currently unavailable: {reason}",
            service=service,
            retryable=True,
            suggestion=f"The {service} is temporarily unavailable. Please try again in a moment.",
        )
        self.error_code = "SERVICE_UNAVAILABLE"


class ServiceTimeoutError(ServiceError):
    """Raised when downstream service request times out."""

    def __init__(
        self,
        *,
        service: str,
        timeout_seconds: float,
    ) -> None:
        super().__init__(
            f"{service} request timed out after {timeout_seconds} seconds.",
            service=service,
            details={"timeout_seconds": timeout_seconds},
            retryable=True,
            suggestion=f"The {service} is responding slowly. Please try again.",
        )
        self.error_code = "SERVICE_TIMEOUT"


class BackendConnectionError(ServiceError):
    """Raised when backend connection fails."""

    def __init__(
        self,
        *,
        reason: str = "Could not connect to backend",
    ) -> None:
        super().__init__(
            f"Backend connection failed: {reason}",
            service="backend",
            retryable=True,
            suggestion="The backend service is temporarily unavailable. Please try again.",
        )
        self.error_code = "BACKEND_CONNECTION_ERROR"


# -----------------------------------------------------------------------------
# Agent Errors
# -----------------------------------------------------------------------------


class AgentError(AIEngineError):
    """Base class for agent-related errors."""

    def __init__(
        self,
        message: str,
        *,
        agent: str,
        details: dict[str, Any] | None = None,
        retryable: bool = True,
        suggestion: str | None = None,
    ) -> None:
        full_details = {"agent": agent, **(details or {})}
        super().__init__(
            message,
            error_code="AGENT_ERROR",
            details=full_details,
            retryable=retryable,
            suggestion=suggestion or "Please try again or contact support.",
        )


class AgentExecutionError(AgentError):
    """Raised when agent execution fails."""

    def __init__(
        self,
        *,
        agent: str,
        reason: str,
    ) -> None:
        super().__init__(
            f"Agent '{agent}' execution failed: {reason}",
            agent=agent,
            retryable=True,
            suggestion="Try rephrasing your request or contact support.",
        )
        self.error_code = "AGENT_EXECUTION_ERROR"


class AgentInitializationError(AgentError):
    """Raised when agent initialization fails."""

    def __init__(
        self,
        *,
        agent: str,
        reason: str,
    ) -> None:
        super().__init__(
            f"Failed to initialize agent '{agent}': {reason}",
            agent=agent,
            retryable=False,
            suggestion="This is a configuration error. Please contact support.",
        )
        self.error_code = "AGENT_INITIALIZATION_ERROR"


# -----------------------------------------------------------------------------
# Error Utilities
# -----------------------------------------------------------------------------


def is_retryable(error: Exception) -> bool:
    """Check if an error is retryable.

    Args:
        error: The exception to check

    Returns:
        True if the error can be retried, False otherwise
    """
    if isinstance(error, AIEngineError):
        return error.retryable

    # Default non-custom exceptions to not retryable for safety
    return False


def get_error_code(error: Exception) -> str:
    """Get the error code from an exception.

    Args:
        error: The exception to get the code from

    Returns:
        Error code string, or "UNKNOWN_ERROR" if not found
    """
    if isinstance(error, AIEngineError):
        return error.error_code
    return "UNKNOWN_ERROR"


def get_user_message(error: Exception) -> str:
    """Get a user-friendly message from an exception.

    Args:
        error: The exception to get the message from

    Returns:
        User-friendly error message
    """
    if isinstance(error, AIEngineError):
        return error.message
    return str(error)


def get_suggestion(error: Exception) -> str | None:
    """Get the suggestion from an exception.

    Args:
        error: The exception to get the suggestion from

    Returns:
        Suggestion string, or None if not available
    """
    if isinstance(error, AIEngineError):
        return error.suggestion
    return None
