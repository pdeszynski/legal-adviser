# Legal AI Platform - Claude Instructions

## Core Principles

- **DDD**: Software model must reflect the legal business domain
- **Modular Monolith**: Strict boundaries between modules in `apps/backend/src/modules`. No direct imports across modules. Use events for cross-module communication
- **English-First**: All code, comments, and commit messages in English
- **Strong Typing**: No `any` (TS) or untyped `Dict`/`Any` (Python)
- **Simplicity**: YAGNI. Avoid over-engineering

## Tech Stack

- **Web**: Next.js, refine.dev, Tailwind CSS, shadcn/ui
- **Backend**: Nest.js, `@ptc-org/nestjs-query`, GraphQL (Code-First), PostgreSQL
- **AI**: Python, FastAPI, PydanticAI, LangGraph
- **Package Managers**: `pnpm` (Node), `uv` (Python)

## Commands

```bash
# Full project
pnpm dev | build | lint | format

# Individual apps
pnpm dev:web | dev:backend
cd apps/ai-engine && uv run dev | uv run pytest

# Tests
pnpm test | test:e2e | test:integration
cd apps/backend && jest
cd apps/web && npm test | playwright test
```

## Testing

**Locations:**
- Backend Unit: `apps/backend/src/modules/**/*.spec.ts`
- Backend E2E: `apps/backend/tests/e2e/*.e2e-spec.ts`
- Frontend Unit: `apps/web/src/**/*.spec.tsx` or `src/**/__tests__/**/*.spec.tsx`
- Frontend E2E: `apps/web/tests/*.spec.ts`
- AI Engine: `apps/ai-engine/tests/unit/*.py`

**Post-Feature Checklist:**
1. Codegen: `pnpm codegen` (after any GraphQL schema changes)
2. Lint: `eslint .`
3. Type check: `tsc --noEmit` / `cd apps/ai-engine && uv run mypy src/`
4. Unit tests: `jest` / `npm test` / `uv run pytest`
5. E2E tests: `npm run test:e2e` / `playwright test`

## Coding Guidelines

- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/)
- **API**: Service-to-Service = REST (OpenAPI), Frontend-Backend = GraphQL only
- **NestJS Query**: Auto-generated resolvers for CRUD, custom resolvers for business logic
- **SSOT**: Environment variables only for secrets/config

### refine.dev Custom Mutations

```tsx
const dp = dataProvider();
if (!dp) throw new Error('Data provider not available');
await (dp as any).custom<GraphQLMutationConfig<UpdateInputType>>({
  url: '',
  method: 'post',
  config: {
    mutation: { operation: 'mutationName', fields: ['id', 'field1'], variables: { input: {...} } }
  }
});
```

### TypeScript Input/Output Type Declaration Order

**Rule:** NestJS GraphQL decorators execute at class definition time. Types must be declared **before** they are referenced. Arrange classes in dependency order - leaf types first, composite types last.

```typescript
// ✅ CORRECT - Leaf type first
@InputType('AddressInput')
export class AddressInput {
  @Field(() => String) street: string;
}

@InputType('UserInput')
export class UserInput {
  @Field(() => AddressInput) address: AddressInput; // Already declared
}

// ❌ INCORRECT - References undeclared type
@InputType('UserInput')
export class UserInput {
  @Field(() => AddressInput) address: AddressInput; // ERROR
}
```

**Example:** `apps/backend/src/modules/chat/dto/chat-message.dto.ts`

### GraphQL Codegen Verification

**Rule:** After ANY GraphQL schema changes (queries, mutations, types), run codegen and verify frontend types match backend.

**Commands:**
```bash
pnpm codegen           # Generate types from backend schema
pnpm build             # Verify frontend builds with new types
pnpm typecheck         # Verify no TypeScript errors
```

**What Gets Generated:**
- `apps/web/src/generated/graphql.ts` - Full GraphQL types
- `apps/web/src/generated/introspection.json` - Schema introspection
- `apps/web/src/generated/persisted-queries/client.json` - Persisted queries

**Common Issues:**
| Issue | Cause | Fix |
|-------|-------|-----|
| Field not found | Backend type changed, codegen not run | Run `pnpm codegen` |
| Type mismatch | Frontend uses old type after backend change | Regenerate types, check imports |
| Mutation missing | Resolver not registered or not exported | Verify `@Resolver()` decorator, module exports |

**Gotcha:** Frontend builds succeed but types don't match runtime - always run codegen after schema changes

### GraphQL Field Resolver Decorators

