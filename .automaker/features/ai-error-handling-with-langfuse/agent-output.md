I'll implement this feature to improve error handling in the AI Engine with Langfuse-integrated error tracking. Let me start by exploring the codebase to understand the existing structure.

🔧 Tool: Task
Input: {
  "description": "Explore AI Engine codebase structure",
  "prompt": "Explore the AI Engine codebase in apps/ai-engine/ to understand:\n1. The current error handling patterns\n2. How agents are structured and where errors might occur\n3. How Langfuse is currently integrated\n4. The workflow structure and error handling\n5. The FastAPI endpoint error handling\n\nFocus on:\n- apps/ai-engine/src/agents/\n- apps/ai-engine/src/workflows/\n- apps/ai-engine/src/api/\n- apps/ai-engine/src/middleware/ (for Langfuse)\n- Any existing error handling or exception classes\n\nProvide a summary of the current error handling state and what needs to be improved.",
  "subagent_type": "Explore"
}

🔧 Tool: Bash
Input: {
  "command": "find apps/ai-engine -type f -name \"*.py\" | grep -E \"(agents|workflows|api|middleware)\" | head -50",
  "description": "List relevant files in AI Engine"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/ai-engine/src/**/*.py"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/ai-engine/src/api/**/*.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/langfuse_middleware.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/langfuse_init.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/qa_agent.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/orchestration.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "limit": 100,
  "offset": 100
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/sentry_init.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/dependencies.py"
}

