"""Conversation history metrics service.

Tracks metrics about conversation history being processed
by the AI Engine for monitoring and debugging.
"""

import logging
import time
from collections import defaultdict
from threading import Lock
from typing import Any

logger = logging.getLogger(__name__)

# Global metrics storage with thread-safe access
_metrics_lock = Lock()
_metrics: dict[str, Any] = {
    "total_requests": 0,
    "total_messages": 0,
    "total_characters": 0,
    "empty_content_count": 0,
    "truncated_count": 0,
    "message_count_distribution": defaultdict(int),
    "role_distribution": defaultdict(int),
    "started_at": time.time(),
}


def record_conversation_history(
    message_count: int,
    total_chars: int,
    user_count: int,
    assistant_count: int,
    has_empty_content: bool,
    was_truncated: bool,
) -> None:
    """Record metrics for a conversation history request.

    Args:
        message_count: Number of messages in the history
        total_chars: Total characters across all messages
        user_count: Number of user messages
        assistant_count: Number of assistant messages
        has_empty_content: Whether any messages had empty content
        was_truncated: Whether the history was truncated (>10 messages)
    """
    with _metrics_lock:
        _metrics["total_requests"] += 1
        _metrics["total_messages"] += message_count
        _metrics["total_characters"] += total_chars

        if has_empty_content:
            _metrics["empty_content_count"] += 1

        if was_truncated:
            _metrics["truncated_count"] += 1

        # Track message count distribution
        if message_count == 0:
            _metrics["message_count_distribution"]["0"] += 1
        elif message_count <= 2:
            _metrics["message_count_distribution"]["1-2"] += 1
        elif message_count <= 5:
            _metrics["message_count_distribution"]["3-5"] += 1
        elif message_count <= 10:
            _metrics["message_count_distribution"]["6-10"] += 1
        else:
            _metrics["message_count_distribution"]["11+"] += 1

        # Track role distribution
        _metrics["role_distribution"]["user"] += user_count
        _metrics["role_distribution"]["assistant"] += assistant_count

    logger.debug(
        "Recorded conversation history metrics: messages=%d, chars=%d, user=%d, assistant=%d",
        message_count,
        total_chars,
        user_count,
        assistant_count,
    )


def get_conversation_history_metrics() -> dict[str, Any]:
    """Get current conversation history metrics.

    Returns:
        Dictionary with current metrics including:
        - total_requests: Total number of requests processed
        - total_messages: Total number of history messages processed
        - total_characters: Total characters in conversation history
        - avg_messages_per_request: Average messages per request
        - avg_characters_per_request: Average characters per request
        - empty_content_count: Number of requests with empty content detected
        - empty_content_rate: Percentage of requests with empty content
        - truncated_count: Number of requests with history truncated (>10 messages)
        - truncated_rate: Percentage of requests that were truncated
        - message_count_distribution: Distribution of message counts
        - role_distribution: Distribution of message roles
        - uptime_seconds: Seconds since metrics collection started
    """
    with _metrics_lock:
        total_requests = _metrics["total_requests"]
        total_messages = _metrics["total_messages"]
        total_characters = _metrics["total_characters"]
        empty_content_count = _metrics["empty_content_count"]
        truncated_count = _metrics["truncated_count"]
        message_count_distribution = dict(_metrics["message_count_distribution"])
        role_distribution = dict(_metrics["role_distribution"])
        started_at = _metrics["started_at"]

    # Calculate averages and rates
    avg_messages = total_messages / total_requests if total_requests > 0 else 0
    avg_characters = total_characters / total_requests if total_requests > 0 else 0
    empty_content_rate = (empty_content_count / total_requests * 100) if total_requests > 0 else 0
    truncated_rate = (truncated_count / total_requests * 100) if total_requests > 0 else 0
    uptime = time.time() - started_at

    return {
        "total_requests": total_requests,
        "total_messages": total_messages,
        "total_characters": total_characters,
        "avg_messages_per_request": round(avg_messages, 2),
        "avg_characters_per_request": round(avg_characters, 2),
        "empty_content_count": empty_content_count,
        "empty_content_rate_percent": round(empty_content_rate, 2),
        "truncated_count": truncated_count,
        "truncated_rate_percent": round(truncated_rate, 2),
        "message_count_distribution": message_count_distribution,
        "role_distribution": role_distribution,
        "uptime_seconds": round(uptime, 2),
    }


def reset_metrics() -> None:
    """Reset all metrics to zero.

    Useful for testing or manual metric reset.
    """
    global _metrics
    with _metrics_lock:
        _metrics = {
            "total_requests": 0,
            "total_messages": 0,
            "total_characters": 0,
            "empty_content_count": 0,
            "truncated_count": 0,
            "message_count_distribution": defaultdict(int),
            "role_distribution": defaultdict(int),
            "started_at": time.time(),
        }
    logger.info("Conversation history metrics reset")
