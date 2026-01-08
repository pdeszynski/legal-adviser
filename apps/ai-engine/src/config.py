from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings using Pydantic Settings."""

    # OpenAI Settings
    OPENAI_API_KEY: str
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