**Rule:** Always use `@ResolveField`, never the deprecated `@ResolveProperty`.

```typescript
// ✅ CORRECT
@ResolveField('pdfUrl', () => String, { nullable: true })
async getPdfUrl(@Parent() document: LegalDocument): Promise<string | null> {
  return this.pdfUrlService.getDocumentPdfUrl(document.id);
}
```

**Example:** `apps/backend/src/modules/documents/pdf-url.resolver.ts`

## Database Seeding

**Location:** `apps/backend/src/seeds/data/`
**Command:** `cd apps/backend && pnpm seed`

**Test Users:**
| Email | Password | Role |
|-------|----------|------|
| `admin@refine.dev` | `password` | Super Admin |
| `lawyer@example.com` | `password123` | Lawyer |
| `user@example.com` | `password123` | Client |

**2FA Test Users:**
| Email | Secret |
|-------|--------|
| `user2fa@example.com` | `JBSWY3DPEHPK3PXP` |
| `admin2fa@example.com` | `KRSXG5DSQZKYQPZM` |

**Generate TOTP:** `cd apps/backend && npm run test:totp <secret>`

## RBAC

**Hierarchy:** `SUPER_ADMIN(5) > ADMIN(4) > LAWYER(3) > PARALEGAL(2) > CLIENT(1) > GUEST(0)`

**Backend Guards:**
```typescript
@UseGuards(GqlAuthGuard, RoleGuard)
@RequireRole(UserRole.ADMIN)
async adminQuery() { ... }

@UseGuards(GqlAuthGuard, AdminGuard)
async adminOnly() { ... }
```

**Frontend:** `const { hasRole, hasRoleLevel, isAdmin } = useUserRole();`

## GraphQL Authorization

**Guard Order:** `GqlAuthGuard` → `RoleGuard` → `DocumentPermissionGuard`

**Patterns:**
```typescript
// Authenticated only
@UseGuards(GqlAuthGuard)
export class MyResolver { ... }

// Admin only
@UseGuards(GqlAuthGuard, AdminGuard)
export class AdminResolver { ... }

// Role-based with hierarchy
@UseGuards(GqlAuthGuard, RoleGuard)
@RequireRole(UserRole.LAWYER)
export class ResourceResolver { ... }

// Public endpoint
@Public()
@Mutation(() => AuthResponse)
async login() { ... }
```

**Public Endpoints:** `auth` (login, register), `demo-request`, `hubspot`, `subscriptions` (catalog), `system-settings` (public), `documents` (legalRulingBySignature), `api-keys` (validate)

## Authentication Context

**Token:** Bearer in Authorization header

**Context Access:**
```typescript
@Context() context: { req: { user: { id: string; username: string; email: string; roles: string[] } } }
const userId = context.req.user?.id;
if (!userId) throw new UnauthorizedException('User not authenticated');
```

**Pitfalls:**
1. Missing `GqlAuthGuard` before `RoleGuard`
2. Wrong context type: use `{ req: { user } }` not `{ user }`
3. Forgetting null check: `context.req.user?.id`
4. Missing `@Public()` on login/register
5. Class-level guards don't work with `@Public()` - use method-level

## CSRF Protection

**Pattern:** Double-submit cookie. Frontend gets token from `GET /api/csrf-token`, includes in `X-CSRF-Token` header for mutations.

**Frontend:** `apps/web/src/lib/csrf.ts`
- `getCsrfToken()` - Get token from cookie/cache
- `fetchCsrfToken()` - Fetch new token
- `ensureCsrfToken()` - Ensure token exists
- `getCsrfHeaders()` - Get headers for mutations
- `clearCsrfToken()` - Clear on logout

**Usage:**
```tsx
const response = await fetch(GRAPHQL_URL, {
  headers: { Authorization: `Bearer ${token}`, ...getCsrfHeaders() },
  credentials: 'include',
});
```

**Backend:**
```typescript
// Most mutations require CSRF by default
@Mutation(() => MyResponse)
async myMutation() { ... }

// Skip CSRF for public mutations
@Mutation(() => AuthResponse)
@SkipCsrf()
async login() { ... }
```

**Constants:** Cookie: `csrf-token`, Header: `x-csrf-token`, Cache: 1 hour

## Two-Factor Authentication

**Features:** TOTP (RFC 6238), QR codes, 10 backup codes, admin override

