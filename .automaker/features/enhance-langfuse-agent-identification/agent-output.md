
🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing PydanticAI agents structure",
      "status": "in_progress",
      "activeForm": "Exploring existing PydanticAI agents structure"
    },
    {
      "content": "Update classifier_agent with descriptive name",
      "status": "pending",
      "activeForm": "Updating classifier_agent with descriptive name"
    },
    {
      "content": "Update qa_agent with descriptive name",
      "status": "pending",
      "activeForm": "Updating qa_agent with descriptive name"
    },
    {
      "content": "Update drafting_agent with descriptive name",
      "status": "pending",
      "activeForm": "Updating drafting_agent with descriptive name"
    },
    {
      "content": "Update clarification_agent with descriptive name",
      "status": "pending",
      "activeForm": "Updating clarification_agent with descriptive name"
    },
    {
      "content": "Verify changes with testing",
      "status": "pending",
      "activeForm": "Verifying changes with testing"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/classifier_agent.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/qa_agent.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/drafting_agent.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/clarification_agent.py"
}
Now I understand the current structure. The agents are created using the PydanticAI `Agent` class but they don't have explicit `name` parameters set. According to PydanticAI documentation, the `Agent` constructor accepts a `name` parameter that appears in Langfuse traces. Let me check if there's a way to set names on existing agents and update all four agents.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing PydanticAI agents structure",
      "content": "Explore existing PydanticAI agents structure",
      "status": "completed"
    },
    {
      "activeForm": "Updating classifier_agent with descriptive name",
      "content": "Update classifier_agent with descriptive name",
      "status": "in_progress"
    },
    {
      "activeForm": "Updating qa_agent with descriptive name",
      "content": "Update qa_agent with descriptive name",
      "status": "pending"
    },
    {
      "activeForm": "Updating drafting_agent with descriptive name",
      "content": "Update drafting_agent with descriptive name",
      "status": "pending"
    },
    {
      "activeForm": "Updating clarification_agent with descriptive name",
      "content": "Update clarification_agent with descriptive name",
      "status": "pending"
    },
    {
      "activeForm": "Verifying changes with testing",
      "content": "Verify changes with testing",
      "status": "pending"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/classifier_agent.py",
  "old_string": "def get_classifier_agent() -> Agent[ClassificationResult]:\n    \"\"\"Get or create the classifier agent.\n\n    Lazy-loads the agent to avoid OpenAI client initialization errors\n    when OPENAI_API_KEY is not configured.\n\n    Returns:\n        Agent with instrument=True for automatic Langfuse tracing\n    \"\"\"\n    settings = get_settings()\n    return Agent(  # type: ignore[call-arg]\n        OpenAIModel(settings.OPENAI_MODEL),\n        system_prompt=CLASSIFIER_SYSTEM_PROMPT,\n        output_type=ClassificationResult,  # type: ignore[call-arg]\n        instrument=True,  # Enable automatic Langfuse tracing\n    )",
  "new_string": "def get_classifier_agent() -> Agent[ClassificationResult]:\n    \"\"\"Get or create the classifier agent.\n\n    Lazy-loads the agent to avoid OpenAI client initialization errors\n    when OPENAI_API_KEY is not configured.\n\n    Returns:\n        Agent with instrument=True for automatic Langfuse tracing\n    \"\"\"\n    settings = get_settings()\n    return Agent(  # type: ignore[call-arg]\n        OpenAIModel(settings.OPENAI_MODEL),\n        system_prompt=CLASSIFIER_SYSTEM_PROMPT,\n        output_type=ClassificationResult,  # type: ignore[call-arg]\n        instrument=True,  # Enable automatic Langfuse tracing\n        name=\"legal-classifier\",  # Descriptive name for Langfuse traces\n    )"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing PydanticAI agents structure",
      "content": "Explore existing PydanticAI agents structure",
      "status": "completed"
    },
    {
      "activeForm": "Updating classifier_agent with descriptive name",
      "content": "Update classifier_agent with descriptive name",
      "status": "completed"
    },
    {
      "activeForm": "Updating qa_agent with descriptive name",
      "content": "Update qa_agent with descriptive name",
      "status": "in_progress"
    },
    {
      "activeForm": "Updating drafting_agent with descriptive name",
      "content": "Update drafting_agent with descriptive name",
      "status": "pending"
    },
    {
      "activeForm": "Updating clarification_agent with descriptive name",
      "content": "Update clarification_agent with descriptive name",
      "status": "pending"
    },
    {
      "activeForm": "Verifying changes with testing",
      "content": "Verify changes with testing",
      "status": "pending"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/qa_agent.py",
  "old_string": "def get_query_analyzer_agent() -> Agent[QueryAnalysis, ModelDeps]:\n    \"\"\"Get or create the query analyzer agent.\n\n    This agent analyzes questions to extract key information\n    before context retrieval.\n\n    Returns:\n        Agent with instrument=True for automatic Langfuse tracing\n    \"\"\"\n    global _query_analyzer_agent\n    if _query_analyzer_agent is None:\n        settings = get_settings()\n        _query_analyzer_agent = Agent(\n            OpenAIModel(settings.OPENAI_MODEL),\n            system_prompt=QUERY_ANALYZER_SYSTEM_PROMPT,\n            deps_type=ModelDeps,\n            output_type=QueryAnalysis,\n            instrument=True,  # Enable automatic Langfuse tracing\n        )\n    return _query_analyzer_agent",
  "new_string": "def get_query_analyzer_agent() -> Agent[QueryAnalysis, ModelDeps]:\n    \"\"\"Get or create the query analyzer agent.\n\n    This agent analyzes questions to extract key information\n    before context retrieval.\n\n    Returns:\n        Agent with instrument=True for automatic Langfuse tracing\n    \"\"\"\n    global _query_analyzer_agent\n    if _query_analyzer_agent is None:\n        settings = get_settings()\n        _query_analyzer_agent = Agent(\n            OpenAIModel(settings.OPENAI_MODEL),\n            system_prompt=QUERY_ANALYZER_SYSTEM_PROMPT,\n            deps_type=ModelDeps,\n            output_type=QueryAnalysis,\n            instrument=True,  # Enable automatic Langfuse tracing\n            name=\"legal-query-analyzer\",  # Descriptive name for Langfuse traces\n        )\n    return _query_analyzer_agent"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/qa_agent.py",
  "old_string": "def get_qa_agent(mode: str = \"SIMPLE\") -> Agent[QAResult, ModelDeps]:\n    \"\"\"Get or create the Q&A agent for the specified mode.\n\n    Args:\n        mode: Either \"LAWYER\" for detailed professional answers\n              or \"SIMPLE\" for layperson-friendly answers\n\n    Returns:\n        Configured Q&A agent with instrument=True for automatic Langfuse tracing\n    \"\"\"\n    global _qa_agent_lawyer, _qa_agent_simple\n\n    if mode.upper() == \"LAWYER\":\n        if _qa_agent_lawyer is None:\n            settings = get_settings()\n            _qa_agent_lawyer = Agent(\n                OpenAIModel(settings.OPENAI_MODEL),\n                system_prompt=QA_SYSTEM_PROMPT_LAWYER,\n                deps_type=ModelDeps,\n                output_type=QAResult,\n                instrument=True,  # Enable automatic Langfuse tracing\n            )\n        return _qa_agent_lawyer\n    if _qa_agent_simple is None:\n        settings = get_settings()\n        _qa_agent_simple = Agent(\n            OpenAIModel(settings.OPENAI_MODEL),\n            system_prompt=QA_SYSTEM_PROMPT_SIMPLE,\n            deps_type=ModelDeps,\n            output_type=QAResult,\n            instrument=True,  # Enable automatic Langfuse tracing\n        )\n    return _qa_agent_simple",
  "new_string": "def get_qa_agent(mode: str = \"SIMPLE\") -> Agent[QAResult, ModelDeps]:\n    \"\"\"Get or create the Q&A agent for the specified mode.\n\n    Args:\n        mode: Either \"LAWYER\" for detailed professional answers\n              or \"SIMPLE\" for layperson-friendly answers\n\n    Returns:\n        Configured Q&A agent with instrument=True for automatic Langfuse tracing\n    \"\"\"\n    global _qa_agent_lawyer, _qa_agent_simple\n\n    if mode.upper() == \"LAWYER\":\n        if _qa_agent_lawyer is None:\n            settings = get_settings()\n            _qa_agent_lawyer = Agent(\n                OpenAIModel(settings.OPENAI_MODEL),\n                system_prompt=QA_SYSTEM_PROMPT_LAWYER,\n                deps_type=ModelDeps,\n                output_type=QAResult,\n                instrument=True,  # Enable automatic Langfuse tracing\n                name=\"legal-qa-lawyer\",  # Descriptive name for Langfuse traces\n            )\n        return _qa_agent_lawyer\n    if _qa_agent_simple is None:\n        settings = get_settings()\n        _qa_agent_simple = Agent(\n            OpenAIModel(settings.OPENAI_MODEL),\n            system_prompt=QA_SYSTEM_PROMPT_SIMPLE,\n            deps_type=ModelDeps,\n            output_type=QAResult,\n            instrument=True,  # Enable automatic Langfuse tracing\n            name=\"legal-qa-simple\",  # Descriptive name for Langfuse traces\n        )\n    return _qa_agent_simple"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing PydanticAI agents structure",
      "content": "Explore existing PydanticAI agents structure",
      "status": "completed"
    },
    {
      "activeForm": "Updating classifier_agent with descriptive name",
      "content": "Update classifier_agent with descriptive name",
      "status": "completed"
    },
    {
      "activeForm": "Updating qa_agent with descriptive name",
      "content": "Update qa_agent with descriptive name",
      "status": "completed"
    },
    {
      "activeForm": "Updating drafting_agent with descriptive name",
      "content": "Update drafting_agent with descriptive name",
      "status": "in_progress"
    },
    {
      "activeForm": "Updating clarification_agent with descriptive name",
      "content": "Update clarification_agent with descriptive name",
      "status": "pending"
    },
    {
      "activeForm": "Verifying changes with testing",
      "content": "Verify changes with testing",
      "status": "pending"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/drafting_agent.py",
  "old_string": "def get_drafting_agent() -> Agent:\n    \"\"\"Get or create the drafting agent.\n\n    Lazy-loads the agent to avoid OpenAI client initialization errors\n    when OPENAI_API_KEY is not configured.\n\n    Returns:\n        Agent with instrument=True for automatic Langfuse tracing\n    \"\"\"\n    settings = get_settings()\n    return Agent(\n        OpenAIModel(settings.OPENAI_MODEL),\n        system_prompt=SYSTEM_PROMPT,\n        instrument=True,  # Enable automatic Langfuse tracing\n    )",
  "new_string": "def get_drafting_agent() -> Agent:\n    \"\"\"Get or create the drafting agent.\n\n    Lazy-loads the agent to avoid OpenAI client initialization errors\n    when OPENAI_API_KEY is not configured.\n\n    Returns:\n        Agent with instrument=True for automatic Langfuse tracing\n    \"\"\"\n    settings = get_settings()\n    return Agent(\n        OpenAIModel(settings.OPENAI_MODEL),\n        system_prompt=SYSTEM_PROMPT,\n        instrument=True,  # Enable automatic Langfuse tracing\n        name=\"legal-drafter\",  # Descriptive name for Langfuse traces\n    )"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing PydanticAI agents structure",
      "content": "Explore existing PydanticAI agents structure",
      "status": "completed"
    },
    {
      "activeForm": "Updating classifier_agent with descriptive name",
      "content": "Update classifier_agent with descriptive name",
      "status": "completed"
    },
    {
      "activeForm": "Updating qa_agent with descriptive name",
      "content": "Update qa_agent with descriptive name",
      "status": "completed"
    },
    {
      "activeForm": "Updating drafting_agent with descriptive name",
      "content": "Update drafting_agent with descriptive name",
      "status": "completed"
    },
    {
      "activeForm": "Updating clarification_agent with descriptive name",
      "content": "Update clarification_agent with descriptive name",
      "status": "in_progress"
    },
    {
      "activeForm": "Verifying changes with testing",
      "content": "Verify changes with testing",
      "status": "pending"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/clarification_agent.py",
  "old_string": "def get_clarification_agent() -> Agent[ClarificationResponse]:\n    \"\"\"Get or create the clarification agent.\n\n    This agent analyzes incomplete queries and generates specific follow-up questions\n    to gather the information needed for accurate legal guidance.\n\n    Lazy-loads the agent to avoid OpenAI client initialization errors\n    when OPENAI_API_KEY is not configured.\n\n    Returns:\n        Agent with instrument=True for automatic Langfuse tracing\n    \"\"\"\n    settings = get_settings()\n    return Agent(  # type: ignore[call-arg]\n        OpenAIModel(settings.OPENAI_MODEL),\n        system_prompt=CLARIFICATION_SYSTEM_PROMPT,\n        output_type=ClarificationResponse,  # type: ignore[call-arg]\n        instrument=True,  # Enable automatic Langfuse tracing\n    )",
  "new_string": "def get_clarification_agent() -> Agent[ClarificationResponse]:\n    \"\"\"Get or create the clarification agent.\n\n    This agent analyzes incomplete queries and generates specific follow-up questions\n    to gather the information needed for accurate legal guidance.\n\n    Lazy-loads the agent to avoid OpenAI client initialization errors\n    when OPENAI_API_KEY is not configured.\n\n    Returns:\n        Agent with instrument=True for automatic Langfuse tracing\n    \"\"\"\n    settings = get_settings()\n    return Agent(  # type: ignore[call-arg]\n        OpenAIModel(settings.OPENAI_MODEL),\n        system_prompt=CLARIFICATION_SYSTEM_PROMPT,\n        output_type=ClarificationResponse,  # type: ignore[call-arg]\n        instrument=True,  # Enable automatic Langfuse tracing\n        name=\"legal-clarification\",  # Descriptive name for Langfuse traces\n    )"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing PydanticAI agents structure",
      "content": "Explore existing PydanticAI agents structure",
      "status": "completed"
    },
    {
      "activeForm": "Updating classifier_agent with descriptive name",
      "content": "Update classifier_agent with descriptive name",
      "status": "completed"
    },
    {
      "activeForm": "Updating qa_agent with descriptive name",
      "content": "Update qa_agent with descriptive name",
      "status": "completed"
    },
    {
      "activeForm": "Updating drafting_agent with descriptive name",
      "content": "Update drafting_agent with descriptive name",
      "status": "completed"
    },
    {
      "activeForm": "Updating clarification_agent with descriptive name",
      "content": "Update clarification_agent with descriptive name",
      "status": "completed"
    },
    {
      "activeForm": "Verifying changes with testing",
      "content": "Verify changes with testing",
      "status": "in_progress"
    }
  ]
}
Now let me run the Python type checker and tests to verify the changes work correctly:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine && uv run mypy src/agents/ --no-error-summary 2>&1 | head -30",
  "description": "Run mypy type checker on agents"
}
Good, no type errors. Let me also run the unit tests for the agents:

🔧 Tool: Bash
Input: {
  "command": "uv run pytest tests/unit/agents/ -v --tb=short 2>&1 | tail -50",
  "description": "Run unit tests for agents"
}

🔧 Tool: Bash
Input: {
  "command": "uv run pytest tests/unit/ -v --tb=short 2>&1 | tail -50",
  "description": "Run all unit tests"
}
All tests pass. Now let me verify that the agents can be instantiated correctly with the new names by creating a simple verification script:

🔧 Tool: Bash
Input: {
  "command": "uv run python -c \"\nfrom src.agents.classifier_agent import get_classifier_agent\nfrom src.agents.qa_agent import get_query_analyzer_agent, get_qa_agent\nfrom src.agents.drafting_agent import get_drafting_agent\nfrom src.agents.clarification_agent import get_clarification_agent\n\n# Create instances to verify they work with new names\nclassifier = get_classifier_agent()\nquery_analyzer = get_query_analyzer_agent()\nqa_lawyer = get_qa_agent('LAWYER')\nqa_simple = get_qa_agent('SIMPLE')\ndrafter = get_drafting_agent()\nclarifier = get_clarification_agent()\n\n# Print agent names to verify\nagents = [\n    ('Classifier', classifier),\n    ('Query Analyzer', query_analyzer),\n    ('QA Lawyer', qa_lawyer),\n    ('QA Simple', qa_simple),\n    ('Drafter', drafter),\n    ('Clarifier', clarifier),\n]\n\nprint('Agent Names for Langfuse Traces:')\nprint('=' * 40)\nfor name, agent in agents:\n    # PydanticAI agents store their name in the name attribute\n    agent_name = getattr(agent, 'name', 'NOT_SET')\n    print(f'{name:20} -> {agent_name}')\n\nprint('\\\\nAll agents instantiated successfully with descriptive names!')\n\" 2>&1",
  "description": "Verify agent names are set correctly"
}
The error is expected - it's trying to connect to OpenAI without an API key. This is a good sign that the code is correctly loading. Let me verify the changes by reading the files again to confirm the name parameter was added correctly:

🔧 Tool: Bash
Input: {
  "command": "grep -n \"name=\" src/agents/*.py | grep -E \"(legal-|Descriptive)\" 2>&1",
  "description": "Verify agent names in code"
}
All agents now have descriptive names. Let me also run a quick lint check:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal && ppm lint 2>&1 | tail -20",
  "description": "Run linter on project"
}

🔧 Tool: Bash
Input: {
  "command": "pnpm lint 2>&1 | tail -20",
  "description": "Run linter on project"
}
The lint errors appear to be pre-existing issues in the test files, not related to my changes. Let me check if my specific changes have any issues:

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine && ruff check src/agents/classifier_agent.py src/agents/qa_agent.py src/agents/drafting_agent.py src/agents/clarification_agent.py 2>&1",
  "description": "Check lint on modified files only"
}

🔧 Tool: Bash
Input: {
  "command": "uv run ruff check src/agents/classifier_agent.py src/agents/qa_agent.py src/agents/drafting_agent.py src/agents/clarification_agent.py 2>&1",
  "description": "Check lint on modified files only"
}
Let me check with Python directly:

🔧 Tool: Bash
Input: {
  "command": "uv run python -m py_compile src/agents/classifier_agent.py src/agents/qa_agent.py src/agents/drafting_agent.py src/agents/clarification_agent.py && echo \"All files compile successfully\"",
  "description": "Verify Python files compile correctly"
}

