"""E2E tests for AI Engine.

These tests verify the complete end-to-end functionality of the AI Engine,
including:
- HTTP API endpoints
- PydanticAI agent orchestration
- LangGraph workflow execution
- Langfuse observability integration

Tests use FastAPI TestClient and mocked LLM calls to avoid external dependencies.
"""
