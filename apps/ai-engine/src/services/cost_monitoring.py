"""Cost monitoring and alerting service.

Tracks token usage and API costs across all operations.
Provides alerts when thresholds are exceeded.
"""

import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from ..config import get_settings
from ..langfuse_init import is_langfuse_enabled


@dataclass
class CostMetric:
    """A single cost metric entry."""

    timestamp: float
    operation: str
    model: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost_usd: float
    user_id: str | None = None
    session_id: str | None = None


@dataclass
class CostSummary:
    """Summary of costs for a time period."""

    period_start: float
    period_end: float
    total_cost_usd: float
    total_input_tokens: int
    total_output_tokens: int
    total_requests: int
    operation_costs: dict[str, float]
    model_costs: dict[str, float]
    alerts_triggered: list[str]


class CostMonitor:
    """Monitor and track AI API costs."""

    def __init__(self) -> None:
        """Initialize the cost monitor."""
        self._metrics: list[CostMetric] = []
        self._daily_costs: dict[str, float] = defaultdict(float)
        self._alerts_triggered: dict[str, float] = {}
        self._settings = get_settings()
        self._startup_time = time.time()

    def record_usage(
        self,
        operation: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        user_id: str | None = None,
        session_id: str | None = None,
    ) -> float:
        """Record token usage and calculate estimated cost.

        Args:
            operation: Type of operation (qa, classify, etc.)
            model: Model name
            input_tokens: Input tokens used
            output_tokens: Output tokens used
            user_id: Optional user ID
            session_id: Optional session ID

        Returns:
            Estimated cost in USD
        """
        from .model_selection import estimate_cost

        cost = estimate_cost(model, input_tokens, output_tokens)

        metric = CostMetric(
            timestamp=time.time(),
            operation=operation,
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=input_tokens + output_tokens,
            estimated_cost_usd=cost,
            user_id=user_id,
            session_id=session_id,
        )

        self._metrics.append(metric)

        # Track daily costs
        today = datetime.now().strftime("%Y-%m-%d")
        self._daily_costs[today] += cost

        # Check for alert threshold
        if self._settings.COST_TRACKING_ENABLED:
            self._check_alert_threshold(today)

        # Log to Langfuse if enabled
        if is_langfuse_enabled():
            from ..langfuse_init import get_langfuse
            langfuse = get_langfuse()
            if langfuse:
                langfuse.score(
                    name="cost_tracking",
                    value=cost,
                    comment=f"{operation}: {input_tokens + output_tokens} tokens",
                )

        return cost

    def _check_alert_threshold(self, date_key: str) -> None:
        """Check if cost threshold exceeded and trigger alert."""
        daily_cost = self._daily_costs[date_key]
        threshold = self._settings.COST_ALERT_THRESHOLD_USD

        # Check if we haven't already alerted for this threshold level
        alert_key = f"{date_key}_{int(threshold)}"

        if daily_cost >= threshold and alert_key not in self._alerts_triggered:
            self._alerts_triggered[alert_key] = daily_cost
            self._trigger_alert(daily_cost, threshold)

    def _trigger_alert(self, current_cost: float, threshold: float) -> None:
        """Trigger a cost alert."""
        import logging

        logger = logging.getLogger(__name__)

        alert_message = (
            f"🚨 Cost Alert: Daily API cost (${current_cost:.2f}) "
            f"has exceeded threshold (${threshold:.2f})"
        )

        logger.warning(alert_message)

        # Could integrate with Slack, email, etc. here
        # For now, just log the alert

    def get_daily_summary(self, date: str | None = None) -> CostSummary:
        """Get cost summary for a specific day.

        Args:
            date: Date in YYYY-MM-DD format, or None for today

        Returns:
            CostSummary for the specified day
        """
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")

        # Filter metrics for the day
        start_of_day = datetime.strptime(date, "%Y-%m-%d").timestamp()
        end_of_day = start_of_day + 86400  # 24 hours

        day_metrics = [
            m for m in self._metrics
            if start_of_day <= m.timestamp < end_of_day
        ]

        # Calculate summary
        operation_costs: dict[str, float] = defaultdict(float)
        model_costs: dict[str, float] = defaultdict(float)

        for metric in day_metrics:
            operation_costs[metric.operation] += metric.estimated_cost_usd
            model_costs[metric.model] += metric.estimated_cost_usd

        total_cost = sum(m.estimated_cost_usd for m in day_metrics)
        total_input = sum(m.input_tokens for m in day_metrics)
        total_output = sum(m.output_tokens for m in day_metrics)

        # Get triggered alerts for this day
        alerts = [
            f"${cost:.2f} / ${self._settings.COST_ALERT_THRESHOLD_USD:.2f}"
            for key, cost in self._alerts_triggered.items()
            if key.startswith(date)
        ]

        return CostSummary(
            period_start=start_of_day,
            period_end=end_of_day,
            total_cost_usd=total_cost,
            total_input_tokens=total_input,
            total_output_tokens=total_output,
            total_requests=len(day_metrics),
            operation_costs=dict(operation_costs),
            model_costs=dict(model_costs),
            alerts_triggered=alerts,
        )

    def get_session_summary(self, session_id: str) -> dict[str, Any]:
        """Get cost summary for a specific session.

        Args:
            session_id: Session ID to summarize

        Returns:
            Dictionary with session cost data
        """
        session_metrics = [
            m for m in self._metrics
            if m.session_id == session_id
        ]

        if not session_metrics:
            return {
                "session_id": session_id,
                "total_cost_usd": 0.0,
                "total_tokens": 0,
                "request_count": 0,
                "operations": [],
            }

        total_cost = sum(m.estimated_cost_usd for m in session_metrics)
        total_tokens = sum(m.total_tokens for m in session_metrics)

        operations = {}
        for metric in session_metrics:
            if metric.operation not in operations:
                operations[metric.operation] = {
                    "cost": 0.0,
                    "tokens": 0,
                    "count": 0,
                }
            operations[metric.operation]["cost"] += metric.estimated_cost_usd
            operations[metric.operation]["tokens"] += metric.total_tokens
            operations[metric.operation]["count"] += 1

        return {
            "session_id": session_id,
            "total_cost_usd": total_cost,
            "total_tokens": total_tokens,
            "request_count": len(session_metrics),
            "operations": operations,
        }

    def get_uptime_hours(self) -> float:
        """Get service uptime in hours."""
        return (time.time() - self._startup_time) / 3600

    def get_average_cost_per_hour(self) -> float:
        """Get average cost per hour since startup."""
        uptime_hours = self.get_uptime_hours()
        if uptime_hours <= 0:
            return 0.0

        total_cost = sum(m.estimated_cost_usd for m in self._metrics)
        return total_cost / uptime_hours

    def get_metrics(self) -> list[CostMetric]:
        """Get all recorded metrics."""
        return self._metrics.copy()

    def clear_old_metrics(self, days_to_keep: int = 7) -> None:
        """Clear metrics older than the specified days.

        Args:
            days_to_keep: Number of days of metrics to retain
        """
        cutoff_time = time.time() - (days_to_keep * 86400)
        self._metrics = [m for m in self._metrics if m.timestamp >= cutoff_time]

    def reset(self) -> None:
        """Reset all metrics (use with caution)."""
        self._metrics.clear()
        self._daily_costs.clear()
        self._alerts_triggered.clear()


