I'll implement this feature to ensure Langfuse environment variables are properly configured. Let me start by exploring the codebase.

🔧 Tool: Task
Input: {
  "subagent_type": "Explore",
  "prompt": "Explore the AI Engine's configuration and Langfuse integration. I need to understand:\n\n1. How environment variables are currently loaded in the AI Engine (look for config.py, settings, .env files)\n2. How Langfuse is currently initialized (look for langfuse_init.py or similar)\n3. What environment variables are already defined in .env.example\n4. Any existing validation for environment variables\n\nFocus on:\n- apps/ai-engine/src/config.py\n- apps/ai-engine/src/langfuse_init.py\n- apps/ai-engine/.env.example\n- Any existing startup validation code\n\nProvide a summary of the current state and what needs to be added.",
  "description": "Explore Langfuse config in AI Engine"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/config.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/langfuse_init.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/.env.example"
}

🔧 Tool: Grep
Input: {
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src",
  "pattern": "startup|startup_validation|validate.*env|missing.*env|validate.*settings"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "offset": 1,
  "limit": 50
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "offset": 300,
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "offset": 600,
  "limit": 100
}

🔧 Tool: Bash
Input: {
  "command": "wc -l apps/ai-engine/src/main.py",
  "description": "Count total lines in main.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "offset": 1200,
  "limit": 60
}

🔧 Tool: Grep
Input: {
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "pattern": "@asynccontextmanager|lifespan|startup.*validation|startup.*checks"
}

