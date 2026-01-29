"""Langfuse tracking service for monitoring observability status.

This module provides in-memory tracking of Langfuse traces and errors
for the debug status endpoint. It tracks:
- Recent trace IDs with timestamps
- Trace counts over time periods
- Langfuse SDK errors
- Last successful trace timestamp
"""

import logging
import time
from collections import deque
from datetime import datetime
from threading import Lock
from typing import Any

logger = logging.getLogger(__name__)

# Global singleton state
_traces: deque[dict[str, Any]] = deque(maxlen=100)  # Store last 100 traces
_errors: deque[dict[str, Any]] = deque(maxlen=50)  # Store last 50 errors
_last_successful_trace: float | None = None  # Timestamp of last successful trace
_lock = Lock()

# Sentinel value for missing last trace
_SENTINEL_LAST_TRACE = "Never"


class LangfuseTracker:
    """Tracker for Langfuse observability metrics.

    This class provides thread-safe tracking of Langfuse traces and errors
    for the /api/v1/debug/langfuse-status endpoint.
    """

    @staticmethod
    def record_trace(
        trace_id: str,
        trace_name: str,
        user_id: str | None = None,
        session_id: str | None = None,
        status: str = "success",
    ) -> None:
        """Record a Langfuse trace event.

        Args:
            trace_id: Unique trace identifier
            trace_name: Name of the trace (operation name)
            user_id: User ID associated with the trace
            session_id: Session ID for grouping
            status: Trace status (success, error, etc.)
        """
        global _traces, _last_successful_trace

        timestamp = time.time()
        trace_record = {
            "trace_id": trace_id,
            "trace_name": trace_name,
            "user_id": user_id,
            "session_id": session_id,
            "status": status,
            "timestamp": timestamp,
            "datetime": datetime.fromtimestamp(timestamp).isoformat(),
        }

        with _lock:
            _traces.append(trace_record)
            if status == "success":
                _last_successful_trace = timestamp

        logger.debug("Recorded Langfuse trace: %s", trace_id)

    @staticmethod
    def record_error(
        error_type: str,
        error_message: str,
        context: dict[str, Any] | None = None,
    ) -> None:
        """Record a Langfuse SDK error.

        Args:
            error_type: Type of error (e.g., "connection_error", "auth_error")
            error_message: Error message
            context: Additional context about the error
        """
        global _errors

        timestamp = time.time()
        error_record = {
            "error_type": error_type,
            "error_message": error_message,
            "context": context or {},
            "timestamp": timestamp,
            "datetime": datetime.fromtimestamp(timestamp).isoformat(),
        }

        with _lock:
            _errors.append(error_record)

        logger.warning("Recorded Langfuse error: %s - %s", error_type, error_message)

    @staticmethod
    def get_trace_counts() -> dict[str, int]:
        """Get trace counts for different time periods.

        Returns:
            Dictionary with trace counts for last hour and last day
        """
        global _traces

        now = time.time()
        hour_ago = now - 3600
        day_ago = now - 86400

        with _lock:
            traces_list = list(_traces)

        last_hour = sum(1 for t in traces_list if t["timestamp"] >= hour_ago)
        last_day = sum(1 for t in traces_list if t["timestamp"] >= day_ago)

        return {
            "last_hour": last_hour,
            "last_day": last_day,
            "total": len(traces_list),
        }

    @staticmethod
    def get_recent_traces(limit: int = 10) -> list[dict[str, Any]]:
        """Get recent trace records.

        Args:
            limit: Maximum number of traces to return

        Returns:
            List of recent trace records
        """
        global _traces

        with _lock:
            traces_list = list(_traces)

        # Return most recent traces first, limited by `limit`
        return list(reversed(traces_list[-limit:]))

    @staticmethod
    def get_recent_errors(limit: int = 10) -> list[dict[str, Any]]:
        """Get recent Langfuse error records.

        Args:
            limit: Maximum number of errors to return

        Returns:
            List of recent error records
        """
        global _errors

        with _lock:
            errors_list = list(_errors)

        return list(reversed(errors_list[-limit:]))

    @staticmethod
    def get_last_successful_trace_timestamp() -> str:
        """Get timestamp of last successful trace.

        Returns:
            ISO-formatted datetime string or "Never" if no successful traces
        """
        global _last_successful_trace

        with _lock:
            if _last_successful_trace is None:
                return _SENTINEL_LAST_TRACE
            return datetime.fromtimestamp(_last_successful_trace).isoformat()

    @staticmethod
    def get_seconds_since_last_trace() -> float | None:
        """Get seconds since last successful trace.

        Returns:
            Seconds since last successful trace, or None if no traces
        """
        global _last_successful_trace

        with _lock:
            if _last_successful_trace is None:
                return None
            return time.time() - _last_successful_trace

    @staticmethod
    def reset() -> None:
        """Reset all tracking state. Useful for testing."""
        global _traces, _errors, _last_successful_trace

        with _lock:
            _traces.clear()
            _errors.clear()
            _last_successful_trace = None


def get_langfuse_tracker() -> LangfuseTracker:
    """Get the Langfuse tracker singleton.

    Returns:
        LangfuseTracker instance
    """
    return LangfuseTracker()


# Export for convenience
__all__ = [
    "LangfuseTracker",
    "get_langfuse_tracker",
]
