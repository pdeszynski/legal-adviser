
🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase for Langfuse integration",
      "content": "Explore codebase for Langfuse integration",
      "status": "in_progress"
    },
    {
      "activeForm": "Planning implementation approach",
      "content": "Plan implementation approach",
      "status": "pending"
    },
    {
      "activeForm": "Implementing debug endpoint",
      "content": "Implement /api/v1/debug/langfuse-status endpoint",
      "status": "pending"
    },
    {
      "activeForm": "Adding admin authentication protection",
      "content": "Add admin authentication protection",
      "status": "pending"
    },
    {
      "activeForm": "Creating Playwright verification test",
      "content": "Create and run Playwright verification test",
      "status": "pending"
    },
    {
      "activeForm": "Cleaning up and summarizing",
      "content": "Clean up and summarize",
      "status": "pending"
    }
  ]
}

🔧 Tool: Glob
Input: {
  "pattern": "**/langfuse*.py"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/ai-engine/src/**/*.py"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/ai-engine/src/auth/**/*.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/langfuse_init.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/auth/jwt.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/config.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase for Langfuse integration",
      "content": "Explore codebase for Langfuse integration",
      "status": "completed"
    },
    {
      "activeForm": "Planning implementation approach",
      "content": "Plan implementation approach",
      "status": "in_progress"
    },
    {
      "activeForm": "Implementing debug endpoint",
      "content": "Implement /api/v1/debug/langfuse-status endpoint",
      "status": "pending"
    },
    {
      "activeForm": "Adding admin authentication protection",
      "content": "Add admin authentication protection",
      "status": "pending"
    },
    {
      "activeForm": "Creating Playwright verification test",
      "content": "Create and run Playwright verification test",
      "status": "pending"
    },
    {
      "activeForm": "Cleaning up and summarizing",
      "content": "Clean up and summarize",
      "status": "pending"
    }
  ]
}
Now I have a good understanding of the codebase. Let me plan the implementation approach:

**Implementation Plan:**

1. **Create a new module for tracking Langfuse traces** (`apps/ai-engine/src/services/langfuse_tracker.py`)
   - Track trace IDs in memory with timestamps
   - Track errors from Langfuse SDK
   - Count traces in last hour/day

2. **Add the debug endpoint** (`/api/v1/debug/langfuse-status`) to `main.py`
   - Return connection status, trace counts, recent trace IDs, last successful trace, recent errors, config check
   - Protect with admin authentication (using existing `UserContext.is_admin`)

3. **Update langfuse_init.py** to expose tracking hooks
   - Add a callback system for trace completion events

4. **Create a simple Playwright test** to verify the endpoint works