# Singleton instance
_cost_monitor: CostMonitor | None = None


def get_cost_monitor() -> CostMonitor:
    """Get the singleton CostMonitor instance."""
    global _cost_monitor
    if _cost_monitor is None:
        _cost_monitor = CostMonitor()
    return _cost_monitor


def track_llm_call(
    operation: str,
    model: str,
    input_tokens: int = 0,
    output_tokens: int = 0,
    user_id: str | None = None,
    session_id: str | None = None,
) -> float:
    """Convenience function to track an LLM call.

    Args:
        operation: Type of operation
        model: Model used
        input_tokens: Input tokens
        output_tokens: Output tokens
        user_id: Optional user ID
        session_id: Optional session ID

    Returns:
        Estimated cost in USD
    """
    if not get_settings().COST_TRACKING_ENABLED:
        return 0.0

    monitor = get_cost_monitor()
    return monitor.record_usage(
        operation=operation,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        user_id=user_id,
        session_id=session_id,
    )


def get_cost_summary_dict() -> dict[str, Any]:
    """Get a dictionary summary of costs for API responses.

    Returns:
        Dictionary with cost summary data
    """
    monitor = get_cost_monitor()
    summary = monitor.get_daily_summary()

    return {
        "today": {
            "total_cost_usd": summary.total_cost_usd,
            "total_tokens": summary.total_input_tokens + summary.total_output_tokens,
            "total_requests": summary.total_requests,
            "alerts": summary.alerts_triggered,
        },
        "by_operation": summary.operation_costs,
        "by_model": summary.model_costs,
        "uptime_hours": monitor.get_uptime_hours(),
        "avg_cost_per_hour": monitor.get_average_cost_per_hour(),
    }
