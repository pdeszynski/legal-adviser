"""Embedding generation service for vector store.

This service handles text embedding generation using OpenAI's API.
"""

from typing import List

from openai import AsyncOpenAI

from ..config import get_settings


class EmbeddingService:
    """Service for generating text embeddings using OpenAI."""

    def __init__(self):
        """Initialize the embedding service with OpenAI client."""
        settings = get_settings()
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.default_model = "text-embedding-3-small"  # 1536 dimensions, cost-effective

    async def generate_embeddings(
        self, texts: List[str], model: str | None = None
    ) -> List[List[float]]:
        """Generate embeddings for a list of texts.

        Args:
            texts: List of text strings to embed
            model: OpenAI embedding model to use (defaults to text-embedding-3-small)

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
            response = await self.client.embeddings.create(
                input=texts, model=model
            )

            # Extract embeddings from response
            embeddings = [item.embedding for item in response.data]
            return embeddings

        except Exception as e:
            raise Exception(f"Embedding generation failed: {str(e)}") from e

    async def generate_embedding(self, text: str, model: str | None = None) -> List[float]:
        """Generate embedding for a single text.

        Args:
            text: Text string to embed
            model: OpenAI embedding model to use

        Returns:
            Single embedding vector

        Raises:
            Exception: If embedding generation fails
        """
        embeddings = await self.generate_embeddings([text], model)
        return embeddings[0] if embeddings else []