🔧 Tool: Bash
Input: {
  "command": "grep -n \"@asynccontextmanager\\|lifespan\\|startup\" apps/ai-engine/src/main.py",
  "description": "Find startup context manager in main.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "offset": 102,
  "limit": 50
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "offset": 150,
  "limit": 50
}
Now let me read the actual files to understand the current implementation:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/config.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/langfuse_init.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/.env.example"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py"
}
Now I have a complete understanding of the current state. Let me create a plan and implement the Langfuse environment variable validation.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add Pydantic validators for Langfuse environment variables in config.py",
      "status": "in_progress",
      "activeForm": "Adding Pydantic validators for Langfuse config"
    },
    {
      "content": "Create startup validation function for Langfuse configuration",
      "status": "pending",
      "activeForm": "Creating startup validation function"
    },
    {
      "content": "Add /health/langfuse endpoint for health checks",
      "status": "pending",
      "activeForm": "Adding Langfuse health check endpoint"
    },
    {
      "content": "Update .env.example with better Langfuse documentation",
      "status": "pending",
      "activeForm": "Updating .env.example documentation"
    },
    {
      "content": "Update main.py lifespan to call Langfuse validation at startup",
      "status": "pending",
      "activeForm": "Integrating validation into startup lifespan"
    },
    {
      "content": "Test the implementation",
      "status": "pending",
      "activeForm": "Testing Langfuse validation"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/config.py",
  "old_string": "from functools import lru_cache\nfrom pathlib import Path\n\nfrom pydantic_settings import BaseSettings, SettingsConfigDict\n\n\nclass Settings(BaseSettings):\n    \"\"\"Application settings using Pydantic Settings.\"\"\"\n\n    # OpenAI Settings\n    # Default placeholder allows service startup;\n    # actual AI features will fail without a real key.\n    OPENAI_API_KEY: str = \"sk-placeholder-set-real-key-in-env\"\n    OPENAI_MODEL: str = \"gpt-4o\"\n    OPENAI_EMBEDDING_MODEL: str = \"text-embedding-3-small\"\n\n    # Service Settings\n    AI_ENGINE_PORT: int = 8000\n    AI_ENGINE_HOST: str = \"0.0.0.0\"\n    BACKEND_URL: str = \"http://localhost:3001\"\n    FRONTEND_URL: str = \"http://localhost:3000\"\n    LOG_LEVEL: str = \"INFO\"\n\n    # JWT Authentication Settings\n    # Must match the JWT_SECRET used by the NestJS backend\n    JWT_SECRET: str = \"secretKey\"  # Must match backend's default\n    JWT_ALGORITHM: str = \"HS256\"\n    JWT_AUDIENCE: str | None = None\n    JWT_ISSUER: str | None = None\n\n    # Langfuse Observability Settings\n    LANGFUSE_PUBLIC_KEY: str = \"\"\n    LANGFUSE_SECRET_KEY: str = \"\"\n    LANGFUSE_HOST: str | None = None  # For Langfuse Cloud/On-premise\n    LANGFUSE_ENABLED: bool = True\n    LANGFUSE_SAMPLING_RATE: float = 1.0  # 1.0 = trace all requests\n    LANGFUSE_SESSION_ID_HEADER: str = \"x-session-id\"\n\n    # Cache Settings\n    REDIS_URL: str = \"\"  # redis://localhost:6379/0\n    CACHE_ENABLED: bool = True\n    CACHE_TTL_SECONDS: int = 3600  # 1 hour default\n    CACHE_MAX_SIZE: int = 1000  # For in-memory cache\n\n    # Cost Monitoring Settings\n    COST_ALERT_THRESHOLD_USD: float = 10.0  # Alert when daily cost exceeds this\n    COST_TRACKING_ENABLED: bool = True\n    MAX_TOKENS_PER_REQUEST: int = 100000  # Safety limit\n\n    # Model Selection Settings\n    AUTO_MODEL_SELECTION: bool = (\n        True  # Automatically choose model based on task complexity\n    )\n    PREFER_MINI_MODEL: bool = True  # Prefer gpt-4o-mini for simple tasks\n\n    model_config = SettingsConfigDict(\n        env_file=Path(__file__).parent.parent / \".env\",\n        env_file_encoding=\"utf-8\",\n        extra=\"ignore\",\n    )",
  "new_string": "from functools import lru_cache\nfrom pathlib import Path\n\nfrom pydantic import field_validator, model_validator\nfrom pydantic_settings import BaseSettings, SettingsConfigDict\n\n\nclass Settings(BaseSettings):\n    \"\"\"Application settings using Pydantic Settings.\"\"\"\n\n    # OpenAI Settings\n    # Default placeholder allows service startup;\n    # actual AI features will fail without a real key.\n    OPENAI_API_KEY: str = \"sk-placeholder-set-real-key-in-env\"\n    OPENAI_MODEL: str = \"gpt-4o\"\n    OPENAI_EMBEDDING_MODEL: str = \"text-embedding-3-small\"\n\n    # Service Settings\n    AI_ENGINE_PORT: int = 8000\n    AI_ENGINE_HOST: str = \"0.0.0.0\"\n    BACKEND_URL: str = \"http://localhost:3001\"\n    FRONTEND_URL: str = \"http://localhost:3000\"\n    LOG_LEVEL: str = \"INFO\"\n\n    # JWT Authentication Settings\n    # Must match the JWT_SECRET used by the NestJS backend\n    JWT_SECRET: str = \"secretKey\"  # Must match backend's default\n    JWT_ALGORITHM: str = \"HS256\"\n    JWT_AUDIENCE: str | None = None\n    JWT_ISSUER: str | None = None\n\n    # Langfuse Observability Settings\n    # Format: pk-xxxxxxxxxxxxxxxxxxxx (starts with \"pk-\")\n    LANGFUSE_PUBLIC_KEY: str = \"\"\n    # Format: sk-xxxxxxxxxxxxxxxxxxxx (starts with \"sk-\")\n    LANGFUSE_SECRET_KEY: str = \"\"\n    # Default to Langfuse Cloud: https://cloud.langfuse.com\n    # For self-hosted: e.g., http://localhost:3000 or https://langfuse.yourdomain.com\n    LANGFUSE_HOST: str | None = None\n    LANGFUSE_ENABLED: bool = True\n    # Sampling rate: 0.0 (no tracing) to 1.0 (trace all requests)\n    LANGFUSE_SAMPLING_RATE: float = 1.0\n    LANGFUSE_SESSION_ID_HEADER: str = \"x-session-id\"\n\n    # Cache Settings\n    REDIS_URL: str = \"\"  # redis://localhost:6379/0\n    CACHE_ENABLED: bool = True\n    CACHE_TTL_SECONDS: int = 3600  # 1 hour default\n    CACHE_MAX_SIZE: int = 1000  # For in-memory cache\n\n    # Cost Monitoring Settings\n    COST_ALERT_THRESHOLD_USD: float = 10.0  # Alert when daily cost exceeds this\n    COST_TRACKING_ENABLED: bool = True\n    MAX_TOKENS_PER_REQUEST: int = 100000  # Safety limit\n\n    # Model Selection Settings\n    AUTO_MODEL_SELECTION: bool = (\n        True  # Automatically choose model based on task complexity\n    )\n    PREFER_MINI_MODEL: bool = True  # Prefer gpt-4o-mini for simple tasks\n\n    model_config = SettingsConfigDict(\n        env_file=Path(__file__).parent.parent / \".env\",\n        env_file_encoding=\"utf-8\",\n        extra=\"ignore\",\n    )\n\n    @field_validator(\"LANGFUSE_PUBLIC_KEY\")\n    @classmethod\n    def validate_langfuse_public_key(cls, v: str) -> str:\n        \"\"\"Validate Langfuse public key format if provided.\n\n        The key should start with \"pk-\" if set. Empty string is allowed\n        when Langfuse is disabled or not configured.\n        \"\"\"\n        if v and not v.startswith(\"pk-\"):\n            raise ValueError(\n                'LANGFUSE_PUBLIC_KEY must start with \"pk-\" (e.g., pk-xxxxxxxxxxxxxxxxxxxx). '\n                'Get your keys from https://cloud.langfuse.com'\n            )\n        return v\n\n    @field_validator(\"LANGFUSE_SECRET_KEY\")\n    @classmethod\n    def validate_langfuse_secret_key(cls, v: str) -> str:\n        \"\"\"Validate Langfuse secret key format if provided.\n\n        The key should start with \"sk-\" if set. Empty string is allowed\n        when Langfuse is disabled or not configured.\n        \"\"\"\n        if v and not v.startswith(\"sk-\"):\n            raise ValueError(\n                'LANGFUSE_SECRET_KEY must start with \"sk-\" (e.g., sk-xxxxxxxxxxxxxxxxxxxx). '\n                'Get your keys from https://cloud.langfuse.com'\n            )\n        return v\n\n    @field_validator(\"LANGFUSE_SAMPLING_RATE\")\n    @classmethod\n    def validate_sampling_rate(cls, v: float) -> float:\n        \"\"\"Validate Langfuse sampling rate is between 0 and 1.\"\"\"\n        if not 0.0 <= v <= 1.0:\n            raise ValueError(\n                \"LANGFUSE_SAMPLING_RATE must be between 0.0 (no tracing) and 1.0 (trace all)\"\n            )\n        return v\n\n    @field_validator(\"LANGFUSE_HOST\")\n    @classmethod\n    def validate_langfuse_host(cls, v: str | None) -> str | None:\n        \"\"\"Validate Langfuse host URL if provided.\n\n        Should be a valid URL for Langfuse Cloud or self-hosted instance.\n        \"\"\"\n        if v:\n            # Remove trailing slash if present\n            v = v.rstrip(\"/\")\n            # Basic URL format check\n            if not v.startswith((\"http://\", \"https://\")):\n                raise ValueError(\n                    'LANGFUSE_HOST must be a valid URL starting with \"http://\" or \"https://\". '\n                    'For Langfuse Cloud use: https://cloud.langfuse.com'\n                )\n        return v\n\n    @model_validator(mode=\"after\")\n    def validate_langfuse_configuration(self) -> \"Settings\":\n        \"\"\"Validate Langfuse configuration consistency.\n\n        If LANGFUSE_ENABLED is True, both keys must be provided.\n        If keys are provided, they must both be set (not just one).\n        \"\"\"\n        # If Langfuse is enabled, require both keys\n        if self.LANGFUSE_ENABLED:\n            if not self.LANGFUSE_PUBLIC_KEY or not self.LANGFUSE_SECRET_KEY:\n                raise ValueError(\n                    \"LANGFUSE_ENABLED is True but LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY is not set. \"\n                    \"Set both keys or disable Langfuse by setting LANGFUSE_ENABLED=false\"\n                )\n\n        # If only one key is set, that's a configuration error\n        has_public_key = bool(self.LANGFUSE_PUBLIC_KEY)\n        has_secret_key = bool(self.LANGFUSE_SECRET_KEY)\n        if has_public_key != has_secret_key:\n            raise ValueError(\n                \"Both LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY must be set together. \"\n                \"Set both keys or leave both empty.\"\n            )\n\n        return self"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Adding Pydantic validators for Langfuse config",
      "content": "Add Pydantic validators for Langfuse environment variables in config.py",
      "status": "completed"
    },
    {
      "activeForm": "Creating startup validation function",
      "content": "Create startup validation function for Langfuse configuration",
      "status": "in_progress"
    },
    {
      "activeForm": "Adding Langfuse health check endpoint",
      "content": "Add /health/langfuse endpoint for health checks",
      "status": "pending"
    },
    {
      "activeForm": "Updating .env.example documentation",
      "content": "Update .env.example with better Langfuse documentation",
      "status": "pending"
    },
    {
      "activeForm": "Integrating validation into startup lifespan",
      "content": "Update main.py lifespan to call Langfuse validation at startup",
      "status": "pending"
    },
    {
      "activeForm": "Testing Langfuse validation",
      "content": "Test the implementation",
      "status": "pending"
    }
  ]
}
Now let me create a dedicated validation module for startup checks:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/validate_config.py",
  "content": "\"\"\"Configuration validation module for AI Engine startup checks.\n\nThis module provides validation functions that are called during application\nstartup to ensure all required configuration is present and valid.\n\nThe validation follows a fail-fast principle: if critical configuration is\nmissing or invalid, the application will log a clear error message and exit.\nThis prevents the application from starting in a broken state.\n\"\"\"\n\nimport logging\nfrom typing import Any\n\nfrom .config import get_settings\n\nlogger = logging.getLogger(__name__)\n\n\nclass ValidationError(Exception):\n    \"\"\"Raised when configuration validation fails.\"\"\"\n\n    def __init__(self, message: str, config_var: str | None = None):\n        self.message = message\n        self.config_var = config_var\n        super().__init__(self.message)\n\n\ndef validate_langfuse_config(settings: Any | None = None) -> dict[str, Any]:\n    \"\"\"Validate Langfuse environment configuration.\n\n    Checks:\n    1. LANGFUSE_PUBLIC_KEY is set and valid (pk- format) when enabled\n    2. LANGFUSE_SECRET_KEY is set and valid (sk- format) when enabled\n    3. LANGFUSE_HOST is correctly configured (if set)\n    4. LANGFUSE_ENABLED flag is working correctly\n    5. LANGFUSE_SAMPLING_RATE is within valid range (0-1)\n\n    Args:\n        settings: Optional settings instance. If not provided, will get from get_settings().\n\n    Returns:\n        Dictionary with validation results:\n        - valid: bool - Whether configuration is valid\n        - enabled: bool - Whether Langfuse is enabled\n        - host: str - The Langfuse host URL\n        - sampling_rate: float - The configured sampling rate\n        - warnings: list[str] - Any warnings (non-critical issues)\n        - errors: list[str] - Any errors (critical issues)\n\n    Raises:\n        ValidationError: If critical configuration is invalid when Langfuse is enabled\n    \"\"\"\n    if settings is None:\n        settings = get_settings()\n\n    result: dict[str, Any] = {\n        \"valid\": True,\n        \"enabled\": False,\n        \"host\": settings.LANGFUSE_HOST or \"https://cloud.langfuse.com\",\n        \"sampling_rate\": settings.LANGFUSE_SAMPLING_RATE,\n        \"warnings\": [],\n        \"errors\": [],\n    }\n\n    # Check if Langfuse is enabled\n    if not settings.LANGFUSE_ENABLED:\n        result[\"enabled\"] = False\n        result[\"warnings\"].append(\"Langfuse is disabled (LANGFUSE_ENABLED=false)\")\n        return result\n\n    result[\"enabled\"] = True\n\n    # Validate public key format\n    if not settings.LANGFUSE_PUBLIC_KEY:\n        result[\"valid\"] = False\n        result[\"errors\"].append(\n            \"LANGFUSE_PUBLIC_KEY is not set. \"\n            \"Get your key from https://cloud.langfuse.com\"\n        )\n    elif not settings.LANGFUSE_PUBLIC_KEY.startswith(\"pk-\"):\n        result[\"valid\"] = False\n        result[\"errors\"].append(\n            f'LANGFUSE_PUBLIC_KEY has invalid format (must start with \"pk-\"). '\n            f'Current value starts with: {settings.LANGFUSE_PUBLIC_KEY[:2]}... '\n            \"Get your keys from https://cloud.langfuse.com\"\n        )\n\n    # Validate secret key format\n    if not settings.LANGFUSE_SECRET_KEY:\n        result[\"valid\"] = False\n        result[\"errors\"].append(\n            \"LANGFUSE_SECRET_KEY is not set. \"\n            \"Get your key from https://cloud.langfuse.com\"\n        )\n    elif not settings.LANGFUSE_SECRET_KEY.startswith(\"sk-\"):\n        result[\"valid\"] = False\n        result[\"errors\"].append(\n            f'LANGFUSE_SECRET_KEY has invalid format (must start with \"sk-\"). '\n            f'Current value starts with: {settings.LANGFUSE_SECRET_KEY[:2]}... '\n            \"Get your keys from https://cloud.langfuse.com\"\n        )\n\n    # Validate sampling rate\n    if not 0.0 <= settings.LANGFUSE_SAMPLING_RATE <= 1.0:\n        result[\"valid\"] = False\n        result[\"errors\"].append(\n            f\"LANGFUSE_SAMPLING_RATE must be between 0.0 and 1.0, got {settings.LANGFUSE_SAMPLING_RATE}\"\n        )\n    elif settings.LANGFUSE_SAMPLING_RATE < 1.0:\n        result[\"warnings\"].append(\n            f\"LANGFUSE_SAMPLING_RATE is {settings.LANGFUSE_SAMPLING_RATE:.2f} \"\n            f\"(only {settings.LANGFUSE_SAMPLING_RATE * 100:.0f}% of requests will be traced)\"\n        )\n\n    # Validate host format\n    if settings.LANGFUSE_HOST:\n        if not settings.LANGFUSE_HOST.startswith((\"http://\", \"https://\")):\n            result[\"valid\"] = False\n            result[\"errors\"].append(\n                f'LANGFUSE_HOST must start with \"http://\" or \"https://\", got: {settings.LANGFUSE_HOST}'\n            )\n        else:\n            # Check for common self-hosted configurations\n            if \"localhost\" in settings.LANGFUSE_HOST or \"127.0.0.1\" in settings.LANGFUSE_HOST:\n                result[\"warnings\"].append(\n                    f\"LANGFUSE_HOST is set to localhost ({settings.LANGFUSE_HOST}). \"\n                    \"Make sure Langfuse server is running and accessible.\"\n                )\n\n    # Log validation results\n    if result[\"valid\"]:\n        logger.info(\n            \"Langfuse configuration valid: host=%s, sampling_rate=%.2f\",\n            result[\"host\"],\n            result[\"sampling_rate\"],\n        )\n        for warning in result[\"warnings\"]:\n            logger.warning(\"Langfuse configuration warning: %s\", warning)\n    else:\n        error_msg = \"Langfuse configuration validation failed:\\n\" + \"\\n\".join(f\"  - {e}\" for e in result[\"errors\"])\n        logger.error(error_msg)\n        raise ValidationError(error_msg, config_var=\"LANGFUSE_*\")\n\n    return result\n\n\ndef validate_openai_config(settings: Any | None = None) -> dict[str, Any]:\n    \"\"\"Validate OpenAI configuration.\n\n    Checks:\n    1. OPENAI_API_KEY is set and not the placeholder\n    2. OPENAI_MODEL is a valid model name\n\n    Args:\n        settings: Optional settings instance. If not provided, will get from get_settings().\n\n    Returns:\n        Dictionary with validation results (same structure as validate_langfuse_config)\n    \"\"\"\n    if settings is None:\n        settings = get_settings()\n\n    result: dict[str, Any] = {\n        \"valid\": True,\n        \"enabled\": True,\n        \"model\": settings.OPENAI_MODEL,\n        \"embedding_model\": settings.OPENAI_EMBEDDING_MODEL,\n        \"warnings\": [],\n        \"errors\": [],\n    }\n\n    # Check if API key is the placeholder\n    if settings.OPENAI_API_KEY in (\"sk-placeholder-set-real-key-in-env\", \"sk-placeholder\"):\n        result[\"valid\"] = False\n        result[\"errors\"].append(\n            \"OPENAI_API_KEY is set to the placeholder value. \"\n            \"Set a real OpenAI API key in your environment or .env file. \"\n            \"Get your key from https://platform.openai.com/api-keys\"\n        )\n    elif not settings.OPENAI_API_KEY or not settings.OPENAI_API_KEY.startswith(\"sk-\"):\n        result[\"valid\"] = False\n        result[\"errors\"].append(\n            \"OPENAI_API_KEY is not set or has invalid format. \"\n            \"It should start with 'sk-'. \"\n            \"Get your key from https://platform.openai.com/api-keys\"\n        )\n\n    # Validate model names\n    valid_models = {\n        \"gpt-4o\",\n        \"gpt-4o-mini\",\n        \"gpt-4-turbo\",\n        \"gpt-4\",\n        \"gpt-3.5-turbo\",\n    }\n    valid_embedding_models = {\n        \"text-embedding-3-small\",\n        \"text-embedding-3-large\",\n        \"text-embedding-ada-002\",\n    }\n\n    if settings.OPENAI_MODEL not in valid_models:\n        result[\"warnings\"].append(\n            f\"OPENAI_MODEL '{settings.OPENAI_MODEL}' is not in the list of commonly used models: {valid_models}\"\n        )\n\n    if settings.OPENAI_EMBEDDING_MODEL not in valid_embedding_models:\n        result[\"warnings\"].append(\n            f\"OPENAI_EMBEDDING_MODEL '{settings.OPENAI_EMBEDDING_MODEL}' is not in the list of commonly used embedding models: {valid_embedding_models}\"\n        )\n\n    # Log validation results\n    if result[\"valid\"]:\n        logger.info(\n            \"OpenAI configuration valid: model=%s, embedding_model=%s\",\n            result[\"model\"],\n            result[\"embedding_model\"],\n        )\n        for warning in result[\"warnings\"]:\n            logger.warning(\"OpenAI configuration warning: %s\", warning)\n    else:\n        error_msg = \"OpenAI configuration validation failed:\\n\" + \"\\n\".join(f\"  - {e}\" for e in result[\"errors\"])\n        logger.error(error_msg)\n        raise ValidationError(error_msg, config_var=\"OPENAI_API_KEY\")\n\n    return result\n\n\ndef validate_all_config(strict: bool = False) -> dict[str, Any]:\n    \"\"\"Validate all application configuration.\n\n    This function is called during application startup to ensure all\n    required configuration is valid before the application starts accepting\n    requests.\n\n    Args:\n        strict: If True, raise ValidationError on any validation failure.\n                 If False, log errors but return results without raising.\n\n    Returns:\n        Dictionary with overall validation results:\n        - valid: bool - Whether all configurations are valid\n        - components: dict - Validation results for each component\n        - errors: list[str] - All errors from all components\n        - warnings: list[str] - All warnings from all components\n    \"\"\"\n    settings = get_settings()\n\n    results: dict[str, Any] = {\n        \"valid\": True,\n        \"components\": {},\n        \"errors\": [],\n        \"warnings\": [],\n    }\n\n    # Validate Langfuse configuration\n    try:\n        langfuse_result = validate_langfuse_config(settings)\n        results[\"components\"][\"langfuse\"] = langfuse_result\n        results[\"warnings\"].extend(langfuse_result.get(\"warnings\", []))\n        if not langfuse_result[\"valid\"]:\n            results[\"valid\"] = False\n            results[\"errors\"].extend(langfuse_result.get(\"errors\", []))\n    except ValidationError as e:\n        results[\"valid\"] = False\n        results[\"components\"][\"langfuse\"] = {\"valid\": False, \"errors\": [e.message]}\n        results[\"errors\"].append(str(e))\n\n    # Validate OpenAI configuration\n    try:\n        openai_result = validate_openai_config(settings)\n        results[\"components\"][\"openai\"] = openai_result\n        results[\"warnings\"].extend(openai_result.get(\"warnings\", []))\n        if not openai_result[\"valid\"]:\n            results[\"valid\"] = False\n            results[\"errors\"].extend(openai_result.get(\"errors\", []))\n    except ValidationError as e:\n        results[\"valid\"] = False\n        results[\"components\"][\"openai\"] = {\"valid\": False, \"errors\": [e.message]}\n        results[\"errors\"].append(str(e))\n\n    # Log summary\n    if results[\"valid\"]:\n        logger.info(\"All configuration validation passed\")\n        if results[\"warnings\"]:\n            logger.warning(\"Configuration warnings: %d\", len(results[\"warnings\"]))\n            for warning in results[\"warnings\"]:\n                logger.warning(\"  - %s\", warning)\n    else:\n        logger.error(\"Configuration validation failed with %d error(s)\", len(results[\"errors\"]))\n        for error in results[\"errors\"]:\n            logger.error(\"  - %s\", error)\n        if strict:\n            raise ValidationError(\n                \"Application configuration is invalid. Please fix the errors above before starting the service.\"\n            )\n\n    return results\n\n\n__all__ = [\n    \"ValidationError\",\n    \"validate_all_config\",\n    \"validate_langfuse_config\",\n    \"validate_openai_config\",\n]\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Adding Pydantic validators for Langfuse config",
      "content": "Add Pydantic validators for Langfuse environment variables in config.py",
      "status": "completed"
    },
    {
      "activeForm": "Creating startup validation function",
      "content": "Create startup validation function for Langfuse configuration",
      "status": "completed"
    },
    {
      "activeForm": "Adding Langfuse health check endpoint",
      "content": "Add /health/langfuse endpoint for health checks",
      "status": "in_progress"
    },
    {
      "activeForm": "Updating .env.example documentation",
      "content": "Update .env.example with better Langfuse documentation",
      "status": "pending"
    },
    {
      "activeForm": "Integrating validation into startup lifespan",
      "content": "Update main.py lifespan to call Langfuse validation at startup",
      "status": "pending"
    },
    {
      "activeForm": "Testing Langfuse validation",
      "content": "Test the implementation",
      "status": "pending"
    }
  ]
}
Now let me add the `/health/langfuse` endpoint to main.py:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "offset": 540,
  "limit": 100
}
Now let me add the `/health/langfuse` endpoint after the `/health/jwt` endpoint:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "old_string": "    return {\n        \"status\": \"ok\",\n        \"jwt_configured\": jwt_configured,\n        \"algorithm\": settings.JWT_ALGORITHM,\n        \"can_validate\": can_validate,\n    }\n\n\n@app.get(\"/api/v1/metrics/costs\")",
  "new_string": "    return {\n        \"status\": \"ok\",\n        \"jwt_configured\": jwt_configured,\n        \"algorithm\": settings.JWT_ALGORITHM,\n        \"can_validate\": can_validate,\n    }\n\n\n@app.get(\"/health/langfuse\")\nasync def langfuse_health_check():\n    \"\"\"Health check for Langfuse observability service.\n\n    Returns 200 if Langfuse configuration is valid and operational.\n    This endpoint verifies:\n    - Langfuse SDK is available\n    - LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY are configured\n    - Keys have valid format (pk- and sk- prefixes)\n    - LANGFUSE_ENABLED is set correctly\n    - LANGFUSE_HOST is configured (if custom)\n    - Connection to Langfuse server is working\n\n    Returns:\n        - status: \"ok\" if Langfuse is healthy, \"disabled\" if explicitly disabled,\n          \"error\" if configuration is invalid\n        - enabled: Whether Langfuse is enabled in configuration\n        - configured: Whether keys are properly configured\n        - host: The Langfuse host URL (cloud or self-hosted)\n        - sampling_rate: The configured sampling rate (0.0 to 1.0)\n        - connection_status: \"connected\" if auth_check passed, \"disconnected\" otherwise\n        - public_key_format: Valid format of the public key (pk-*)\n        - secret_key_format: Valid format of the secret key (sk-*)\n        - warnings: List of configuration warnings (non-critical issues)\n        - errors: List of configuration errors (if any)\n\n    The endpoint returns 200 even if Langfuse is disabled or misconfigured,\n    but includes error details in the response. Use the response body to\n    determine if action is needed.\n    \"\"\"\n    from .config import get_settings\n    from .langfuse_init import get_langfuse, is_langfuse_enabled\n    from .validate_config import validate_langfuse_config\n\n    settings = get_settings()\n\n    # Check if Langfuse is explicitly disabled\n    if not settings.LANGFUSE_ENABLED:\n        return {\n            \"status\": \"disabled\",\n            \"enabled\": False,\n            \"configured\": False,\n            \"host\": settings.LANGFUSE_HOST or \"https://cloud.langfuse.com\",\n            \"sampling_rate\": settings.LANGFUSE_SAMPLING_RATE,\n            \"connection_status\": \"disabled\",\n            \"public_key_format\": None,\n            \"secret_key_format\": None,\n            \"warnings\": [\"Langfuse is disabled by LANGFUSE_ENABLED=false\"],\n            \"errors\": [],\n        }\n\n    # Validate configuration\n    try:\n        validation_result = validate_langfuse_config(settings)\n    except Exception as e:\n        return {\n            \"status\": \"error\",\n            \"enabled\": True,\n            \"configured\": False,\n            \"host\": settings.LANGFUSE_HOST or \"https://cloud.langfuse.com\",\n            \"sampling_rate\": settings.LANGFUSE_SAMPLING_RATE,\n            \"connection_status\": \"error\",\n            \"public_key_format\": None,\n            \"secret_key_format\": None,\n            \"warnings\": [],\n            \"errors\": [str(e)],\n        }\n\n    if not validation_result[\"valid\"]:\n        return {\n            \"status\": \"error\",\n            \"enabled\": True,\n            \"configured\": False,\n            \"host\": settings.LANGFUSE_HOST or \"https://cloud.langfuse.com\",\n            \"sampling_rate\": settings.LANGFUSE_SAMPLING_RATE,\n            \"connection_status\": \"invalid_config\",\n            \"public_key_format\": settings.LANGFUSE_PUBLIC_KEY[:2] + \"-\" if settings.LANGFUSE_PUBLIC_KEY else None,\n            \"secret_key_format\": settings.LANGFUSE_SECRET_KEY[:2] + \"-\" if settings.LANGFUSE_SECRET_KEY else None,\n            \"warnings\": validation_result.get(\"warnings\", []),\n            \"errors\": validation_result.get(\"errors\", []),\n        }\n\n    # Check connection to Langfuse server\n    connection_status = \"disconnected\"\n    langfuse_client = get_langfuse()\n    if langfuse_client is not None:\n        try:\n            # Test connection with auth_check\n            if hasattr(langfuse_client, \"auth_check\"):\n                if langfuse_client.auth_check():\n                    connection_status = \"connected\"\n            else:\n                # Fallback: if client exists, assume connected\n                connection_status = \"connected\"\n        except Exception:\n            connection_status = \"error\"\n\n    return {\n        \"status\": \"ok\" if connection_status == \"connected\" else \"degraded\",\n        \"enabled\": True,\n        \"configured\": True,\n        \"host\": settings.LANGFUSE_HOST or \"https://cloud.langfuse.com\",\n        \"sampling_rate\": settings.LANGFUSE_SAMPLING_RATE,\n        \"connection_status\": connection_status,\n        \"public_key_format\": settings.LANGFUSE_PUBLIC_KEY[:3] + \"*\" * 20 if settings.LANGFUSE_PUBLIC_KEY else None,\n        \"secret_key_format\": settings.LANGFUSE_SECRET_KEY[:3] + \"*\" * 20 if settings.LANGFUSE_SECRET_KEY else None,\n        \"warnings\": validation_result.get(\"warnings\", []),\n        \"errors\": [],\n    }\n\n\n@app.get(\"/api/v1/metrics/costs\")"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Adding Pydantic validators for Langfuse config",
      "content": "Add Pydantic validators for Langfuse environment variables in config.py",
      "status": "completed"
    },
    {
      "activeForm": "Creating startup validation function",
      "content": "Create startup validation function for Langfuse configuration",
      "status": "completed"
    },
    {
      "activeForm": "Adding Langfuse health check endpoint",
      "content": "Add /health/langfuse endpoint for health checks",
      "status": "completed"
    },
    {
      "activeForm": "Updating .env.example documentation",
      "content": "Update .env.example with better Langfuse documentation",
      "status": "in_progress"
    },
    {
      "activeForm": "Integrating validation into startup lifespan",
      "content": "Update main.py lifespan to call Langfuse validation at startup",
      "status": "pending"
    },
    {
      "activeForm": "Testing Langfuse validation",
      "content": "Test the implementation",
      "status": "pending"
    }
  ]
}
Now let me update the `.env.example` file with better documentation:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/.env.example",
  "old_string": "# -----------------------------------------------------------------------------\n# Langfuse Observability Settings (Optional)\n# -----------------------------------------------------------------------------\n# Get credentials from: https://cloud.langfuse.com\n# Leave empty to disable Langfuse tracing\nLANGFUSE_PUBLIC_KEY=\nLANGFUSE_SECRET_KEY=\nLANGFUSE_HOST=\n\n# Langfuse configuration\nLANGFUSE_ENABLED=true\nLANGFUSE_SAMPLING_RATE=1.0\nLANGFUSE_SESSION_ID_HEADER=x-session-id",
  "new_string": "# -----------------------------------------------------------------------------\n# Langfuse Observability Settings (Optional)\n# -----------------------------------------------------------------------------\n# Langfuse provides AI observability including LLM tracing, token usage,\n# cost monitoring, and performance analytics.\n#\n# Get your credentials from: https://cloud.langfuse.com\n# For self-hosted Langfuse, see: https://langfuse.com/docs/self-host\n\n# Public key for Langfuse authentication\n# Format: Must start with \"pk-\" (e.g., pk-xxxxxxxxxxxxxxxxxxxx)\n# Leave empty to disable Langfuse tracing (also set LANGFUSE_ENABLED=false)\nLANGFUSE_PUBLIC_KEY=\n\n# Secret key for Langfuse authentication\n# Format: Must start with \"sk-\" (e.g., sk-xxxxxxxxxxxxxxxxxxxx)\n# Must be set together with LANGFUSE_PUBLIC_KEY\nLANGFUSE_SECRET_KEY=\n\n# Langfuse server URL\n# - For Langfuse Cloud: https://cloud.langfuse.com (default, leave empty)\n# - For self-hosted: e.g., http://localhost:3000 or https://langfuse.yourdomain.com\nLANGFUSE_HOST=\n\n# Enable or disable Langfuse tracing\n# Set to \"true\" to enable, \"false\" to disable\n# If enabled, both LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY must be set\nLANGFUSE_ENABLED=true\n\n# Sampling rate determines what percentage of requests are traced\n# - 1.0 = Trace 100% of requests (recommended for development)\n# - 0.5 = Trace 50% of requests\n# - 0.1 = Trace 10% of requests (recommended for high-traffic production)\n# - 0.0 = Trace no requests\nLANGFUSE_SAMPLING_RATE=1.0\n\n# HTTP header name to use for session ID tracking\n# The frontend should send this header to correlate traces with user sessions\nLANGFUSE_SESSION_ID_HEADER=x-session-id"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Adding Pydantic validators for Langfuse config",
      "content": "Add Pydantic validators for Langfuse environment variables in config.py",
      "status": "completed"
    },
    {
      "activeForm": "Creating startup validation function",
      "content": "Create startup validation function for Langfuse configuration",
      "status": "completed"
    },
    {
      "activeForm": "Adding Langfuse health check endpoint",
      "content": "Add /health/langfuse endpoint for health checks",
      "status": "completed"
    },
    {
      "activeForm": "Updating .env.example documentation",
      "content": "Update .env.example with better Langfuse documentation",
      "status": "completed"
    },
    {
      "activeForm": "Integrating validation into startup lifespan",
      "content": "Update main.py lifespan to call Langfuse validation at startup",
      "status": "in_progress"
    },
    {
      "activeForm": "Testing Langfuse validation",
      "content": "Test the implementation",
      "status": "pending"
    }
  ]
}
Now let me integrate the validation into the startup lifespan in main.py:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "limit": 60,
  "offset": 100
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "old_string": "@asynccontextmanager\nasync def lifespan(_app: FastAPI):\n    \"\"\"Lifespan context manager for startup/shutdown events with graceful shutdown.\"\"\"\n    global startup_complete, startup_status\n\n    # Startup\n    logger.info(\"Legal AI Engine starting up...\")\n    startup_status[\"phase\"] = \"initializing\"\n    startup_status[\"message\"] = \"Initializing AI Engine components...\"\n\n    try:\n        # Initialize ML models and agents (lazy load)\n        startup_status[\"phase\"] = \"loading_models\"\n        startup_status[\"message\"] = \"Loading ML models and agents...\"\n\n        # Pre-load classifier agent to verify dependencies\n\n        startup_status[\"phase\"] = \"ready\"\n        startup_status[\"message\"] = \"AI Engine is ready\"\n\n        logger.info(\"AI Engine startup complete\")\n        startup_complete = True\n    except Exception:\n        logger.exception(\"AI Engine startup failed\")\n        startup_status[\"phase\"] = \"failed\"\n        startup_status[\"message\"] = \"Startup failed\"\n        startup_status[\"error\"] = \"Initialization error\"\n\n    # Set up signal handlers for graceful shutdown\n    def handle_shutdown(signum, _frame):\n        logger.info(\"Received signal %s, initiating graceful shutdown...\", signum)\n        shutdown_event.set()\n\n    signal.signal(signal.SIGINT, handle_shutdown)\n    signal.signal(signal.SIGTERM, handle_shutdown)\n\n    yield\n\n    # Shutdown - wait for in-flight requests to complete\n    logger.info(\"Legal AI Engine shutting down gracefully...\")\n    logger.info(\"Active generation tasks: %d\", len(generation_tasks))\n\n    # Flush Langfuse events before shutdown\n    flush()",
  "new_string": "@asynccontextmanager\nasync def lifespan(_app: FastAPI):\n    \"\"\"Lifespan context manager for startup/shutdown events with graceful shutdown.\"\"\"\n    global startup_complete, startup_status\n\n    # Startup\n    logger.info(\"Legal AI Engine starting up...\")\n    startup_status[\"phase\"] = \"initializing\"\n    startup_status[\"message\"] = \"Initializing AI Engine components...\"\n\n    try:\n        # Validate configuration before starting services\n        startup_status[\"phase\"] = \"validating_config\"\n        startup_status[\"message\"] = \"Validating configuration...\"\n\n        from .validate_config import validate_all_config\n\n        # Use non-strict mode: log errors but don't fail startup\n        # This allows the service to start for development even with missing config\n        config_validation = validate_all_config(strict=False)\n\n        # Store validation results in startup status\n        startup_status[\"config_validation\"] = config_validation\n\n        if not config_validation[\"valid\"]:\n            logger.warning(\n                \"Configuration validation found %d error(s) and %d warning(s). \"\n                \"Service will start but some features may not work correctly.\",\n                len(config_validation[\"errors\"]),\n                len(config_validation[\"warnings\"]),\n            )\n            # Don't fail startup for missing config in development\n            # In production, you may want to set strict=True\n\n        # Initialize ML models and agents (lazy load)\n        startup_status[\"phase\"] = \"loading_models\"\n        startup_status[\"message\"] = \"Loading ML models and agents...\"\n\n        # Pre-load classifier agent to verify dependencies\n\n        startup_status[\"phase\"] = \"ready\"\n        startup_status[\"message\"] = \"AI Engine is ready\"\n\n        logger.info(\"AI Engine startup complete\")\n        startup_complete = True\n    except Exception:\n        logger.exception(\"AI Engine startup failed\")\n        startup_status[\"phase\"] = \"failed\"\n        startup_status[\"message\"] = \"Startup failed\"\n        startup_status[\"error\"] = \"Initialization error\"\n\n    # Set up signal handlers for graceful shutdown\n    def handle_shutdown(signum, _frame):\n        logger.info(\"Received signal %s, initiating graceful shutdown...\", signum)\n        shutdown_event.set()\n\n    signal.signal(signal.SIGINT, handle_shutdown)\n    signal.signal(signal.SIGTERM, handle_shutdown)\n\n    yield\n\n    # Shutdown - wait for in-flight requests to complete\n    logger.info(\"Legal AI Engine shutting down gracefully...\")\n    logger.info(\"Active generation tasks: %d\", len(generation_tasks))\n\n    # Flush Langfuse events before shutdown\n    flush()"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Adding Pydantic validators for Langfuse config",
      "content": "Add Pydantic validators for Langfuse environment variables in config.py",
      "status": "completed"
    },
    {
      "activeForm": "Creating startup validation function",
      "content": "Create startup validation function for Langfuse configuration",
      "status": "completed"
    },
    {
      "activeForm": "Adding Langfuse health check endpoint",
      "content": "Add /health/langfuse endpoint for health checks",
      "status": "completed"
    },
    {
      "activeForm": "Updating .env.example documentation",
      "content": "Update .env.example with better Langfuse documentation",
      "status": "completed"
    },
    {
      "activeForm": "Integrating validation into startup lifespan",
      "content": "Update main.py lifespan to call Langfuse validation at startup",
      "status": "completed"
    },
    {
      "activeForm": "Testing Langfuse validation",
      "content": "Test the implementation",
      "status": "in_progress"
    }
  ]
}
Now let me test the implementation by running Python syntax checks:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine && uv run python -c \"\nfrom src.config import get_settings\nfrom src.validate_config import validate_langfuse_config, validate_all_config, ValidationError\nimport os\n\n# Test 1: Test with valid format but placeholder values\nprint('Test 1: Testing validation functions...')\ntry:\n    result = validate_langfuse_config()\n    print(f'Langfuse validation result: valid={result[\\\"valid\\\"]}, enabled={result[\\\"enabled\\\"]}')\n    if result.get('errors'):\n        print(f'Errors: {result[\\\"errors\\\"]}')\n    if result.get('warnings'):\n        print(f'Warnings: {result[\\\"warnings\\\"]}')\nexcept ValidationError as e:\n    print(f'ValidationError (expected if keys misconfigured): {e.message}')\n\n# Test 2: Test with invalid public key format\nprint('\\\\nTest 2: Testing invalid key format validation...')\nos.environ['LANGFUSE_PUBLIC_KEY'] = 'invalid-key'\nos.environ['LANGFUSE_SECRET_KEY'] = 'sk-test123'\ntry:\n    # Clear the cached settings\n    import src.config\n    src.config.get_settings.cache_clear()\n    from src.config import get_settings\n    settings = get_settings()\n    print(f'Settings loaded, public key: {settings.LANGFUSE_PUBLIC_KEY[:10]}...')\nexcept Exception as e:\n    print(f'Expected validation error: {e}')\n\nprint('\\\\nAll tests passed!')\n\"\n",
  "description": "Test Langfuse validation implementation"
}
Excellent! The validation is working. Now let me run the full type check on the AI Engine:

🔧 Tool: Bash
Input: {
  "command": "uv run mypy src/ --no-error-summary 2>&1 | head -50 || true",
  "description": "Run mypy type check on AI Engine"
}
The mypy errors are mostly pre-existing issues in other files, not in our new validation code. Let me specifically test the validation module:

🔧 Tool: Bash
Input: {
  "command": "uv run mypy src/validate_config.py --show-error-codes",
  "description": "Type check validate_config.py"
}
The error is from the config.py file where the model_validator doesn't have a return type annotation. Let me fix that:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/config.py",
  "limit": 30,
  "offset": 145
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/config.py",
  "old_string": "@lru_cache\ndef get_settings():\n    \"\"\"Return cached settings instance.\"\"\"\n    return Settings()",
  "new_string": "@lru_cache\ndef get_settings() -> Settings:\n    \"\"\"Return cached settings instance.\"\"\"\n    return Settings()"
}
Now let me verify the app can start with the new validation:

🔧 Tool: Bash
Input: {
  "command": "uv run python -c \"\nimport sys\nsys.path.insert(0, 'src')\n\n# Test all imports work\nfrom main import app, lifespan, startup_complete\nfrom validate_config import validate_all_config, ValidationError\nfrom langfuse_init import init_langfuse, is_langfuse_enabled\n\nprint('All imports successful!')\nprint('App created:', app.title)\n\"",
  "description": "Verify imports work correctly"
}
That's expected - let me test in a different way:

🔧 Tool: Bash
Input: {
  "command": "uv run python -c \"\nimport sys\nsys.path.insert(0, 'src')\n\n# Test all imports work\nimport src.main as main\nimport src.validate_config as validate_config\nimport src.langfuse_init as langfuse_init\nimport src.config as config\n\nprint('All imports successful!')\nprint('App created:', main.app.title)\nprint('Settings loaded OK')\n\n# Test validation function\nsettings = config.get_settings()\nresult = validate_config.validate_langfuse_config(settings)\nprint(f'Langfuse validation: valid={result[\\\"valid\\\"]}, enabled={result[\\\"enabled\\\"]}')\n\n# Test full validation\nfull_result = validate_config.validate_all_config(strict=False)\nprint(f'Full validation: valid={full_result[\\\"valid\\\"]}, errors={len(full_result[\\\"errors\\\"])}')\n\"",
  "description": "Verify all modules import correctly"
}
The implementation is working correctly. Now let me test the `/health/langfuse` endpoint by running the development server:

🔧 Tool: Bash
Input: {
  "command": "timeout 10 uv run dev 2>&1 | grep -E \"(Application startup complete|Uvicorn running|LANGFUSE|validation|Error)\" | head -20 || true",
  "description": "Start dev server to verify startup"
}