**GraphQL API:**
```graphql
mutation EnableTwoFactorAuth { enableTwoFactorAuth { secret, qrCodeDataUrl, backupCodes } }
mutation VerifyTwoFactorSetup($input: VerifyTwoFactorSetupInput!) { verifyTwoFactorSetup(input: $input) { success } }
mutation DisableTwoFactorAuth($input: DisableTwoFactorInput!) { disableTwoFactorAuth(input: { password: "..." }) }
mutation RegenerateBackupCodes { regenerateBackupCodes { codes } }
mutation AdminForceDisableTwoFactor($input: AdminForceDisableTwoFactorInput!) { adminForceDisableTwoFactor(input: { userId: "..." }) { id twoFactorEnabled } }
query TwoFactorSettings { twoFactorSettings { status enabled remainingBackupCodes } }
```

**Rate Limit:** 5/minute, 10 failures = 30 min lockout

**Frontend:** `apps/web/src/components/settings/two-factor-setup.tsx`

## HubSpot Integration

**Location:** `apps/backend/src/modules/integrations/hubspot/`

**Env Vars:** `HUBSPOT_ENABLED`, `HUBSPOT_API_KEY`, `HUBSPOT_DEMO_REQUESTS_LIST_ID`, `HUBSPOT_WAITLIST_LIST_ID`, `HUBSPOT_DEAL_PIPELINE`, `HUBSPOT_DEAL_STAGE`, `HUBSPOT_WEBHOOK_SECRET`

**Lead Scoring:** Timeline (immediate: +50, 1mo: +40, 3mo: +20) + Company size (enterprise: +30, mid: +20, small: +10) + Details (use case: +15, company: +10, website: +5). 50+ points = Deal created.

**Required Contact Properties:** `use_case`, `timeline`, `company_size`, `message`

**Workflow Config:** See `apps/backend/src/modules/integrations/hubspot/HUBSPOT_WORKFLOWS.md`

## Temporal Schedules

**Schedules vs Workflows:** Schedules = recurring/time-based, Workflows = one-time/event-driven

**GraphQL API:** `describeSchedule`, `pauseSchedule`, `resumeSchedule`, `deleteSchedule`

**Backend Service:** `apps/backend/src/modules/temporal/temporal.service.ts`

**Cron Format:** `minute hour day month weekday` (e.g., `0 2 * * *` = daily 2 AM)

**Overlap Policies:** `SKIP` (default), `ALLOW_ALL`, `BUFFER_ONE`

**Env Vars:** `TEMPORAL_CLUSTER_URL`, `TEMPORAL_NAMESPACE`, `TEMPORAL_TASK_QUEUE`

## AI Engine

**Location:** `apps/ai-engine/`
**Purpose:** Python-based AI service for legal document generation, Q&A, and case analysis

**Tech:** FastAPI, PydanticAI, LangGraph, Langfuse, Python 3.11+, uv

**Commands:**
```bash
cd apps/ai-engine && uv run dev      # Hot reload
cd apps/ai-engine && uv run pytest    # Tests
cd apps/ai-engine && uv run mypy src/ # Type check
```

**Env Vars:**
```bash
# OpenAI (Required)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Service
AI_ENGINE_PORT=8000
AI_ENGINE_HOST=0.0.0.0
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# Langfuse (Optional)
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...
LANGFUSE_ENABLED=true
LANGFUSE_SAMPLING_RATE=1.0
LANGFUSE_SESSION_ID_HEADER=x-session-id
```

### CORS Configuration

**Location:** `apps/ai-engine/src/main.py`

**Configuration:** Allows origins from `FRONTEND_URL` + `http://localhost:3000`, credentials: true, methods: GET/POST/OPTIONS, headers: Authorization/Content-Type. CORS middleware added **before** routes.

**Test:** `curl -X OPTIONS http://localhost:8000/api/v1/qa/ask -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: POST" -v`

### Streaming Chat Architecture

**Overview:** Frontend → AI Engine (JWT auth) → SSE stream back to Frontend. Bypasses GraphQL for lower latency.

**JWT Token Claims:** `sub` (user UUID), `username`, `email`, `roles` (array), `type` (must NOT be "refresh" or "2fa-temp"), `exp`

**Validation:** HS256, `JWT_SECRET` shared with backend, requires `sub` + `email`, rejects refresh tokens

**Session ID Pattern:**
- Session IDs track conversations, stored in request body (not JWT)
- Validated as UUID v4 in AI Engine
- Frontend generates with `crypto.randomUUID()`, stores in localStorage
- Used in Langfuse traces for session grouping

**UUID v4 Format:** `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx` (e.g., `550e8400-e29b-41d4-a716-446655440000`)

