"""Shared pytest configuration for AI Engine tests.

This module sets up environment variables and common fixtures used across
all test types (unit, integration, e2e).
"""

import os

# Set environment variables for testing before imports
os.environ.setdefault("OPENAI_API_KEY", "test-key-for-pytest")
os.environ.setdefault("OPENAI_MODEL", "gpt-4-test")
os.environ.setdefault("LANGFUSE_ENABLED", "false")
os.environ.setdefault("LANGFUSE_PUBLIC_KEY", "")
os.environ.setdefault("LANGFUSE_SECRET_KEY", "")
