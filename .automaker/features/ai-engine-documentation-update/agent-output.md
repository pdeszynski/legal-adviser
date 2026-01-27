
🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore AI Engine codebase structure and architecture",
      "status": "in_progress",
      "activeForm": "Exploring AI Engine codebase structure"
    },
    {
      "content": "Understand PydanticAI agent patterns",
      "status": "pending",
      "activeForm": "Understanding PydanticAI agent patterns"
    },
    {
      "content": "Understand LangGraph workflow patterns",
      "status": "pending",
      "activeForm": "Understanding LangGraph workflow patterns"
    },
    {
      "content": "Review Langfuse observability setup",
      "status": "pending",
      "activeForm": "Reviewing Langfuse observability setup"
    },
    {
      "content": "Review clarification flow design",
      "status": "pending",
      "activeForm": "Reviewing clarification flow design"
    },
    {
      "content": "Update CLAUDE.md with AI Engine documentation",
      "status": "pending",
      "activeForm": "Updating CLAUDE.md"
    },
    {
      "content": "Create AI Engine specific documentation",
      "status": "pending",
      "activeForm": "Creating AI Engine documentation"
    }
  ]
}

🔧 Tool: Task
Input: {
  "description": "Explore AI Engine architecture",
  "prompt": "Explore the AI Engine codebase in apps/ai-engine/ to understand the new architecture. I need to understand:\n\n1. The overall structure and organization\n2. PydanticAI agent patterns - how agents are created and used\n3. LangGraph workflow patterns for multi-agent scenarios\n4. Langfuse observability setup and integration\n5. Clarification flow design and UX patterns\n6. Environment variables used (especially LANGFUSE keys)\n7. Testing strategies for AI components\n\nLook for:\n- Main entry points and configuration\n- Agent definitions and patterns\n- LangGraph workflows and state management\n- Langfuse instrumentation\n- Clarification/question generation flows\n- Test files and patterns\n- Environment configuration (.env files, config files)\n\nReturn a comprehensive summary of the architecture with file paths and code examples.",
  "subagent_type": "Explore"
}

🔧 Tool: Bash
Input: {
  "command": "find /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine -type f -name \"*.py\" | grep -E \"(agent|workflow|clarification|test)\" | head -20",
  "description": "Find Python files related to agents, workflows, clarification, and tests"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/",
  "description": "List AI Engine directory structure"
}

🔧 Tool: Bash
Input: {
  "command": "find /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src -type f -name \"*.py\" | grep -v \"__pycache__\" | head -30",
  "description": "Find Python files in src directory"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/pyproject.toml"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/.env.example"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/LANGFUSE.md"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/langfuse_init.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/config.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/dependencies.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/qa_agent.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/clarification_agent.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/states.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/orchestration.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/case_analysis_workflow.py"
}