Let me implement this:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase for Langfuse integration",
      "content": "Explore codebase for Langfuse integration",
      "status": "completed"
    },
    {
      "activeForm": "Planning implementation approach",
      "content": "Plan implementation approach",
      "status": "completed"
    },
    {
      "activeForm": "Creating Langfuse tracker service",
      "content": "Create Langfuse tracker service",
      "status": "in_progress"
    },
    {
      "activeForm": "Adding debug endpoint to main.py",
      "content": "Add debug endpoint to main.py",
      "status": "pending"
    },
    {
      "activeForm": "Creating Playwright verification test",
      "content": "Create and run Playwright verification test",
      "status": "pending"
    },
    {
      "activeForm": "Cleaning up and summarizing",
      "content": "Clean up and summarize",
      "status": "pending"
    }
  ]
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/services/langfuse_tracker.py",
  "content": "\"\"\"Langfuse tracking service for monitoring observability status.\n\nThis module provides in-memory tracking of Langfuse traces and errors\nfor the debug status endpoint. It tracks:\n- Recent trace IDs with timestamps\n- Trace counts over time periods\n- Langfuse SDK errors\n- Last successful trace timestamp\n\"\"\"\n\nimport logging\nimport time\nfrom collections import deque\nfrom datetime import datetime, timedelta\nfrom threading import Lock\nfrom typing import Any\n\nlogger = logging.getLogger(__name__)\n\n# Global singleton state\n_traces: deque[dict[str, Any]] = deque(maxlen=100)  # Store last 100 traces\n_errors: deque[dict[str, Any]] = deque(maxlen=50)  # Store last 50 errors\n_last_successful_trace: float | None = None  # Timestamp of last successful trace\n_lock = Lock()\n\n# Sentinel value for missing last trace\n_SENTINEL_LAST_TRACE = \"Never\"\n\n\nclass LangfuseTracker:\n    \"\"\"Tracker for Langfuse observability metrics.\n\n    This class provides thread-safe tracking of Langfuse traces and errors\n    for the /api/v1/debug/langfuse-status endpoint.\n    \"\"\"\n\n    @staticmethod\n    def record_trace(\n        trace_id: str,\n        trace_name: str,\n        user_id: str | None = None,\n        session_id: str | None = None,\n        status: str = \"success\",\n    ) -> None:\n        \"\"\"Record a Langfuse trace event.\n\n        Args:\n            trace_id: Unique trace identifier\n            trace_name: Name of the trace (operation name)\n            user_id: User ID associated with the trace\n            session_id: Session ID for grouping\n            status: Trace status (success, error, etc.)\n        \"\"\"\n        global _traces, _last_successful_trace\n\n        timestamp = time.time()\n        trace_record = {\n            \"trace_id\": trace_id,\n            \"trace_name\": trace_name,\n            \"user_id\": user_id,\n            \"session_id\": session_id,\n            \"status\": status,\n            \"timestamp\": timestamp,\n            \"datetime\": datetime.fromtimestamp(timestamp).isoformat(),\n        }\n\n        with _lock:\n            _traces.append(trace_record)\n            if status == \"success\":\n                _last_successful_trace = timestamp\n\n        logger.debug(\"Recorded Langfuse trace: %s\", trace_id)\n\n    @staticmethod\n    def record_error(\n        error_type: str,\n        error_message: str,\n        context: dict[str, Any] | None = None,\n    ) -> None:\n        \"\"\"Record a Langfuse SDK error.\n\n        Args:\n            error_type: Type of error (e.g., \"connection_error\", \"auth_error\")\n            error_message: Error message\n            context: Additional context about the error\n        \"\"\"\n        global _errors\n\n        timestamp = time.time()\n        error_record = {\n            \"error_type\": error_type,\n            \"error_message\": error_message,\n            \"context\": context or {},\n            \"timestamp\": timestamp,\n            \"datetime\": datetime.fromtimestamp(timestamp).isoformat(),\n        }\n\n        with _lock:\n            _errors.append(error_record)\n\n        logger.warning(\"Recorded Langfuse error: %s - %s\", error_type, error_message)\n\n    @staticmethod\n    def get_trace_counts() -> dict[str, int]:\n        \"\"\"Get trace counts for different time periods.\n\n        Returns:\n            Dictionary with trace counts for last hour and last day\n        \"\"\"\n        global _traces\n\n        now = time.time()\n        hour_ago = now - 3600\n        day_ago = now - 86400\n\n        with _lock:\n            traces_list = list(_traces)\n\n        last_hour = sum(1 for t in traces_list if t[\"timestamp\"] >= hour_ago)\n        last_day = sum(1 for t in traces_list if t[\"timestamp\"] >= day_ago)\n\n        return {\n            \"last_hour\": last_hour,\n            \"last_day\": last_day,\n            \"total\": len(traces_list),\n        }\n\n    @staticmethod\n    def get_recent_traces(limit: int = 10) -> list[dict[str, Any]]:\n        \"\"\"Get recent trace records.\n\n        Args:\n            limit: Maximum number of traces to return\n\n        Returns:\n            List of recent trace records\n        \"\"\"\n        global _traces\n\n        with _lock:\n            traces_list = list(_traces)\n\n        # Return most recent traces first, limited by `limit`\n        return list(reversed(traces_list[-limit:]))\n\n    @staticmethod\n    def get_recent_errors(limit: int = 10) -> list[dict[str, Any]]:\n        \"\"\"Get recent Langfuse error records.\n\n        Args:\n            limit: Maximum number of errors to return\n\n        Returns:\n            List of recent error records\n        \"\"\"\n        global _errors\n\n        with _lock:\n            errors_list = list(_errors)\n\n        return list(reversed(errors_list[-limit:]))\n\n    @staticmethod\n    def get_last_successful_trace_timestamp() -> str:\n        \"\"\"Get timestamp of last successful trace.\n\n        Returns:\n            ISO-formatted datetime string or \"Never\" if no successful traces\n        \"\"\"\n        global _last_successful_trace\n\n        with _lock:\n            if _last_successful_trace is None:\n                return _SENTINEL_LAST_TRACE\n            return datetime.fromtimestamp(_last_successful_trace).isoformat()\n\n    @staticmethod\n    def get_seconds_since_last_trace() -> float | None:\n        \"\"\"Get seconds since last successful trace.\n\n        Returns:\n            Seconds since last successful trace, or None if no traces\n        \"\"\"\n        global _last_successful_trace\n\n        with _lock:\n            if _last_successful_trace is None:\n                return None\n            return time.time() - _last_successful_trace\n\n    @staticmethod\n    def reset() -> None:\n        \"\"\"Reset all tracking state. Useful for testing.\"\"\"\n        global _traces, _errors, _last_successful_trace\n\n        with _lock:\n            _traces.clear()\n            _errors.clear()\n            _last_successful_trace = None\n\n\ndef get_langfuse_tracker() -> LangfuseTracker:\n    \"\"\"Get the Langfuse tracker singleton.\n\n    Returns:\n        LangfuseTracker instance\n    \"\"\"\n    return LangfuseTracker()\n\n\n# Export for convenience\n__all__ = [\n    \"LangfuseTracker\",\n    \"get_langfuse_tracker\",\n]\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase for Langfuse integration",
      "content": "Explore codebase for Langfuse integration",
      "status": "completed"
    },
    {
      "activeForm": "Planning implementation approach",
      "content": "Plan implementation approach",
      "status": "completed"
    },
    {
      "activeForm": "Creating Langfuse tracker service",
      "content": "Create Langfuse tracker service",
      "status": "completed"
    },
    {
      "activeForm": "Adding debug endpoint to main.py",
      "content": "Add debug endpoint to main.py",
      "status": "in_progress"
    },
    {
      "activeForm": "Creating Playwright verification test",
      "content": "Create and run Playwright verification test",
      "status": "pending"
    },
    {
      "activeForm": "Cleaning up and summarizing",
      "content": "Clean up and summarize",
      "status": "pending"
    }
  ]
}
Now let me add the debug endpoint to main.py:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "old_string": "@app.get(\"/api/v1/metrics/costs\")\nasync def get_cost_metrics():\n    \"\"\"Get cost and usage metrics for monitoring.\n\n    Returns:\n        - today: Today's total cost, tokens, and requests\n        - by_operation: Cost breakdown by operation type\n        - by_model: Cost breakdown by model\n        - uptime_hours: Service uptime\n        - avg_cost_per_hour: Average cost per hour since startup\n        - alerts: List of triggered cost alerts\n\n    This endpoint is useful for:\n    - Cost monitoring dashboards\n    - Automated cost alerts\n    - Usage analytics\n    \"\"\"\n    return get_cost_summary_dict()",
  "new_string": "@app.get(\"/api/v1/metrics/costs\")\nasync def get_cost_metrics():\n    \"\"\"Get cost and usage metrics for monitoring.\n\n    Returns:\n        - today: Today's total cost, tokens, and requests\n        - by_operation: Cost breakdown by operation type\n        - by_model: Cost breakdown by model\n        - uptime_hours: Service uptime\n        - avg_cost_per_hour: Average cost per hour since startup\n        - alerts: List of triggered cost alerts\n\n    This endpoint is useful for:\n    - Cost monitoring dashboards\n    - Automated cost alerts\n    - Usage analytics\n    \"\"\"\n    return get_cost_summary_dict()\n\n\n@app.get(\"/api/v1/debug/langfuse-status\")\nasync def get_langfuse_status(\n    user: UserContext = Depends(get_current_user),\n):\n    \"\"\"Get Langfuse observability status for debugging.\n\n    This endpoint helps diagnose Langfuse integration issues without\n    logging into the Langfuse dashboard.\n\n    Requires admin authentication (user with ADMIN or SUPER_ADMIN role).\n\n    Returns:\n        - connection_status: \"connected\" or \"disconnected\"\n        - configuration: Langfuse configuration check (keys, sampling rate, etc.)\n        - trace_counts: Number of traces sent in last hour/day/total\n        - recent_traces: List of recent trace IDs for verification\n        - last_successful_trace: Timestamp of last successful trace\n        - seconds_since_last_trace: Seconds since last successful trace\n        - recent_errors: List of recent Langfuse SDK errors\n        - langfuse_available: Whether Langfuse SDK is available\n        - langfuse_enabled: Whether Langfuse is enabled in config\n\n    Raises:\n        HTTPException 403: If user is not an admin\n        HTTPException 401: If authentication is required but not provided\n    \"\"\"\n    from .config import get_settings\n    from .langfuse_init import get_langfuse, is_langfuse_enabled\n    from .services.langfuse_tracker import get_langfuse_tracker\n\n    # Check admin authorization\n    if not user.is_admin:\n        raise HTTPException(\n            status_code=status.HTTP_403_FORBIDDEN,\n            detail={\n                \"error_code\": \"INSUFFICIENT_PERMISSIONS\",\n                \"message\": \"Admin access required for Langfuse debug endpoint\",\n            },\n        )\n\n    settings = get_settings()\n    tracker = get_langfuse_tracker()\n    langfuse_client = get_langfuse()\n\n    # Check connection status\n    connection_status = \"disconnected\"\n    if is_langfuse_enabled() and langfuse_client is not None:\n        try:\n            # Use auth_check to verify connection\n            if hasattr(langfuse_client, \"auth_check\"):\n                if langfuse_client.auth_check():\n                    connection_status = \"connected\"\n            else:\n                # Fallback: if enabled and client exists, assume connected\n                connection_status = \"connected\"\n        except Exception as e:\n            logger.warning(\"Langfuse auth_check failed: %s\", e)\n\n    # Get trace counts\n    trace_counts = tracker.get_trace_counts()\n\n    # Get recent traces (limit to 10 for readability)\n    recent_traces = tracker.get_recent_traces(limit=10)\n\n    # Get recent errors (limit to 10)\n    recent_errors = tracker.get_recent_errors(limit=10)\n\n    # Get last successful trace info\n    last_successful_trace = tracker.get_last_successful_trace_timestamp()\n    seconds_since_last_trace = tracker.get_seconds_since_last_trace()\n\n    # Check configuration\n    has_public_key = bool(settings.LANGFUSE_PUBLIC_KEY)\n    has_secret_key = bool(settings.LANGFUSE_SECRET_KEY)\n    sampling_rate = settings.LANGFUSE_SAMPLING_RATE\n\n    # Check if Langfuse SDK is available\n    from .langfuse_init import _langfuse_available\n    langfuse_available = _langfuse_available\n\n    return {\n        \"connection_status\": connection_status,\n        \"configuration\": {\n            \"public_key_configured\": has_public_key,\n            \"secret_key_configured\": has_secret_key,\n            \"host\": settings.LANGFUSE_HOST,\n            \"sampling_rate\": sampling_rate,\n            \"enabled\": settings.LANGFUSE_ENABLED,\n            \"session_id_header\": settings.LANGFUSE_SESSION_ID_HEADER,\n        },\n        \"trace_counts\": trace_counts,\n        \"recent_traces\": recent_traces,\n        \"last_successful_trace\": last_successful_trace,\n        \"seconds_since_last_trace\": seconds_since_last_trace,\n        \"recent_errors\": recent_errors,\n        \"langfuse_available\": langfuse_available,\n        \"langfuse_enabled\": is_langfuse_enabled(),\n    }"
}
Now I need to add the missing import for `status`:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "limit": 30
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "old_string": "from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Request",
  "new_string": "from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Request, status"
}
Now let me add an optional admin dependency and make the endpoint also support optional auth for testing purposes. First, let me check how we can better handle this:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/auth/jwt.py",
  "offset": 360,
  "limit": 70
}
The implementation looks good. Now let me also update the langfuse_init.py to record traces to the tracker. Let me add integration:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/langfuse_init.py",
  "offset": 290,
  "limit": 90
}
Now let me update the `create_trace` function to record to the tracker, and also add a helper to record errors:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/langfuse_init.py",
  "old_string": "def create_trace(\n    name: str,\n    input: Any | None = None,\n    user_id: str | None = None,\n    session_id: str | None = None,\n    tags: list[str] | None = None,\n    metadata: dict[str, Any] | None = None,\n) -> Any | None:\n    \"\"\"Create a new manual trace (useful for workflows).\n\n    For most cases, use @observe() decorator instead.\n    This is useful when you need a trace object to update later.\n\n    Args:\n        name: Trace name\n        input: Input data (will be PII-redacted)\n        user_id: User ID for analytics\n        session_id: Session ID for grouping\n        tags: List of tags\n        metadata: Additional metadata (will be PII-redacted)\n\n    Returns:\n        Trace object or None if Langfuse disabled\n    \"\"\"\n    if not is_langfuse_enabled() or _langfuse_client is None:\n        return None\n\n    # Apply PII redaction\n    if isinstance(input, str):\n        input = _redact_pii(input)\n    elif isinstance(input, dict):\n        input = _redact_dict_pii(input)\n\n    if metadata:\n        metadata = _redact_dict_pii(metadata)\n\n    return _langfuse_client.trace(\n        name=name,\n        input=input,\n        user_id=user_id,\n        session_id=session_id,\n        tags=tags,\n        metadata=metadata,\n    )",
  "new_string": "def create_trace(\n    name: str,\n    input: Any | None = None,\n    user_id: str | None = None,\n    session_id: str | None = None,\n    tags: list[str] | None = None,\n    metadata: dict[str, Any] | None = None,\n) -> Any | None:\n    \"\"\"Create a new manual trace (useful for workflows).\n\n    For most cases, use @observe() decorator instead.\n    This is useful when you need a trace object to update later.\n\n    Args:\n        name: Trace name\n        input: Input data (will be PII-redacted)\n        user_id: User ID for analytics\n        session_id: Session ID for grouping\n        tags: List of tags\n        metadata: Additional metadata (will be PII-redacted)\n\n    Returns:\n        Trace object or None if Langfuse disabled\n    \"\"\"\n    if not is_langfuse_enabled() or _langfuse_client is None:\n        return None\n\n    # Apply PII redaction\n    if isinstance(input, str):\n        input = _redact_pii(input)\n    elif isinstance(input, dict):\n        input = _redact_dict_pii(input)\n\n    if metadata:\n        metadata = _redact_dict_pii(metadata)\n\n    trace = _langfuse_client.trace(\n        name=name,\n        input=input,\n        user_id=user_id,\n        session_id=session_id,\n        tags=tags,\n        metadata=metadata,\n    )\n\n    # Record trace to tracker for debug endpoint\n    _record_trace_to_tracker(trace, name, user_id, session_id)\n\n    return trace\n\n\ndef _record_trace_to_tracker(\n    trace: Any,\n    name: str,\n    user_id: str | None = None,\n    session_id: str | None = None,\n    status: str = \"success\",\n) -> None:\n    \"\"\"Record trace to Langfuse tracker for debug endpoint.\n\n    Args:\n        trace: Langfuse trace object\n        name: Trace name\n        user_id: User ID\n        session_id: Session ID\n        status: Trace status\n    \"\"\"\n    try:\n        # Lazy import to avoid circular dependency\n        from .services.langfuse_tracker import get_langfuse_tracker\n\n        tracker = get_langfuse_tracker()\n\n        # Try to get trace ID from the trace object\n        trace_id = getattr(trace, \"id\", getattr(trace, \"trace_id\", str(id(trace))))\n\n        tracker.record_trace(\n            trace_id=trace_id,\n            trace_name=name,\n            user_id=user_id,\n            session_id=session_id,\n            status=status,\n        )\n    except Exception:\n        # Silently fail - tracking should not break main application\n        pass"
}
Now I also need to add a helper function to record Langfuse errors. Let me add that and update the initialization to record errors:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/langfuse_init.py",
  "limit": 50,
  "offset": 160
}
I see the init function needs to be updated to record errors. Let me update it:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/langfuse_init.py",
  "old_string": "    try:\n        # Set environment variables for Langfuse SDK\n        # This is required for PydanticAI's automatic instrumentation\n        os.environ[\"LANGFUSE_PUBLIC_KEY\"] = settings.LANGFUSE_PUBLIC_KEY\n        os.environ[\"LANGFUSE_SECRET_KEY\"] = settings.LANGFUSE_SECRET_KEY\n        if settings.LANGFUSE_HOST:\n            os.environ[\"LANGFUSE_HOST\"] = settings.LANGFUSE_HOST\n\n        # Get the Langfuse client using the official SDK method\n        # This initializes OpenTelemetry tracing automatically\n        _langfuse_client = get_client()\n\n        # Test connection\n        if _langfuse_client.auth_check():\n            _langfuse_enabled = True\n            environment = os.getenv(\"NODE_ENV\", os.getenv(\"ENVIRONMENT\", \"development\"))\n\n            # Initialize PydanticAI instrumentation - KEY STEP for official integration\n            # This enables automatic tracing for all agents created with instrument=True\n            Agent.instrument_all()\n\n            print(f\"Langfuse initialized successfully (environment: {environment})\")\n            print(\"PydanticAI instrumentation enabled via Agent.instrument_all()\")\n        else:\n            print(\"Langfuse authentication failed\")\n            _langfuse_client = None\n            _langfuse_enabled = False\n\n    except Exception as e:\n        print(f\"Langfuse initialization failed: {e}\")\n        _langfuse_client = None\n        _langfuse_enabled = False",
  "new_string": "    try:\n        # Set environment variables for Langfuse SDK\n        # This is required for PydanticAI's automatic instrumentation\n        os.environ[\"LANGFUSE_PUBLIC_KEY\"] = settings.LANGFUSE_PUBLIC_KEY\n        os.environ[\"LANGFUSE_SECRET_KEY\"] = settings.LANGFUSE_SECRET_KEY\n        if settings.LANGFUSE_HOST:\n            os.environ[\"LANGFUSE_HOST\"] = settings.LANGFUSE_HOST\n\n        # Get the Langfuse client using the official SDK method\n        # This initializes OpenTelemetry tracing automatically\n        _langfuse_client = get_client()\n\n        # Test connection\n        if _langfuse_client.auth_check():\n            _langfuse_enabled = True\n            environment = os.getenv(\"NODE_ENV\", os.getenv(\"ENVIRONMENT\", \"development\"))\n\n            # Initialize PydanticAI instrumentation - KEY STEP for official integration\n            # This enables automatic tracing for all agents created with instrument=True\n            Agent.instrument_all()\n\n            print(f\"Langfuse initialized successfully (environment: {environment})\")\n            print(\"PydanticAI instrumentation enabled via Agent.instrument_all()\")\n        else:\n            print(\"Langfuse authentication failed\")\n            _record_langfuse_error(\"auth_failed\", \"Langfuse authentication check failed\")\n            _langfuse_client = None\n            _langfuse_enabled = False\n\n    except Exception as e:\n        print(f\"Langfuse initialization failed: {e}\")\n        _record_langfuse_error(\"initialization_failed\", str(e))\n        _langfuse_client = None\n        _langfuse_enabled = False"
}
Now I need to add the `_record_langfuse_error` helper function. Let me add it near the `_record_trace_to_tracker` function:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/langfuse_init.py",
  "old_string": "def _record_trace_to_tracker(\n    trace: Any,\n    name: str,\n    user_id: str | None = None,\n    session_id: str | None = None,\n    status: str = \"success\",\n) -> None:\n    \"\"\"Record trace to Langfuse tracker for debug endpoint.\n\n    Args:\n        trace: Langfuse trace object\n        name: Trace name\n        user_id: User ID\n        session_id: Session ID\n        status: Trace status\n    \"\"\"\n    try:\n        # Lazy import to avoid circular dependency\n        from .services.langfuse_tracker import get_langfuse_tracker\n\n        tracker = get_langfuse_tracker()\n\n        # Try to get trace ID from the trace object\n        trace_id = getattr(trace, \"id\", getattr(trace, \"trace_id\", str(id(trace))))\n\n        tracker.record_trace(\n            trace_id=trace_id,\n            trace_name=name,\n            user_id=user_id,\n            session_id=session_id,\n            status=status,\n        )\n    except Exception:\n        # Silently fail - tracking should not break main application\n        pass",
  "new_string": "def _record_trace_to_tracker(\n    trace: Any,\n    name: str,\n    user_id: str | None = None,\n    session_id: str | None = None,\n    status: str = \"success\",\n) -> None:\n    \"\"\"Record trace to Langfuse tracker for debug endpoint.\n\n    Args:\n        trace: Langfuse trace object\n        name: Trace name\n        user_id: User ID\n        session_id: Session ID\n        status: Trace status\n    \"\"\"\n    try:\n        # Lazy import to avoid circular dependency\n        from .services.langfuse_tracker import get_langfuse_tracker\n\n        tracker = get_langfuse_tracker()\n\n        # Try to get trace ID from the trace object\n        trace_id = getattr(trace, \"id\", getattr(trace, \"trace_id\", str(id(trace))))\n\n        tracker.record_trace(\n            trace_id=trace_id,\n            trace_name=name,\n            user_id=user_id,\n            session_id=session_id,\n            status=status,\n        )\n    except Exception:\n        # Silently fail - tracking should not break main application\n        pass\n\n\ndef _record_langfuse_error(\n    error_type: str,\n    error_message: str,\n    context: dict[str, Any] | None = None,\n) -> None:\n    \"\"\"Record Langfuse SDK error for debug endpoint.\n\n    Args:\n        error_type: Type of error (e.g., \"auth_failed\", \"connection_error\")\n        error_message: Error message\n        context: Additional context about the error\n    \"\"\"\n    try:\n        # Lazy import to avoid circular dependency\n        from .services.langfuse_tracker import get_langfuse_tracker\n\n        tracker = get_langfuse_tracker()\n        tracker.record_error(error_type, error_message, context)\n    except Exception:\n        # Silently fail - error tracking should not break main application\n        pass"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase for Langfuse integration",
      "content": "Explore codebase for Langfuse integration",
      "status": "completed"
    },
    {
      "activeForm": "Planning implementation approach",
      "content": "Plan implementation approach",
      "status": "completed"
    },
    {
      "activeForm": "Creating Langfuse tracker service",
      "content": "Create Langfuse tracker service",
      "status": "completed"
    },
    {
      "activeForm": "Adding debug endpoint to main.py",
      "content": "Add debug endpoint to main.py",
      "status": "completed"
    },
    {
      "activeForm": "Creating Playwright verification test",
      "content": "Create and run Playwright verification test",
      "status": "in_progress"
    },
    {
      "activeForm": "Cleaning up and summarizing",
      "content": "Clean up and summarize",
      "status": "pending"
    }
  ]
}
I see the main.py was modified. It looks like a `/health/langfuse` endpoint was added which is good but different from what we need. Let me check if my endpoint was also added or if I need to add it:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py",
  "limit": 100,
  "offset": 690
}
Good, my endpoint was already added. I see that a `/health/langfuse` endpoint was also added which references a `validate_config` module. Let me check if this exists:

🔧 Tool: Glob
Input: {
  "pattern": "**/ai-engine/**/validate_config.py"
}
It exists, good. Now let me create the Playwright test. First, let me check the existing test structure for the AI engine:

🔧 Tool: Glob
Input: {
  "pattern": "**/ai-engine/tests/**/*.py"
}
Let me read the existing e2e test to understand the pattern:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/tests/e2e/test_api_e2e.py"
}
Now I'll create a temporary Playwright test for the AI Engine debug endpoint. Since this is a Python FastAPI service, I'll use the Python test client approach (similar to the existing tests) instead of Playwright which is for frontend:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/tests/e2e/test_langfuse_debug_endpoint.py",
  "content": "\"\"\"Test for Langfuse debug endpoint - temporary verification test.\n\nThis test verifies the /api/v1/debug/langfuse-status endpoint works correctly.\nAfter successful verification, this test file should be removed or integrated\ninto the main test suite.\n\"\"\"\n\nfrom unittest.mock import MagicMock\n\nimport pytest\nfrom fastapi.testclient import TestClient\n\nfrom src.main import app\n\n\n@pytest.fixture\ndef client():\n    \"\"\"Create a test client for the FastAPI app.\"\"\"\n    return TestClient(app)\n\n\ndef _create_admin_token() -> str:\n    \"\"\"Create a mock admin JWT token for testing.\n\n    In real testing, you'd use the actual JWT generation from the backend.\n    For this verification test, we create a minimal valid JWT structure.\n    \"\"\"\n    import jwt\n    from src.config import get_settings\n\n    settings = get_settings()\n\n    payload = {\n        \"sub\": \"admin-test-id\",\n        \"username\": \"admin\",\n        \"email\": \"admin@example.com\",\n        \"roles\": [\"SUPER_ADMIN\"],  # Admin role\n        \"type\": \"access\",\n    }\n\n    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)\n    return token\n\n\ndef _create_user_token() -> str:\n    \"\"\"Create a mock non-admin JWT token for testing.\"\"\"\n    import jwt\n    from src.config import get_settings\n\n    settings = get_settings()\n\n    payload = {\n        \"sub\": \"user-test-id\",\n        \"username\": \"user\",\n        \"email\": \"user@example.com\",\n        \"roles\": [\"CLIENT\"],  # Non-admin role\n        \"type\": \"access\",\n    }\n\n    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)\n    return token\n\n\nclass TestLangfuseDebugEndpoint:\n    \"\"\"Tests for /api/v1/debug/langfuse-status endpoint.\"\"\"\n\n    def test_endpoint_returns_401_without_auth(self, client: TestClient):\n        \"\"\"Test that endpoint requires authentication.\"\"\"\n        response = client.get(\"/api/v1/debug/langfuse-status\")\n        assert response.status_code == 401\n\n    def test_endpoint_returns_403_for_non_admin(self, client: TestClient):\n        \"\"\"Test that endpoint requires admin role.\"\"\"\n        user_token = _create_user_token()\n        response = client.get(\n            \"/api/v1/debug/langfuse-status\",\n            headers={\"Authorization\": f\"Bearer {user_token}\"},\n        )\n        assert response.status_code == 403\n        data = response.json()\n        assert \"INSUFFICIENT_PERMISSIONS\" in str(data.get(\"detail\", \"\"))\n\n    def test_endpoint_returns_200_for_admin(self, client: TestClient):\n        \"\"\"Test that endpoint returns 200 for admin users.\"\"\"\n        admin_token = _create_admin_token()\n        response = client.get(\n            \"/api/v1/debug/langfuse-status\",\n            headers={\"Authorization\": f\"Bearer {admin_token}\"},\n        )\n        assert response.status_code == 200\n\n    def test_endpoint_response_structure(self, client: TestClient):\n        \"\"\"Test that endpoint returns correct response structure.\"\"\"\n        admin_token = _create_admin_token()\n        response = client.get(\n            \"/api/v1/debug/langfuse-status\",\n            headers={\"Authorization\": f\"Bearer {admin_token}\"},\n        )\n        assert response.status_code == 200\n\n        data = response.json()\n\n        # Check required fields\n        required_fields = [\n            \"connection_status\",\n            \"configuration\",\n            \"trace_counts\",\n            \"recent_traces\",\n            \"last_successful_trace\",\n            \"seconds_since_last_trace\",\n            \"recent_errors\",\n            \"langfuse_available\",\n            \"langfuse_enabled\",\n        ]\n\n        for field in required_fields:\n            assert field in data, f\"Missing field: {field}\"\n\n    def test_configuration_section_structure(self, client: TestClient):\n        \"\"\"Test that configuration section has correct structure.\"\"\"\n        admin_token = _create_admin_token()\n        response = client.get(\n            \"/api/v1/debug/langfuse-status\",\n            headers={\"Authorization\": f\"Bearer {admin_token}\"},\n        )\n        assert response.status_code == 200\n\n        data = response.json()\n        config = data[\"configuration\"]\n\n        # Configuration fields\n        config_fields = [\n            \"public_key_configured\",\n            \"secret_key_configured\",\n            \"sampling_rate\",\n            \"enabled\",\n            \"session_id_header\",\n        ]\n\n        for field in config_fields:\n            assert field in config, f\"Missing config field: {field}\"\n\n    def test_trace_counts_section_structure(self, client: TestClient):\n        \"\"\"Test that trace_counts section has correct structure.\"\"\"\n        admin_token = _create_admin_token()\n        response = client.get(\n            \"/api/v1/debug/langfuse-status\",\n            headers={\"Authorization\": f\"Bearer {admin_token}\"},\n        )\n        assert response.status_code == 200\n\n        data = response.json()\n        trace_counts = data[\"trace_counts\"]\n\n        # Trace count fields\n        count_fields = [\"last_hour\", \"last_day\", \"total\"]\n\n        for field in count_fields:\n            assert field in trace_counts, f\"Missing trace count field: {field}\"\n            assert isinstance(trace_counts[field], int), f\"{field} should be int\"\n\n    def test_recent_traces_is_list(self, client: TestClient):\n        \"\"\"Test that recent_traces is a list.\"\"\"\n        admin_token = _create_admin_token()\n        response = client.get(\n            \"/api/v1/debug/langfuse-status\",\n            headers={\"Authorization\": f\"Bearer {admin_token}\"},\n        )\n        assert response.status_code == 200\n\n        data = response.json()\n        assert isinstance(data[\"recent_traces\"], list)\n\n    def test_recent_errors_is_list(self, client: TestClient):\n        \"\"\"Test that recent_errors is a list.\"\"\"\n        admin_token = _create_admin_token()\n        response = client.get(\n            \"/api/v1/debug/langfuse-status\",\n            headers={\"Authorization\": f\"Bearer {admin_token}\"},\n        )\n        assert response.status_code == 200\n\n        data = response.json()\n        assert isinstance(data[\"recent_errors\"], list)\n\n    def test_connection_status_is_valid(self, client: TestClient):\n        \"\"\"Test that connection_status has a valid value.\"\"\"\n        admin_token = _create_admin_token()\n        response = client.get(\n            \"/api/v1/debug/langfuse-status\",\n            headers={\"Authorization\": f\"Bearer {admin_token}\"},\n        )\n        assert response.status_code == 200\n\n        data = response.json()\n        assert data[\"connection_status\"] in [\"connected\", \"disconnected\"]\n\n    def test_tracker_service_exists(self):\n        \"\"\"Test that the tracker service can be imported.\"\"\"\n        from src.services.langfuse_tracker import (\n            LangfuseTracker,\n            get_langfuse_tracker,\n        )\n\n        tracker = get_langfuse_tracker()\n        assert tracker is not None\n        assert isinstance(tracker, LangfuseTracker)\n\n    def test_tracker_record_trace(self):\n        \"\"\"Test that tracker can record a trace.\"\"\"\n        from src.services.langfuse_tracker import get_langfuse_tracker\n\n        tracker = get_langfuse_tracker()\n\n        # Record a test trace\n        tracker.record_trace(\n            trace_id=\"test-trace-123\",\n            trace_name=\"test_operation\",\n            user_id=\"test-user\",\n            session_id=\"test-session\",\n            status=\"success\",\n        )\n\n        # Get trace counts\n        counts = tracker.get_trace_counts()\n        assert counts[\"total\"] >= 1\n\n    def test_tracker_record_error(self):\n        \"\"\"Test that tracker can record an error.\"\"\"\n        from src.services.langfuse_tracker import get_langfuse_tracker\n\n        tracker = get_langfuse_tracker()\n\n        # Record a test error\n        tracker.record_error(\n            error_type=\"test_error\",\n            error_message=\"This is a test error\",\n        )\n\n        # Get recent errors\n        errors = tracker.get_recent_errors(limit=1)\n        assert len(errors) >= 1\n        assert errors[0][\"error_type\"] == \"test_error\"\n\n    def test_tracker_reset(self):\n        \"\"\"Test that tracker can be reset.\"\"\"\n        from src.services.langfuse_tracker import get_langfuse_tracker\n\n        tracker = get_langfuse_tracker()\n\n        # Record some data\n        tracker.record_trace(\"test-1\", \"test\", status=\"success\")\n        tracker.record_error(\"test_error\", \"test\")\n\n        # Reset\n        tracker.reset()\n\n        # Verify reset\n        counts = tracker.get_trace_counts()\n        assert counts[\"total\"] == 0\n\n        errors = tracker.get_recent_errors()\n        assert len(errors) == 0\n\n\nif __name__ == \"__main__\":\n    pytest.main([__file__, \"-v\"])\n"
}
Now let me run the test to verify the implementation:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine && uv run pytest tests/e2e/test_langfuse_debug_endpoint.py -v 2>&1",
  "description": "Run the Langfuse debug endpoint test",
  "timeout": 120000
}
All 13 tests passed. Now let me clean up the test file since it was a temporary verification test:

🔧 Tool: Bash
Input: {
  "command": "rm /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/tests/e2e/test_langfuse_debug_endpoint.py",
  "description": "Delete the temporary verification test"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase for Langfuse integration",
      "content": "Explore codebase for Langfuse integration",
      "status": "completed"
    },
    {
      "activeForm": "Planning implementation approach",
      "content": "Plan implementation approach",
      "status": "completed"
    },
    {
      "activeForm": "Creating Langfuse tracker service",
      "content": "Create Langfuse tracker service",
      "status": "completed"
    },
    {
      "activeForm": "Adding debug endpoint to main.py",
      "content": "Add debug endpoint to main.py",
      "status": "completed"
    },
    {
      "activeForm": "Creating and running verification test",
      "content": "Create and run verification test",
      "status": "completed"
    },
    {
      "activeForm": "Cleaning up and summarizing",
      "content": "Clean up and summarize",
      "status": "in_progress"
    }
  ]
}
Let me verify the implementation is complete by checking the final state of the files:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal && git diff --stat HEAD apps/ai-engine/src/",
  "description": "Check git diff stats for ai-engine changes"
}
I see there are many changes - some from previous work and some from my implementation. Let me verify my specific changes were applied:

🔧 Tool: Grep
Input: {
  "pattern": "/api/v1/debug/langfuse-status",
  "path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src",
  "output_mode": "content"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/ai-engine/src/services/langfuse_tracker.py"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase for Langfuse integration",
      "content": "Explore codebase for Langfuse integration",
      "status": "completed"
    },
    {
      "activeForm": "Planning implementation approach",
      "content": "Plan implementation approach",
      "status": "completed"
    },
    {
      "activeForm": "Creating Langfuse tracker service",
      "content": "Create Langfuse tracker service",
      "status": "completed"
    },
    {
      "activeForm": "Adding debug endpoint to main.py",
      "content": "Add debug endpoint to main.py",
      "status": "completed"
    },
    {
      "activeForm": "Creating and running verification test",
      "content": "Create and run verification test",
      "status": "completed"
    },
    {
      "activeForm": "Cleaning up and summarizing",
      "content": "Clean up and summarize",
      "status": "completed"
    }
  ]
}
<summary>
## Summary: Langfuse Debug Status Endpoint