**Frontend Hook:** `apps/web/src/hooks/useStreamingChat.ts`
```tsx
const { sendMessage, abortStream, isStreaming, currentContent } = useStreamingChat({
  onToken, onCitation, onStreamEnd, onStreamError, fallbackToGraphQL: true
});
```

### Streaming Endpoint: `/api/v1/qa/ask-stream`

**Unified endpoint** for questions and clarification answers

**Request:**
```json
{
  "question": "What are my rights?",
  "mode": "LAWYER",
  "session_id": "uuid-v4",
  "message_type": "QUESTION" | "CLARIFICATION_ANSWER",
  "clarification_answers": [{"question": "...", "question_type": "...", "answer": "..."}],
  "conversation_history": [...],
  "conversation_metadata": {...}
}
```

**Response:** Server-Sent Events (SSE)

**Event Types:**
| Type | Description |
|------|-------------|
| `token` | Streaming text chunks |
| `citation` | Legal citation (source, article, URL) |
| `clarification` | Follow-up questions needed |
| `error` | Error with code and message |
| `done` | Completion with metadata |

**Error Codes:** `MISSING_TOKEN`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `INVALID_TOKEN_TYPE`, `INCOMPLETE_AUTH`, `LLM_API_ERROR`, `RATE_LIMIT_EXCEEDED`, `INVALID_SESSION_ID`

### PydanticAI Agent Patterns

**Lazy Loading Pattern:**
```python
_my_agent: Agent[MyResult, ModelDeps] | None = None

def get_my_agent() -> Agent[MyResult, ModelDeps]:
    global _my_agent
    if _my_agent is None:
        settings = get_settings()
        _my_agent = Agent(f"openai:{settings.OPENAI_MODEL}", system_prompt="...", deps_type=ModelDeps, output_type=MyResult)
    return _my_agent
```

**ModelDeps:** All agents use `ModelDeps` for consistent access to settings and OpenAI client

**Agents:**
- `legal-query-analyzer` - Query analysis and routing (`src/agents/qa_agent.py`)
- `legal-qa-lawyer` - Professional legal Q&A (`src/agents/qa_agent.py`)
- `legal-qa-simple` - Simplified Q&A (`src/agents/qa_agent.py`)
- `legal-classifier` - Case classification (`src/agents/classifier_agent.py`)
- `legal-clarification` - Clarification questions (`src/agents/clarification_agent.py`)

### LangGraph Workflow Patterns

**Purpose:** Orchestration between PydanticAI agents (not for direct LLM calls)

**Structure:**
```python
class MyWorkflowState(TypedDict, total=False):
    input: Required[str]
    intermediate_result: str | None
    final_output: str | None
    metadata: dict[str, Any]

def create_workflow() -> StateGraph:
    workflow = StateGraph(MyWorkflowState)
    workflow.add_node("step1", step1_function)
    workflow.add_edge("step1", "step2")
    workflow.set_entry_point("step1")
    return workflow.compile()
```

**Best Practices:** `TypedDict` with `total=False`, wrap nodes in try-catch, cache compiled workflows with `@lru_cache`, provide `create_*_state()` factory functions

**Workflows:**
- Case Analysis (`src/workflows/case_analysis_workflow.py`)
- Document Generation (`src/workflows/document_generation_workflow.py`)
- Complex Q&A (`src/workflows/complex_qa_workflow.py`)

### Clarification Flow Design

**Decision Logic:** Confidence < 0.6 → clarify, no grounds → clarify, pre-filled responses → skip

**Question Structure:**
```python
class ClarificationQuestion(BaseModel):
    question: str
    question_type: str  # timeline, parties, documents, amounts, jurisdiction
    options: list[str] | None
    hint: str | None
```

**UX:** Max 2-4 questions, clear next steps, context-aware

### Langfuse Observability

**Integration:** Official PydanticAI integration. `init_langfuse()` calls `Agent.instrument_all()` on startup. All agents with `instrument=True` auto-traced.