🔧 Tool: Bash
Input: {
  "command": "find /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/tests -name \"*.py\" | head -15",
  "description": "List test files in tests directory"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/tests/conftest.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/tests/unit/test_workflows.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/main.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/WORKFLOWS.md",
  "limit": 100
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring AI Engine codebase structure",
      "content": "Explore AI Engine codebase structure and architecture",
      "status": "completed"
    },
    {
      "activeForm": "Understanding PydanticAI agent patterns",
      "content": "Understand PydanticAI agent patterns",
      "status": "completed"
    },
    {
      "activeForm": "Understanding LangGraph workflow patterns",
      "content": "Understand LangGraph workflow patterns",
      "status": "completed"
    },
    {
      "activeForm": "Reviewing Langfuse observability setup",
      "content": "Review Langfuse observability setup",
      "status": "completed"
    },
    {
      "activeForm": "Reviewing clarification flow design",
      "content": "Review clarification flow design",
      "status": "completed"
    },
    {
      "activeForm": "Reading existing CLAUDE.md and documentation",
      "content": "Read existing CLAUDE.md to understand what to update",
      "status": "in_progress"
    },
    {
      "activeForm": "Updating CLAUDE.md",
      "content": "Update CLAUDE.md with AI Engine documentation",
      "status": "pending"
    },
    {
      "activeForm": "Creating AI Engine documentation",
      "content": "Create AI Engine specific documentation",
      "status": "pending"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.claude/CLAUDE.md"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/LANGFUSE.md"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/ai-engine/**/*.md"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/README.md"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/WORKFLOWS.md"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/ai-engine/src/agents/*.py"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/ai-engine/src/workflows/*.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/dependencies.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/agents/qa_agent.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/workflows/states.py"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/ai-engine/tests/**/*.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/tests/conftest.py"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/src/config.py"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring AI Engine codebase structure",
      "content": "Explore AI Engine codebase structure and architecture",
      "status": "completed"
    },
    {
      "activeForm": "Understanding PydanticAI agent patterns",
      "content": "Understand PydanticAI agent patterns",
      "status": "completed"
    },
    {
      "activeForm": "Understanding LangGraph workflow patterns",
      "content": "Understand LangGraph workflow patterns",
      "status": "completed"
    },
    {
      "activeForm": "Reviewing Langfuse observability setup",
      "content": "Review Langfuse observability setup",
      "status": "completed"
    },
    {
      "activeForm": "Reviewing clarification flow design",
      "content": "Review clarification flow design",
      "status": "completed"
    },
    {
      "activeForm": "Reading existing CLAUDE.md and documentation",
      "content": "Read existing CLAUDE.md to understand what to update",
      "status": "completed"
    },
    {
      "activeForm": "Updating CLAUDE.md with AI Engine section",
      "content": "Update CLAUDE.md with AI Engine documentation",
      "status": "in_progress"
    },
    {
      "activeForm": "Updating AI Engine README.md",
      "content": "Update AI Engine README.md with new architecture",
      "status": "pending"
    },
    {
      "activeForm": "Creating AI_ENGINE_ARCHITECTURE.md",
      "content": "Create comprehensive AI Engine architecture documentation",
      "status": "pending"
    }
  ]
}
Now I have a comprehensive understanding of the AI Engine architecture. Let me update the documentation. First, I'll update CLAUDE.md to add the AI Engine section:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.claude/CLAUDE.md",
  "old_string": "**Scheduler Example:** `apps/backend/src/modules/temporal/workflows/billing/ruling-scheduler.service.ts`",
  "new_string": "**Scheduler Example:** `apps/backend/src/modules/temporal/workflows/billing/ruling-scheduler.service.ts`\n\n## AI Engine\n\n**Location:** `apps/ai-engine/`\n\n**Purpose:** Python-based AI service for legal document generation, Q&A, and case analysis.\n\n### Technology Stack\n\n- **FastAPI**: Modern Python web framework\n- **PydanticAI**: Type-safe AI agent framework (replaces LangChain)\n- **LangGraph**: Workflow orchestration for multi-agent scenarios\n- **Langfuse**: Observability and tracing\n- **Python 3.11+**: Modern Python with type hints\n- **uv**: Fast Python package manager\n\n### Commands\n\n```bash\n# Development (with hot reload)\ncd apps/ai-engine && uv run dev\n\n# Testing\ncd apps/ai-engine && uv run pytest\n\n# Type checking\ncd apps/ai-engine && uv run mypy src/\n```\n\n### Environment Variables\n\n```bash\n# OpenAI (Required)\nOPENAI_API_KEY=sk-...\nOPENAI_MODEL=gpt-4o\nOPENAI_EMBEDDING_MODEL=text-embedding-3-small\n\n# Service\nAI_ENGINE_PORT=8000\nAI_ENGINE_HOST=0.0.0.0\nBACKEND_URL=http://localhost:3001\n\n# Langfuse Observability (Optional but recommended)\nLANGFUSE_PUBLIC_KEY=pk-...\nLANGFUSE_SECRET_KEY=sk-...\nLANGFUSE_ENABLED=true\nLANGFUSE_SAMPLING_RATE=1.0\nLANGFUSE_SESSION_ID_HEADER=x-session-id\n```\n\n### Architecture Overview\n\n```\n┌─────────────────────────────────────────────────────────────┐\n│                        AI Engine                             │\n├─────────────────────────────────────────────────────────────┤\n│                                                               │\n│  ┌─────────────────┐      ┌──────────────────────────────┐  │\n│  │   FastAPI       │──────│   LangGraph Orchestrator     │  │\n│  │   Endpoints     │      │   (multi-agent workflows)    │  │\n│  └─────────────────┘      └──────────────────────────────┘  │\n│           │                          │                       │\n│           │                          ▼                       │\n│           │              ┌───────────────────────┐          │\n│           │              │  PydanticAI Agents    │          │\n│           │              ├───────────────────────┤          │\n│           └─────────────→│ • QA Agent            │          │\n│                          │ • Classifier Agent    │          │\n│                          │ • Drafting Agent      │          │\n│                          │ • Clarification Agent │          │\n│                          └───────────────────────┘          │\n│                                     │                        │\n│                                     ▼                        │\n│                          ┌───────────────────────┐          │\n│                          │  ModelDeps            │          │\n│                          │  (dependencies)       │          │\n│                          └───────────────────────┘          │\n└─────────────────────────────────────────────────────────────┘\n```\n\n### PydanticAI Agent Patterns\n\n#### Creating a New Agent\n\n```python\nfrom pydantic_ai import Agent\nfrom .dependencies import ModelDeps, get_model_deps\n\n# Define output schema\nfrom pydantic import BaseModel\n\nclass MyResult(BaseModel):\n    answer: str\n    confidence: float\n\n# Create agent with lazy loading\n_my_agent: Agent[MyResult, ModelDeps] | None = None\n\ndef get_my_agent() -> Agent[MyResult, ModelDeps]:\n    global _my_agent\n    if _my_agent is None:\n        from ..config import get_settings\n        settings = get_settings()\n        _my_agent = Agent(\n            f\"openai:{settings.OPENAI_MODEL}\",\n            system_prompt=\"You are a helpful legal assistant.\",\n            deps_type=ModelDeps,\n            output_type=MyResult,\n        )\n    return _my_agent\n\n# Use the agent\nasync def my_function(question: str) -> dict[str, str]:\n    deps = get_model_deps()\n    agent = get_my_agent()\n    result = await agent.run(question, deps=deps)\n    return result.data.model_dump()\n```\n\n#### Dependency Injection\n\nAll agents use `ModelDeps` for consistent access to settings and OpenAI client:\n\n```python\nclass ModelDeps:\n    def __init__(self) -> None:\n        self.settings = get_settings()\n        self.openai_client = get_openai_client()\n```\n\n#### Existing Agents\n\n| Agent | Location | Purpose |\n|-------|----------|---------|\n| QA Agent | `src/agents/qa_agent.py` | Legal Q&A with RAG, citations |\n| Classifier Agent | `src/agents/classifier_agent.py` | Identify legal grounds |\n| Drafting Agent | `src/agents/drafting_agent.py` | Generate legal documents |\n| Clarification Agent | `src/agents/clarification_agent.py` | Generate follow-up questions |\n\n### LangGraph Workflow Patterns\n\nLangGraph is used **only for orchestration** between PydanticAI agents, not for direct LLM calls.\n\n#### Workflow Structure\n\n```python\nfrom typing import TypedDict\nfrom langgraph.graph import StateGraph\n\nclass MyWorkflowState(TypedDict, total=False):\n    input: Required[str]\n    intermediate_result: str | None\n    final_output: str | None\n    metadata: dict[str, Any]\n\ndef create_my_workflow() -> StateGraph:\n    workflow = StateGraph(MyWorkflowState)\n\n    # Add nodes\n    workflow.add_node(\"step1\", step1_function)\n    workflow.add_node(\"step2\", step2_function)\n\n    # Add edges\n    workflow.add_edge(\"step1\", \"step2\")\n    workflow.set_entry_point(\"step1\")\n    workflow.set_finish_point(\"step2\")\n\n    return workflow.compile()\n```\n\n#### Workflow Best Practices\n\n1. **State Schemas**: Use `TypedDict` with `total=False` for optional fields\n2. **Error Handling**: Wrap all node functions in try-catch, store error in state\n3. **Singleton Pattern**: Cache compiled workflows with `@lru_cache`\n4. **Factory Functions**: Provide `create_*_state()` functions for initial state\n\n#### Existing Workflows\n\n| Workflow | Location | Purpose |\n|----------|----------|---------|\n| Case Analysis | `src/workflows/case_analysis_workflow.py` | Classify and analyze legal cases |\n| Document Generation | `src/workflows/document_generation_workflow.py` | Generate documents with revision |\n| Complex Q&A | `src/workflows/complex_qa_workflow.py` | Deep research and citation |\n\n### Clarification Flow Design\n\nThe clarification system generates follow-up questions when queries are incomplete.\n\n#### Decision Logic\n\n- Low confidence (< 0.6) → Needs clarification\n- No legal grounds identified → Needs clarification\n- Pre-filled user responses → Skip clarification\n\n#### Question Structure\n\n```python\nclass ClarificationQuestion(BaseModel):\n    question: str\n    question_type: str  # timeline, parties, documents, amounts, jurisdiction\n    options: list[str] | None  # Optional predefined choices\n    hint: str | None  # Help text for users\n```\n\n#### UX Pattern\n\n- Maximum 2-4 specific questions\n- Clear \"next steps\" explanation\n- Context-aware questioning based on classification results\n\n### Langfuse Observability\n\n#### Setup\n\n1. Get credentials from [Langfuse Cloud](https://cloud.langfuse.com)\n2. Set environment variables (see above)\n3. All agents and workflows are automatically traced\n\n#### What Gets Traced\n\n- All LLM calls (model, tokens, latency)\n- HTTP requests (middleware)\n- Workflow nodes (spans)\n- User sessions and IDs\n\n#### PII Redaction\n\nAutomatic redaction for:\n- Email addresses\n- Polish phone numbers\n- PESEL numbers (Polish national ID)\n- NIP numbers (Polish tax ID)\n- Credit card numbers\n\n#### Viewing Traces\n\nGo to `https://cloud.langfuse.com` to view:\n- Agent performance (latency, success rate)\n- Token usage and costs\n- User analytics\n- Error correlation with Sentry\n\n### API Endpoints\n\n#### Simple Agent Endpoints\n\n```bash\nPOST /api/v1/qa                 # Simple Q&A\nPOST /api/v1/classify           # Case classification\nPOST /api/v1/documents/generate # Document generation\n```\n\n#### Enhanced RAG Endpoints\n\n```bash\nPOST /api/v1/qa/ask             # Q&A with user context\nPOST /api/v1/qa/ask-rag         # RAG-based Q&A\nPOST /api/v1/search/semantic    # Vector search\n```\n\n#### Workflow Endpoints\n\n```bash\nPOST /api/v1/workflows/case-analysis        # Multi-step case analysis\nPOST /api/v1/workflows/document-generation  # Document with revision\nPOST /api/v1/workflows/complex-qa           # Comprehensive Q&A\n```\n\n#### System Endpoints\n\n```bash\nGET /health          # Health check with startup status\nGET /health/ready    # Kubernetes readiness probe\nGET /health/live     # Kubernetes liveness probe\n```\n\n### Testing\n\n#### Test Locations\n\n- Unit tests: `apps/ai-engine/tests/unit/*.py`\n- Integration tests: `apps/ai-engine/tests/integration/*.py`\n\n#### Test Configuration\n\n```python\n# conftest.py sets test defaults\nos.environ.setdefault(\"OPENAI_API_KEY\", \"test-key-for-pytest\")\nos.environ.setdefault(\"OPENAI_MODEL\", \"gpt-4-test\")\n```\n\n#### Test Patterns\n\n```python\n# Model validation\ndef test_create_legal_ground():\n    ground = LegalGround(\n        name=\"Breach of Contract\",\n        confidence_score=0.85,\n        legal_basis=[\"Art. 471 KC\"]\n    )\n    assert ground.confidence_score == 0.85\n\n# State creation\ndef test_create_case_analysis_state():\n    state = create_case_analysis_state(\n        case_description=\"Test case\",\n        session_id=\"test-123\"\n    )\n    assert state[\"metadata\"][\"current_step\"] == \"classify\"\n\n# Conditional edge routing\ndef test_should_clarify_with_low_confidence():\n    state = {\"classification_confidence\": 0.5, \"needs_clarification\": True}\n    assert should_clarify(state) == \"clarify\"\n```\n\n### Migration from LangChain\n\nIf migrating from LangChain patterns:\n\n| LangChain | PydanticAI |\n|-----------|------------|\n| `@chain` decorator | `Agent` class with `output_type` |\n| `RunnableSequence` | LangGraph `StateGraph` |\n| `BasePromptTemplate` | System prompt string |\n| `StructuredOutput` | `output_type=BaseModel` |\n| `bind_tools()` | Tool registration on Agent |\n\n#### Before (LangChain-style)\n\n```python\nfrom langchain.schema import BasePromptTemplate\nfrom langchain.chains import LLMChain\n\nprompt = BasePromptTemplate.from_template(\"You are a lawyer. {question}\")\nchain = LLMChain(llm=llm, prompt=prompt)\nresult = chain.run(question=\"What is...?\")\n```\n\n#### After (PydanticAI)\n\n```python\nfrom pydantic_ai import Agent\nfrom pydantic import BaseModel\n\nclass Result(BaseModel):\n    answer: str\n\nagent = Agent(\n    \"openai:gpt-4o\",\n    system_prompt=\"You are a lawyer.\",\n    output_type=Result,\n)\nresult = await agent.run(\"What is...?\")\n```\n\n### Key Design Principles\n\n1. **Lazy Loading**: Agents are initialized on-demand to avoid startup failures\n2. **Singleton Pattern**: Workflows and orchestrators are singletons for performance\n3. **Error Resilience**: Each node handles errors gracefully without crashing the workflow\n4. **Separation of Concerns**: PydanticAI for agents, LangGraph for orchestration\n5. **Observability First**: Comprehensive tracing and monitoring built-in\n6. **Type Safety**: Strong typing throughout with Pydantic models and TypedDict\n7. **Extensibility**: Easy to add new agents or workflow branches\n\n### Integration with Backend\n\nThe NestJS backend communicates with AI Engine via HTTP:\n\n```typescript\n// apps/backend/src/modules/ai/ai-client.service.ts\n@Injectable()\nexport class AiClientService {\n  private readonly baseUrl = 'http://localhost:8000';\n\n  async askQuestion(question: string, mode: 'LAWYER' | 'SIMPLE') {\n    return this.httpService.post('/api/v1/qa/ask', { question, mode });\n  }\n}\n```"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring AI Engine codebase structure",
      "content": "Explore AI Engine codebase structure and architecture",
      "status": "completed"
    },
    {
      "activeForm": "Understanding PydanticAI agent patterns",
      "content": "Understand PydanticAI agent patterns",
      "status": "completed"
    },
    {
      "activeForm": "Understanding LangGraph workflow patterns",
      "content": "Understand LangGraph workflow patterns",
      "status": "completed"
    },
    {
      "activeForm": "Reviewing Langfuse observability setup",
      "content": "Review Langfuse observability setup",
      "status": "completed"
    },
    {
      "activeForm": "Reviewing clarification flow design",
      "content": "Review clarification flow design",
      "status": "completed"
    },
    {
      "activeForm": "Reading existing CLAUDE.md and documentation",
      "content": "Read existing CLAUDE.md to understand what to update",
      "status": "completed"
    },
    {
      "activeForm": "Updating CLAUDE.md with AI Engine section",
      "content": "Update CLAUDE.md with AI Engine documentation",
      "status": "completed"
    },
    {
      "activeForm": "Updating AI Engine README.md",
      "content": "Update AI Engine README.md with new architecture",
      "status": "in_progress"
    },
    {
      "activeForm": "Creating AI_ENGINE_ARCHITECTURE.md",
      "content": "Create comprehensive AI Engine architecture documentation",
      "status": "pending"
    }
  ]
}
Now let me update the AI Engine README.md with the new architecture:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/README.md",
  "content": "# AI Engine\n\nAI-powered legal assistance service built with FastAPI, PydanticAI, and LangGraph.\n\n## Overview\n\nThis service provides AI capabilities for the Legal AI Platform, including:\n\n- **Document Generation**: Generate legal documents from natural language descriptions\n- **Legal Q&A**: Answer legal questions with citations and context retrieval\n- **Case Analysis**: Multi-step workflows for analyzing legal cases\n- **Clarification Flow**: Interactive follow-up questions for incomplete queries\n\n## Technology Stack\n\n| Component | Technology | Purpose |\n|-----------|------------|---------|\n| Web Framework | FastAPI | Modern async Python web framework |\n| AI Agents | PydanticAI | Type-safe AI agent framework |\n| Orchestration | LangGraph | Multi-agent workflow coordination |\n| Observability | Langfuse | LLM tracing and monitoring |\n| Error Tracking | Sentry | Error correlation and reporting |\n| Package Manager | uv | Fast Python dependency management |\n| Python | 3.11+ | Modern type-hinted Python |\n\n## Architecture\n\n```\n┌──────────────────────────────────────────────────────────────────────┐\n│                           AI Engine Service                          │\n├──────────────────────────────────────────────────────────────────────┤\n│                                                                      │\n│  ┌──────────────┐      ┌──────────────────────────────────────────┐ │\n│  │   FastAPI    │      │         LangGraph Orchestrator           │ │\n│  │  Endpoints   │──────│   (multi-agent workflow coordination)    │ │\n│  └──────────────┘      └──────────────────────────────────────────┘ │\n│         │                           │                               │\n│         │         ┌─────────────────┼─────────────────┐             │\n│         │         ▼                 ▼                 ▼             │\n│         │  ┌──────────┐     ┌──────────┐     ┌──────────┐          │\n│         └─→│   Q&A    │     │Classifier│     │ Drafting │          │\n│            │  Agent   │     │  Agent   │     │  Agent   │          │\n│            └──────────┘     └──────────┘     └──────────┘          │\n│                   │                 │                 │             │\n│                   └─────────────────┼─────────────────┘             │\n│                                   ▼                               │\n│                    ┌──────────────────────────┐                    │\n│                    │      ModelDeps           │                    │\n│                    │  (OpenAI, Settings)      │                    │\n│                    └──────────────────────────┘                    │\n│                                                                      │\n│  ┌──────────────────────────────────────────────────────────────┐  │\n│  │                    Observability Layer                       │  │\n│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │  │\n│  │  │   Langfuse   │  │    Sentry    │  │   Logging    │      │  │\n│  │  │  (LLM Traces)│  │ (Error Track)│  │  (Structured)│      │  │\n│  │  └──────────────┘  └──────────────┘  └──────────────┘      │  │\n│  └──────────────────────────────────────────────────────────────┘  │\n└──────────────────────────────────────────────────────────────────────┘\n```\n\n## Setup\n\n### Prerequisites\n\n- Python 3.11 or higher\n- `uv` package manager (recommended) or pip\n- OpenAI API key\n\n### Installation\n\n```bash\n# Using uv (recommended)\nuv sync\n\n# Or using pip\npip install -e .\n```\n\n### Environment Configuration\n\nCreate a `.env` file in the ai-engine directory:\n\n```bash\n# OpenAI Configuration (Required)\nOPENAI_API_KEY=sk-your-openai-api-key-here\nOPENAI_MODEL=gpt-4o\nOPENAI_EMBEDDING_MODEL=text-embedding-3-small\n\n# Service Configuration\nAI_ENGINE_PORT=8000\nAI_ENGINE_HOST=0.0.0.0\nBACKEND_URL=http://localhost:3001\n\n# Langfuse Observability (Optional but recommended)\nLANGFUSE_PUBLIC_KEY=pk-your-langfuse-public-key\nLANGFUSE_SECRET_KEY=sk-your-langfuse-secret-key\nLANGFUSE_ENABLED=true\nLANGFUSE_SAMPLING_RATE=1.0\nLANGFUSE_SESSION_ID_HEADER=x-session-id\n```\n\n### Getting Langfuse Credentials\n\n1. Go to [Langfuse Cloud](https://cloud.langfuse.com)\n2. Sign up or log in\n3. Create a new project\n4. Copy the Public Key and Secret Key from project settings\n\n## Running the Service\n\n### Development Mode (with Hot Reload)\n\n```bash\n# Using the dev script (recommended)\nuv run dev\n\n# Or using uvicorn directly\nuv run uvicorn src.main:app --reload --port 8000 --log-level debug\n```\n\nThe hot reload feature automatically restarts the server when Python source code changes:\n- Monitors `src/` and `tests/` directories\n- Graceful shutdown of in-flight requests\n- ~1-2 second restart time\n\n### Production Mode\n\n```bash\nuvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4\n```\n\nThe service will be available at:\n- API: http://localhost:8000\n- Interactive docs: http://localhost:8000/docs\n- ReDoc: http://localhost:8000/redoc\n\n## Project Structure\n\n```\nsrc/\n├── main.py              # FastAPI application entry point\n├── config.py            # Pydantic Settings for configuration\n├── langfuse_init.py     # Langfuse observability setup\n├── sentry_init.py       # Sentry error tracking setup\n├── start_server.py      # Server startup script\n├── agents/              # PydanticAI agents\n│   ├── dependencies.py  # Dependency injection (ModelDeps)\n│   ├── qa_agent.py      # Legal Q&A with RAG\n│   ├── classifier_agent.py  # Case classification\n│   ├── drafting_agent.py    # Document generation\n│   ├── clarification_agent.py  # Follow-up questions\n│   └── rag_tool.py      # RAG context retrieval\n├── workflows/           # LangGraph workflow orchestration\n│   ├── states.py        # TypedDict state schemas\n│   ├── orchestration.py # WorkflowOrchestrator service\n│   ├── case_analysis_workflow.py\n│   ├── document_generation_workflow.py\n│   └── complex_qa_workflow.py\n├── models/              # Pydantic models\n│   ├── requests.py      # Request DTOs\n│   └── responses.py     # Response DTOs\n└── services/            # Core services\n    └── embeddings.py    # Embedding generation\n```\n\n## API Endpoints\n\n### Health Endpoints\n\n```\nGET /health          # Service health with startup status\nGET /health/ready    # Kubernetes readiness probe\nGET /health/live     # Kubernetes liveness probe\n```\n\n### Simple Agent Endpoints\n\n```\nPOST /api/v1/qa                 # Simple Q&A\nPOST /api/v1/classify           # Case classification\nPOST /api/v1/documents/generate # Document generation\n```\n\n### Enhanced RAG Endpoints\n\n```\nPOST /api/v1/qa/ask          # Q&A with user context\nPOST /api/v1/qa/ask-rag      # RAG-based Q&A\nPOST /api/v1/search/semantic # Vector search\n```\n\n### Workflow Endpoints\n\n```\nPOST /api/v1/workflows/case-analysis        # Multi-step case analysis\nPOST /api/v1/workflows/document-generation  # Document with revision\nPOST /api/v1/workflows/complex-qa           # Comprehensive Q&A\n```\n\n## Development Guides\n\n### Creating a New PydanticAI Agent\n\n```python\n# src/agents/my_agent.py\nfrom pydantic_ai import Agent\nfrom pydantic import BaseModel\nfrom .dependencies import ModelDeps, get_model_deps\n\nclass MyResult(BaseModel):\n    answer: str\n    confidence: float\n\n# Lazy-loading pattern\n_my_agent: Agent[MyResult, ModelDeps] | None = None\n\ndef get_my_agent() -> Agent[MyResult, ModelDeps]:\n    global _my_agent\n    if _my_agent is None:\n        from ..config import get_settings\n        settings = get_settings()\n        _my_agent = Agent(\n            f\"openai:{settings.OPENAI_MODEL}\",\n            system_prompt=\"You are a helpful legal assistant.\",\n            deps_type=ModelDeps,\n            output_type=MyResult,\n        )\n    return _my_agent\n\n# Usage\nasync def my_function(question: str) -> dict:\n    deps = get_model_deps()\n    agent = get_my_agent()\n    result = await agent.run(question, deps=deps)\n    return result.data.model_dump()\n```\n\n### Creating a New LangGraph Workflow\n\n```python\n# src/workflows/my_workflow.py\nfrom typing import Any, Required, TypedDict\nfrom langgraph.graph import StateGraph\n\nclass MyWorkflowState(TypedDict, total=False):\n    input: Required[str]\n    intermediate: str | None\n    output: str | None\n    error: str | None\n\ndef step1(state: MyWorkflowState) -> MyWorkflowState:\n    try:\n        # Process step 1\n        state[\"intermediate\"] = \"result\"\n    except Exception as e:\n        state[\"error\"] = str(e)\n    return state\n\ndef step2(state: MyWorkflowState) -> MyWorkflowState:\n    try:\n        # Process step 2\n        state[\"output\"] = \"final result\"\n    except Exception as e:\n        state[\"error\"] = str(e)\n    return state\n\n@lru_cache\ndef my_workflow() -> CompiledStateGraph:\n    workflow = StateGraph(MyWorkflowState)\n    workflow.add_node(\"step1\", step1)\n    workflow.add_node(\"step2\", step2)\n    workflow.add_edge(\"step1\", \"step2\")\n    workflow.set_entry_point(\"step1\")\n    workflow.set_finish_point(\"step2\")\n    return workflow.compile()\n```\n\n### Adding Langfuse Tracing\n\n```python\nfrom ..langfuse_init import get_langfuse, is_langfuse_enabled\n\nasync def my_traced_function(input: str, session_id: str):\n    trace = None\n    if is_langfuse_enabled():\n        langfuse = get_langfuse()\n        trace = langfuse.trace(\n            name=\"my_operation\",\n            session_id=session_id,\n        )\n\n    try:\n        # Your logic here\n        result = \"output\"\n\n        if trace:\n            trace.end(output={\"result\": result})\n        return result\n    except Exception as e:\n        if trace:\n            trace.end(level=\"ERROR\", status_message=str(e))\n        raise\n```\n\n## Testing\n\n### Running Tests\n\n```bash\n# Run all tests\nuv run pytest\n\n# Run with coverage\nuv run pytest --cov\n\n# Run specific test file\nuv run pytest tests/unit/test_workflows.py\n```\n\n### Test Configuration\n\nTests are configured in `pyproject.toml` and use mock data to avoid real API calls:\n\n```python\n# conftest.py sets test defaults\nos.environ.setdefault(\"OPENAI_API_KEY\", \"test-key-for-pytest\")\nos.environ.setdefault(\"OPENAI_MODEL\", \"gpt-4-test\")\n```\n\n### Writing Tests\n\n```python\n# tests/unit/test_my_agent.py\nimport pytest\nfrom src.agents.my_agent import get_my_agent\n\n@pytest.mark.asyncio\nasync def test_my_agent():\n    agent = get_my_agent()\n    result = await agent.run(\"Test input\")\n    assert result.data.answer\n    assert 0 <= result.data.confidence <= 1\n```\n\n## Observability\n\n### Langfuse Dashboard\n\nOnce configured, access the Langfuse dashboard at `https://cloud.langfuse.com`:\n\n- **Traces**: Individual request executions with spans\n- **Sessions**: Grouped requests by user session\n- **Users**: Per-user analytics and error rates\n- **Metrics**: Token usage, latency, costs\n\n### PII Redaction\n\nAll traces automatically redact Polish personal data:\n- Email addresses\n- Phone numbers (Polish and international)\n- PESEL numbers (Polish national ID)\n- NIP numbers (Polish tax ID)\n- Credit card numbers\n\n### Sentry Integration\n\nErrors are automatically correlated with Langfuse traces via `sentry-trace` header propagation.\n\n## Integration with Backend\n\nThe NestJS backend communicates with this service via HTTP:\n\n```typescript\n// apps/backend/src/modules/ai/ai-client.service.ts\n@Injectable()\nexport class AiClientService {\n  private readonly baseUrl = 'http://localhost:8000';\n\n  async askQuestion(question: string, mode: 'LAWYER' | 'SIMPLE') {\n    return this.httpService.post('/api/v1/qa/ask', { question, mode });\n  }\n\n  async classifyCase(description: string) {\n    return this.httpService.post('/api/v1/classify', { description });\n  }\n}\n```\n\n## Documentation\n\n- **Langfuse Integration**: See [LANGFUSE.md](LANGFUSE.md)\n- **Workflow Patterns**: See [WORKFLOWS.md](WORKFLOWS.md)\n- **Main Project Docs**: See [CLAUDE.md](../../.claude/CLAUDE.md)\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring AI Engine codebase structure",
      "content": "Explore AI Engine codebase structure and architecture",
      "status": "completed"
    },
    {
      "activeForm": "Understanding PydanticAI agent patterns",
      "content": "Understand PydanticAI agent patterns",
      "status": "completed"
    },
    {
      "activeForm": "Understanding LangGraph workflow patterns",
      "content": "Understand LangGraph workflow patterns",
      "status": "completed"
    },
    {
      "activeForm": "Reviewing Langfuse observability setup",
      "content": "Review Langfuse observability setup",
      "status": "completed"
    },
    {
      "activeForm": "Reviewing clarification flow design",
      "content": "Review clarification flow design",
      "status": "completed"
    },
    {
      "activeForm": "Reading existing CLAUDE.md and documentation",
      "content": "Read existing CLAUDE.md to understand what to update",
      "status": "completed"
    },
    {
      "activeForm": "Updating CLAUDE.md with AI Engine section",
      "content": "Update CLAUDE.md with AI Engine documentation",
      "status": "completed"
    },
    {
      "activeForm": "Updating AI Engine README.md",
      "content": "Update AI Engine README.md with new architecture",
      "status": "completed"
    },
    {
      "activeForm": "Creating AI_ENGINE_ARCHITECTURE.md",
      "content": "Create comprehensive AI Engine architecture documentation",
      "status": "in_progress"
    }
  ]
}
Now let me create a comprehensive AI Engine architecture document:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/ARCHITECTURE.md",
  "content": "# AI Engine Architecture\n\nThis document describes the architecture of the AI Engine service, including design patterns, component relationships, and implementation guidelines.\n\n## Table of Contents\n\n1. [Overview](#overview)\n2. [Architecture Layers](#architecture-layers)\n3. [PydanticAI Agent Patterns](#pydanticai-agent-patterns)\n4. [LangGraph Workflow Patterns](#langgraph-workflow-patterns)\n5. [Clarification Flow Design](#clarification-flow-design)\n6. [Observability Strategy](#observability-strategy)\n7. [Data Flow](#data-flow)\n8. [Migration Guide](#migration-guide)\n\n---\n\n## Overview\n\nThe AI Engine follows a **layered architecture** with clear separation of concerns:\n\n```\n┌─────────────────────────────────────────────────────────────────────┐\n│                         API Layer (FastAPI)                          │\n│  - REST endpoints                                                   │\n│  - Request/Response validation                                      │\n│  - Error handling                                                   │\n└─────────────────────────────────────────────────────────────────────┘\n                                  │\n                                  ▼\n┌─────────────────────────────────────────────────────────────────────┐\n│                    Orchestration Layer (LangGraph)                  │\n│  - Multi-agent workflows                                           │\n│  - State management                                                 │\n│  - Conditional routing                                              │\n└─────────────────────────────────────────────────────────────────────┘\n                                  │\n                                  ▼\n┌─────────────────────────────────────────────────────────────────────┐\n│                      Agent Layer (PydanticAI)                       │\n│  - QA Agent                                                         │\n│  - Classifier Agent                                                 │\n│  - Drafting Agent                                                   │\n│  - Clarification Agent                                              │\n└─────────────────────────────────────────────────────────────────────┘\n                                  │\n                                  ▼\n┌─────────────────────────────────────────────────────────────────────┐\n│                      Dependency Layer                               │\n│  - ModelDeps (OpenAI client, settings)                             │\n│  - Embeddings service                                               │\n│  - RAG tools                                                        │\n└─────────────────────────────────────────────────────────────────────┘\n                                  │\n                                  ▼\n┌─────────────────────────────────────────────────────────────────────┐\n│                   External Services                                 │\n│  - OpenAI API                                                       │\n│  - Backend Vector Store                                            │\n└─────────────────────────────────────────────────────────────────────┘\n```\n\n### Key Design Principles\n\n1. **Separation of Concerns**: LangGraph for orchestration, PydanticAI for agents\n2. **Lazy Loading**: Agents initialized on-demand to avoid startup failures\n3. **Type Safety**: Strong typing with Pydantic models and TypedDict\n4. **Observability First**: Comprehensive tracing built-in\n5. **Error Resilience**: Each component handles errors gracefully\n\n---\n\n## Architecture Layers\n\n### 1. API Layer (FastAPI)\n\n**Location:** `src/main.py`\n\nThe API layer provides HTTP endpoints with automatic validation via Pydantic models.\n\n```python\nfrom fastapi import FastAPI\nfrom .models.requests import QARequest\nfrom .models.responses import QAResponse\n\n@app.post(\"/api/v1/qa/ask\", response_model=QAResponse)\nasync def ask_question(request: QARequest) -> QAResponse:\n    result = await answer_question(\n        question=request.question,\n        mode=request.mode,\n        session_id=request.session_id,\n    )\n    return QAResponse(**result)\n```\n\n**Key Features:**\n- Automatic request validation\n- Structured error responses\n- OpenAPI documentation generation\n- Health check endpoints\n\n### 2. Orchestration Layer (LangGraph)\n\n**Location:** `src/workflows/`\n\nLangGraph coordinates multiple agents in complex workflows. It is **only used for orchestration**, not for direct LLM calls.\n\n**Key Components:**\n- **State Schemas**: TypedDict definitions for workflow state\n- **Nodes**: Functions that process state and call agents\n- **Edges**: Connections between nodes (conditional or fixed)\n- **Workflows**: Compiled StateGraph instances\n\n### 3. Agent Layer (PydanticAI)\n\n**Location:** `src/agents/`\n\nPydanticAI agents encapsulate AI capabilities with type-safe inputs and outputs.\n\n```python\nfrom pydantic_ai import Agent\nfrom pydantic import BaseModel\n\nclass Result(BaseModel):\n    answer: str\n    confidence: float\n\nagent = Agent(\n    \"openai:gpt-4o\",\n    system_prompt=\"You are a legal assistant.\",\n    output_type=Result,\n)\n```\n\n### 4. Dependency Layer\n\n**Location:** `src/agents/dependencies.py`\n\nProvides centralized dependency injection for agents.\n\n```python\nclass ModelDeps:\n    def __init__(self) -> None:\n        self.settings = get_settings()\n        self.openai_client = get_openai_client()\n```\n\n---\n\n## PydanticAI Agent Patterns\n\n### Pattern 1: Lazy-Loading Agent\n\nAvoids startup failures by initializing agents on first use.\n\n```python\n# Global reference (module-level)\n_my_agent: Agent[MyResult, ModelDeps] | None = None\n\ndef get_my_agent() -> Agent[MyResult, ModelDeps]:\n    \"\"\"Get or create the agent singleton.\"\"\"\n    global _my_agent\n    if _my_agent is None:\n        settings = get_settings()\n        _my_agent = Agent(\n            f\"openai:{settings.OPENAI_MODEL}\",\n            system_prompt=\"You are a helpful assistant.\",\n            deps_type=ModelDeps,\n            output_type=MyResult,\n        )\n    return _my_agent\n```\n\n### Pattern 2: Multi-Mode Agent\n\nDifferent system prompts for different use cases.\n\n```python\n_agent_lawyer: Agent[QAResult, ModelDeps] | None = None\n_agent_simple: Agent[QAResult, ModelDeps] | None = None\n\nLAWYER_PROMPT = \"You are an expert lawyer providing detailed analysis.\"\nSIMPLE_PROMPT = \"You are a lawyer explaining to a layperson.\"\n\ndef get_qa_agent(mode: str = \"SIMPLE\") -> Agent[QAResult, ModelDeps]:\n    global _agent_lawyer, _agent_simple\n\n    if mode.upper() == \"LAWYER\":\n        if _agent_lawyer is None:\n            settings = get_settings()\n            _agent_lawyer = Agent(\n                f\"openai:{settings.OPENAI_MODEL}\",\n                system_prompt=LAWYER_PROMPT,\n                deps_type=ModelDeps,\n                output_type=QAResult,\n            )\n        return _agent_lawyer\n\n    if _agent_simple is None:\n        settings = get_settings()\n        _agent_simple = Agent(\n            f\"openai:{settings.OPENAI_MODEL}\",\n            system_prompt=SIMPLE_PROMPT,\n            deps_type=ModelDeps,\n            output_type=QAResult,\n        )\n    return _agent_simple\n```\n\n### Pattern 3: Agent with Tools\n\nTools provide structured capabilities to agents.\n\n```python\nfrom pydantic_ai import Agent, RunContext\n\n@agent.tool\nasync def retrieve_context(\n    ctx: RunContext[ModelDeps],\n    query: str,\n    limit: int = 5,\n) -> list[RetrievedContext]:\n    \"\"\"Retrieve relevant legal context from vector store.\"\"\"\n    # Implementation here\n    pass\n\nagent = Agent(\n    \"openai:gpt-4o\",\n    system_prompt=\"Use the retrieve_context tool for RAG.\",\n    deps_type=ModelDeps,\n)\nagent.register_tool(retrieve_context)\n```\n\n### Pattern 4: Workflow Function\n\nAgents are typically called within workflow functions that handle orchestration.\n\n```python\nasync def answer_question(\n    question: str,\n    mode: str = \"SIMPLE\",\n    session_id: str = \"default\",\n) -> dict[str, Any]:\n    \"\"\"Complete Q&A workflow.\"\"\"\n    # Get dependencies\n    deps = get_model_deps()\n\n    # Get agent\n    agent = get_qa_agent(mode)\n\n    # Run agent\n    result = await agent.run(question, deps=deps)\n\n    # Return structured output\n    return result.data.model_dump()\n```\n\n---\n\n## LangGraph Workflow Patterns\n\n### Pattern 1: State Schema Definition\n\nUse `TypedDict` with `total=False` for optional fields.\n\n```python\nfrom typing import Any, Required, TypedDict\n\nclass MyWorkflowState(TypedDict, total=False):\n    # Required fields\n    input: Required[str]\n\n    # Optional fields (can be omitted in initial state)\n    intermediate: str | None\n    output: str | None\n    error: str | None\n    metadata: dict[str, Any]\n```\n\n### Pattern 2: Node Function\n\nNodes receive state, process it, and return updated state.\n\n```python\ndef my_node(state: MyWorkflowState) -> MyWorkflowState:\n    \"\"\"Process a step in the workflow.\"\"\"\n    try:\n        # Process the input\n        result = process(state[\"input\"])\n\n        # Update state\n        state[\"intermediate\"] = result\n        state[\"metadata\"][\"current_step\"] = \"my_node\"\n\n    except Exception as e:\n        # Store error in state for graceful handling\n        state[\"error\"] = str(e)\n\n    return state\n```\n\n### Pattern 3: Conditional Edge\n\nRoute to different nodes based on state.\n\n```python\ndef should_continue(state: MyWorkflowState) -> str:\n    \"\"\"Decide next step based on state.\"\"\"\n    if state.get(\"error\"):\n        return \"error_handler\"\n    if state.get(\"output\"):\n        return \"complete\"\n    return \"process_more\"\n```\n\n### Pattern 4: Workflow Compilation\n\nUse `@lru_cache` for singleton workflow instances.\n\n```python\nfrom functools import lru_cache\nfrom langgraph.graph import StateGraph, END\n\n@lru_cache\ndef my_workflow() -> CompiledStateGraph:\n    \"\"\"Create and cache the workflow.\"\"\"\n    workflow = StateGraph(MyWorkflowState)\n\n    # Add nodes\n    workflow.add_node(\"start\", start_node)\n    workflow.add_node(\"process\", process_node)\n    workflow.add_node(\"complete\", complete_node)\n\n    # Add edges\n    workflow.add_edge(\"start\", \"process\")\n    workflow.add_conditional_edges(\n        \"process\",\n        should_continue,\n        {\"process_more\": \"process\", \"complete\": \"complete\"}\n    )\n    workflow.add_edge(\"complete\", END)\n\n    # Set entry point\n    workflow.set_entry_point(\"start\")\n\n    return workflow.compile()\n```\n\n### Pattern 5: Workflow Execution\n\n```python\nasync def run_my_workflow(input: str, session_id: str) -> dict[str, Any]:\n    \"\"\"Execute the workflow.\"\"\"\n    # Create initial state\n    initial_state: MyWorkflowState = {\n        \"input\": input,\n        \"metadata\": {\"session_id\": session_id, \"current_step\": \"start\"},\n    }\n\n    # Get workflow\n    workflow = my_workflow()\n\n    # Execute\n    result = await workflow.ainvoke(initial_state)\n\n    return result\n```\n\n---\n\n## Clarification Flow Design\n\nThe clarification system generates follow-up questions when queries are incomplete.\n\n### Decision Logic\n\n```python\ndef needs_clarification(classification: dict) -> bool:\n    \"\"\"Determine if clarification is needed.\"\"\"\n    # Low confidence score\n    if classification[\"confidence\"] < 0.6:\n        return True\n\n    # No legal grounds identified\n    if not classification.get(\"legal_grounds\"):\n        return True\n\n    # Any low-confidence ground\n    for ground in classification.get(\"legal_grounds\", []):\n        if ground[\"confidence\"] < 0.6:\n            return True\n\n    return False\n```\n\n### Question Generation\n\n```python\nclass ClarificationQuestion(BaseModel):\n    question: str\n    question_type: str  # timeline, parties, documents, amounts, jurisdiction\n    options: list[str] | None = None  # Optional predefined choices\n    hint: str | None = None  # Help text for users\n\nasync def generate_clarifications(\n    question: str,\n    query_type: str,\n    mode: str = \"SIMPLE\",\n) -> dict[str, Any]:\n    \"\"\"Generate structured clarification questions.\"\"\"\n    # Use clarification agent to generate questions\n    agent = get_clarification_agent()\n    result = await agent.run(\n        f\"Question: {question}\\nType: {query_type}\",\n        deps=get_model_deps(),\n    )\n\n    questions = result.data.questions\n\n    return {\n        \"needs_clarification\": len(questions) > 0,\n        \"questions\": [q.model_dump() for q in questions],\n        \"context_summary\": result.data.summary,\n        \"next_steps\": result.data.next_steps,\n    }\n```\n\n### UX Integration\n\n```typescript\n// Frontend integration example\ninterface ClarificationResponse {\n  needs_clarification: boolean;\n  questions: Array<{\n    question: string;\n    question_type: string;\n    options?: string[];\n    hint?: string;\n  }>;\n  context_summary: string;\n  next_steps: string;\n}\n\nfunction showClarification(response: ClarificationResponse) {\n  if (response.needs_clarification) {\n    // Render question cards\n    response.questions.forEach(q => {\n      renderQuestionCard(q);\n    });\n    // Show next steps explanation\n    renderInfo(response.next_steps);\n  }\n}\n```\n\n---\n\n## Observability Strategy\n\n### Langfuse Integration\n\nAll AI operations are traced with Langfuse for observability.\n\n#### Trace Structure\n\n```\nworkflow_execution (trace)\n├── node_1 (span)\n│   └── llm_call (span)\n├── node_2 (span)\n│   └── llm_call (span)\n└── node_3 (span)\n    └── llm_call (span)\n```\n\n#### Tracing Pattern\n\n```python\nfrom ..langfuse_init import get_langfuse, is_langfuse_enabled\n\nasync def traced_operation(input: str, session_id: str) -> dict:\n    trace = None\n    if is_langfuse_enabled():\n        langfuse = get_langfuse()\n        trace = langfuse.trace(\n            name=\"my_operation\",\n            session_id=session_id,\n            metadata={\"input_length\": len(input)},\n        )\n\n    try:\n        # Do work\n        result = await do_work(input)\n\n        # Create child span\n        if trace:\n            span = trace.span(name=\"sub_operation\")\n            span.end(output={\"result\": result})\n\n        if trace:\n            trace.end(output={\"final\": result})\n\n        return result\n\n    except Exception as e:\n        if trace:\n            trace.end(level=\"ERROR\", status_message=str(e))\n        raise\n```\n\n### PII Redaction\n\nAutomatic redaction for Polish personal data:\n\n```python\nimport re\n\n_PII_PATTERNS = [\n    (r'\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b', '[EMAIL]'),\n    (r'\\b\\d{11}\\b', '[PESEL]'),\n    (r'\\b[Nn][Ii][Pp]:?\\s*\\d{10}\\b', '[NIP]'),\n    (r'\\b\\d{3}[-\\s]?\\d{3}[-\\s]?\\d{3}\\b', '[PHONE]'),\n]\n\ndef redact_pii(text: str) -> str:\n    \"\"\"Redact PII from text.\"\"\"\n    for pattern, replacement in _PII_PATTERNS:\n        text = re.sub(pattern, replacement, text)\n    return text\n```\n\n### Distributed Tracing\n\nHeaders propagate trace context across services:\n\n```\nFrontend → Backend → AI Engine\n         ↓          ↓\n      Langfuse   Langfuse\n```\n\nHeaders:\n- `x-session-id`: Session identifier\n- `x-user-id`: User identifier\n- `x-langfuse-trace-id`: Langfuse trace ID\n- `sentry-trace`: Sentry trace ID\n\n---\n\n## Data Flow\n\n### Simple Q&A Flow\n\n```\n┌─────────┐    HTTP POST    ┌─────────┐\n│ Client  │ ───────────────→ │ FastAPI │\n└─────────┘                 └────┬────┘\n                                 │\n                                 ▼\n                          ┌─────────────┐\n                          │ QA Endpoint │\n                          └──────┬──────┘\n                                 │\n                                 ▼\n                          ┌─────────────┐\n                          │ QA Agent    │\n                          └──────┬──────┘\n                                 │\n                                 ▼\n                          ┌─────────────┐\n                          │ OpenAI API  │\n                          └──────┬──────┘\n                                 │\n                                 ▼\n                          ┌─────────────┐\n                          │ Langfuse    │\n                          │ (trace)     │\n                          └──────┬──────┘\n                                 │\n                                 ▼\n                          ┌─────────────┐\n                          │ Response    │\n                          └──────┬──────┘\n                                 │\n                                 ▼\n┌─────────┐   JSON Response   ┌─────────┐\n│ Client  │ ←───────────────── │ FastAPI │\n└─────────┘                   └─────────┘\n```\n\n### Workflow Flow\n\n```\n┌─────────┐    HTTP POST    ┌──────────────┐\n│ Client  │ ───────────────→ │ LangGraph    │\n└─────────┘                  │ Workflow     │\n                             └──────┬───────┘\n                                    │\n         ┌──────────────────────────┼──────────────────┐\n         ▼                          ▼                  ▼\n    ┌─────────┐              ┌──────────┐         ┌──────────┐\n    │ Node 1  │              │ Node 2   │         │ Node 3   │\n    │(classify)│─────────────→│(clarify) │─────────→│(research)│\n    └────┬────┘              └────┬─────┘         └────┬─────┘\n         │                        │                     │\n         └────────────────────────┼─────────────────────┘\n                                  ▼\n                          ┌──────────────┐\n                          │ Final State  │\n                          └──────┬───────┘\n                                 │\n                                 ▼\n┌─────────┐   JSON Response   ┌─────────┐\n│ Client  │ ←───────────────── │ FastAPI │\n└─────────┘                   └─────────┘\n```\n\n---\n\n## Migration Guide\n\n### From LangChain to PydanticAI\n\n| LangChain | PydanticAI |\n|-----------|------------|\n| `@chain` decorator | `Agent` class with `output_type` |\n| `RunnableSequence` | LangGraph `StateGraph` |\n| `BasePromptTemplate` | System prompt string |\n| `StructuredOutput` | `output_type=BaseModel` |\n| `bind_tools()` | Tool registration on Agent |\n\n#### Before (LangChain-style)\n\n```python\nfrom langchain.schema import BasePromptTemplate\nfrom langchain.chains import LLMChain\nfrom langchain.output_parsers import PydanticOutputParser\n\nprompt = BasePromptTemplate.from_template(\n    \"You are a lawyer. Answer: {question}\"\n)\nparser = PydanticOutputParser(pydantic_object=QAResult)\nchain = LLMChain(llm=llm, prompt=prompt)\nresult = chain.run(question=\"What is...?\")\nparsed = parser.parse(result)\n```\n\n#### After (PydanticAI)\n\n```python\nfrom pydantic_ai import Agent\nfrom pydantic import BaseModel\n\nclass QAResult(BaseModel):\n    answer: str\n    confidence: float\n\nagent = Agent(\n    \"openai:gpt-4o\",\n    system_prompt=\"You are a lawyer.\",\n    output_type=QAResult,\n)\nresult = await agent.run(\"What is...?\")\n# result.data is already a QAResult instance\n```\n\n### From Direct OpenAI to PydanticAI\n\n#### Before\n\n```python\nfrom openai import AsyncOpenAI\n\nclient = AsyncOpenAI(api_key=api_key)\nresponse = await client.chat.completions.create(\n    model=\"gpt-4o\",\n    messages=[\n        {\"role\": \"system\", \"content\": \"You are a lawyer.\"},\n        {\"role\": \"user\", \"content\": question}\n    ]\n)\nanswer = response.choices[0].message.content\n```\n\n#### After\n\n```python\nfrom pydantic_ai import Agent\nfrom pydantic import BaseModel\n\nclass Answer(BaseModel):\n    content: str\n\nagent = Agent(\n    \"openai:gpt-4o\",\n    system_prompt=\"You are a lawyer.\",\n    output_type=Answer,\n)\nresult = await agent.run(question)\nanswer = result.data.content\n```\n\n---\n\n## File Reference\n\n| File | Purpose |\n|------|---------|\n| `src/main.py` | FastAPI application and endpoints |\n| `src/config.py` | Pydantic Settings for configuration |\n| `src/langfuse_init.py` | Langfuse client setup and utilities |\n| `src/agents/dependencies.py` | Dependency injection (ModelDeps) |\n| `src/agents/qa_agent.py` | Q&A agent with RAG |\n| `src/agents/classifier_agent.py` | Legal case classification |\n| `src/agents/drafting_agent.py` | Document generation |\n| `src/agents/clarification_agent.py` | Follow-up question generation |\n| `src/agents/rag_tool.py` | Vector store retrieval tool |\n| `src/workflows/states.py` | TypedDict state schemas |\n| `src/workflows/orchestration.py` | WorkflowOrchestrator service |\n| `src/workflows/case_analysis_workflow.py` | Case analysis workflow |\n| `src/workflows/document_generation_workflow.py` | Document generation workflow |\n| `src/workflows/complex_qa_workflow.py` | Complex Q&A workflow |\n| `tests/conftest.py` | Test configuration |\n| `tests/unit/test_workflows.py` | Workflow unit tests |\n| `LANGFUSE.md` | Langfuse integration guide |\n| `WORKFLOWS.md` | Workflow pattern documentation |\n| `README.md` | Project overview |\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring AI Engine codebase structure",
      "content": "Explore AI Engine codebase structure and architecture",
      "status": "completed"
    },
    {
      "activeForm": "Understanding PydanticAI agent patterns",
      "content": "Understand PydanticAI agent patterns",
      "status": "completed"
    },
    {
      "activeForm": "Understanding LangGraph workflow patterns",
      "content": "Understand LangGraph workflow patterns",
      "status": "completed"
    },
    {
      "activeForm": "Reviewing Langfuse observability setup",
      "content": "Review Langfuse observability setup",
      "status": "completed"
    },
    {
      "activeForm": "Reviewing clarification flow design",
      "content": "Review clarification flow design",
      "status": "completed"
    },
    {
      "activeForm": "Reading existing CLAUDE.md and documentation",
      "content": "Read existing CLAUDE.md to understand what to update",
      "status": "completed"
    },
    {
      "activeForm": "Updating CLAUDE.md with AI Engine section",
      "content": "Update CLAUDE.md with AI Engine documentation",
      "status": "completed"
    },
    {
      "activeForm": "Updating AI Engine README.md",
      "content": "Update AI Engine README.md with new architecture",
      "status": "completed"
    },
    {
      "activeForm": "Creating AI_ENGINE_ARCHITECTURE.md",
      "content": "Create comprehensive AI Engine architecture documentation",
      "status": "completed"
    },
    {
      "activeForm": "Verifying documentation completeness",
      "content": "Verify all documentation is complete and consistent",
      "status": "in_progress"
    }
  ]
}
Now let me verify the documentation by running the type checks and ensuring everything compiles:

🔧 Tool: Bash
Input: {
  "command": "tsc --noEmit 2>&1 | head -50",
  "description": "Run TypeScript type check",
  "timeout": 60000
}

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine && uv run mypy src/ 2>&1 || true",
  "description": "Run Python type check on AI Engine",
  "timeout": 60000
}
The Python type check shows some pre-existing issues (these are not caused by our documentation changes). Let me verify the TypeScript type check works correctly:

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit 2>&1 | head -30",
  "description": "Run TypeScript type check from project root",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "pnpm tsc --noEmit 2>&1 | tail -20",
  "description": "Run TypeScript type check",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal && pnpm run build:backend 2>&1 | tail -30",
  "description": "Run backend build",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "pnpm run lint 2>&1 | tail -30",
  "description": "Run ESLint check",
  "timeout": 120000
}
The lint errors in AI Engine are pre-existing and not related to the documentation changes. Let me verify the documentation files exist and are correctly formatted:

🔧 Tool: Bash
Input: {
  "command": "ls -la /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/*.md && wc -l /Users/piteer/workspace/radca-prawny/legal/apps/ai-engine/*.md",
  "description": "List AI Engine markdown files"
}

🔧 Tool: Bash
Input: {
  "command": "grep -n \"^#\" /Users/piteer/workspace/radca-prawny/legal/.claude/CLAUDE.md | tail -20",
  "description": "Verify CLAUDE.md headers"
}
All documentation files are in place. Let me verify the AI Engine section was added to CLAUDE.md:

🔧 Tool: Bash
Input: {
  "command": "grep -n \"^## AI Engine\" /Users/piteer/workspace/radca-prawny/legal/.claude/CLAUDE.md",
  "description": "Verify AI Engine section in CLAUDE.md"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring AI Engine codebase structure",
      "content": "Explore AI Engine codebase structure and architecture",
      "status": "completed"
    },
    {
      "activeForm": "Understanding PydanticAI agent patterns",
      "content": "Understand PydanticAI agent patterns",
      "status": "completed"
    },
    {
      "activeForm": "Understanding LangGraph workflow patterns",
      "content": "Understand LangGraph workflow patterns",
      "status": "completed"
    },
    {
      "activeForm": "Reviewing Langfuse observability setup",
      "content": "Review Langfuse observability setup",
      "status": "completed"
    },
    {
      "activeForm": "Reviewing clarification flow design",
      "content": "Review clarification flow design",
      "status": "completed"
    },
    {
      "activeForm": "Reading existing CLAUDE.md and documentation",
      "content": "Read existing CLAUDE.md to understand what to update",
      "status": "completed"
    },
    {
      "activeForm": "Updating CLAUDE.md with AI Engine section",
      "content": "Update CLAUDE.md with AI Engine documentation",
      "status": "completed"
    },
    {
      "activeForm": "Updating AI Engine README.md",
      "content": "Update AI Engine README.md with new architecture",
      "status": "completed"
    },
    {
      "activeForm": "Creating AI_ENGINE_ARCHITECTURE.md",
      "content": "Create comprehensive AI Engine architecture documentation",
      "status": "completed"
    },
    {
      "activeForm": "Verifying documentation completeness",
      "content": "Verify all documentation is complete and consistent",
      "status": "completed"
    }
  ]
}
<summary>
## Summary: AI Engine Documentation Update