### Changes Implemented

1. **Created Langfuse Tracker Service** (`apps/ai-engine/src/services/langfuse_tracker.py`)
   - Thread-safe in-memory tracking of Langfuse traces and errors
   - Records trace IDs, timestamps, user/session context
   - Tracks trace counts (last hour, last day, total)
   - Records Langfuse SDK errors for debugging
   - Provides `last_successful_trace` timestamp

2. **Added Debug Endpoint** (`/api/v1/debug/langfuse-status`) in `main.py`
   - **Connection status**: "connected" or "disconnected" based on `auth_check()`
   - **Configuration check**: Keys configured, sampling rate, enabled status, host
   - **Trace counts**: Number of traces sent in last hour/day/total
   - **Recent traces**: List of last 10 trace IDs for verification
   - **Last successful trace**: ISO timestamp of last successful trace
   - **Seconds since last trace**: For health monitoring
   - **Recent errors**: Last 10 Langfuse SDK errors
   - **Langfuse availability**: SDK availability and enabled status
   - **Admin authentication required**: Uses `UserContext.is_admin` for authorization

3. **Integrated Tracking with Langfuse** (`langfuse_init.py`)
   - Added `_record_trace_to_tracker()` helper function
   - Added `_record_langfuse_error()` helper function
   - Updated `init_langfuse()` to record initialization errors
   - Updated `create_trace()` to record traces to tracker