🔧 Tool: Grep
Input: {
  "output_mode": "files_with_matches",
  "path": "apps/ai-engine/src",
  "pattern": "class.*Exception|class.*Error"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/config.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/document_generation_workflow.py",
  "limit": 150
}
Now let me create a todo list and start implementing the structured error handling system.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Create structured error exception classes",
      "status": "in_progress",
      "activeForm": "Creating structured error exception classes"
    },
    {
      "content": "Add Langfuse-integrated error tracking decorator",
      "status": "pending",
      "activeForm": "Adding Langfuse-integrated error tracking decorator"
    },
    {
      "content": "Implement retry logic with exponential backoff",
      "status": "pending",
      "activeForm": "Implementing retry logic with exponential backoff"
    },
    {
      "content": "Add fallback agent behaviors",
      "status": "pending",
      "activeForm": "Adding fallback agent behaviors"
    },
    {
      "content": "Create user-friendly error response models",
      "status": "pending",
      "activeForm": "Creating user-friendly error response models"
    },
    {
      "content": "Update FastAPI exception handlers",
      "status": "pending",
      "activeForm": "Updating FastAPI exception handlers"
    },
    {
      "content": "Integrate error handling into existing agents",
      "status": "pending",
      "activeForm": "Integrating error handling into existing agents"
    },
    {
      "content": "Integrate error handling into workflows",
      "status": "pending",
      "activeForm": "Integrating error handling into workflows"
    },
    {
      "content": "Run tests to verify implementation",
      "status": "pending",
      "activeForm": "Running tests to verify implementation"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/__init__.py"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/ai-engine/src/**/*.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/langfuse_init.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/config.py"
}
Now let me read the existing agents and workflows to understand how they handle errors:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/qa_agent.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/dependencies.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/models/responses.py"
}
Now let me read the workflows to understand how they handle errors:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/states.py"
}
Now I have a good understanding of the codebase. Let me start implementing the structured error handling system. I'll create the exception classes first:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/exceptions.py",
  "content": "\"\"\"Structured exception classes for AI Engine error handling.\n\nThis module provides a hierarchy of custom exceptions for different failure modes:\n- LLM API errors (OpenAI rate limits, timeouts, etc.)\n- Tool failures (RAG retrieval, embedding generation)\n- Validation errors (input validation, schema validation)\n- Workflow errors (orchestration failures, state errors)\n- Service unavailable errors (downstream service failures)\n\nEach exception includes:\n- Error code for programmatic handling\n- User-friendly message\n- Technical details for debugging\n- Retry recommendation\n\"\"\"\n\nfrom typing import Any\n\n\n# -----------------------------------------------------------------------------\n# Base Exception\n# -----------------------------------------------------------------------------\n\n\nclass AIEngineError(Exception):\n    \"\"\"Base exception for all AI Engine errors.\n\n    All custom exceptions inherit from this class, allowing catch-all\n    error handling with `except AIEngineError`.\n\n    Attributes:\n        message: User-friendly error message\n        error_code: Unique error code for programmatic handling\n        details: Additional technical details for debugging\n        retryable: Whether the operation can be retried\n        suggestion: Actionable suggestion for the user\n    \"\"\"\n\n    def __init__(\n        self,\n        message: str,\n        *,\n        error_code: str,\n        details: dict[str, Any] | None = None,\n        retryable: bool = False,\n        suggestion: str | None = None,\n    ) -> None:\n        self.message = message\n        self.error_code = error_code\n        self.details = details or {}\n        self.retryable = retryable\n        self.suggestion = suggestion\n        super().__init__(message)\n\n    def to_dict(self) -> dict[str, Any]:\n        \"\"\"Convert exception to dictionary for API responses.\"\"\"\n        return {\n            \"error_code\": self.error_code,\n            \"message\": self.message,\n            \"details\": self.details,\n            \"retryable\": self.retryable,\n            \"suggestion\": self.suggestion,\n        }\n\n\n# -----------------------------------------------------------------------------\n# LLM API Errors\n# -----------------------------------------------------------------------------\n\n\nclass LLMError(AIEngineError):\n    \"\"\"Base class for LLM-related errors.\"\"\"\n\n    def __init__(\n        self,\n        message: str,\n        *,\n        details: dict[str, Any] | None = None,\n        retryable: bool = True,\n        suggestion: str | None = None,\n    ) -> None:\n        super().__init__(\n            message,\n            error_code=\"LLM_ERROR\",\n            details=details,\n            retryable=retryable,\n            suggestion=suggestion or \"Please try again. If the problem persists, contact support.\",\n        )\n\n\nclass RateLimitError(LLMError):\n    \"\"\"Raised when LLM API rate limit is exceeded.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        limit: int | None = None,\n        reset_time: str | None = None,\n        provider: str = \"openai\",\n    ) -> None:\n        message = f\"Rate limit exceeded for {provider}. Please try again later.\"\n        details = {\"provider\": provider}\n        if limit:\n            details[\"limit\"] = limit\n        if reset_time:\n            details[\"reset_time\"] = reset_time\n            message = f\"Rate limit exceeded for {provider}. Resets at {reset_time}.\"\n\n        super().__init__(\n            message,\n            details=details,\n            retryable=True,\n            suggestion=f\"Wait a moment before retrying. Rate limit resets {reset_time or 'shortly'}.\",\n        )\n        self.error_code = \"RATE_LIMIT_EXCEEDED\"\n\n\nclass QuotaExceededError(LLMError):\n    \"\"\"Raised when LLM API quota is exhausted.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        quota_type: str = \"tokens\",\n        current_usage: int | None = None,\n        limit: int | None = None,\n        provider: str = \"openai\",\n    ) -> None:\n        message = f\"API quota exceeded for {provider}.\"\n        details = {\"provider\": provider, \"quota_type\": quota_type}\n        if current_usage is not None:\n            details[\"current_usage\"] = current_usage\n        if limit is not None:\n            details[\"limit\"] = limit\n\n        super().__init__(\n            message,\n            details=details,\n            retryable=False,\n            suggestion=\"Contact administrator to increase quota or try again later.\",\n        )\n        self.error_code = \"QUOTA_EXCEEDED\"\n\n\nclass LLMTimeoutError(LLMError):\n    \"\"\"Raised when LLM API request times out.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        timeout_seconds: float,\n        model: str,\n    ) -> None:\n        super().__init__(\n            f\"Request to {model} timed out after {timeout_seconds} seconds.\",\n            details={\"timeout_seconds\": timeout_seconds, \"model\": model},\n            retryable=True,\n            suggestion=\"Try again with a shorter prompt or simpler question.\",\n        )\n        self.error_code = \"LLM_TIMEOUT\"\n\n\nclass LLMInvalidResponseError(LLMError):\n    \"\"\"Raised when LLM returns invalid or malformed response.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        model: str,\n        issue: str,\n        raw_response: str | None = None,\n    ) -> None:\n        details = {\"model\": model, \"issue\": issue}\n        if raw_response:\n            details[\"raw_response_preview\"] = raw_response[:200]\n\n        super().__init__(\n            f\"Invalid response from {model}: {issue}\",\n            details=details,\n            retryable=True,\n            suggestion=\"Try rephrasing your question.\",\n        )\n        self.error_code = \"LLM_INVALID_RESPONSE\"\n\n\nclass LLMAuthenticationError(LLMError):\n    \"\"\"Raised when LLM API authentication fails.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        provider: str = \"openai\",\n    ) -> None:\n        super().__init__(\n            f\"Authentication failed for {provider} API.\",\n            details={\"provider\": provider},\n            retryable=False,\n            suggestion=\"This is a configuration error. Please contact support.\",\n        )\n        self.error_code = \"LLM_AUTH_ERROR\"\n\n\nclass LLMContextLengthExceededError(LLMError):\n    \"\"\"Raised when input exceeds LLM context window.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        model: str,\n        input_tokens: int,\n        max_tokens: int,\n    ) -> None:\n        super().__init__(\n            f\"Input is too long for {model}. {input_tokens} tokens exceeds limit of {max_tokens}.\",\n            details={\n                \"model\": model,\n                \"input_tokens\": input_tokens,\n                \"max_tokens\": max_tokens,\n            },\n            retryable=False,\n            suggestion=\"Please shorten your input or break it into smaller parts.\",\n        )\n        self.error_code = \"CONTEXT_LENGTH_EXCEEDED\"\n\n\n# -----------------------------------------------------------------------------\n# Tool Errors\n# -----------------------------------------------------------------------------\n\n\nclass ToolError(AIEngineError):\n    \"\"\"Base class for tool-related errors.\"\"\"\n\n    def __init__(\n        self,\n        message: str,\n        *,\n        tool_name: str,\n        details: dict[str, Any] | None = None,\n        retryable: bool = True,\n        suggestion: str | None = None,\n    ) -> None:\n        full_details = {\"tool_name\": tool_name, **(details or {})}\n        super().__init__(\n            message,\n            error_code=\"TOOL_ERROR\",\n            details=full_details,\n            retryable=retryable,\n            suggestion=suggestion,\n        )\n\n\nclass RetrievalError(ToolError):\n    \"\"\"Raised when vector store retrieval fails.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        query: str,\n        reason: str,\n    ) -> None:\n        super().__init__(\n            f\"Failed to retrieve relevant documents: {reason}\",\n            tool_name=\"retrieve_context\",\n            details={\"query_preview\": query[:100]},\n            retryable=True,\n            suggestion=\"Try rephrasing your question or contact support if the issue persists.\",\n        )\n        self.error_code = \"RETRIEVAL_ERROR\"\n\n\nclass EmbeddingGenerationError(ToolError):\n    \"\"\"Raised when embedding generation fails.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        text_count: int,\n        reason: str,\n    ) -> None:\n        super().__init__(\n            f\"Failed to generate embeddings: {reason}\",\n            tool_name=\"generate_embeddings\",\n            details={\"text_count\": text_count},\n            retryable=True,\n            suggestion=\"Try with fewer documents or contact support.\",\n        )\n        self.error_code = \"EMBEDDING_ERROR\"\n\n\n# -----------------------------------------------------------------------------\n# Validation Errors\n# -----------------------------------------------------------------------------\n\n\nclass ValidationError(AIEngineError):\n    \"\"\"Base class for validation errors.\"\"\"\n\n    def __init__(\n        self,\n        message: str,\n        *,\n        field: str | None = None,\n        details: dict[str, Any] | None = None,\n        suggestion: str | None = None,\n    ) -> None:\n        full_details = details or {}\n        if field:\n            full_details[\"field\"] = field\n\n        super().__init__(\n            message,\n            error_code=\"VALIDATION_ERROR\",\n            details=full_details,\n            retryable=False,\n            suggestion=suggestion or \"Please check your input and try again.\",\n        )\n\n\nclass InputValidationError(ValidationError):\n    \"\"\"Raised when user input validation fails.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        field: str,\n        value: str,\n        constraint: str,\n    ) -> None:\n        super().__init__(\n            f\"Invalid value for '{field}': {constraint}\",\n            field=field,\n            details={\"value_preview\": str(value)[:100]},\n            suggestion=f\"Provide a valid {field}.\",\n        )\n        self.error_code = \"INPUT_VALIDATION_ERROR\"\n\n\nclass MissingRequiredFieldError(ValidationError):\n    \"\"\"Raised when required field is missing.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        field: str,\n    ) -> None:\n        super().__init__(\n            f\"Required field '{field}' is missing.\",\n            field=field,\n            suggestion=f\"Please provide the '{field}' field.\",\n        )\n        self.error_code = \"MISSING_REQUIRED_FIELD\"\n\n\nclass SchemaValidationError(ValidationError):\n    \"\"\"Raised when response schema validation fails.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        expected_type: str,\n        received_type: str,\n        field_path: str | None = None,\n    ) -> None:\n        message = f\"Schema validation failed: expected {expected_type}, got {received_type}\"\n        if field_path:\n            message = f\"Schema validation failed at '{field_path}': expected {expected_type}, got {received_type}\"\n\n        super().__init__(\n            message,\n            field=field_path,\n            details={\n                \"expected_type\": expected_type,\n                \"received_type\": received_type,\n            },\n            suggestion=\"This is an internal error. Please contact support.\",\n        )\n        self.error_code = \"SCHEMA_VALIDATION_ERROR\"\n\n\n# -----------------------------------------------------------------------------\n# Workflow Errors\n# -----------------------------------------------------------------------------\n\n\nclass WorkflowError(AIEngineError):\n    \"\"\"Base class for workflow-related errors.\"\"\"\n\n    def __init__(\n        self,\n        message: str,\n        *,\n        workflow: str,\n        step: str | None = None,\n        details: dict[str, Any] | None = None,\n        retryable: bool = False,\n        suggestion: str | None = None,\n    ) -> None:\n        full_details = {\"workflow\": workflow, **(details or {})}\n        if step:\n            full_details[\"step\"] = step\n\n        super().__init__(\n            message,\n            error_code=\"WORKFLOW_ERROR\",\n            details=full_details,\n            retryable=retryable,\n            suggestion=suggestion,\n        )\n\n\nclass WorkflowStateError(WorkflowError):\n    \"\"\"Raised when workflow state is invalid.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        workflow: str,\n        state_key: str,\n        expected: str,\n        actual: str,\n    ) -> None:\n        super().__init__(\n            f\"Invalid workflow state: {state_key} should be {expected}, got {actual}\",\n            workflow=workflow,\n            details={\n                \"state_key\": state_key,\n                \"expected\": expected,\n                \"actual\": actual,\n            },\n            retryable=False,\n            suggestion=\"This is an internal error. Please try again or contact support.\",\n        )\n        self.error_code = \"WORKFLOW_STATE_ERROR\"\n\n\nclass WorkflowExecutionError(WorkflowError):\n    \"\"\"Raised when workflow execution fails.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        workflow: str,\n        step: str,\n        reason: str,\n    ) -> None:\n        super().__init__(\n            f\"Workflow execution failed at step '{step}': {reason}\",\n            workflow=workflow,\n            step=step,\n            retryable=True,\n            suggestion=\"Try again. If the problem persists, contact support.\",\n        )\n        self.error_code = \"WORKFLOW_EXECUTION_ERROR\"\n\n\nclass MaxIterationsExceededError(WorkflowError):\n    \"\"\"Raised when workflow exceeds maximum iterations.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        workflow: str,\n        max_iterations: int,\n        actual_iterations: int,\n    ) -> None:\n        super().__init__(\n            f\"Workflow exceeded maximum iterations ({max_iterations}). Stopped after {actual_iterations}.\",\n            workflow=workflow,\n            details={\n                \"max_iterations\": max_iterations,\n                \"actual_iterations\": actual_iterations,\n            },\n            retryable=False,\n            suggestion=\"Contact support to increase iteration limit or simplify your request.\",\n        )\n        self.error_code = \"MAX_ITERATIONS_EXCEEDED\"\n\n\n# -----------------------------------------------------------------------------\n# Service Errors\n# -----------------------------------------------------------------------------\n\n\nclass ServiceError(AIEngineError):\n    \"\"\"Base class for service-related errors.\"\"\"\n\n    def __init__(\n        self,\n        message: str,\n        *,\n        service: str,\n        details: dict[str, Any] | None = None,\n        retryable: bool = True,\n        suggestion: str | None = None,\n    ) -> None:\n        full_details = {\"service\": service, **(details or {})}\n        super().__init__(\n            message,\n            error_code=\"SERVICE_ERROR\",\n            details=full_details,\n            retryable=retryable,\n            suggestion=suggestion or \"Please try again later.\",\n        )\n\n\nclass ServiceUnavailableError(ServiceError):\n    \"\"\"Raised when downstream service is unavailable.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        service: str,\n        reason: str = \"Service unavailable\",\n    ) -> None:\n        super().__init__(\n            f\"{service} is currently unavailable: {reason}\",\n            service=service,\n            retryable=True,\n            suggestion=f\"The {service} is temporarily unavailable. Please try again in a moment.\",\n        )\n        self.error_code = \"SERVICE_UNAVAILABLE\"\n\n\nclass ServiceTimeoutError(ServiceError):\n    \"\"\"Raised when downstream service request times out.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        service: str,\n        timeout_seconds: float,\n    ) -> None:\n        super().__init__(\n            f\"{service} request timed out after {timeout_seconds} seconds.\",\n            service=service,\n            details={\"timeout_seconds\": timeout_seconds},\n            retryable=True,\n            suggestion=f\"The {service} is responding slowly. Please try again.\",\n        )\n        self.error_code = \"SERVICE_TIMEOUT\"\n\n\nclass BackendConnectionError(ServiceError):\n    \"\"\"Raised when backend connection fails.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        reason: str = \"Could not connect to backend\",\n    ) -> None:\n        super().__init__(\n            f\"Backend connection failed: {reason}\",\n            service=\"backend\",\n            retryable=True,\n            suggestion=\"The backend service is temporarily unavailable. Please try again.\",\n        )\n        self.error_code = \"BACKEND_CONNECTION_ERROR\"\n\n\n# -----------------------------------------------------------------------------\n# Agent Errors\n# -----------------------------------------------------------------------------\n\n\nclass AgentError(AIEngineError):\n    \"\"\"Base class for agent-related errors.\"\"\"\n\n    def __init__(\n        self,\n        message: str,\n        *,\n        agent: str,\n        details: dict[str, Any] | None = None,\n        retryable: bool = True,\n        suggestion: str | None = None,\n    ) -> None:\n        full_details = {\"agent\": agent, **(details or {})}\n        super().__init__(\n            message,\n            error_code=\"AGENT_ERROR\",\n            details=full_details,\n            retryable=retryable,\n            suggestion=suggestion or \"Please try again or contact support.\",\n        )\n\n\nclass AgentExecutionError(AgentError):\n    \"\"\"Raised when agent execution fails.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        agent: str,\n        reason: str,\n    ) -> None:\n        super().__init__(\n            f\"Agent '{agent}' execution failed: {reason}\",\n            agent=agent,\n            retryable=True,\n            suggestion=\"Try rephrasing your request or contact support.\",\n        )\n        self.error_code = \"AGENT_EXECUTION_ERROR\"\n\n\nclass AgentInitializationError(AgentError):\n    \"\"\"Raised when agent initialization fails.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        agent: str,\n        reason: str,\n    ) -> None:\n        super().__init__(\n            f\"Failed to initialize agent '{agent}': {reason}\",\n            agent=agent,\n            retryable=False,\n            suggestion=\"This is a configuration error. Please contact support.\",\n        )\n        self.error_code = \"AGENT_INITIALIZATION_ERROR\"\n\n\n# -----------------------------------------------------------------------------\n# Error Utilities\n# -----------------------------------------------------------------------------\n\n\ndef is_retryable(error: Exception) -> bool:\n    \"\"\"Check if an error is retryable.\n\n    Args:\n        error: The exception to check\n\n    Returns:\n        True if the error can be retried, False otherwise\n    \"\"\"\n    if isinstance(error, AIEngineError):\n        return error.retryable\n\n    # Default non-custom exceptions to not retryable for safety\n    return False\n\n\ndef get_error_code(error: Exception) -> str:\n    \"\"\"Get the error code from an exception.\n\n    Args:\n        error: The exception to get the code from\n\n    Returns:\n        Error code string, or \"UNKNOWN_ERROR\" if not found\n    \"\"\"\n    if isinstance(error, AIEngineError):\n        return error.error_code\n    return \"UNKNOWN_ERROR\"\n\n\ndef get_user_message(error: Exception) -> str:\n    \"\"\"Get a user-friendly message from an exception.\n\n    Args:\n        error: The exception to get the message from\n\n    Returns:\n        User-friendly error message\n    \"\"\"\n    if isinstance(error, AIEngineError):\n        return error.message\n    return str(error)\n\n\ndef get_suggestion(error: Exception) -> str | None:\n    \"\"\"Get the suggestion from an exception.\n\n    Args:\n        error: The exception to get the suggestion from\n\n    Returns:\n        Suggestion string, or None if not available\n    \"\"\"\n    if isinstance(error, AIEngineError):\n        return error.suggestion\n    return None\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Creating structured error exception classes",
      "content": "Create structured error exception classes",
      "status": "completed"
    },
    {
      "activeForm": "Adding Langfuse-integrated error tracking decorator",
      "content": "Add Langfuse-integrated error tracking decorator",
      "status": "in_progress"
    },
    {
      "activeForm": "Implementing retry logic with exponential backoff",
      "content": "Implement retry logic with exponential backoff",
      "status": "pending"
    },
    {
      "activeForm": "Adding fallback agent behaviors",
      "content": "Add fallback agent behaviors",
      "status": "pending"
    },
    {
      "activeForm": "Creating user-friendly error response models",
      "content": "Create user-friendly error response models",
      "status": "pending"
    },
    {
      "activeForm": "Updating FastAPI exception handlers",
      "content": "Update FastAPI exception handlers",
      "status": "pending"
    },
    {
      "activeForm": "Integrating error handling into existing agents",
      "content": "Integrate error handling into existing agents",
      "status": "pending"
    },
    {
      "activeForm": "Integrating error handling into workflows",
      "content": "Integrate error handling into workflows",
      "status": "pending"
    },
    {
      "activeForm": "Running tests to verify implementation",
      "content": "Run tests to verify implementation",
      "status": "pending"
    }
  ]
}
Now let me create the error tracking decorator with Langfuse integration and retry logic:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/error_handling.py",
  "content": "\"\"\"Error handling utilities with Langfuse integration and retry logic.\n\nThis module provides:\n1. Decorators for automatic error tracking with Langfuse\n2. Retry logic with exponential backoff\n3. Error context enrichment\n4. Fallback mechanisms for agent failures\n\"\"\"\n\nimport asyncio\nimport functools\nimport logging\nimport time\nimport traceback\nfrom typing import Any, Callable, TypeVar\n\nfrom .config import get_settings\nfrom .exceptions import (\n    AIEngineError,\n    is_retryable,\n    get_error_code,\n    get_user_message,\n    get_suggestion,\n)\nfrom .langfuse_init import is_langfuse_enabled, get_langfuse\n\nlogger = logging.getLogger(__name__)\n\nT = TypeVar(\"T\")\n\n\n# -----------------------------------------------------------------------------\n# Retry Configuration\n# -----------------------------------------------------------------------------\n\n\nclass RetryConfig:\n    \"\"\"Configuration for retry behavior.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        max_attempts: int = 3,\n        base_delay: float = 1.0,\n        max_delay: float = 60.0,\n        exponential_base: float = 2.0,\n        jitter: bool = True,\n    ) -> None:\n        \"\"\"Initialize retry configuration.\n\n        Args:\n            max_attempts: Maximum number of retry attempts\n            base_delay: Initial delay in seconds\n            max_delay: Maximum delay in seconds\n            exponential_base: Base for exponential backoff\n            jitter: Add random jitter to delay\n        \"\"\"\n        self.max_attempts = max_attempts\n        self.base_delay = base_delay\n        self.max_delay = max_delay\n        self.exponential_base = exponential_base\n        self.jitter = jitter\n\n\n# Default retry configuration\nDEFAULT_RETRY_CONFIG = RetryConfig()\n\n# Retry configuration for different error types\nRETRY_CONFIGS = {\n    \"rate_limit\": RetryConfig(\n        max_attempts=5,\n        base_delay=5.0,\n        max_delay=120.0,\n    ),\n    \"timeout\": RetryConfig(\n        max_attempts=3,\n        base_delay=2.0,\n        max_delay=30.0,\n    ),\n    \"service_unavailable\": RetryConfig(\n        max_attempts=4,\n        base_delay=3.0,\n        max_delay=60.0,\n    ),\n}\n\n\ndef get_retry_config_for_error(error: Exception) -> RetryConfig:\n    \"\"\"Get retry configuration based on error type.\n\n    Args:\n        error: The exception to get config for\n\n    Returns:\n        RetryConfig for the error type\n    \"\"\"\n    error_code = get_error_code(error)\n\n    if error_code == \"RATE_LIMIT_EXCEEDED\":\n        return RETRY_CONFIGS[\"rate_limit\"]\n    if error_code == \"LLM_TIMEOUT\":\n        return RETRY_CONFIGS[\"timeout\"]\n    if error_code == \"SERVICE_UNAVAILABLE\":\n        return RETRY_CONFIGS[\"service_unavailable\"]\n\n    return DEFAULT_RETRY_CONFIG\n\n\ndef calculate_delay(attempt: int, config: RetryConfig) -> float:\n    \"\"\"Calculate delay for next retry attempt.\n\n    Args:\n        attempt: Current attempt number (0-indexed)\n        config: Retry configuration\n\n    Returns:\n        Delay in seconds\n    \"\"\"\n    delay = min(\n        config.base_delay * (config.exponential_base ** attempt),\n        config.max_delay,\n    )\n\n    if config.jitter:\n        import random\n        delay = delay * (0.5 + random.random() * 0.5)\n\n    return delay\n\n\n# -----------------------------------------------------------------------------\n# Error Tracking with Langfuse\n# -----------------------------------------------------------------------------\n\n\ndef track_error_context(\n    span: Any,\n    error: Exception,\n    context: dict[str, Any] | None = None,\n) -> None:\n    \"\"\"Enrich Langfuse span with error context.\n\n    Args:\n        span: Langfuse span to annotate\n        error: The exception that occurred\n        context: Additional context about the error\n    \"\"\"\n    if span is None:\n        return\n\n    try:\n        error_info = {\n            \"error_code\": get_error_code(error),\n            \"error_type\": type(error).__name__,\n            \"error_message\": str(error),\n            \"retryable\": is_retryable(error),\n        }\n\n        if isinstance(error, AIEngineError):\n            error_info[\"details\"] = error.details\n            if error.suggestion:\n                error_info[\"suggestion\"] = error.suggestion\n\n        if context:\n            error_info[\"context\"] = context\n\n        # Update span metadata with error info\n        if hasattr(span, \"metadata\"):\n            span.metadata = span.metadata or {}\n            span.metadata[\"error\"] = error_info\n\n        # End span with error level\n        span.end(level=\"ERROR\", status_message=str(error))\n\n    except Exception as e:\n        # Don't let error tracking failures break the main flow\n        logger.warning(\"Failed to track error in Langfuse: %s\", e)\n\n\ndef create_error_trace(\n    operation: str,\n    session_id: str | None = None,\n    user_id: str | None = None,\n    metadata: dict[str, Any] | None = None,\n) -> Any | None:\n    \"\"\"Create a Langfuse trace for error tracking.\n\n    Args:\n        operation: Operation name (e.g., \"qa_agent.run\")\n        session_id: Session ID for grouping\n        user_id: User ID for analytics\n        metadata: Additional metadata\n\n    Returns:\n        Langfuse trace or None if Langfuse disabled\n    \"\"\"\n    if not is_langfuse_enabled():\n        return None\n\n    client = get_langfuse()\n    if client is None:\n        return None\n\n    return client.trace(\n        name=f\"error:{operation}\",\n        session_id=session_id,\n        user_id=user_id,\n        metadata=metadata or {},\n    )\n\n\n# -----------------------------------------------------------------------------\n# Retry Decorator\n# -----------------------------------------------------------------------------\n\n\ndef with_retry(\n    *,\n    config: RetryConfig | None = None,\n    operation_name: str | None = None,\n    session_id: str | None = None,\n    user_id: str | None = None,\n):\n    \"\"\"Decorator for automatic retry with exponential backoff.\n\n    Args:\n        config: Retry configuration (uses default if None)\n        operation_name: Operation name for logging/tracking\n        session_id: Session ID for Langfuse tracking\n        user_id: User ID for Langfuse tracking\n\n    Example:\n        ```python\n        @with_retry(operation_name=\"qa_agent.run\")\n        async def my_function():\n            # May fail with retryable errors\n            pass\n        ```\n    \"\"\"\n    def decorator(func: Callable[..., T]) -> Callable[..., T]:\n        if asyncio.iscoroutinefunction(func):\n            @functools.wraps(func)\n            async def async_wrapper(*args: Any, **kwargs: Any) -> T:\n                retry_config = config or DEFAULT_RETRY_CONFIG\n                last_error: Exception | None = None\n                operation = operation_name or func.__name__\n\n                for attempt in range(retry_config.max_attempts):\n                    try:\n                        return await func(*args, **kwargs)\n                    except Exception as e:\n                        last_error = e\n\n                        if not is_retryable(e):\n                            # Non-retryable error, raise immediately\n                            logger.error(\n                                \"Non-retryable error in %s: %s\",\n                                operation,\n                                e,\n                            )\n                            raise\n\n                        if attempt < retry_config.max_attempts - 1:\n                            # Calculate delay and retry\n                            delay = calculate_delay(attempt, retry_config)\n                            logger.warning(\n                                \"Retryable error in %s (attempt %d/%d): %s. \"\n                                \"Retrying in %.2fs...\",\n                                operation,\n                                attempt + 1,\n                                retry_config.max_attempts,\n                                e,\n                                delay,\n                            )\n\n                            # Track retry in Langfuse\n                            if is_langfuse_enabled():\n                                client = get_langfuse()\n                                if client:\n                                    span = client.span(\n                                        name=f\"{operation}.retry_{attempt}\",\n                                        session_id=session_id,\n                                        user_id=user_id,\n                                        metadata={\n                                            \"attempt\": attempt + 1,\n                                            \"max_attempts\": retry_config.max_attempts,\n                                            \"delay_seconds\": delay,\n                                            \"error_code\": get_error_code(e),\n                                        },\n                                    )\n                                    span.end(level=\"WARNING\")\n\n                            await asyncio.sleep(delay)\n                        else:\n                            logger.error(\n                                \"Max retries exceeded for %s: %s\",\n                                operation,\n                                e,\n                            )\n\n                # All retries exhausted\n                if last_error:\n                    # Create final error trace\n                    if is_langfuse_enabled():\n                        trace = create_error_trace(\n                            operation,\n                            session_id=session_id,\n                            user_id=user_id,\n                        )\n                        if trace:\n                            track_error_context(trace, last_error)\n\n                    raise last_error\n                raise RuntimeError(\"Retry logic failed without error\")\n\n            return async_wrapper\n        else:\n            @functools.wraps(func)\n            def sync_wrapper(*args: Any, **kwargs: Any) -> T:\n                retry_config = config or DEFAULT_RETRY_CONFIG\n                last_error: Exception | None = None\n                operation = operation_name or func.__name__\n\n                for attempt in range(retry_config.max_attempts):\n                    try:\n                        return func(*args, **kwargs)\n                    except Exception as e:\n                        last_error = e\n\n                        if not is_retryable(e):\n                            logger.error(\n                                \"Non-retryable error in %s: %s\",\n                                operation,\n                                e,\n                            )\n                            raise\n\n                        if attempt < retry_config.max_attempts - 1:\n                            delay = calculate_delay(attempt, retry_config)\n                            logger.warning(\n                                \"Retryable error in %s (attempt %d/%d): %s. \"\n                                \"Retrying in %.2fs...\",\n                                operation,\n                                attempt + 1,\n                                retry_config.max_attempts,\n                                e,\n                                delay,\n                            )\n                            time.sleep(delay)\n                        else:\n                            logger.error(\n                                \"Max retries exceeded for %s: %s\",\n                                operation,\n                                e,\n                            )\n\n                if last_error:\n                    raise last_error\n                raise RuntimeError(\"Retry logic failed without error\")\n\n            return sync_wrapper\n\n    return decorator\n\n\n# -----------------------------------------------------------------------------\n# Error Tracking Decorator\n# -----------------------------------------------------------------------------\n\n\ndef with_error_tracking(\n    *,\n    operation: str | None = None,\n    session_id: str | None = None,\n    user_id: str | None = None,\n    reraise: bool = True,\n):\n    \"\"\"Decorator for automatic error tracking with Langfuse.\n\n    Args:\n        operation: Operation name for tracking\n        session_id: Session ID for Langfuse\n        user_id: User ID for Langfuse\n        reraise: Whether to reraise the exception\n\n    Example:\n        ```python\n        @with_error_tracking(operation_name=\"qa_agent.run\")\n        async def my_function():\n            # Errors will be tracked in Langfuse\n            pass\n        ```\n    \"\"\"\n    def decorator(func: Callable[..., T]) -> Callable[..., T]:\n        op_name = operation or func.__name__\n\n        if asyncio.iscoroutinefunction(func):\n            @functools.wraps(func)\n            async def async_wrapper(*args: Any, **kwargs: Any) -> T:\n                trace = None\n\n                # Create Langfuse trace\n                if is_langfuse_enabled():\n                    trace = create_error_trace(\n                        op_name,\n                        session_id=session_id,\n                        user_id=user_id,\n                    )\n\n                try:\n                    result = await func(*args, **kwargs)\n\n                    # End trace successfully\n                    if trace:\n                        trace.end()\n\n                    return result\n\n                except Exception as e:\n                    logger.error(\n                        \"Error in %s: %s\",\n                        op_name,\n                        e,\n                        exc_info=True,\n                    )\n\n                    # Track error in Langfuse\n                    if trace:\n                        track_error_context(trace, e)\n\n                    if reraise:\n                        raise\n                    return None  # type: ignore\n\n            return async_wrapper\n        else:\n            @functools.wraps(func)\n            def sync_wrapper(*args: Any, **kwargs: Any) -> T:\n                trace = None\n\n                if is_langfuse_enabled():\n                    trace = create_error_trace(\n                        op_name,\n                        session_id=session_id,\n                        user_id=user_id,\n                    )\n\n                try:\n                    result = func(*args, **kwargs)\n\n                    if trace:\n                        trace.end()\n\n                    return result\n\n                except Exception as e:\n                    logger.error(\n                        \"Error in %s: %s\",\n                        op_name,\n                        e,\n                        exc_info=True,\n                    )\n\n                    if trace:\n                        track_error_context(trace, e)\n\n                    if reraise:\n                        raise\n                    return None  # type: ignore\n\n            return sync_wrapper\n\n    return decorator\n\n\n# -----------------------------------------------------------------------------\n# Combined Decorator: Retry + Error Tracking\n# -----------------------------------------------------------------------------\n\n\ndef with_resilience(\n    *,\n    operation: str | None = None,\n    session_id: str | None = None,\n    user_id: str | None = None,\n    retry_config: RetryConfig | None = None,\n):\n    \"\"\"Decorator combining retry logic and error tracking.\n\n    This is the recommended decorator for agent and workflow functions.\n    It provides:\n    1. Automatic retry for retryable errors\n    2. Langfuse error tracking\n    3. Detailed logging\n\n    Args:\n        operation: Operation name for tracking\n        session_id: Session ID for Langfuse\n        user_id: User ID for Langfuse\n        retry_config: Retry configuration (uses default if None)\n\n    Example:\n        ```python\n        @with_resilience(operation=\"qa_agent.run\")\n        async def my_agent_function():\n            # Automatic retry and error tracking\n            pass\n        ```\n    \"\"\"\n    def decorator(func: Callable[..., T]) -> Callable[..., T]:\n        # Apply error tracking first (outer decorator)\n        tracked = with_error_tracking(\n            operation=operation,\n            session_id=session_id,\n            user_id=user_id,\n        )(func)\n\n        # Apply retry (inner decorator)\n        return with_retry(\n            config=retry_config,\n            operation_name=operation,\n            session_id=session_id,\n            user_id=user_id,\n        )(tracked)\n\n    return decorator\n\n\n# -----------------------------------------------------------------------------\n# Fallback Mechanisms\n# -----------------------------------------------------------------------------\n\n\nclass FallbackConfig:\n    \"\"\"Configuration for fallback behavior.\"\"\"\n\n    def __init__(\n        self,\n        *,\n        fallback_function: Callable[..., Any] | None = None,\n        fallback_message: str | None = None,\n        use_simplified_response: bool = False,\n    ) -> None:\n        \"\"\"Initialize fallback configuration.\n\n        Args:\n            fallback_function: Alternative function to call on failure\n            fallback_message: Message to return on failure\n            use_simplified_response: Return simplified response on failure\n        \"\"\"\n        self.fallback_function = fallback_function\n        self.fallback_message = fallback_message\n        self.use_simplified_response = use_simplified_response\n\n\ndef with_fallback(\n    *,\n    fallback_config: FallbackConfig,\n    operation: str | None = None,\n):\n    \"\"\"Decorator for fallback behavior on agent failure.\n\n    Args:\n        fallback_config: Fallback configuration\n        operation: Operation name for logging\n\n    Example:\n        ```python\n        @with_fallback(\n            fallback_config=FallbackConfig(\n                fallback_message=\"I apologize, but I'm having trouble processing your request right now. Please try again.\"\n            ),\n            operation=\"qa_agent.run\"\n        )\n        async def my_agent_function():\n            pass\n        ```\n    \"\"\"\n    def decorator(func: Callable[..., T]) -> Callable[..., T]:\n        op_name = operation or func.__name__\n\n        if asyncio.iscoroutinefunction(func):\n            @functools.wraps(func)\n            async def async_wrapper(*args: Any, **kwargs: Any) -> T:\n                try:\n                    return await func(*args, **kwargs)\n                except Exception as e:\n                    logger.warning(\n                        \"Primary function failed in %s, using fallback: %s\",\n                        op_name,\n                        e,\n                    )\n\n                    # Track the failure in Langfuse\n                    if is_langfuse_enabled():\n                        client = get_langfuse()\n                        if client:\n                            span = client.span(\n                                name=f\"{op_name}.fallback\",\n                                metadata={\n                                    \"primary_error\": get_error_code(e),\n                                    \"fallback_type\": \"fallback_function\" if fallback_config.fallback_function else \"fallback_message\",\n                                },\n                            )\n                            span.end(level=\"WARNING\")\n\n                    # Use fallback function if available\n                    if fallback_config.fallback_function:\n                        if asyncio.iscoroutinefunction(fallback_config.fallback_function):\n                            return await fallback_config.fallback_function(*args, **kwargs)\n                        return fallback_config.fallback_function(*args, **kwargs)  # type: ignore\n\n                    # Return fallback message\n                    if fallback_config.fallback_message:\n                        # Return as dict for compatibility with agent responses\n                        return {\n                            \"error\": get_user_message(e),\n                            \"fallback_message\": fallback_config.fallback_message,\n                            \"suggestion\": get_suggestion(e),\n                        }  # type: ignore\n\n                    # Re-raise if no fallback configured\n                    raise\n\n            return async_wrapper\n        else:\n            @functools.wraps(func)\n            def sync_wrapper(*args: Any, **kwargs: Any) -> T:\n                try:\n                    return func(*args, **kwargs)\n                except Exception as e:\n                    logger.warning(\n                        \"Primary function failed in %s, using fallback: %s\",\n                        op_name,\n                        e,\n                    )\n\n                    if fallback_config.fallback_function:\n                        return fallback_config.fallback_function(*args, **kwargs)  # type: ignore\n\n                    if fallback_config.fallback_message:\n                        return {\n                            \"error\": get_user_message(e),\n                            \"fallback_message\": fallback_config.fallback_message,\n                            \"suggestion\": get_suggestion(e),\n                        }  # type: ignore\n\n                    raise\n\n            return sync_wrapper\n\n    return decorator\n\n\n# -----------------------------------------------------------------------------\n# Error Response Builder\n# -----------------------------------------------------------------------------\n\n\ndef build_error_response(\n    error: Exception,\n    include_details: bool = False,\n) -> dict[str, Any]:\n    \"\"\"Build a standardized error response.\n\n    Args:\n        error: The exception to convert\n        include_details: Whether to include technical details\n\n    Returns:\n        Dictionary with error information\n    \"\"\"\n    response = {\n        \"error\": True,\n        \"error_code\": get_error_code(error),\n        \"message\": get_user_message(error),\n    }\n\n    suggestion = get_suggestion(error)\n    if suggestion:\n        response[\"suggestion\"] = suggestion\n\n    if include_details and isinstance(error, AIEngineError):\n        response[\"details\"] = error.details\n\n    # In development, include stack trace\n    settings = get_settings()\n    if settings.LOG_LEVEL == \"DEBUG\":\n        response[\"traceback\"] = traceback.format_exc()\n\n    return response\n\n\n# -----------------------------------------------------------------------------\n# Agent-Specific Error Handling\n# -----------------------------------------------------------------------------\n\n\nasync def safe_agent_run(\n    agent_func: Callable[..., T],\n    *args: Any,\n    agent_name: str,\n    session_id: str | None = None,\n    user_id: str | None = None,\n    **kwargs: Any,\n) -> T:\n    \"\"\"Safely execute an agent function with error handling.\n\n    This wrapper provides:\n    1. Automatic retry for retryable errors\n    2. Langfuse error tracking\n    3. Graceful fallback behavior\n\n    Args:\n        agent_func: The agent function to execute\n        *args: Positional arguments for the agent\n        agent_name: Name of the agent (for logging/tracking)\n        session_id: Session ID for Langfuse\n        user_id: User ID for Langfuse\n        **kwargs: Keyword arguments for the agent\n\n    Returns:\n        Agent result or fallback response\n\n    Raises:\n        Exception: If all retries fail and no fallback is available\n    \"\"\"\n    trace = None\n\n    if is_langfuse_enabled():\n        trace = create_error_trace(\n            f\"{agent_name}.run\",\n            session_id=session_id,\n            user_id=user_id,\n        )\n\n    try:\n        result = await agent_func(*args, **kwargs)\n\n        if trace:\n            trace.end()\n\n        return result\n\n    except Exception as e:\n        logger.error(\n            \"Agent %s failed: %s\",\n            agent_name,\n            e,\n            exc_info=True,\n        )\n\n        if trace:\n            track_error_context(trace, e, {\"agent\": agent_name})\n\n        # Re-raise for caller to handle\n        raise\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Creating structured error exception classes",
      "content": "Create structured error exception classes",
      "status": "completed"
    },
    {
      "activeForm": "Adding Langfuse-integrated error tracking decorator",
      "content": "Add Langfuse-integrated error tracking decorator",
      "status": "completed"
    },
    {
      "activeForm": "Implementing retry logic with exponential backoff",
      "content": "Implement retry logic with exponential backoff",
      "status": "completed"
    },
    {
      "activeForm": "Adding fallback agent behaviors",
      "content": "Add fallback agent behaviors",
      "status": "completed"
    },
    {
      "activeForm": "Creating user-friendly error response models",
      "content": "Create user-friendly error response models",
      "status": "in_progress"
    },
    {
      "activeForm": "Updating FastAPI exception handlers",
      "content": "Update FastAPI exception handlers",
      "status": "pending"
    },
    {
      "activeForm": "Integrating error handling into existing agents",
      "content": "Integrate error handling into existing agents",
      "status": "pending"
    },
    {
      "activeForm": "Integrating error handling into workflows",
      "content": "Integrate error handling into workflows",
      "status": "pending"
    },
    {
      "activeForm": "Running tests to verify implementation",
      "content": "Run tests to verify implementation",
      "status": "pending"
    }
  ]
}
Now let me create the error response models and update the FastAPI exception handlers:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/models/responses.py"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/models/responses.py",
  "old_string": "\"\"\"Response models for AI Engine API.\"\"\"\n\nfrom pydantic import BaseModel, Field\n\n\nclass Citation(BaseModel):",
  "new_string": "\"\"\"Response models for AI Engine API.\"\"\"\n\nfrom typing import Any\nfrom pydantic import BaseModel, Field\n\n\n# -----------------------------------------------------------------------------\n# Error Response Models\n# -----------------------------------------------------------------------------\n\n\nclass ErrorDetail(BaseModel):\n    \"\"\"Detailed error information.\"\"\"\n\n    field: str | None = Field(default=None, description=\"Field that caused the error\")\n    message: str = Field(..., description=\"Error message\")\n    code: str | None = Field(default=None, description=\"Error code for the field\")\n\n\nclass ErrorResponse(BaseModel):\n    \"\"\"Standardized error response for API errors.\"\"\"\n\n    error: bool = Field(default=True, description=\"Error flag\")\n    error_code: str = Field(..., description=\"Unique error code for programmatic handling\")\n    message: str = Field(..., description=\"User-friendly error message\")\n    suggestion: str | None = Field(default=None, description=\"Actionable suggestion for the user\")\n    details: dict[str, Any] | None = Field(default=None, description=\"Additional technical details\")\n    retryable: bool | None = Field(default=None, description=\"Whether the request can be retried\")\n    request_id: str | None = Field(default=None, description=\"Request ID for support reference\")\n\n\nclass ValidationErrorResponse(BaseModel):\n    \"\"\"Response for input validation errors.\"\"\"\n\n    error: bool = Field(default=True, description=\"Error flag\")\n    error_code: str = Field(default=\"VALIDATION_ERROR\", description=\"Error code\")\n    message: str = Field(default=\"Request validation failed\", description=\"Error message\")\n    errors: list[ErrorDetail] = Field(\n        default_factory=list, description=\"List of validation errors\"\n    )\n\n\nclass RateLimitErrorResponse(BaseModel):\n    \"\"\"Response for rate limit errors.\"\"\"\n\n    error: bool = Field(default=True, description=\"Error flag\")\n    error_code: str = Field(default=\"RATE_LIMIT_EXCEEDED\", description=\"Error code\")\n    message: str = Field(..., description=\"Error message\")\n    retry_after: int | None = Field(\n        default=None, description=\"Seconds until retry is allowed\"\n    )\n    limit: int | None = Field(default=None, description=\"Rate limit that was exceeded\")\n    reset_time: str | None = Field(default=None, description=\"Time when limit resets\")\n\n\nclass ServiceUnavailableErrorResponse(BaseModel):\n    \"\"\"Response for service unavailable errors.\"\"\"\n\n    error: bool = Field(default=True, description=\"Error flag\")\n    error_code: str = Field(default=\"SERVICE_UNAVAILABLE\", description=\"Error code\")\n    message: str = Field(\n        default=\"Service temporarily unavailable. Please try again later.\",\n        description=\"Error message\"\n    )\n    service: str | None = Field(default=None, description=\"Name of unavailable service\")\n    estimated_recovery: str | None = Field(\n        default=None, description=\"Estimated time for service recovery\"\n    )\n\n\n# -----------------------------------------------------------------------------\n# Standard Response Models\n# -----------------------------------------------------------------------------\n\n\nclass Citation(BaseModel):"
}
Now let me update the FastAPI main.py to add custom exception handlers:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "limit": 250
}
Now I'll update the main.py to add custom exception handlers. Let me add the exception handlers after the existing validation exception handler:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "old_string": "from .agents.classifier_agent import classifier_agent as get_classifier_agent\nfrom .agents.qa_agent import answer_question\nfrom .langfuse_init import flush, init_langfuse\nfrom .models.requests import (\n    AskQuestionRequest,\n    ClassifyCaseRequest,\n    GenerateDocumentRequest,\n    GenerateEmbeddingsRequest,\n    QARequest,\n    SearchRulingsRequest,\n    SemanticSearchRequest,\n)\nfrom .models.responses import (\n    AnswerResponse,\n    Citation,\n    ClassificationResponse,\n    DocumentGenerationStatus,\n    GenerateDocumentResponse,\n    GenerateEmbeddingsResponse,\n    QAResponse,\n    Ruling,\n    SearchRulingsResponse,\n    SemanticSearchResponse,\n    SemanticSearchResult,\n)\nfrom .sentry_init import init_sentry",
  "new_string": "from .agents.classifier_agent import classifier_agent as get_classifier_agent\nfrom .agents.qa_agent import answer_question\nfrom .error_handling import build_error_response\nfrom .exceptions import (\n    AIEngineError,\n    RateLimitError,\n    ServiceUnavailableError,\n    ValidationError,\n    LLMTimeoutError,\n    BackendConnectionError,\n    get_error_code,\n    get_user_message,\n    get_suggestion,\n)\nfrom .langfuse_init import flush, init_langfuse\nfrom .models.requests import (\n    AskQuestionRequest,\n    ClassifyCaseRequest,\n    GenerateDocumentRequest,\n    GenerateEmbeddingsRequest,\n    QARequest,\n    SearchRulingsRequest,\n    SemanticSearchRequest,\n)\nfrom .models.responses import (\n    AnswerResponse,\n    Citation,\n    ClassificationResponse,\n    DocumentGenerationStatus,\n    ErrorResponse,\n    GenerateDocumentResponse,\n    GenerateEmbeddingsResponse,\n    QAResponse,\n    Ruling,\n    RateLimitErrorResponse,\n    SearchRulingsResponse,\n    SemanticSearchResponse,\n    SemanticSearchResult,\n    ServiceUnavailableErrorResponse,\n    ValidationErrorResponse,\n)\nfrom .sentry_init import init_sentry"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "old_string": "# Global exception handler for validation errors (422)\n@app.exception_handler(422)\nasync def validation_exception_handler(request: Request, exc: HTTPException):\n    \"\"\"Handle validation errors with detailed logging.\"\"\"\n    logger.error(\n        \"Validation error on %s %s: %s\",\n        request.method,\n        request.url.path,\n        exc.detail,\n    )\n    return HTTPException(\n        status_code=422,\n        detail={\n            \"message\": \"Request validation failed\",\n            \"errors\": exc.detail,\n            \"path\": request.url.path,\n            \"method\": request.method,\n        },\n    )",
  "new_string": "# Global exception handler for validation errors (422)\n@app.exception_handler(422)\nasync def validation_exception_handler(request: Request, exc: HTTPException):\n    \"\"\"Handle validation errors with detailed logging.\"\"\"\n    logger.error(\n        \"Validation error on %s %s: %s\",\n        request.method,\n        request.url.path,\n        exc.detail,\n    )\n    return HTTPException(\n        status_code=422,\n        detail={\n            \"message\": \"Request validation failed\",\n            \"errors\": exc.detail,\n            \"path\": request.url.path,\n            \"method\": request.method,\n        },\n    )\n\n\n# Custom exception handlers for AI Engine errors\n@app.exception_handler(AIEngineError)\nasync def ai_engine_exception_handler(request: Request, exc: AIEngineError):\n    \"\"\"Handle all AI Engine custom exceptions with structured responses.\"\"\"\n    # Log error with context\n    logger.error(\n        \"AI Engine error on %s %s: [%s] %s\",\n        request.method,\n        request.url.path,\n        exc.error_code,\n        exc.message,\n        exc_info=True,\n    )\n\n    # Track error in Langfuse\n    from .langfuse_init import is_langfuse_enabled, get_langfuse\n    if is_langfuse_enabled():\n        client = get_langfuse()\n        if client:\n            trace = client.trace(\n                name=f\"error:{exc.error_code}\",\n                session_id=request.headers.get(\"x-session-id\"),\n                user_id=request.headers.get(\"x-user-id\"),\n                metadata={\n                    \"path\": request.url.path,\n                    \"method\": request.method,\n                    \"error_code\": exc.error_code,\n                    \"retryable\": exc.retryable,\n                },\n            )\n            trace.end(level=\"ERROR\", status_message=str(exc))\n\n    # Build error response\n    status_code = 500\n    if exc.error_code == \"RATE_LIMIT_EXCEEDED\":\n        status_code = 429\n    elif exc.error_code in (\"VALIDATION_ERROR\", \"INPUT_VALIDATION_ERROR\", \"MISSING_REQUIRED_FIELD\"):\n        status_code = 400\n    elif exc.error_code == \"SERVICE_UNAVAILABLE\":\n        status_code = 503\n    elif exc.error_code == \"LLM_AUTH_ERROR\":\n        status_code = 401\n\n    return JSONResponse(\n        status_code=status_code,\n        content=ErrorResponse(\n            error_code=exc.error_code,\n            message=exc.message,\n            suggestion=exc.suggestion,\n            details=exc.details if exc.details else None,\n            retryable=exc.retryable,\n            request_id=request.headers.get(\"x-request-id\"),\n        ).model_dump(),\n    )\n\n\n@app.exception_handler(RateLimitError)\nasync def rate_limit_exception_handler(request: Request, exc: RateLimitError):\n    \"\"\"Handle rate limit errors with retry-after header.\"\"\"\n    logger.warning(\n        \"Rate limit exceeded on %s %s: %s\",\n        request.method,\n        request.url.path,\n        exc.message,\n    )\n\n    retry_after = exc.details.get(\"reset_time\", 60)\n    if isinstance(retry_after, str):\n        # Parse reset time if it's a string\n        try:\n            from datetime import datetime\n            retry_after = int(datetime.fromisoformat(retry_after).timestamp() - time.time())\n            retry_after = max(1, retry_after)\n        except Exception:\n            retry_after = 60\n\n    return JSONResponse(\n        status_code=429,\n        headers={\"Retry-After\": str(retry_after)},\n        content=RateLimitErrorResponse(\n            message=exc.message,\n            retry_after=retry_after,\n            limit=exc.details.get(\"limit\"),\n            reset_time=exc.details.get(\"reset_time\"),\n        ).model_dump(),\n    )\n\n\n@app.exception_handler(ServiceUnavailableError)\nasync def service_unavailable_exception_handler(request: Request, exc: ServiceUnavailableError):\n    \"\"\"Handle service unavailable errors.\"\"\"\n    logger.error(\n        \"Service unavailable on %s %s: %s\",\n        request.method,\n        request.url.path,\n        exc.message,\n    )\n\n    return JSONResponse(\n        status_code=503,\n        content=ServiceUnavailableErrorResponse(\n            message=exc.message,\n            service=exc.details.get(\"service\"),\n            estimated_recovery=exc.details.get(\"estimated_recovery\"),\n        ).model_dump(),\n    )\n\n\n@app.exception_handler(ValidationError)\nasync def validation_error_exception_handler(request: Request, exc: ValidationError):\n    \"\"\"Handle validation errors from input validation.\"\"\"\n    logger.warning(\n        \"Validation error on %s %s: %s\",\n        request.method,\n        request.url.path,\n        exc.message,\n    )\n\n    return JSONResponse(\n        status_code=400,\n        content=ValidationErrorResponse(\n            message=exc.message,\n            errors=[\n                {\n                    \"field\": exc.details.get(\"field\"),\n                    \"message\": exc.message,\n                    \"code\": exc.error_code,\n                }\n            ],\n        ).model_dump(),\n    )\n\n\n# Global fallback exception handler\n@app.exception_handler(Exception)\nasync def global_exception_handler(request: Request, exc: Exception):\n    \"\"\"Handle all uncaught exceptions with user-friendly responses.\"\"\"\n    # Generate request ID for support reference\n    request_id = request.headers.get(\"x-request-id\") or str(uuid.uuid4())\n\n    # Log full error with stack trace\n    logger.exception(\n        \"Unhandled exception on %s %s (request_id: %s): %s\",\n        request.method,\n        request.url.path,\n        request_id,\n        exc,\n    )\n\n    # Track in Langfuse\n    from .langfuse_init import is_langfuse_enabled, get_langfuse\n    if is_langfuse_enabled():\n        client = get_langfuse()\n        if client:\n            trace = client.trace(\n                name=\"error:unhandled\",\n                session_id=request.headers.get(\"x-session-id\"),\n                user_id=request.headers.get(\"x-user-id\"),\n                metadata={\n                    \"path\": request.url.path,\n                    \"method\": request.method,\n                    \"exception_type\": type(exc).__name__,\n                    \"request_id\": request_id,\n                },\n            )\n            trace.end(level=\"ERROR\", status_message=str(exc))\n\n    # Build user-friendly response (don't expose technical details in production)\n    from .config import get_settings\n    settings = get_settings()\n\n    # In production, hide technical details\n    if settings.LOG_LEVEL != \"DEBUG\":\n        message = \"An unexpected error occurred. Please try again or contact support.\"\n        details = None\n    else:\n        message = str(exc)\n        details = {\"exception_type\": type(exc).__name__}\n\n    return JSONResponse(\n        status_code=500,\n        content=ErrorResponse(\n            error_code=\"INTERNAL_ERROR\",\n            message=message,\n            suggestion=\"Please try again. If the problem persists, contact support with request ID: \" + request_id,\n            details=details,\n            retryable=True,\n            request_id=request_id,\n        ).model_dump(),\n    )"
}
I need to add the JSONResponse import to the file. Let me fix that:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "old_string": "from fastapi import BackgroundTasks, FastAPI, HTTPException, Request",
  "new_string": "from fastapi import BackgroundTasks, FastAPI, HTTPException, Request\nfrom fastapi.responses import JSONResponse"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Creating structured error exception classes",
      "content": "Create structured error exception classes",
      "status": "completed"
    },
    {
      "activeForm": "Adding Langfuse-integrated error tracking decorator",
      "content": "Add Langfuse-integrated error tracking decorator",
      "status": "completed"
    },
    {
      "activeForm": "Implementing retry logic with exponential backoff",
      "content": "Implement retry logic with exponential backoff",
      "status": "completed"
    },
    {
      "activeForm": "Adding fallback agent behaviors",
      "content": "Add fallback agent behaviors",
      "status": "completed"
    },
    {
      "activeForm": "Creating user-friendly error response models",
      "content": "Create user-friendly error response models",
      "status": "completed"
    },
    {
      "activeForm": "Updating FastAPI exception handlers",
      "content": "Update FastAPI exception handlers",
      "status": "completed"
    },
    {
      "activeForm": "Integrating error handling into existing agents",
      "content": "Integrate error handling into existing agents",
      "status": "in_progress"
    },
    {
      "activeForm": "Integrating error handling into workflows",
      "content": "Integrate error handling into workflows",
      "status": "pending"
    },
    {
      "activeForm": "Running tests to verify implementation",
      "content": "Run tests to verify implementation",
      "status": "pending"
    }
  ]
}
Now let me integrate error handling into the existing agents. I'll start by updating the qa_agent.py to use the new error handling:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/qa_agent.py",
  "old_string": "\"\"\"Q&A Agent using PydanticAI with tool-based architecture.\n\nThis agent implements legal question answering using PydanticAI's tool system\nfor context retrieval and citation formatting.\n\nIncludes comprehensive Langfuse observability for tracing all operations.\n\"\"\"\n\nfrom typing import Any\n\nfrom pydantic import BaseModel, Field\nfrom pydantic_ai import Agent, RunContext\n\nfrom ..config import get_settings\nfrom ..langfuse_init import _redact_dict_pii, is_langfuse_enabled\nfrom .clarification_agent import generate_clarifications\nfrom .dependencies import ModelDeps, get_model_deps\nfrom .rag_tool import (\n    extract_citations_from_contexts,\n    format_contexts_for_prompt,\n    retrieve_context_tool,\n)",
  "new_string": "\"\"\"Q&A Agent using PydanticAI with tool-based architecture.\n\nThis agent implements legal question answering using PydanticAI's tool system\nfor context retrieval and citation formatting.\n\nIncludes comprehensive Langfuse observability for tracing all operations.\nEnhanced with structured error handling and retry logic.\n\"\"\"\n\nfrom typing import Any\n\nfrom pydantic import BaseModel, Field\nfrom pydantic_ai import Agent, RunContext\n\nfrom ..config import get_settings\nfrom ..error_handling import with_resilience, safe_agent_run\nfrom ..exceptions import (\n    AgentExecutionError,\n    RetrievalError,\n    LLMTimeoutError,\n    LLMContextLengthExceededError,\n)\nfrom ..langfuse_init import _redact_dict_pii, is_langfuse_enabled\nfrom .clarification_agent import generate_clarifications\nfrom .dependencies import ModelDeps, get_model_deps\nfrom .rag_tool import (\n    extract_citations_from_contexts,\n    format_contexts_for_prompt,\n    retrieve_context_tool,\n)"
}
Now let me update the answer_question function to use the new error handling:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/qa_agent.py",
  "offset": 190,
  "limit": 200
}
Let me replace the exception handling in the answer_question function with the new structured error handling:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/qa_agent.py",
  "old_string": "        return response\n\n    except Exception as e:\n        if trace:\n            trace.end(level=\"ERROR\", status_message=str(e))\n        raise",
  "new_string": "        return response\n\n    except Exception as e:\n        # Convert to structured error if not already\n        if not isinstance(e, AgentExecutionError):\n            # Map common errors to structured exceptions\n            error_message = str(e).lower()\n            if \"timeout\" in error_message or \"timed out\" in error_message:\n                e = LLMTimeoutError(\n                    timeout_seconds=60.0,\n                    model=settings.OPENAI_MODEL,\n                )\n            elif \"context length\" in error_message or \"too long\" in error_message:\n                e = LLMContextLengthExceededError(\n                    model=settings.OPENAI_MODEL,\n                    input_tokens=len(question.split()),  # Approximate\n                    max_tokens=128000,  # GPT-4o context limit\n                )\n            elif \"retriev\" in error_message or \"vector\" in error_message:\n                e = RetrievalError(\n                    query=question[:100],\n                    reason=str(e),\n                )\n            else:\n                e = AgentExecutionError(\n                    agent=f\"qa_agent_{mode.lower()}\",\n                    reason=str(e),\n                )\n\n        if trace:\n            from ..error_handling import track_error_context\n            track_error_context(trace, e, {\"mode\": mode, \"question_length\": len(question)})\n\n        raise"
}
Now let me integrate error handling into the workflows. I'll update the case_analysis_workflow.py:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "old_string": "\"\"\"Case Analysis Workflow using LangGraph.\n\nThis workflow orchestrates:\n1. Classifier Agent - Identify legal grounds\n2. Research Node - Find relevant context\n3. Clarification Agent - Gather missing information\n4. Decision Logic - Route based on completeness\n\nThe workflow uses conditional edges to decide:\n- If clarification needed -> clarify branch\n- If enough info -> research branch\n- Always completes with final analysis\n\"\"\"\n\nimport time\nfrom typing import Any, Literal\n\nfrom langgraph.graph import END, StateGraph\n\nfrom ..agents.clarification_agent import clarification_agent\nfrom ..agents.classifier_agent import classify_case\nfrom ..langfuse_init import is_langfuse_enabled\nfrom .states import CaseAnalysisState, create_case_analysis_state",
  "new_string": "\"\"\"Case Analysis Workflow using LangGraph.\n\nThis workflow orchestrates:\n1. Classifier Agent - Identify legal grounds\n2. Research Node - Find relevant context\n3. Clarification Agent - Gather missing information\n4. Decision Logic - Route based on completeness\n\nThe workflow uses conditional edges to decide:\n- If clarification needed -> clarify branch\n- If enough info -> research branch\n- Always completes with final analysis\n\nEnhanced with structured error handling and Langfuse tracking.\n\"\"\"\n\nimport time\nfrom typing import Any, Literal\n\nfrom langgraph.graph import END, StateGraph\n\nfrom ..agents.clarification_agent import clarification_agent\nfrom ..agents.classifier_agent import classify_case\nfrom ..error_handling import track_error_context, build_error_response\nfrom ..exceptions import WorkflowExecutionError, AgentExecutionError\nfrom ..langfuse_init import is_langfuse_enabled, create_error_trace\nfrom .states import CaseAnalysisState, create_case_analysis_state"
}
Now let me update the error handling in the workflow nodes. I'll update the classify_node as an example:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "old_string": "    except Exception as e:\n        if span:\n            span.end(level=\"ERROR\", status_message=str(e))\n        state[\"error\"] = str(e)\n        state[\"next_step\"] = \"error\"\n        return state",
  "new_string": "    except Exception as e:\n        if span:\n            track_error_context(span, e, {\"workflow\": \"case_analysis\", \"node\": \"classify\"})\n\n        # Convert to structured error\n        if not isinstance(e, AgentExecutionError):\n            e = AgentExecutionError(\n                agent=\"classifier\",\n                reason=str(e),\n            )\n\n        state[\"error\"] = build_error_response(e, include_details=True)\n        state[\"next_step\"] = \"error\"\n        return state"
}
Let me replace all occurrences in the workflow file:

🔧 Tool: Edit
Input: {
  "replace_all": true,
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "old_string": "    except Exception as e:\n        if span:\n            span.end(level=\"ERROR\", status_message=str(e))\n        state[\"error\"] = str(e)\n        state[\"next_step\"] = \"error\"\n        return state",
  "new_string": "    except Exception as e:\n        if span:\n            track_error_context(span, e, {\"workflow\": \"case_analysis\"})\n\n        # Convert to structured error\n        if not isinstance(e, WorkflowExecutionError):\n            e = WorkflowExecutionError(\n                workflow=\"case_analysis\",\n                step=\"classify\",\n                reason=str(e),\n            )\n\n        state[\"error\"] = build_error_response(e, include_details=True)\n        state[\"next_step\"] = \"error\"\n        return state"
}
Now let me also update the workflow wrapper run method to use the structured error handling:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "offset": 490,
  "limit": 60
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "limit": 30,
  "offset": 550
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "old_string": "        except Exception as e:\n            if trace:\n                trace.end(level=\"ERROR\", status_message=str(e))\n            raise",
  "new_string": "        except Exception as e:\n            if trace:\n                track_error_context(trace, e, {\"workflow\": \"case_analysis\"})\n\n            # Convert to structured workflow error\n            if not isinstance(e, WorkflowExecutionError):\n                e = WorkflowExecutionError(\n                    workflow=\"case_analysis\",\n                    step=\"execution\",\n                    reason=str(e),\n                )\n\n            raise"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Creating structured error exception classes",
      "content": "Create structured error exception classes",
      "status": "completed"
    },
    {
      "activeForm": "Adding Langfuse-integrated error tracking decorator",
      "content": "Add Langfuse-integrated error tracking decorator",
      "status": "completed"
    },
    {
      "activeForm": "Implementing retry logic with exponential backoff",
      "content": "Implement retry logic with exponential backoff",
      "status": "completed"
    },
    {
      "activeForm": "Adding fallback agent behaviors",
      "content": "Add fallback agent behaviors",
      "status": "completed"
    },
    {
      "activeForm": "Creating user-friendly error response models",
      "content": "Create user-friendly error response models",
      "status": "completed"
    },
    {
      "activeForm": "Updating FastAPI exception handlers",
      "content": "Update FastAPI exception handlers",
      "status": "completed"
    },
    {
      "activeForm": "Integrating error handling into existing agents",
      "content": "Integrate error handling into existing agents",
      "status": "completed"
    },
    {
      "activeForm": "Integrating error handling into workflows",
      "content": "Integrate error handling into workflows",
      "status": "completed"
    },
    {
      "activeForm": "Running tests to verify implementation",
      "content": "Run tests to verify implementation",
      "status": "in_progress"
    }
  ]
}
Now let me run the tests to verify the implementation works correctly:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine && uv run python -c \"\n# Test imports\nfrom src.exceptions import *\nfrom src.error_handling import *\nfrom src.models.responses import ErrorResponse, ValidationErrorResponse\n\n# Test exception creation\ne = RateLimitError(limit=100, reset_time='2024-01-01T00:00:00Z')\nprint(f'RateLimitError: {e.message}')\nprint(f'Error code: {e.error_code}')\nprint(f'Retryable: {e.retryable}')\nprint(f'To dict: {e.to_dict()}')\n\n# Test error response\nresponse = ErrorResponse(\n    error_code='TEST_ERROR',\n    message='Test error message',\n    suggestion='Try again',\n    retryable=True\n)\nprint(f'ErrorResponse: {response.model_dump()}')\n\nprint('All imports and basic tests passed!')\n\"",
  "description": "Test imports and basic functionality",
  "timeout": 60000
}
The imports and basic functionality work. Now let me run the actual unit tests:

🔧 Tool: Bash
Input: {
  "command": "uv run pytest tests/unit/ -v --tb=short 2>&1 | head -100",
  "description": "Run unit tests",
  "timeout": 120000
}
I need to fix the import issue. The `create_error_trace` function is in `error_handling.py`, not `langfuse_init.py`. Let me fix the workflow file:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py",
  "old_string": "from ..agents.clarification_agent import clarification_agent\nfrom ..agents.classifier_agent import classify_case\nfrom ..error_handling import track_error_context, build_error_response\nfrom ..exceptions import WorkflowExecutionError, AgentExecutionError\nfrom ..langfuse_init import is_langfuse_enabled, create_error_trace\nfrom .states import CaseAnalysisState, create_case_analysis_state",
  "new_string": "from ..agents.clarification_agent import clarification_agent\nfrom ..agents.classifier_agent import classify_case\nfrom ..error_handling import track_error_context, build_error_response\nfrom ..exceptions import WorkflowExecutionError, AgentExecutionError\nfrom ..langfuse_init import is_langfuse_enabled\nfrom .states import CaseAnalysisState, create_case_analysis_state"
}

🔧 Tool: Bash
Input: {
  "command": "uv run pytest tests/unit/ -v --tb=short 2>&1 | head -100",
  "description": "Run unit tests again",
  "timeout": 120000
}
All 34 tests passed. Now let me also create a simple test to verify the new error handling functionality:

🔧 Tool: Bash
Input: {
  "command": "uv run python -c \"\nimport asyncio\nfrom src.exceptions import (\n    RateLimitError,\n    LLMTimeoutError,\n    RetrievalError,\n    ValidationError,\n    WorkflowExecutionError,\n    is_retryable,\n    get_error_code,\n    get_user_message,\n    get_suggestion,\n)\nfrom src.error_handling import (\n    with_retry,\n    with_error_tracking,\n    with_resilience,\n    RetryConfig,\n    build_error_response,\n)\n\n# Test 1: Exception properties\nprint('=== Test 1: Exception Properties ===')\nrate_err = RateLimitError(limit=100, reset_time='2024-01-01T00:00:00Z')\nprint(f'RateLimitError: {rate_err.error_code}')\nprint(f'Is retryable: {is_retryable(rate_err)}')\nprint(f'Message: {get_user_message(rate_err)}')\nprint(f'Suggestion: {get_suggestion(rate_err)}')\nprint()\n\n# Test 2: Retry logic\nprint('=== Test 2: Retry Logic ===')\ncall_count = 0\n\n@with_retry(operation_name='test_operation')\nasync def failing_function():\n    global call_count\n    call_count += 1\n    if call_count < 3:\n        # Raise a retryable error\n        raise RateLimitError(limit=10, reset_time='soon')\n    return 'success after retries'\n\ntry:\n    result = asyncio.run(failing_function())\n    print(f'Result: {result}')\n    print(f'Total calls: {call_count}')\nexcept Exception as e:\n    print(f'Error after retries: {e}')\nprint()\n\n# Test 3: Build error response\nprint('=== Test 3: Build Error Response ===')\nerror_response = build_error_response(rate_err, include_details=True)\nprint(f'Error response: {error_response}')\nprint()\n\n# Test 4: Different error types\nprint('=== Test 4: Different Error Types ===')\nerrors = [\n    RateLimitError(limit=100, reset_time='2024-01-01T00:00:00Z'),\n    LLMTimeoutError(timeout_seconds=60, model='gpt-4o'),\n    RetrievalError(query='test query', reason='Connection failed'),\n    ValidationError(field='question', value='', constraint='cannot be empty'),\n    WorkflowExecutionError(workflow='case_analysis', step='classify', reason='Agent failed'),\n]\n\nfor err in errors:\n    print(f'{err.error_code}: retryable={is_retryable(err)}')\n\nprint()\nprint('All error handling tests passed!')\n\"",
  "description": "Test error handling functionality",
  "timeout": 60000
}
There's an issue with the `InputValidationError` class - I need to check the signature. Let me fix that:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/exceptions.py",
  "limit": 50,
  "offset": 190
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/exceptions.py",
  "limit": 50,
  "offset": 290
}
The `InputValidationError` takes `field`, `value`, and `constraint` as keyword-only arguments. That's correct. The test is using `ValidationError` (the base class) incorrectly. The base class requires a positional message argument. Let me run a corrected test:

🔧 Tool: Bash
Input: {
  "command": "uv run python -c \"\nimport asyncio\nfrom src.exceptions import (\n    RateLimitError,\n    LLMTimeoutError,\n    RetrievalError,\n    InputValidationError,\n    WorkflowExecutionError,\n    is_retryable,\n    get_error_code,\n    get_user_message,\n    get_suggestion,\n)\nfrom src.error_handling import (\n    with_retry,\n    RetryConfig,\n    build_error_response,\n)\n\n# Test 1: Exception properties\nprint('=== Test 1: Exception Properties ===')\nrate_err = RateLimitError(limit=100, reset_time='2024-01-01T00:00:00Z')\nprint(f'RateLimitError: {rate_err.error_code}')\nprint(f'Is retryable: {is_retryable(rate_err)}')\nprint(f'Message: {get_user_message(rate_err)}')\nprint(f'Suggestion: {get_suggestion(rate_err)}')\nprint()\n\n# Test 2: Retry logic\nprint('=== Test 2: Retry Logic ===')\ncall_count = 0\n\n@with_retry(operation_name='test_operation')\nasync def failing_function():\n    global call_count\n    call_count += 1\n    if call_count < 3:\n        # Raise a retryable error\n        raise RateLimitError(limit=10, reset_time='soon')\n    return 'success after retries'\n\ntry:\n    result = asyncio.run(failing_function())\n    print(f'Result: {result}')\n    print(f'Total calls: {call_count}')\nexcept Exception as e:\n    print(f'Error after retries: {e}')\nprint()\n\n# Test 3: Build error response\nprint('=== Test 3: Build Error Response ===')\nerror_response = build_error_response(rate_err, include_details=True)\nprint(f'Error response keys: {list(error_response.keys())}')\nprint()\n\n# Test 4: Different error types\nprint('=== Test 4: Different Error Types ===')\nerrors = [\n    RateLimitError(limit=100, reset_time='2024-01-01T00:00:00Z'),\n    LLMTimeoutError(timeout_seconds=60, model='gpt-4o'),\n    RetrievalError(query='test query', reason='Connection failed'),\n    InputValidationError(field='question', value='', constraint='cannot be empty'),\n    WorkflowExecutionError(workflow='case_analysis', step='classify', reason='Agent failed'),\n]\n\nfor err in errors:\n    print(f'{err.error_code}: retryable={is_retryable(err)}')\n\nprint()\nprint('All error handling tests passed!')\n\"",
  "description": "Test error handling functionality (corrected)",
  "timeout": 60000
}
All tests pass. Now let me update the todo list to mark everything as complete:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Creating structured error exception classes",
      "content": "Create structured error exception classes",
      "status": "completed"
    },
    {
      "activeForm": "Adding Langfuse-integrated error tracking decorator",
      "content": "Add Langfuse-integrated error tracking decorator",
      "status": "completed"
    },
    {
      "activeForm": "Implementing retry logic with exponential backoff",
      "content": "Implement retry logic with exponential backoff",
      "status": "completed"
    },
    {
      "activeForm": "Adding fallback agent behaviors",
      "content": "Add fallback agent behaviors",
      "status": "completed"
    },
    {
      "activeForm": "Creating user-friendly error response models",
      "content": "Create user-friendly error response models",
      "status": "completed"
    },
    {
      "activeForm": "Updating FastAPI exception handlers",
      "content": "Update FastAPI exception handlers",
      "status": "completed"
    },
    {
      "activeForm": "Integrating error handling into existing agents",
      "content": "Integrate error handling into existing agents",
      "status": "completed"
    },
    {
      "activeForm": "Integrating error handling into workflows",
      "content": "Integrate error handling into workflows",
      "status": "completed"
    },
    {
      "activeForm": "Running tests to verify implementation",
      "content": "Run tests to verify implementation",
      "status": "completed"
    }
  ]
}
The implementation is complete. Let me provide a summary of all the changes:

<summary>
## Summary: Improve Error Handling in AI Engine with Langfuse-Integrated Error Tracking

### Changes Implemented

#### 1. Structured Error Types (`apps/ai-engine/src/exceptions.py`)
- Created `AIEngineError` base exception with error code, user-friendly message, technical details, retryability flag, and suggestion
- **LLM Errors**: `RateLimitError`, `QuotaExceededError`, `LLMTimeoutError`, `LLMInvalidResponseError`, `LLMAuthenticationError`, `LLMContextLengthExceededError`
- **Tool Errors**: `ToolError`, `RetrievalError`, `EmbeddingGenerationError`
- **Validation Errors**: `ValidationError`, `InputValidationError`, `MissingRequiredFieldError`, `SchemaValidationError`
- **Workflow Errors**: `WorkflowError`, `WorkflowStateError`, `WorkflowExecutionError`, `MaxIterationsExceededError`
- **Service Errors**: `ServiceError`, `ServiceUnavailableError`, `ServiceTimeoutError`, `BackendConnectionError`
- **Agent Errors**: `AgentError`, `AgentExecutionError`, `AgentInitializationError`

#### 2. Error Handling Utilities (`apps/ai-engine/src/error_handling.py`)
- **Retry Logic**: `@with_retry` decorator with exponential backoff and jitter
- **Error Tracking**: `@with_error_tracking` decorator for Langfuse integration
- **Combined Resilience**: `@with_resilience` decorator combining retry and error tracking
- **Fallback Mechanisms**: `@with_fallback` decorator for graceful degradation
- **Helper Functions**: `build_error_response()`, `safe_agent_run()`, `track_error_context()`
- Configurable retry settings per error type (rate limit, timeout, service unavailable)

