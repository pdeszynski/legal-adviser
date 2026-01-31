"""Configuration validation module for AI Engine startup checks.

This module provides validation functions that are called during application
startup to ensure all required configuration is present and valid.

The validation follows a fail-fast principle: if critical configuration is
missing or invalid, the application will log a clear error message and exit.
This prevents the application from starting in a broken state.
"""

import logging
from typing import Any

from .config import get_settings

logger = logging.getLogger(__name__)


class ValidationError(Exception):
    """Raised when configuration validation fails."""

    def __init__(self, message: str, config_var: str | None = None):
        self.message = message
        self.config_var = config_var
        super().__init__(self.message)


def validate_langfuse_config(settings: Any | None = None) -> dict[str, Any]:
    """Validate Langfuse environment configuration.

    Checks:
    1. LANGFUSE_PUBLIC_KEY is set and valid (pk- format) when enabled
    2. LANGFUSE_SECRET_KEY is set and valid (sk- format) when enabled
    3. LANGFUSE_HOST is correctly configured (if set)
    4. LANGFUSE_ENABLED flag is working correctly
    5. LANGFUSE_SAMPLING_RATE is within valid range (0-1)

    Args:
        settings: Optional settings instance. If not provided, will get from
            get_settings().

    Returns:
        Dictionary with validation results:
        - valid: bool - Whether configuration is valid
        - enabled: bool - Whether Langfuse is enabled
        - host: str - The Langfuse host URL
        - sampling_rate: float - The configured sampling rate
        - warnings: list[str] - Any warnings (non-critical issues)
        - errors: list[str] - Any errors (critical issues)

    Raises:
        ValidationError: If critical configuration is invalid when Langfuse is enabled
    """
    if settings is None:
        settings = get_settings()

    result: dict[str, Any] = {
        "valid": True,
        "enabled": False,
        "host": settings.LANGFUSE_HOST or "https://cloud.langfuse.com",
        "sampling_rate": settings.LANGFUSE_SAMPLING_RATE,
        "warnings": [],
        "errors": [],
    }

    # Check if Langfuse is enabled
    if not settings.LANGFUSE_ENABLED:
        result["enabled"] = False
        result["warnings"].append("Langfuse is disabled (LANGFUSE_ENABLED=false)")
        return result

    result["enabled"] = True

    # Validate public key format
    if not settings.LANGFUSE_PUBLIC_KEY:
        result["valid"] = False
        result["errors"].append(
            "LANGFUSE_PUBLIC_KEY is not set. "
            "Get your key from https://cloud.langfuse.com"
        )
    elif not settings.LANGFUSE_PUBLIC_KEY.startswith("pk-"):
        result["valid"] = False
        result["errors"].append(
            f'LANGFUSE_PUBLIC_KEY has invalid format (must start with "pk-"). '
            f"Current value starts with: {settings.LANGFUSE_PUBLIC_KEY[:2]}... "
            "Get your keys from https://cloud.langfuse.com"
        )

    # Validate secret key format
    if not settings.LANGFUSE_SECRET_KEY:
        result["valid"] = False
        result["errors"].append(
            "LANGFUSE_SECRET_KEY is not set. "
            "Get your key from https://cloud.langfuse.com"
        )
    elif not settings.LANGFUSE_SECRET_KEY.startswith("sk-"):
        result["valid"] = False
        result["errors"].append(
            f'LANGFUSE_SECRET_KEY has invalid format (must start with "sk-"). '
            f"Current value starts with: {settings.LANGFUSE_SECRET_KEY[:2]}... "
            "Get your keys from https://cloud.langfuse.com"
        )

    # Validate sampling rate
    if not 0.0 <= settings.LANGFUSE_SAMPLING_RATE <= 1.0:
        result["valid"] = False
        result["errors"].append(
            f"LANGFUSE_SAMPLING_RATE must be between 0.0 and 1.0, got {settings.LANGFUSE_SAMPLING_RATE}"
        )
    elif settings.LANGFUSE_SAMPLING_RATE < 1.0:
        result["warnings"].append(
            f"LANGFUSE_SAMPLING_RATE is {settings.LANGFUSE_SAMPLING_RATE:.2f} "
            f"(only {settings.LANGFUSE_SAMPLING_RATE * 100:.0f}% of requests will be traced)"
        )

    # Validate host format
    if settings.LANGFUSE_HOST:
        if not settings.LANGFUSE_HOST.startswith(("http://", "https://")):
            result["valid"] = False
            result["errors"].append(
                f'LANGFUSE_HOST must start with "http://" or "https://", got: {settings.LANGFUSE_HOST}'
            )
        else:
            # Check for common self-hosted configurations
            if (
                "localhost" in settings.LANGFUSE_HOST
                or "127.0.0.1" in settings.LANGFUSE_HOST
            ):
                result["warnings"].append(
                    f"LANGFUSE_HOST is set to localhost ({settings.LANGFUSE_HOST}). "
                    "Make sure Langfuse server is running and accessible."
                )

    # Log validation results
    if result["valid"]:
        logger.info(
            "Langfuse configuration valid: host=%s, sampling_rate=%.2f",
            result["host"],
            result["sampling_rate"],
        )
        for warning in result["warnings"]:
            logger.warning("Langfuse configuration warning: %s", warning)
    else:
        error_msg = "Langfuse configuration validation failed:\n" + "\n".join(
            f"  - {e}" for e in result["errors"]
        )
        logger.error(error_msg)
        raise ValidationError(error_msg, config_var="LANGFUSE_*")

    print("langfules result", result)

    return result


