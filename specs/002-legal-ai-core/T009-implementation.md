# T009 Implementation: Setup Basic AI Service API and Client Generation

## Overview

This task implements the foundational AI service infrastructure, enabling communication between the NestJS backend and the Python FastAPI AI Engine.

## What Was Implemented

### 1. AI Engine (FastAPI) - `/apps/ai-engine/`

#### API Endpoints

- `GET /health` - Health check endpoint
- `POST /api/v1/documents/generate` - Initiate document generation
- `GET /api/v1/documents/status/{task_id}` - Check document generation status
- `POST /api/v1/qa/ask` - Ask legal questions
- `POST /api/v1/search/rulings` - Search for legal rulings

#### Pydantic Models

Created type-safe request/response models in `src/models/`:

- **requests.py**: `GenerateDocumentRequest`, `AskQuestionRequest`, `SearchRulingsRequest`
- **responses.py**: `GenerateDocumentResponse`, `DocumentGenerationStatus`, `AnswerResponse`, `SearchRulingsResponse`, `Citation`, `Ruling`

#### Features

- Full OpenAPI/Swagger documentation at `/docs`
- CORS middleware for development
- Proper error handling with HTTPException
- Type-safe Pydantic validation
- Mock implementations (ready for real AI integration)

#### OpenAPI Schema Export

- Script: `src/export_openapi.py`
- Generates: `openapi.json` for TypeScript client generation

### 2. Backend AI Client Module - `/apps/backend/src/shared/ai-client/`

#### Files Created

- **ai-client.module.ts**: NestJS module with HttpModule integration
- **ai-client.service.ts**: Service with typed methods for all AI endpoints
- **ai-client.types.ts**: TypeScript type definitions mirroring Python models
- **ai-client.service.spec.ts**: Unit tests for the service

#### Service Methods

```typescript
- generateDocument(request): Promise<GenerateDocumentResponse>
- getDocumentStatus(taskId): Promise<DocumentGenerationStatus>
- askQuestion(request): Promise<AnswerResponse>
- searchRulings(request): Promise<SearchRulingsResponse>
- healthCheck(): Promise<{status: string}>
```

#### Integration

- Added `AiClientModule` to `app.module.ts`
- Configured with `@nestjs/axios` for HTTP communication
- Uses ConfigService for AI_ENGINE_URL configuration

### 3. Configuration Files

#### Environment Templates

- **apps/ai-engine/.env.example**: AI Engine configuration (OpenAI API key, etc.)
- **apps/backend/.env.example**: Updated with `AI_ENGINE_URL` configuration

#### Documentation

- **apps/ai-engine/README.md**: Comprehensive setup and usage guide

### 4. Dependencies Installed

#### Python (AI Engine)

- FastAPI, Uvicorn (web framework)
- Pydantic, PydanticAI (type safety and AI)
- LangGraph, LangChain (AI workflows)
- OpenAI (LLM integration)
- All installed via `uv sync`

#### TypeScript (Backend)

- `@nestjs/axios` - HTTP client
- `axios` - HTTP library

## How to Use

### Starting the AI Engine

```bash
cd apps/ai-engine

# Install dependencies (first time)
uv sync

# Start the service
uv run uvicorn src.main:app --reload --port 8000
```

Access at:

- API: http://localhost:8000
- Docs: http://localhost:8000/docs

### Using the AI Client in Backend

```typescript
import { AiClientService } from './shared/ai-client/ai-client.service';

@Injectable()
export class SomeService {
  constructor(private aiClient: AiClientService) {}

  async generateDoc() {
    const response = await this.aiClient.generateDocument({
      description: 'Create a debt recovery lawsuit',
      document_type: DocumentType.LAWSUIT,
      session_id: 'session-123',
    });

    // Check status
    const status = await this.aiClient.getDocumentStatus(response.task_id);
    return status.content;
  }
}
```

### Exporting OpenAPI Schema

```bash
cd apps/ai-engine
uv run python src/export_openapi.py
```

This generates `openapi.json` which can be used with tools like `openapi-typescript-codegen` to auto-generate TypeScript clients.

## Architecture Decisions

### 1. HTTP REST over gRPC

- **Reason**: Simpler for MVP, easier debugging, better tooling
- **Future**: Can migrate to gRPC for performance if needed

### 2. Manual Type Definitions (for now)

- **Current**: TypeScript types manually mirror Python Pydantic models
- **Future**: Auto-generate from OpenAPI schema using `openapi-typescript-codegen`

### 3. Mock Implementations

- **Current**: Endpoints return mock data
- **Next Steps**: Implement actual AI logic in subsequent tasks (T013-T019)

### 4. In-Memory Task Storage

- **Current**: Simple dict for demo
- **Future**: Replace with Redis or database for production

## Testing

### Backend Build

```bash
cd apps/backend
pnpm run build  # ✓ Successful
```

### AI Engine Health Check

```bash
curl http://localhost:8000/health
# {"status": "ok"}
```

### OpenAPI Schema Generation

```bash
cd apps/ai-engine
uv run python src/export_openapi.py
# ✓ Creates openapi.json with 604 lines
```

## Next Steps

This task provides the foundation for:

- **T013-T019**: User Story 1 (Document Generation) - Implement actual LangGraph workflows
- **T020-T024**: User Story 2 (Legal Q&A) - Implement RAG with PydanticAI
- **T025-T028**: User Story 3 (Case Law Search) - Integrate search service

## Files Modified/Created

### Created

- `apps/ai-engine/src/models/__init__.py`
- `apps/ai-engine/src/models/requests.py`
- `apps/ai-engine/src/models/responses.py`
- `apps/ai-engine/src/export_openapi.py`
- `apps/ai-engine/README.md`
- `apps/ai-engine/.env.example`
- `apps/ai-engine/openapi.json` (generated)
- `apps/backend/src/shared/index.ts`
- `apps/backend/src/shared/ai-client/ai-client.module.ts`
- `apps/backend/src/shared/ai-client/ai-client.service.ts`
- `apps/backend/src/shared/ai-client/ai-client.types.ts`
- `apps/backend/src/shared/ai-client/ai-client.service.spec.ts`

### Modified

- `apps/ai-engine/src/main.py` - Enhanced with full API endpoints
- `apps/backend/src/app.module.ts` - Added AiClientModule
- `apps/backend/.env.example` - Added AI_ENGINE_URL
- `apps/backend/package.json` - Added @nestjs/axios, axios

## Status

✅ **COMPLETE** - Basic AI Service API and Client Generation is fully functional and ready for integration.
