# AI Engine

AI-powered legal assistance service built with FastAPI, PydanticAI, and LangGraph.

## Overview

This service provides AI capabilities for the Legal AI Platform, including:

- **Document Generation**: Generate legal documents from natural language descriptions
- **Legal Q&A**: Answer legal questions with citations and context retrieval
- **Case Analysis**: Multi-step workflows for analyzing legal cases
- **Clarification Flow**: Interactive follow-up questions for incomplete queries

## Technology Stack

| Component       | Technology | Purpose                           |
| --------------- | ---------- | --------------------------------- |
| Web Framework   | FastAPI    | Modern async Python web framework |
| AI Agents       | PydanticAI | Type-safe AI agent framework      |
| Orchestration   | LangGraph  | Multi-agent workflow coordination |
| Observability   | Langfuse   | LLM tracing and monitoring        |
| Error Tracking  | Sentry     | Error correlation and reporting   |
| Package Manager | uv         | Fast Python dependency management |
| Python          | 3.11+      | Modern type-hinted Python         |

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           AI Engine Service                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐      ┌──────────────────────────────────────────┐ │
│  │   FastAPI    │      │         LangGraph Orchestrator           │ │
│  │  Endpoints   │──────│   (multi-agent workflow coordination)    │ │
│  └──────────────┘      └──────────────────────────────────────────┘ │
│         │                           │                               │
│         │         ┌─────────────────┼─────────────────┐             │
│         │         ▼                 ▼                 ▼             │
│         │  ┌──────────┐     ┌──────────┐     ┌──────────┐          │
│         └─→│   Q&A    │     │Classifier│     │ Drafting │          │
│            │  Agent   │     │  Agent   │     │  Agent   │          │
│            └──────────┘     └──────────┘     └──────────┘          │
│                   │                 │                 │             │
│                   └─────────────────┼─────────────────┘             │
│                                   ▼                               │
│                    ┌──────────────────────────┐                    │
│                    │      ModelDeps           │                    │
│                    │  (OpenAI, Settings)      │                    │
│                    └──────────────────────────┘                    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Observability Layer                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │  │
│  │  │   Langfuse   │  │    Sentry    │  │   Logging    │      │  │
│  │  │  (LLM Traces)│  │ (Error Track)│  │  (Structured)│      │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

## Setup

### Prerequisites

- Python 3.11 or higher
- `uv` package manager (recommended) or pip
- OpenAI API key

### Installation

```bash
# Using uv (recommended)
uv sync

# Or using pip
pip install -e .
```

### Environment Configuration

Create a `.env` file in the ai-engine directory:

```bash
# OpenAI Configuration (Required)
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Service Configuration
AI_ENGINE_PORT=8000
AI_ENGINE_HOST=0.0.0.0
BACKEND_URL=http://localhost:3001

# Langfuse Observability (Optional but recommended)
LANGFUSE_PUBLIC_KEY=pk-your-langfuse-public-key
LANGFUSE_SECRET_KEY=sk-your-langfuse-secret-key
LANGFUSE_ENABLED=true
LANGFUSE_SAMPLING_RATE=1.0
LANGFUSE_SESSION_ID_HEADER=x-session-id
```

### Getting Langfuse Credentials

