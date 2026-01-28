"""Response caching service using Redis for performance optimization.

This module provides caching for AI responses to:
- Reduce API costs for repeated queries
- Improve response latency
- Reduce token usage for similar requests

Cache keys are based on hashed query parameters with configurable TTL.
"""

import hashlib
import json
from collections.abc import Callable, Coroutine
from typing import Any, TypeVar

from ..config import get_settings

T = TypeVar("T")

# Singleton cache client
_cache_backend: "CacheBackend | None" = None


class CacheBackend:
    """Abstract cache backend interface."""

    async def get(self, key: str) -> Any | None:
        """Get value from cache."""
        raise NotImplementedError

    async def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        """Set value in cache with TTL."""
        raise NotImplementedError

    async def delete(self, key: str) -> None:
        """Delete value from cache."""
        raise NotImplementedError

    async def clear(self) -> None:
        """Clear all cached values."""
        raise NotImplementedError

    def is_available(self) -> bool:
        """Check if cache backend is available."""
        return True


class InMemoryCache(CacheBackend):
    """In-memory cache backend for development/testing.

    Uses simple dictionary with size limit for basic caching.
    """

    def __init__(self, max_size: int = 1000) -> None:
        """Initialize in-memory cache.

        Args:
            max_size: Maximum number of cached items
        """
        self._cache: dict[str, tuple[Any, float]] = {}  # key -> (value, expiry_time)
        self._max_size = max_size
        self._access_order: list[str] = []  # Track access for LRU eviction

    def _evict_expired(self) -> None:
        """Remove expired entries."""
        import time

        now = time.time()
        expired_keys = [
            key for key, (_, expiry) in self._cache.items() if expiry < now
        ]
        for key in expired_keys:
            del self._cache[key]
            if key in self._access_order:
                self._access_order.remove(key)

    def _evict_lru(self) -> None:
        """Evict least recently used entry if at capacity."""
        if len(self._cache) >= self._max_size and self._access_order:
            lru_key = self._access_order.pop(0)
            if lru_key in self._cache:
                del self._cache[lru_key]

    async def get(self, key: str) -> Any | None:
        """Get value from cache."""
        self._evict_expired()

        entry = self._cache.get(key)
        if entry is None:
            return None

        value, expiry = entry
        import time

        if time.time() > expiry:
            # Expired
            del self._cache[key]
            if key in self._access_order:
                self._access_order.remove(key)
            return None

        # Update access order
        if key in self._access_order:
            self._access_order.remove(key)
        self._access_order.append(key)

        return value

    async def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        """Set value in cache with TTL."""
        self._evict_expired()
        self._evict_lru()

        import time

        expiry = time.time() + ttl_seconds
        self._cache[key] = (value, expiry)

        if key in self._access_order:
            self._access_order.remove(key)
        self._access_order.append(key)

    async def delete(self, key: str) -> None:
        """Delete value from cache."""
        if key in self._cache:
            del self._cache[key]
        if key in self._access_order:
            self._access_order.remove(key)

    async def clear(self) -> None:
        """Clear all cached values."""
        self._cache.clear()
        self._access_order.clear()