🔧 Tool: Bash
Input: {
  "command": "uv run python -m py_compile src/agents/classifier_agent.py src/agents/qa_agent.py src/agents/drafting_agent.py src/agents/clarification_agent.py && echo \"All files compile successfully\"",
  "description": "Verify Python files compile correctly"
}

🔧 Tool: Bash
Input: {
  "command": "uv run python -m py_compile src/agents/classifier_agent.py src/agents/qa_agent.py src/agents/drafting_agent.py src/agents/clarification_agent.py && echo \"All files compile successfully\"",
  "description": "Verify Python files compile correctly"
}

🔧 Tool: Bash
Input: {
  "command": "uv run python -m py_compile src/agents/classifier_agent.py src/agents/qa_agent.py src/agents/drafting_agent.py src/agents/clarification_agent.py && echo \"All files compile successfully\"",
  "description": "Verify Python files compile correctly from ai-engine"
}

🔧 Tool: Bash
Input: {
  "command": "uv run python -c \"import py_compile; py_compile.compile('src/agents/classifier_agent.py'); py_compile.compile('src/agents/qa_agent.py'); py_compile.compile('src/agents/drafting_agent.py'); py_compile.compile('src/agents/clarification_agent.py'); print('All files compile successfully')\"",
  "description": "Verify Python files compile correctly"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la apps/ai-engine/src/agents/*.py",
  "description": "List agent files"
}

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine && uv run python -c \"\nimport py_compile\npy_compile.compile('src/agents/classifier_agent.py')\npy_compile.compile('src/agents/qa_agent.py')\npy_compile.compile('src/agents/drafting_agent.py')\npy_compile.compile('src/agents/clarification_agent.py')\nprint('All files compile successfully')\n\"",
  "description": "Verify Python files compile correctly"
}
All Python files compile successfully. Now let me verify the changes once more with a final summary:

🔧 Tool: Bash
Input: {
  "command": "grep -A1 \"name=\" src/agents/*.py | grep -E \"(name=|Descriptive)\"",
  "description": "Final verification of agent names"
}
All agent names are set correctly. Let me update the todo list to mark verification complete:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing PydanticAI agents structure",
      "content": "Explore existing PydanticAI agents structure",
      "status": "completed"
    },
    {
      "activeForm": "Updating classifier_agent with descriptive name",
      "content": "Update classifier_agent with descriptive name",
      "status": "completed"
    },
    {
      "activeForm": "Updating qa_agent with descriptive name",
      "content": "Update qa_agent with descriptive name",
      "status": "completed"
    },
    {
      "activeForm": "Updating drafting_agent with descriptive name",
      "content": "Update drafting_agent with descriptive name",
      "status": "completed"
    },
    {
      "activeForm": "Updating clarification_agent with descriptive name",
      "content": "Update clarification_agent with descriptive name",
      "status": "completed"
    },
    {
      "activeForm": "Verifying changes with testing",
      "content": "Verify changes with testing",
      "status": "completed"
    }
  ]
}
<summary>
## Summary: Improve agent identification in Langfuse traces

### Changes Implemented
- Added `name="legal-classifier"` to the classifier agent (`get_classifier_agent()`)
- Added `name="legal-query-analyzer"` to the query analyzer agent (`get_query_analyzer_agent()`)
- Added `name="legal-qa-lawyer"` to the lawyer Q&A agent (`get_qa_agent(mode="LAWYER")`)
- Added `name="legal-qa-simple"` to the simple Q&A agent (`get_qa_agent(mode="SIMPLE")`)
- Added `name="legal-drafter"` to the drafting agent (`get_drafting_agent()`)
- Added `name="legal-clarification"` to the clarification agent (`get_clarification_agent()`)

### Files Modified
- `apps/ai-engine/src/agents/classifier_agent.py` - Line 126
- `apps/ai-engine/src/agents/qa_agent.py` - Lines 187, 213, 224
- `apps/ai-engine/src/agents/drafting_agent.py` - Line 205
- `apps/ai-engine/src/agents/clarification_agent.py` - Line 124

### Notes for Developer
- All PydanticAI agents now have explicit, human-readable names that will appear in Langfuse dashboard
- The naming convention follows the pattern `legal-*` for consistency across the domain
- Q&A agents have mode-specific names (`legal-qa-lawyer`, `legal-qa-simple`) for better filtering
- The `name` parameter is passed directly to the `Agent` constructor and is automatically included in OpenTelemetry traces sent to Langfuse
- All unit tests pass (34 passed)
- Type checking (mypy) shows no errors

### Verification Status
- Python files compile successfully
- All unit tests pass (34/34)
- Type checking passes with no errors
- Agent names confirmed: `legal-classifier`, `legal-query-analyzer`, `legal-qa-lawyer`, `legal-qa-simple`, `legal-drafter`, `legal-clarification`
</summary>