🔧 Tool: Bash
Input: {
  "command": "timeout 15 bash -c \"uv run dev 2>&1\" | head -50 || true",
  "description": "Start dev server to verify startup"
}
Let me try a different approach:

🔧 Tool: Bash
Input: {
  "command": "uv run dev &\nsleep 5\ncurl -s http://localhost:8000/health/langfuse | head -50 || true\nkill %1 2>/dev/null || true",
  "description": "Test health/langfuse endpoint"
}

🔧 Tool: Bash
Input: {
  "command": "(\n  uv run dev &\n  DEV_PID=$!\n  sleep 5\n  curl -s http://localhost:8000/health/langfuse 2>/dev/null || echo \"Server not responding yet\"\n  curl -s http://localhost:8000/health 2>/dev/null || echo \"Health check not responding\"\n  kill $DEV_PID 2>/dev/null || true\n)",
  "description": "Test health endpoints"
}
The server is running. Let me check the specific endpoint:

🔧 Tool: Bash
Input: {
  "command": "curl -s http://localhost:8000/health/langfuse 2>/dev/null | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/health/langfuse",
  "description": "Test Langfuse health endpoint"
}
The server might not have reloaded. Let me check if the endpoint was added correctly:

🔧 Tool: Bash
Input: {
  "command": "grep -n \"langfuse_health_check\" /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "description": "Check endpoint was added"
}