### Changes Implemented

1. **Updated CLAUDE.md** (`.claude/CLAUDE.md`)
   - Added comprehensive "AI Engine" section (lines 299-666)
   - Documented PydanticAI agent patterns with code examples
   - Documented LangGraph workflow patterns
   - Documented clarification flow design
   - Documented Langfuse observability setup and trace interpretation
   - Added migration guide from LangChain to PydanticAI
   - Documented environment variables (LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, OPENAI_API_KEY)
   - Documented testing strategies for AI components

2. **Updated AI Engine README.md** (`apps/ai-engine/README.md`)
   - Completely rewrote with new architecture overview
   - Added ASCII architecture diagram
   - Documented all technology stack components
   - Added environment configuration guide
   - Added API endpoint documentation
   - Added development guides for creating agents and workflows
   - Added Langfuse tracing patterns
   - Added testing documentation

3. **Created ARCHITECTURE.md** (`apps/ai-engine/ARCHITECTURE.md`)
   - Comprehensive 728-line architecture document
   - Detailed architecture layers with diagrams
   - PydanticAI agent patterns (4 patterns with examples)
   - LangGraph workflow patterns (5 patterns with examples)
   - Clarification flow design with decision logic
   - Observability strategy including PII redaction
   - Data flow diagrams for simple Q&A and workflows
   - Migration guide from LangChain and direct OpenAI