**Env Vars:** `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST` (default: https://cloud.langfuse.com), `LANGFUSE_ENABLED`, `LANGFUSE_SAMPLING_RATE`

**Trace Metadata:**
- **Input:** question, question_length, mode, query_type, document_type, language, model
- **Output:** answer_length, confidence, citations_count, grounds_count, processing_time_ms, time_to_first_token_ms, suggested_title
- **User/Session:** user_id (JWT sub), session_id (UUID v4), user_roles, user_role_level
- **Conversation:** message_count, conversation_history_length, is_first_message, query_category, locale

**Add Metadata:**
```python
from ..langfuse_init import is_langfuse_enabled, update_current_trace

if is_langfuse_enabled():
    update_current_trace(input=question, user_id=user_id, session_id=session_id, metadata={"workflow": "my_workflow"})
```

**Filtering in Langfuse UI:**
- User: `user_id = "<uuid>"`
- Session: `session_id = "<uuid>"`
- Agent: `agent_name = "legal-qa-lawyer"`
- Metadata: `metadata.mode = "LAWYER"`
- High latency: `latency_ms > 5000`

**PII Redaction:** Email, phone (+48), PESEL (11 digits), NIP (10 digits), credit card (13-19 digits), Polish names

**Data Retention:** Production: 90 days, Dev: 30 days, Errors: 180 days

**Debugging User Issues:**
1. Get `userId` and `sessionId` from frontend
2. Filter traces in Langfuse by `user_id`
3. Check trace status, input/output, latency breakdown, error messages
4. Verify metadata populated correctly

**Common Issues:**
- Empty response → Check `latency_ms` > 30000
- Wrong language → Check `language` metadata
- No citations → Look for `search` span errors
- High latency → Compare traces, check `model` field
- Clarification loop → Check `confidence < 0.6`

**Troubleshooting:**
- No traces: Verify env vars, `LANGFUSE_ENABLED=true`, check logs for "PydanticAI instrumentation enabled"
- Missing agents: Ensure `instrument=True`, `Agent.instrument_all()` called after `init_langfuse()`, use lazy loading
- Missing metadata: Check `update_current_trace()` called, keys are strings, values JSON-serializable

### API Endpoints

**Simple:** `POST /api/v1/qa`, `POST /api/v1/classify`, `POST /api/v1/documents/generate`

**RAG:** `POST /api/v1/qa/ask`, `POST /api/v1/qa/ask-rag`, `POST /api/v1/search/semantic`

**Workflows:** `POST /api/v1/workflows/case-analysis`, `POST /api/v1/workflows/document-generation`, `POST /api/v1/workflows/complex-qa`

**System:** `GET /health`, `GET /health/ready`, `GET /health/live`

### Testing (AI Engine)

**Type Checking:** `cd apps/ai-engine && uv run mypy src/`

**Common mypy Errors:**
| Error | Cause | Fix |
|-------|-------|-----|
| `no-any-return` | Missing return type on inner async function | Add `async def inner() -> ReturnType:` |
| Duplicate `disable_error_code` | Multiple `[[tool.mypy.overrides]]` | Merge into single section |
| Incompatible type | External library stubs incomplete | Use `# type: ignore` with comment |

**Test Locations:** Unit: `apps/ai-engine/tests/unit/*.py`, Integration: `apps/ai-engine/tests/integration/*.py`

**Test Patterns:**
```python
# Model validation
def test_create_legal_ground():
    ground = LegalGround(name="Breach", confidence_score=0.85, legal_basis=["Art. 471 KC"])
    assert ground.confidence_score == 0.85

# State creation
def test_create_state():
    state = create_case_analysis_state(case_description="Test", session_id="test-123")
    assert state["metadata"]["current_step"] == "classify"
```

### Key Design Principles

1. **Lazy Loading**: Agents initialized on-demand to avoid startup failures
2. **Singleton Pattern**: Workflows cached with `@lru_cache`
3. **Error Resilience**: Each node handles errors gracefully
4. **Separation of Concerns**: PydanticAI for agents, LangGraph for orchestration
5. **Observability First**: Comprehensive tracing with Langfuse
6. **Type Safety**: Strong typing with Pydantic models and TypedDict
7. **Extensibility**: Easy to add new agents or workflow branches

### Backend Integration

```typescript
// apps/backend/src/modules/ai/ai-client.service.ts
@Injectable()
export class AiClientService {
  private readonly baseUrl = 'http://localhost:8000';
  async askQuestion(question: string, mode: 'LAWYER' | 'SIMPLE') {
    return this.httpService.post('/api/v1/qa/ask', { question, mode });
  }
}
```

### Migration from LangChain

| LangChain | PydanticAI |
|-----------|------------|
| `@chain` decorator | `Agent` class with `output_type` |
| `RunnableSequence` | LangGraph `StateGraph` |
| `BasePromptTemplate` | System prompt string |
| `StructuredOutput` | `output_type=BaseModel` |
| `bind_tools()` | Tool registration on Agent |