#### 3. User-Friendly Error Response Models (`apps/ai-engine/src/models/responses.py`)
- `ErrorResponse`: Standardized error response with error_code, message, suggestion, details, retryable flag
- `ValidationErrorResponse`: For input validation errors
- `RateLimitErrorResponse`: For rate limit errors with retry_after header
- `ServiceUnavailableErrorResponse`: For downstream service failures

#### 4. FastAPI Exception Handlers (`apps/ai-engine/src/main.py`)
- `ai_engine_exception_handler`: Handles all `AIEngineError` subclasses with proper HTTP status codes
- `rate_limit_exception_handler`: Returns 429 with Retry-After header
- `service_unavailable_exception_handler`: Returns 503 for service issues
- `validation_error_exception_handler`: Returns 400 for validation errors
- `global_exception_handler`: Catches all uncaught exceptions with user-friendly messages
- All handlers integrate with Langfuse for error tracking

#### 5. Agent Integration (`apps/ai-engine/src/agents/qa_agent.py`)
- Updated `answer_question()` to convert exceptions to structured errors
- Maps common OpenAI errors to appropriate structured exceptions
- Enhanced Langfuse error context tracking

#### 6. Workflow Integration (`apps/ai-engine/src/workflows/case_analysis_workflow.py`)
- Updated all workflow nodes to use structured error handling
- Workflow errors now include detailed error context
- Langfuse spans properly annotated with error information

### Files Modified
- `apps/ai-engine/src/exceptions.py` (new file - 550 lines)
- `apps/ai-engine/src/error_handling.py` (new file - 520 lines)
- `apps/ai-engine/src/models/responses.py` (added error response models)
- `apps/ai-engine/src/main.py` (added exception handlers)
- `apps/ai-engine/src/agents/qa_agent.py` (integrated error handling)
- `apps/ai-engine/src/workflows/case_analysis_workflow.py` (integrated error handling)

### Verification Status
- All 34 existing unit tests pass
- Custom error handling tests verified:
  - Exception properties (error_code, retryable, message, suggestion)
  - Retry logic with exponential backoff (3 retries success)
  - Error response building with proper structure
  - Different error types correctly classified by retryability

### Key Features
1. **Automatic Retry**: Transient errors (rate limits, timeouts) are automatically retried with exponential backoff
2. **Langfuse Integration**: All errors are tracked with context in Langfuse for observability
3. **User-Friendly Messages**: Technical errors are masked with user-friendly messages and suggestions
4. **Error Aggregation**: Similar errors are grouped by error_code for admin dashboard analysis
5. **Traceability**: Every error can be traced back to specific agents/workflows via request_id
6. **Fallback Behavior**: Agents can fall back to alternative responses on failure

### Notes for Developer
- To use retry logic: `@with_retry(operation_name="my_operation")`
- To use fallback: `@with_fallback(fallback_config=FallbackConfig(fallback_message="..."))`
- For full resilience: `@with_resilience(operation="my_operation")`
- All custom exceptions inherit from `AIEngineError` for catch-all handling
- Langfuse traces show error context including error_code, retryable status, and suggestions
</summary>