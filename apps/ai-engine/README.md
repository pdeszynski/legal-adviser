# AI Engine

AI-powered legal assistance service built with FastAPI, PydanticAI, and LangGraph.

## Overview

This service provides AI capabilities for the Legal AI Platform, including:

- **Document Generation**: Generate legal documents from natural language descriptions
- **Legal Q&A**: Answer legal questions with citations
- **Case Law Search**: Search for relevant court rulings

## Technology Stack

- **FastAPI**: Modern Python web framework
- **PydanticAI**: Type-safe AI agent framework
- **LangGraph**: Workflow orchestration for complex AI tasks
- **Python 3.11+**: Modern Python with type hints

## Setup

### Prerequisites

- Python 3.11 or higher
- `uv` package manager (recommended)

### Installation

```bash
# Install dependencies using uv
uv sync

# Or using pip
pip install -e .
```

## Running the Service

### Development Mode

```bash
# Using uv
uv run uvicorn src.main:app --reload --port 8000

# Or using uvicorn directly
uvicorn src.main:app --reload --port 8000
```

The service will be available at:

- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Production Mode

```bash
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Testing

To run the tests, use the following command:

```bash
uv run pytest
```

This will run all unit tests located in the `tests/` directory.
Configuration is available in `pyproject.toml`.

## API Endpoints

### Health Check

- `GET /health` - Service health status

### Document Generation

- `POST /api/v1/documents/generate` - Initiate document generation
- `GET /api/v1/documents/status/{task_id}` - Check generation status

### Legal Q&A

- `POST /api/v1/qa/ask` - Ask a legal question

### Case Law Search

- `POST /api/v1/search/rulings` - Search for legal rulings

## OpenAPI Schema

Export the OpenAPI schema for client generation:

```bash
uv run python src/export_openapi.py
```

This creates `openapi.json` which can be used to generate TypeScript clients for the backend.

## Project Structure

```
src/
├── main.py              # FastAPI application
├── models/              # Pydantic models
│   ├── requests.py      # Request models
│   └── responses.py     # Response models
├── agents/              # PydanticAI agents
├── graphs/              # LangGraph workflows
├── prompts/             # AI prompts
└── export_openapi.py    # OpenAPI schema export script
```

## Environment Variables

Create a `.env` file in the ai-engine directory:

```env
# OpenAI API Key (or other LLM provider)
OPENAI_API_KEY=your_api_key_here

# Optional: Model configuration
OPENAI_MODEL=gpt-4
```

## Development

### Adding New Endpoints

1. Define request/response models in `src/models/`
2. Add endpoint to `src/main.py`
3. Implement AI logic in `src/agents/` or `src/graphs/`
4. Export updated OpenAPI schema

### Type Safety

All API endpoints use Pydantic models for request/response validation, ensuring type safety and automatic documentation.

## Integration with Backend

The NestJS backend communicates with this service via HTTP. The `AiClientService` in the backend provides typed methods for all endpoints.

## TODO

- [ ] Implement actual document generation with LangGraph
- [ ] Implement Q&A with RAG using PydanticAI
- [ ] Integrate with Polish legal database
- [ ] Add authentication/authorization
- [ ] Implement rate limiting
- [ ] Add monitoring and logging
