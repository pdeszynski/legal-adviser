from functools import lru_cache
from pathlib import Path

from pydantic import field_validator, model_validator
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
    FRONTEND_URL: str = "http://localhost:3000"
    LOG_LEVEL: str = "INFO"

    # JWT Authentication Settings
    # Must match the JWT_SECRET used by the NestJS backend
    JWT_SECRET: str = "secretKey"  # Must match backend's default
    JWT_ALGORITHM: str = "HS256"
    JWT_AUDIENCE: str | None = None
    JWT_ISSUER: str | None = None

    # Langfuse Observability Settings
    # Format: pk-xxxxxxxxxxxxxxxxxxxx (starts with "pk-")
    LANGFUSE_PUBLIC_KEY: str = ""
    # Format: sk-xxxxxxxxxxxxxxxxxxxx (starts with "sk-")
    LANGFUSE_SECRET_KEY: str = ""
    # Default to Langfuse Cloud: https://cloud.langfuse.com
    # For self-hosted: e.g., http://localhost:3000 or https://langfuse.yourdomain.com
    LANGFUSE_HOST: str | None = None
    LANGFUSE_ENABLED: bool = True
    # Sampling rate: 0.0 (no tracing) to 1.0 (trace all requests)
    LANGFUSE_SAMPLING_RATE: float = 1.0
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

    @field_validator("LANGFUSE_PUBLIC_KEY")
    @classmethod
    def validate_langfuse_public_key(cls, v: str) -> str:
        """Validate Langfuse public key format if provided.

        The key should start with "pk-" if set. Empty string is allowed
        when Langfuse is disabled or not configured.
        """
        if v and not v.startswith("pk-"):
            raise ValueError(
                'LANGFUSE_PUBLIC_KEY must start with "pk-" (e.g., pk-xxxxxxxxxxxxxxxxxxxx). '
                'Get your keys from https://cloud.langfuse.com'
            )
        return v

    @field_validator("LANGFUSE_SECRET_KEY")
    @classmethod
    def validate_langfuse_secret_key(cls, v: str) -> str:
        """Validate Langfuse secret key format if provided.

        The key should start with "sk-" if set. Empty string is allowed
        when Langfuse is disabled or not configured.
        """
        if v and not v.startswith("sk-"):
            raise ValueError(
                'LANGFUSE_SECRET_KEY must start with "sk-" (e.g., sk-xxxxxxxxxxxxxxxxxxxx). '
                'Get your keys from https://cloud.langfuse.com'
            )
        return v

    @field_validator("LANGFUSE_SAMPLING_RATE")
    @classmethod
    def validate_sampling_rate(cls, v: float) -> float:
        """Validate Langfuse sampling rate is between 0 and 1."""
        if not 0.0 <= v <= 1.0:
            raise ValueError(
                "LANGFUSE_SAMPLING_RATE must be between 0.0 (no tracing) and 1.0 (trace all)"
            )
        return v

    @field_validator("LANGFUSE_HOST")
    @classmethod
    def validate_langfuse_host(cls, v: str | None) -> str | None:
        """Validate Langfuse host URL if provided.

        Should be a valid URL for Langfuse Cloud or self-hosted instance.
        """
        if v:
            # Remove trailing slash if present
            v = v.rstrip("/")
            # Basic URL format check
            if not v.startswith(("http://", "https://")):
                raise ValueError(
                    'LANGFUSE_HOST must be a valid URL starting with "http://" or "https://". '
                    'For Langfuse Cloud use: https://cloud.langfuse.com'
                )
        return v

    @model_validator(mode="after")
    def validate_langfuse_configuration(self) -> "Settings":
        """Validate Langfuse configuration consistency.

        If LANGFUSE_ENABLED is True, both keys must be provided.
        If keys are provided, they must both be set (not just one).
        """
        # If Langfuse is enabled, require both keys
        if self.LANGFUSE_ENABLED:
            if not self.LANGFUSE_PUBLIC_KEY or not self.LANGFUSE_SECRET_KEY:
                raise ValueError(
                    "LANGFUSE_ENABLED is True but LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY is not set. "
                    "Set both keys or disable Langfuse by setting LANGFUSE_ENABLED=false"
                )

        # If only one key is set, that's a configuration error
        has_public_key = bool(self.LANGFUSE_PUBLIC_KEY)
        has_secret_key = bool(self.LANGFUSE_SECRET_KEY)
        if has_public_key != has_secret_key:
            raise ValueError(
                "Both LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY must be set together. "
                "Set both keys or leave both empty."
            )

        return self


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