def validate_openai_config(settings: Any | None = None) -> dict[str, Any]:
    """Validate OpenAI configuration.

    Checks:
    1. OPENAI_API_KEY is set and not the placeholder
    2. OPENAI_MODEL is a valid model name

    Args:
        settings: Optional settings instance. If not provided, will get from
            get_settings().

    Returns:
        Dictionary with validation results (same structure as validate_langfuse_config)
    """
    if settings is None:
        settings = get_settings()

    result: dict[str, Any] = {
        "valid": True,
        "enabled": True,
        "model": settings.OPENAI_MODEL,
        "embedding_model": settings.OPENAI_EMBEDDING_MODEL,
        "warnings": [],
        "errors": [],
    }

    # Check if API key is the placeholder
    if settings.OPENAI_API_KEY in (
        "sk-placeholder-set-real-key-in-env",
        "sk-placeholder",
    ):
        result["valid"] = False
        result["errors"].append(
            "OPENAI_API_KEY is set to the placeholder value. "
            "Set a real OpenAI API key in your environment or .env file. "
            "Get your key from https://platform.openai.com/api-keys"
        )
    elif not settings.OPENAI_API_KEY or not settings.OPENAI_API_KEY.startswith("sk-"):
        result["valid"] = False
        result["errors"].append(
            "OPENAI_API_KEY is not set or has invalid format. "
            "It should start with 'sk-'. "
            "Get your key from https://platform.openai.com/api-keys"
        )

    # Validate model names
    valid_models = {
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4-turbo",
        "gpt-4",
        "gpt-3.5-turbo",
    }
    valid_embedding_models = {
        "text-embedding-3-small",
        "text-embedding-3-large",
        "text-embedding-ada-002",
    }

    if settings.OPENAI_MODEL not in valid_models:
        result["warnings"].append(
            f"OPENAI_MODEL '{settings.OPENAI_MODEL}' is not in the list of commonly used models: {valid_models}"
        )

    if settings.OPENAI_EMBEDDING_MODEL not in valid_embedding_models:
        result["warnings"].append(
            f"OPENAI_EMBEDDING_MODEL '{settings.OPENAI_EMBEDDING_MODEL}' is not in the list of commonly used embedding models: {valid_embedding_models}"
        )

    # Log validation results
    if result["valid"]:
        logger.info(
            "OpenAI configuration valid: model=%s, embedding_model=%s",
            result["model"],
            result["embedding_model"],
        )
        for warning in result["warnings"]:
            logger.warning("OpenAI configuration warning: %s", warning)
    else:
        error_msg = "OpenAI configuration validation failed:\n" + "\n".join(
            f"  - {e}" for e in result["errors"]
        )
        logger.error(error_msg)
        raise ValidationError(error_msg, config_var="OPENAI_API_KEY")

    return result


def validate_all_config(strict: bool = False) -> dict[str, Any]:
    """Validate all application configuration.

    This function is called during application startup to ensure all
    required configuration is valid before the application starts accepting
    requests.

    Args:
        strict: If True, raise ValidationError on any validation failure.
                 If False, log errors but return results without raising.

    Returns:
        Dictionary with overall validation results:
        - valid: bool - Whether all configurations are valid
        - components: dict - Validation results for each component
        - errors: list[str] - All errors from all components
        - warnings: list[str] - All warnings from all components
    """
    settings = get_settings()

    results: dict[str, Any] = {
        "valid": True,
        "components": {},
        "errors": [],
        "warnings": [],
    }

    # Validate Langfuse configuration
    try:
        langfuse_result = validate_langfuse_config(settings)
        results["components"]["langfuse"] = langfuse_result
        results["warnings"].extend(langfuse_result.get("warnings", []))
        if not langfuse_result["valid"]:
            results["valid"] = False
            results["errors"].extend(langfuse_result.get("errors", []))
    except ValidationError as e:
        results["valid"] = False
        results["components"]["langfuse"] = {"valid": False, "errors": [e.message]}
        results["errors"].append(str(e))

    # Validate OpenAI configuration
    try:
        openai_result = validate_openai_config(settings)
        results["components"]["openai"] = openai_result
        results["warnings"].extend(openai_result.get("warnings", []))
        if not openai_result["valid"]:
            results["valid"] = False
            results["errors"].extend(openai_result.get("errors", []))
    except ValidationError as e:
        results["valid"] = False
        results["components"]["openai"] = {"valid": False, "errors": [e.message]}
        results["errors"].append(str(e))

    # Log summary
    if results["valid"]:
        logger.info("All configuration validation passed")
        if results["warnings"]:
            logger.warning("Configuration warnings: %d", len(results["warnings"]))
            for warning in results["warnings"]:
                logger.warning("  - %s", warning)
    else:
        logger.error(
            "Configuration validation failed with %d error(s)", len(results["errors"])
        )
        for error in results["errors"]:
            logger.error("  - %s", error)
        if strict:
            raise ValidationError(
                "Application configuration is invalid. Please fix the errors above before starting the service."
            )

    return results


__all__ = [
    "ValidationError",
    "validate_all_config",
    "validate_langfuse_config",
    "validate_openai_config",
]
