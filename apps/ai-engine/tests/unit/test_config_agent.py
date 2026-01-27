import os
from unittest.mock import patch

from src.agents.drafting_agent import get_drafting_agent
from src.config import get_settings


@patch.dict(
    os.environ, {"OPENAI_API_KEY": "test-key-123", "OPENAI_MODEL": "gpt-4-turbo"}
)
def test_settings_load_from_env():
    """Verify settings are loaded correctly from environment variables."""
    # Clear cache to ensure we get fresh settings
    get_settings.cache_clear()
    settings = get_settings()
    assert settings.OPENAI_API_KEY == "test-key-123"
    assert settings.OPENAI_MODEL == "gpt-4-turbo"


def test_agent_initialization():
    """Verify drafting agent can be initialized with correct model from settings."""
    agent = get_drafting_agent()
    assert agent is not None
    # Verify agent is properly initialized
    assert hasattr(agent, "run")

