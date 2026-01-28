"""Embedding generation service for vector store.

This service handles text embedding generation using a centralized OpenAI client.
All embedding operations go through this service to provide a single point of control
and make it easy to swap implementations when PydanticAI adds native embedding support.

Note: PydanticAI v1.31 doesn't have native embedding support, so we use OpenAI's API
directly through the centralized client in dependencies.py. This abstraction allows
easy migration when PydanticAI adds embedder support.
"""

from typing import Any

from ..agents.dependencies import get_openai_client
from ..config import get_settings


class EmbeddingService:
    """Service for generating text embeddings.

    This service abstracts the embedding implementation, currently using
    OpenAI's API through the centralized client. When PydanticAI adds
    native embedder support, this class can be updated to use it.
    """

    def __init__(self) -> None:
        """Initialize the embedding service."""
        self._client: Any = None
        self._default_model = "text-embedding-3-small"

    @property
    def client(self) -> Any:  # type: ignore[no-any-return]
        """Lazy-load the OpenAI client."""
        if self._client is None:
            self._client = get_openai_client()
        return self._client

    @property
    def default_model(self) -> str:
        """Get the default embedding model from settings."""
        settings = get_settings()
        return getattr(settings, "OPENAI_EMBEDDING_MODEL", self._default_model)

    async def generate_embeddings(
        self, texts: list[str], model: str | None = None
    ) -> list[list[float]]:
        """Generate embeddings for a list of texts.

        Args:
            texts: List of text strings to embed
            model: Embedding model to use (defaults to text-embedding-3-small)

        Returns:
            List of embedding vectors (one per input text)

        Raises:
            Exception: If embedding generation fails
        """
        if not texts:
            return []

        model = model or self.default_model

        try:
            # OpenAI supports batch embedding generation
            response = await self.client.embeddings.create(input=texts, model=model)

            # Extract embeddings from response
            return [item.embedding for item in response.data]

        except Exception as e:
            raise RuntimeError(f"Embedding generation failed: {e!s}") from e

    async def generate_embedding(
        self, text: str, model: str | None = None
    ) -> list[float]:
        """Generate embedding for a single text.

        Args:
            text: Text string to embed
            model: Embedding model to use

        Returns:
            Single embedding vector

        Raises:
            Exception: If embedding generation fails
        """
        embeddings = await self.generate_embeddings([text], model)
        return embeddings[0] if embeddings else []