🔧 Tool: Bash
Input: {
  "command": "grep -n \"@app.get.*health/langfuse\" /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "description": "Check endpoint decorator"
}
The endpoint is there. Let me kill any running servers and restart:

🔧 Tool: Bash
Input: {
  "command": "pkill -f \"uvicorn.*main:app\" 2>/dev/null || true\nsleep 2\ncurl -s http://localhost:8000/health/langfuse 2>/dev/null && echo \"Server still running\" || echo \"Server stopped\"",
  "description": "Kill existing server"
}

🔧 Tool: Bash
Input: {
  "command": "lsof -i :8000 | grep LISTEN || echo \"No process on 8000\"",
  "description": "Check what's on port 8000"
}

🔧 Tool: Bash
Input: {
  "command": "kill -9 44049 44051 2>/dev/null || true\nsleep 1\nps aux | grep uvicorn | grep -v grep || echo \"No uvicorn running\"",
  "description": "Kill the servers"
}

🔧 Tool: Bash
Input: {
  "command": "uv run uvicorn src.main:app --reload &\nsleep 8\ncurl -s http://localhost:8000/health/langfuse 2>/dev/null | python3 -m json.tool 2>/dev/null || echo \"Request failed\"\npkill -f \"uvicorn.*main:app\" 2>/dev/null || true",
  "description": "Start server and test endpoint"
}

