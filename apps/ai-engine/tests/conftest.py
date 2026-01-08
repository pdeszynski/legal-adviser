import os

# Set environment variables for testing before imports
os.environ.setdefault("OPENAI_API_KEY", "test-key-for-pytest")
os.environ.setdefault("OPENAI_MODEL", "gpt-4-test")