1. Go to [Langfuse Cloud](https://cloud.langfuse.com)
2. Sign up or log in
3. Create a new project
4. Copy the Public Key and Secret Key from project settings

## Running the Service

### Development Mode (with Hot Reload)

```bash
# Using the dev script (recommended)
uv run dev

# Or using uvicorn directly
uv run uvicorn src.main:app --reload --port 8000 --log-level debug
```

The hot reload feature automatically restarts the server when Python source code changes:

- Monitors `src/` and `tests/` directories
- Graceful shutdown of in-flight requests
- ~1-2 second restart time

### Production Mode

```bash
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

The service will be available at:

- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
src/
├── main.py              # FastAPI application entry point
├── config.py            # Pydantic Settings for configuration
├── langfuse_init.py     # Langfuse observability setup
├── sentry_init.py       # Sentry error tracking setup
├── start_server.py      # Server startup script
├── agents/              # PydanticAI agents
│   ├── dependencies.py  # Dependency injection (ModelDeps)
│   ├── qa_agent.py      # Legal Q&A with RAG
│   ├── classifier_agent.py  # Case classification
│   ├── drafting_agent.py    # Document generation
│   ├── clarification_agent.py  # Follow-up questions
│   └── rag_tool.py      # RAG context retrieval
├── workflows/           # LangGraph workflow orchestration
│   ├── states.py        # TypedDict state schemas
│   ├── orchestration.py # WorkflowOrchestrator service
│   ├── case_analysis_workflow.py
│   ├── document_generation_workflow.py
│   └── complex_qa_workflow.py
├── models/              # Pydantic models
│   ├── requests.py      # Request DTOs
│   └── responses.py     # Response DTOs
└── services/            # Core services
    └── embeddings.py    # Embedding generation
```

## API Endpoints

### Health Endpoints

```
GET /health          # Service health with startup status
GET /health/ready    # Kubernetes readiness probe
GET /health/live     # Kubernetes liveness probe
```

### Simple Agent Endpoints

```
POST /api/v1/qa                 # Simple Q&A
POST /api/v1/classify           # Case classification
POST /api/v1/documents/generate # Document generation
```

### Enhanced RAG Endpoints

```
POST /api/v1/qa/ask          # Q&A with user context
POST /api/v1/qa/ask-rag      # RAG-based Q&A
POST /api/v1/search/semantic # Vector search
```

### Workflow Endpoints

```
POST /api/v1/workflows/case-analysis        # Multi-step case analysis
POST /api/v1/workflows/document-generation  # Document with revision
POST /api/v1/workflows/complex-qa           # Comprehensive Q&A
```

## Development Guides

### Creating a New PydanticAI Agent

```python
# src/agents/my_agent.py
from pydantic_ai import Agent
from pydantic import BaseModel
from .dependencies import ModelDeps, get_model_deps

class MyResult(BaseModel):
    answer: str
    confidence: float

# Lazy-loading pattern
_my_agent: Agent[MyResult, ModelDeps] | None = None

def get_my_agent() -> Agent[MyResult, ModelDeps]:
    global _my_agent
    if _my_agent is None:
        from ..config import get_settings
        settings = get_settings()
        _my_agent = Agent(
            f"openai:{settings.OPENAI_MODEL}",
            system_prompt="You are a helpful legal assistant.",
            deps_type=ModelDeps,
            output_type=MyResult,
        )
    return _my_agent

# Usage
async def my_function(question: str) -> dict:
    deps = get_model_deps()
    agent = get_my_agent()
    result = await agent.run(question, deps=deps)
    return result.data.model_dump()
```

### Creating a New LangGraph Workflow

```python
# src/workflows/my_workflow.py
from typing import Any, Required, TypedDict
from langgraph.graph import StateGraph

class MyWorkflowState(TypedDict, total=False):
    input: Required[str]
    intermediate: str | None
    output: str | None
    error: str | None

def step1(state: MyWorkflowState) -> MyWorkflowState:
    try:
        # Process step 1
        state["intermediate"] = "result"
    except Exception as e:
        state["error"] = str(e)
    return state

def step2(state: MyWorkflowState) -> MyWorkflowState:
    try:
        # Process step 2
        state["output"] = "final result"
    except Exception as e:
        state["error"] = str(e)
    return state

@lru_cache
def my_workflow() -> CompiledStateGraph:
    workflow = StateGraph(MyWorkflowState)
    workflow.add_node("step1", step1)
    workflow.add_node("step2", step2)
    workflow.add_edge("step1", "step2")
    workflow.set_entry_point("step1")
    workflow.set_finish_point("step2")
    return workflow.compile()
```

### Adding Langfuse Tracing

```python
from ..langfuse_init import get_langfuse, is_langfuse_enabled

async def my_traced_function(input: str, session_id: str):
    trace = None
    if is_langfuse_enabled():
        langfuse = get_langfuse()
        trace = langfuse.trace(
            name="my_operation",
            session_id=session_id,
        )

    try:
        # Your logic here
        result = "output"

        if trace:
            trace.end(output={"result": result})
        return result
    except Exception as e:
        if trace:
            trace.end(level="ERROR", status_message=str(e))
        raise
```

## Testing

### Running Tests

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov

# Run specific test file
uv run pytest tests/unit/test_workflows.py
```

### Test Configuration

Tests are configured in `pyproject.toml` and use mock data to avoid real API calls:

```python
# conftest.py sets test defaults
os.environ.setdefault("OPENAI_API_KEY", "test-key-for-pytest")
os.environ.setdefault("OPENAI_MODEL", "gpt-4-test")
```

### Writing Tests

```python
# tests/unit/test_my_agent.py
import pytest
from src.agents.my_agent import get_my_agent

@pytest.mark.asyncio
async def test_my_agent():
    agent = get_my_agent()
    result = await agent.run("Test input")
    assert result.data.answer
    assert 0 <= result.data.confidence <= 1
```

## Observability

### Langfuse Dashboard

Once configured, access the Langfuse dashboard at `https://cloud.langfuse.com`:

- **Traces**: Individual request executions with spans
- **Sessions**: Grouped requests by user session
- **Users**: Per-user analytics and error rates
- **Metrics**: Token usage, latency, costs

### PII Redaction

All traces automatically redact Polish personal data:

- Email addresses
- Phone numbers (Polish and international)
- PESEL numbers (Polish national ID)
- NIP numbers (Polish tax ID)
- Credit card numbers

### Sentry Integration

Errors are automatically correlated with Langfuse traces via `sentry-trace` header propagation.

## Integration with Backend

The NestJS backend communicates with this service via HTTP:

```typescript
// apps/backend/src/modules/ai/ai-client.service.ts
@Injectable()
export class AiClientService {
  private readonly baseUrl = 'http://localhost:8000';

  async askQuestion(question: string, mode: 'LAWYER' | 'SIMPLE') {
    return this.httpService.post('/api/v1/qa/ask', { question, mode });
  }

  async classifyCase(description: string) {
    return this.httpService.post('/api/v1/classify', { description });
  }
}
```

## Documentation

- **Langfuse Integration**: See [LANGFUSE.md](LANGFUSE.md)
- **Workflow Patterns**: See [WORKFLOWS.md](WORKFLOWS.md)
- **Main Project Docs**: See [CLAUDE.md](../../.claude/CLAUDE.md)