🔧 Tool: TaskOutput
Input: {
  "task_id": "b64eaf8",
  "block": true,
  "timeout": 30000
}
The server started successfully and shows our validation logs. Let me test the endpoint again now that the server is running:

🔧 Tool: Bash
Input: {
  "command": "curl -s http://localhost:8000/health/langfuse 2>/dev/null | python3 -m json.tool 2>/dev/null || echo \"Request failed - server may not be running\"",
  "description": "Test Langfuse health endpoint"
}
The `/health/langfuse` endpoint is working. Let me also test the `/health` endpoint to see the startup status:

🔧 Tool: Bash
Input: {
  "command": "curl -s http://localhost:8000/health 2>/dev/null | python3 -m json.tool 2>/dev/null",
  "description": "Test main health endpoint"
}
Excellent! Let me now test the error cases by setting invalid environment variables:

🔧 Tool: Bash
Input: {
  "command": "pkill -f \"uvicorn.*main:app\" 2>/dev/null || true\nsleep 2\n\n# Test with invalid LANGFUSE_PUBLIC_KEY format\nLANGFUSE_ENABLED=true LANGFUSE_PUBLIC_KEY=invalid LANGFUSE_SECRET_KEY=sk-test123 uv run python -c \"\nimport sys\nsys.path.insert(0, 'src')\nfrom src.config import get_settings\n\ntry:\n    settings = get_settings()\n    print('ERROR: Should have raised ValidationError for invalid key format')\nexcept Exception as e:\n    print(f'Expected error: {str(e)[:200]}...')\n\"",
  "description": "Test invalid key format validation"
}
The validation is working correctly. Let me also test when Langfuse is disabled:

🔧 Tool: Bash
Input: {
  "command": "# Test when LANGFUSE_ENABLED is false (should pass without keys)\nLANGFUSE_ENABLED=false LANGFUSE_PUBLIC_KEY= LANGFUSE_SECRET_KEY= uv run python -c \"\nimport sys\nsys.path.insert(0, 'src')\nfrom src.config import get_settings\n\nsettings = get_settings()\nprint(f'LANGFUSE_ENABLED: {settings.LANGFUSE_ENABLED}')\nprint(f'Validation passed when disabled: OK')\n\"",
  "description": "Test validation when Langfuse disabled"
}
Now let me update the todo list and finalize:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Adding Pydantic validators for Langfuse config",
      "content": "Add Pydantic validators for Langfuse environment variables in config.py",
      "status": "completed"
    },
    {
      "activeForm": "Creating startup validation function",
      "content": "Create startup validation function for Langfuse configuration",
      "status": "completed"
    },
    {
      "activeForm": "Adding Langfuse health check endpoint",
      "content": "Add /health/langfuse endpoint for health checks",
      "status": "completed"
    },
    {
      "activeForm": "Updating .env.example documentation",
      "content": "Update .env.example with better Langfuse documentation",
      "status": "completed"
    },
    {
      "activeForm": "Integrating validation into startup lifespan",
      "content": "Update main.py lifespan to call Langfuse validation at startup",
      "status": "completed"
    },
    {
      "activeForm": "Testing Langfuse validation",
      "content": "Test the implementation",
      "status": "completed"
    }
  ]
}
Let me clean up the background process:

🔧 Tool: KillShell
Input: {
  "shell_id": "b64eaf8"
}
<summary>
## Summary: Verify Langfuse Environment Configuration

### Changes Implemented

1. **Added Pydantic Validators to `config.py`**:
   - `validate_langfuse_public_key`: Ensures key starts with `pk-`
   - `validate_langfuse_secret_key`: Ensures key starts with `sk-`
   - `validate_sampling_rate`: Ensures value is between 0.0 and 1.0
   - `validate_langfuse_host`: Validates URL format (http:// or https://)
   - `validate_langfuse_configuration`: Model validator that ensures consistency when LANGFUSE_ENABLED is true
   - Added return type annotation to `get_settings()`

2. **Created New Validation Module `src/validate_config.py`**:
   - `ValidationError` exception class
   - `validate_langfuse_config()`: Validates Langfuse environment variables
   - `validate_openai_config()`: Validates OpenAI configuration
   - `validate_all_config()`: Runs all validations and returns summary
   - Non-strict mode allows service to start with warnings for development

3. **Added `/health/langfuse` Health Check Endpoint**:
   - Returns status: ok, disabled, error, or degraded
   - Validates key formats, sampling rate, and host configuration
   - Tests connection to Langfuse server with `auth_check()`
   - Returns detailed diagnostics including warnings and errors

4. **Updated `.env.example` Documentation**:
   - Added detailed explanations for each Langfuse environment variable
   - Documented required key formats (`pk-`, `sk-`)
   - Explained sampling rate options (0.0 to 1.0)
   - Added notes about self-hosted vs cloud Langfuse

5. **Integrated Validation into Startup Lifespan**:
   - Added `validate_all_config()` call in `lifespan()` context manager
   - Stores validation results in `startup_status` for diagnostics
   - Logs warnings but doesn't fail startup for development (non-strict mode)

### Files Modified

- `apps/ai-engine/src/config.py` - Added Pydantic validators and return type annotation
- `apps/ai-engine/src/validate_config.py` - New validation module
- `apps/ai-engine/src/main.py` - Added `/health/langfuse` endpoint and startup validation
- `apps/ai-engine/.env.example` - Enhanced Langfuse documentation

### Verification Status

The implementation was tested and verified:

1. **Pydantic Validators**: Successfully reject invalid key formats (e.g., `LANGFUSE_PUBLIC_KEY=invalid` raises `ValueError` with clear message)

2. **Health Check Endpoint**: `/health/langfuse` returns:
   ```json
   {
     "status": "degraded",
     "enabled": true,
     "configured": true,
     "host": "https://cloud.langfuse.com",
     "sampling_rate": 1.0,
     "connection_status": "disconnected",
     "warnings": [],
     "errors": []
   }
   ```

3. **Startup Validation**: Server logs show validation at startup:
   ```
   Langfuse configuration valid: host=https://cloud.langfuse.com, sampling_rate=1.00
   OpenAI configuration valid: model=gpt-4o, embedding_model=text-embedding-3-small
   All configuration validation passed
   ```

4. **Disabled State**: When `LANGFUSE_ENABLED=false`, validation passes without requiring keys
</summary>