### Files Modified

| File | Lines | Purpose |
|------|-------|---------|
| `.claude/CLAUDE.md` | +368 lines | Main project documentation with AI Engine section |
| `apps/ai-engine/README.md` | +394 lines | AI Engine overview and quick start |
| `apps/ai-engine/ARCHITECTURE.md` | +728 lines | Deep-dive architecture documentation |

### Documentation Topics Covered

1. **PydanticAI Agent Patterns**
   - Lazy-loading pattern for agents
   - Multi-mode agents (LAWYER/SIMPLE)
   - Agent with tools
   - Workflow function pattern

2. **LangGraph Workflow Patterns**
   - State schema definition with TypedDict
   - Node function pattern
   - Conditional edge routing
   - Workflow compilation with @lru_cache
   - Workflow execution

3. **Langfuse Observability**
   - Setup and credentials
   - Trace structure interpretation
   - PII redaction for Polish personal data
   - Distributed tracing headers
   - Dashboard usage

4. **Clarification Flow Design**
   - Decision logic (confidence thresholds)
   - Question generation
   - UX integration patterns

5. **Migration Guide**
   - From LangChain to PydanticAI
   - From direct OpenAI to PydanticAI
   - Side-by-side code comparisons

6. **Environment Variables**
   - OPENAI_API_KEY, OPENAI_MODEL, OPENAI_EMBEDDING_MODEL
   - LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY
   - LANGFUSE_ENABLED, LANGFUSE_SAMPLING_RATE
   - AI_ENGINE_PORT, BACKEND_URL

7. **Testing Strategies**
   - Test locations (unit/integration)
   - Test configuration with mock data
   - Model validation tests
   - State creation tests
   - Conditional edge routing tests

### Notes for Developer

- The documentation follows the existing project's English-first policy
- All code examples use proper type hints
- ASCII diagrams are used for architecture visualization
- Documentation is structured for easy navigation with headers
- The AI Engine section in CLAUDE.md integrates seamlessly with existing documentation sections
</summary>