class RedisCache(CacheBackend):
    """Redis cache backend for production.

    Provides distributed caching with proper TTL support.
    Falls back to in-memory cache if Redis is unavailable.
    """

    def __init__(self, url: str, key_prefix: str = "ai_engine:") -> None:
        """Initialize Redis cache.

        Args:
            url: Redis connection URL (redis://localhost:6379/0)
            key_prefix: Prefix for all cache keys
        """
        self._url = url
        self._key_prefix = key_prefix
        self._client: Any | None = None
        self._available = False

    async def _get_client(self) -> Any:
        """Lazy-load Redis client."""
        if self._client is not None:
            return self._client

        try:
            import redis.asyncio as redis

            # Type ignore for redis.from_url which has complex return type
            self._client = await redis.from_url(  # type: ignore[no-untyped-call]
                self._url,
                encoding="utf-8",
                decode_responses=True,
            )
            # Test connection
            await self._client.ping()
            self._available = True
        except Exception:
            self._available = False
            self._client = None

        return self._client

    def is_available(self) -> bool:
        """Check if Redis is available."""
        return self._available

    async def get(self, key: str) -> Any | None:
        """Get value from cache."""
        if not self.is_available():
            return None

        try:
            client = await self._get_client()
            if client is None:
                return None

            value = await client.get(f"{self._key_prefix}{key}")
            if value is None:
                return None

            return json.loads(value)
        except Exception:
            # On error, mark as unavailable and return None
            self._available = False
            return None

    async def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        """Set value in cache with TTL."""
        if not self.is_available():
            return

        try:
            client = await self._get_client()
            if client is None:
                return

            await client.setex(
                f"{self._key_prefix}{key}",
                ttl_seconds,
                json.dumps(value),
            )
        except Exception:
            # On error, mark as unavailable
            self._available = False

    async def delete(self, key: str) -> None:
        """Delete value from cache."""
        if not self.is_available():
            return

        try:
            client = await self._get_client()
            if client is None:
                return

            await client.delete(f"{self._key_prefix}{key}")
        except Exception:
            self._available = False

    async def clear(self) -> None:
        """Clear all cached values with our prefix."""
        if not self.is_available():
            return

        try:
            client = await self._get_client()
            if client is None:
                return

            keys = []
            async for key in client.scan_iter(f"{self._key_prefix}*"):
                keys.append(key)

            if keys:
                await client.delete(*keys)
        except Exception:
            self._available = False


def generate_cache_key(
    operation: str,
    **params: Any,
) -> str:
    """Generate a deterministic cache key from parameters.

    Args:
        operation: Name of the operation (e.g., "qa", "classify")
        **params: Parameters to include in key

    Returns:
        Hash-based cache key
    """
    # Sort params for deterministic hashing
    sorted_params = json.dumps(params, sort_keys=True, default=str)

    # Create hash
    key_material = f"{operation}:{sorted_params}"
    return hashlib.sha256(key_material.encode()).hexdigest()[:32]


def get_cache_backend() -> CacheBackend:
    """Get the configured cache backend.

    Uses Redis if REDIS_URL is configured, otherwise falls back
    to in-memory caching.

    Returns:
        CacheBackend instance
    """
    global _cache_backend

    if _cache_backend is not None:
        return _cache_backend

    settings = get_settings()

    # Try Redis if configured
    redis_url = getattr(settings, "REDIS_URL", None)
    if redis_url:
        _cache_backend = RedisCache(redis_url)
        return _cache_backend

    # Default to in-memory cache
    max_cache_size = getattr(settings, "CACHE_MAX_SIZE", 1000)
    _cache_backend = InMemoryCache(max_size=max_cache_size)
    return _cache_backend


async def cached_call(
    operation: str,
    params: dict[str, Any],
    callable_func: Callable[[], Coroutine[Any, Any, T]],
    ttl_seconds: int = 3600,
) -> tuple[T, bool]:
    """Execute a cached call.

    Args:
        operation: Operation name for cache key
        params: Parameters for cache key generation
        callable_func: Async function to call if cache miss
        ttl_seconds: Time-to-live for cached result

    Returns:
        Tuple of (result, was_cached)
    """
    cache = get_cache_backend()
    cache_key = generate_cache_key(operation, **params)

    # Try cache first
    cached_result = await cache.get(cache_key)
    if cached_result is not None:
        return cached_result, True

    # Cache miss - call function
    result = await callable_func()

    # Store in cache
    await cache.set(cache_key, result, ttl_seconds)

    return result, False


async def invalidate_cache(operation: str, **params: Any) -> None:
    """Invalidate a specific cache entry.

    Args:
        operation: Operation name
        **params: Parameters matching the cached call
    """
    cache = get_cache_backend()
    cache_key = generate_cache_key(operation, **params)
    await cache.delete(cache_key)


async def clear_all_cache() -> None:
    """Clear all cached values."""
    cache = get_cache_backend()
    await cache.clear()