### Files Modified
- `apps/ai-engine/src/services/langfuse_tracker.py` (new file)
- `apps/ai-engine/src/main.py` (added debug endpoint at line 741)
- `apps/ai-engine/src/langfuse_init.py` (added tracking integration)

### Notes for Developer

The debug endpoint returns a comprehensive JSON response:

```json
{
  "connection_status": "connected",
  "configuration": {
    "public_key_configured": true,
    "secret_key_configured": true,
    "host": "https://cloud.langfuse.com",
    "sampling_rate": 1.0,
    "enabled": true,
    "session_id_header": "x-session-id"
  },
  "trace_counts": {
    "last_hour": 5,
    "last_day": 42,
    "total": 100
  },
  "recent_traces": [...],
  "last_successful_trace": "2026-01-27T10:30:00",
  "seconds_since_last_trace": 45.2,
  "recent_errors": [],
  "langfuse_available": true,
  "langfuse_enabled": true
}
```

**Usage**:
```bash
curl -H "Authorization: Bearer <admin_jwt_token>" \
  http://localhost:8000/api/v1/debug/langfuse-status
```

### Verification Status

The feature was verified with a comprehensive test suite covering:
- Authentication requirement (401 without auth)
- Authorization requirement (403 for non-admin users)
- Response structure validation
- Configuration section structure
- Trace counts structure
- Recent traces/errors list validation
- Connection status validation
- Tracker service functionality

All 13 tests passed. The temporary test file was deleted after successful verification as requested.
</summary>