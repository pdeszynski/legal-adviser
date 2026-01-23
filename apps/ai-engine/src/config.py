from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings using Pydantic Settings."""

    # OpenAI Settings
    # Default placeholder allows service startup;
    # actual AI features will fail without a real key.
    OPENAI_API_KEY: str = "sk-placeholder-set-real-key-in-env"
    OPENAI_MODEL: str = "gpt-4o"

    # Service Settings
    AI_ENGINE_PORT: int = 8000
    AI_ENGINE_HOST: str = "0.0.0.0"
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


@lru_cache
def get_settings():
    """Return cached settings instance."""
    return Settings()
