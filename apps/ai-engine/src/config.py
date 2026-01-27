from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings using Pydantic Settings."""

    # OpenAI Settings
    # Default placeholder allows service startup;
    # actual AI features will fail without a real key.
    OPENAI_API_KEY: str = "sk-placeholder-set-real-key-in-env"
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Service Settings
    AI_ENGINE_PORT: int = 8000
    AI_ENGINE_HOST: str = "0.0.0.0"
    BACKEND_URL: str = "http://localhost:3001"
    LOG_LEVEL: str = "INFO"

    # Langfuse Observability Settings
    LANGFUSE_PUBLIC_KEY: str = ""
    LANGFUSE_SECRET_KEY: str = ""
    LANGFUSE_HOST: str | None = None  # For Langfuse Cloud/On-premise
    LANGFUSE_ENABLED: bool = True
    LANGFUSE_SAMPLING_RATE: float = 1.0  # 1.0 = trace all requests
    LANGFUSE_SESSION_ID_HEADER: str = "x-session-id"

    # Cache Settings
    REDIS_URL: str = ""  # redis://localhost:6379/0
    CACHE_ENABLED: bool = True
    CACHE_TTL_SECONDS: int = 3600  # 1 hour default
    CACHE_MAX_SIZE: int = 1000  # For in-memory cache

    # Cost Monitoring Settings
    COST_ALERT_THRESHOLD_USD: float = 10.0  # Alert when daily cost exceeds this
    COST_TRACKING_ENABLED: bool = True
    MAX_TOKENS_PER_REQUEST: int = 100000  # Safety limit

    # Model Selection Settings
    AUTO_MODEL_SELECTION: bool = (
        True  # Automatically choose model based on task complexity
    )
    PREFER_MINI_MODEL: bool = True  # Prefer gpt-4o-mini for simple tasks

    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings():
    """Return cached settings instance."""
    return Settings()
