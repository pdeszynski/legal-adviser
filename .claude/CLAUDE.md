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

## RBAC (Role-Based Access Control)

### Role Hierarchy

**Hierarchy:** `SUPER_ADMIN(5) > ADMIN(4) > LAWYER(3) > PARALEGAL(2) > CLIENT(1) > GUEST(0)`

Higher roles automatically inherit permissions from lower roles. For example, an ADMIN can access any route that requires CLIENT, PARALEGAL, or LAWYER permissions.

### Single Source of Truth

**User Entity** (`apps/backend/src/modules/users/entities/user.entity.ts`):

- Single `role` field (enum: `guest | client | paralegal | lawyer | admin | super_admin`)
- Default role: `CLIENT` for regular users
- This is the authoritative source for a user's role

**JWT Token Format**:

- `roles` array: Always contains one role from the User entity
- Example: `{ "sub": "uuid", "email": "...", "roles": ["admin"] }`

**Legacy Mapping** (for backwards compatibility):

- `user` → `CLIENT`
- `admin` → `ADMIN`

### Backend Guards

**Location:** `apps/backend/src/modules/auth/guards/`

**RoleGuard** - Role-based access with hierarchy:

```typescript
import { UseGuards } from '@nestjs/common';
import { UserRole, RoleMatchMode } from '../enums/user-role.enum';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { RoleGuard, RequireRole } from '../guards/role.guard';

// Single required role (ADMIN or higher)
@UseGuards(GqlAuthGuard, RoleGuard)
@RequireRole(UserRole.ADMIN)
async adminQuery() { ... }

// Multiple roles - user needs at least one (OR logic)
@UseGuards(GqlAuthGuard, RoleGuard)
@RequireRole(UserRole.ADMIN, UserRole.LAWYER)
async flexibleQuery() { ... }

// Multiple roles - user needs all (AND logic)
@UseGuards(GqlAuthGuard, RoleGuard)
@RequireRole(UserRole.ADMIN, UserRole.LAWYER, { mode: RoleMatchMode.ALL })
async requiresAllRoles() { ... }
```

**AdminGuard** - Admin-only access (ADMIN or SUPER_ADMIN):

```typescript
import { AdminGuard } from '../guards/admin.guard';

@UseGuards(GqlAuthGuard, AdminGuard)
async adminOnly() { ... }
```

**Role Access Pattern** (how guards read roles):

```typescript
// Guards handle both formats automatically:
// 1. user.roles (string[] from JWT) - checked first
// 2. user.role (string from User entity) - fallback

// The normalizeRole() function handles legacy mapping:
// - 'user' → UserRole.CLIENT
// - 'admin' → UserRole.ADMIN
```

### Frontend Role Checking

**Location:** `apps/web/src/hooks/use-user-role.tsx`

```typescript
import { useUserRole } from '@/hooks/use-user-role';

const {
  role, // Single role ( UserRole | null)
  roles, // Array for backwards compatibility (UserRole[])
  hasRole, // (role: UserRole | UserRole[]) => boolean
  hasRoleLevel, // (minRole: UserRole) => boolean
  isAdmin, // boolean (admin or super_admin)
  isSuperAdmin, // boolean
  isLegalProfessional, // boolean (paralegal, lawyer, admin, super_admin)
  isClient, // boolean (client or guest)
} = useUserRole();

// Examples:
if (isAdmin) {
  // Show admin content
}

if (hasRole('lawyer')) {
  // Show lawyer-specific content
}

if (hasRoleLevel('lawyer')) {
  // Show content for lawyer level and above (lawyer, admin, super_admin)
}

if (hasRole(['lawyer', 'admin'])) {
  // User has at least one of these roles
}
```

### Protected Routes

**Admin Layout:** `apps/web/src/app/admin/layout.tsx`
**Menu Filtering:** `apps/web/src/config/menu.config.tsx`

### Do NOT Revert to Old Pattern

**WARNING:** Never use the old multi-role pattern where users had multiple roles in the entity. The current implementation has:

- Single `role` field on User entity (enum)
- `roles` array only in JWT for token format compatibility
- Guards that handle both formats seamlessly

Reverting to the old pattern (multiple roles per user in entity) will break:

1. Role hierarchy logic
2. AdminGuard functionality
3. Frontend `useUserRole` hook
4. All existing role checks

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
mutation EnableTwoFactorAuth {
  enableTwoFactorAuth {
    secret
    qrCodeDataUrl
    backupCodes
  }
}
mutation VerifyTwoFactorSetup($input: VerifyTwoFactorSetupInput!) {
  verifyTwoFactorSetup(input: $input) {
    success
  }
}
mutation DisableTwoFactorAuth($input: DisableTwoFactorInput!) {
  disableTwoFactorAuth(input: { password: "..." })
}
mutation RegenerateBackupCodes {
  regenerateBackupCodes {
    codes
  }
}
mutation AdminForceDisableTwoFactor($input: AdminForceDisableTwoFactorInput!) {
  adminForceDisableTwoFactor(input: { userId: "..." }) {
    id
    twoFactorEnabled
  }
}
query TwoFactorSettings {
  twoFactorSettings {
    status
    enabled
    remainingBackupCodes
  }
}
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
  onToken,
  onCitation,
  onStreamEnd,
  onStreamError,
  fallbackToGraphQL: true,
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

| LangChain            | PydanticAI                       |
| -------------------- | -------------------------------- |
| `@chain` decorator   | `Agent` class with `output_type` |
| `RunnableSequence`   | LangGraph `StateGraph`           |
| `BasePromptTemplate` | System prompt string             |
| `StructuredOutput`   | `output_type=BaseModel`          |
| `bind_tools()`       | Tool registration on Agent       |

## Refine.dev Admin CRUD Patterns

### Overview

The admin panel uses Refine.dev as the primary framework. This section clarifies when to use standard Refine CRUD patterns vs custom implementations to prevent over-engineering.

**Key Principle:** Use standard Refine patterns for simple data operations. Reserve custom implementations for complex business logic that cannot be expressed with standard CRUD.

### Decision Matrix

| Use Case                       | Approach                                           | Example                                |
| ------------------------------ | -------------------------------------------------- | -------------------------------------- |
| **Simple CRUD Operations**     | Standard Refine (`useTable`, `useEdit`, `useForm`) | User management, settings, API keys    |
| **List/View with Filters**     | Standard Refine (`useTable`, `useList`)            | Document listings, audit logs          |
| **Complex Business Logic**     | Custom Implementation                              | Temporal workflows, approval workflows |
| **Analytics Aggregations**     | Custom Implementation (`useCustom`)                | Dashboard metrics, charts              |
| **Domain-Specific Operations** | Custom Mutations                                   | Bulk operations, role changes          |

### Standard CRUD Pattern (Preferred)

**Use for:** User management, audit logs, settings, API keys, document listings, subscription plans.

**Example - Simple List Page:**

```tsx
'use client';

import { useTable } from '@refinedev/react-table';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';

type Document = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
};

export default function AdminDocumentsPage() {
  const columns = useMemo<ColumnDef<Document>[]>(
    () => [
      { id: 'title', accessorKey: 'title', header: 'Title' },
      { id: 'status', accessorKey: 'status', header: 'Status' },
      { id: 'createdAt', accessorKey: 'createdAt', header: 'Created' },
    ],
    [],
  );

  const { reactTable } = useTable<Document>({
    columns,
    refineCoreProps: {
      resource: 'documents',
      pagination: { pageSize: 20 },
      sorters: { initial: [{ field: 'createdAt', order: 'desc' }] },
    },
  });

  return <table>{/* Render table using reactTable */}</table>;
}
```

**Example - Using useList for Data Fetching:**

```tsx
import { useList } from '@refinedev/core';

const { data, isLoading, refetch } = useList<User>({
  resource: 'users',
  pagination: { current: 1, pageSize: 10 },
  filters: [{ field: 'role', operator: 'eq', value: 'admin' }],
  sorters: [{ field: 'createdAt', order: 'desc' }],
});
```

**Reference:** https://refine.dev/core/docs/data/hooks/use-table/

### Custom Implementation Pattern

**Use for:** Analytics dashboards, temporal workflow management, approval workflows, bulk operations with complex logic.

**Example - Custom Query with useCustom:**

```tsx
import { useCustom } from '@refinedev/core';

const { data, isLoading } = useCustom<DashboardStats>({
  url: '/admin-dashboard',
  method: 'get',
  config: {
    query: {
      operation: 'adminDashboard',
      fields: ['totalUsers', 'activeSessions', 'documentCount'],
    },
  },
});
```

**Example - Custom Mutation:**

```tsx
import { useCustomMutation } from '@refinedev/core';
import { dataProvider } from '@providers/data-provider';

const mutation = useCustomMutation();

const handleBulkAction = async () => {
  mutation.mutate({
    url: '',
    method: 'post',
    config: {
      mutation: {
        operation: 'bulkSuspendUsers',
        fields: ['success', 'failed { id error }'],
        variables: { input: { userIds: ['1', '2'] } },
      },
    },
  });
};
```

**Reference:** https://refine.dev/core/docs/data/data-provider/

### Resource Configuration Patterns

The data provider (`apps/web/src/providers/data-provider/index.ts`) supports multiple resource types with GraphQL queries.

**Standard Resources (nestjs-query auto-generated):**

- `users` - User management
- `subscription_plans` - Subscription management

**Custom Resources (custom GraphQL queries):**

- `documents` - Legal documents
- `audit_logs` - Audit trail
- `notifications` - Notification history
- `legalRulings` - Legal rulings database
- `demoRequests` - Demo request management

**Adding a New Resource:**

1. **Backend:** Create nestjs-query resolver or custom resolver
2. **Frontend Data Provider:** Add `getList`, `getOne`, `create`, `update`, `deleteOne` methods
3. **Frontend Page:** Use standard Refine hooks (`useTable`, `useList`, `useShow`)

### NestJS-Query Integration

**Backend Entity Setup:**

```typescript
// apps/backend/src/modules/users/entities/user.entity.ts
@ObjectType('User')
@Resolver((of) => User)
export class User {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  email: string;

  @Field(() => UserRole)
  role: UserRole;
}

//nestjs-query automatically generates:
// - users: UserConnection!
// - user(id: ID!): User!
// - createOneUser(input: CreateUserInput!): User!
// - updateOneUser(id: ID!, input: UpdateUserInput!): User!
// - deleteOneUser(id: ID!): User!
```

**Frontend Data Provider Mapping:**

```typescript
// apps/web/src/providers/data-provider/index.ts
getList: async ({ resource, pagination, filters, sorters }) => {
  if (resource === 'users') {
    const query = `
      query GetUsers($filter: UserFilter, $paging: CursorPaging, $sorting: [UserSort!]) {
        users(filter: $filter, paging: $paging, sorting: $sorting) {
          totalCount
          edges { node { id email role } }
          pageInfo { endCursor }
        }
      }
    `;
    // Execute and return
  }
};
```

## NestJS-Query + Refine.dev Integration Guide

This section provides the complete pattern for integrating Refine.dev with nestjs-query auto-generated resolvers. Following this pattern ensures type-safe, efficient admin pages with minimal boilerplate.

### 1. Backend: Entity Decorator Setup

**Location:** `apps/backend/src/modules/{module}/entities/{entity}.entity.ts`

**Required Decorators:**

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { IDField, FilterableField, QueryOptions, Relation } from '@ptc-org/nestjs-query-graphql';

@Entity('users')
@ObjectType('User')
@QueryOptions({ enableTotalCount: true }) // Required for Connection totalCount
@Relation('sessions', () => UserSession, { nullable: true }) // Define relations
export class User {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @FilterableField() // Makes field filterable in GraphQL queries
  email: string;

  @Column({ type: 'boolean', default: true })
  @FilterableField()
  isActive: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true }) // Non-filterable field
  username: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  updatedAt: Date;
}
```

**Key Decorator Rules:**

| Decorator                                          | Purpose                                 | When to Use                    |
| -------------------------------------------------- | --------------------------------------- | ------------------------------ |
| `@IDField(() => ID)`                               | Primary key with GraphQL ID type        | All entity IDs                 |
| `@FilterableField()`                               | Enables filtering/sorting on this field | Fields you want to filter/sort |
| `@FilterableField(() => Type, { nullable: true })` | Nullable filterable field               | Optional fields                |
| `@Field(() => Type, { nullable: true })`           | Regular GraphQL field (no filter)       | Computed/read-only fields      |
| `@QueryOptions({ enableTotalCount: true })`        | Enables totalCount in Connection        | All entities                   |
| `@Relation()`                                      | Defines relationship to other entities  | OneToMany/ManyToOne            |

**JSON Field Handling:**

```typescript
import GraphQLJSON from 'graphql-type-json';

// Define a TypeScript interface for your JSON structure
export interface ChangeDetails {
  changedFields?: string[];
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

@Entity('audit_logs')
@ObjectType('AuditLog')
@QueryOptions({ enableTotalCount: true })
export class AuditLog {
  // ... other fields

  @Column({ type: 'jsonb', nullable: true })
  @Field(() => GraphQLJSON, { nullable: true })
  changeDetails: ChangeDetails | null;
}
```

### 2. Backend: Module Registration with QueryService

**Location:** `apps/backend/src/modules/{module}/{module}.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { User } from './entities/user.entity';
import { CreateUserInput, UpdateUserInput } from './dto';
import { UsersAdminResolver } from './users-admin.resolver';

@Module({
  imports: [
    // TypeORM repository for custom services
    TypeOrmModule.forFeature([User]),

    // nestjs-query for User entity - auto-generates CRUD with Connection format
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([User])],
      resolvers: [
        {
          DTOClass: User, // The entity class
          EntityClass: User, // Same as DTOClass for simple CRUD
          CreateDTOClass: CreateUserInput, // Custom create DTO
          UpdateDTOClass: UpdateUserInput, // Custom update DTO
          enableTotalCount: true, // Required for pagination
          enableAggregate: true, // Enable aggregate queries
          read: {
            many: { name: 'users' }, // GraphQL query name for list
            one: { name: 'user' }, // GraphQL query name for single
          },
          create: {
            one: { name: 'createOneUser' },
            many: { disabled: true }, // Disable bulk create
          },
          update: {
            one: { name: 'updateOneUser' },
            many: { disabled: true }, // Disable bulk update
          },
          delete: {
            one: { name: 'deleteOneUser' },
            many: { disabled: true }, // Disable bulk delete
          },
        },
      ],
    }),
  ],
  providers: [UsersAdminResolver], // Custom resolvers for business logic
  exports: [UsersService],
})
export class UsersModule {}
```

**Auto-Generated GraphQL Operations:**

```graphql
# Queries
users(filter: UserFilter, paging: CursorPaging, sorting: [UserSort!]): UserConnection!
user(id: ID!): User!

# Mutations
createOneUser(input: CreateOneUserInput!): User!
updateOneUser(input: UpdateOneUserInput!): User!
deleteOneUser(input: DeleteOneUserInput!): User!

# Types (auto-generated)
type UserConnection {
  totalCount: Int!
  edges: [UserEdge!]!
  pageInfo: PageInfo!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

input UserFilter {
  id: IDFilter
  email: StringFilter
  isActive: BooleanFilter
  # ... other fields
}

input UserSort {
  field: UserSortFields!
  direction: SortDirection!
}
```

### 3. Backend: Create/Update DTOs

**Location:** `apps/backend/src/modules/{module}/dto/`

```typescript
// create-user.dto.ts
import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}

// update-user.dto.ts
export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  isActive?: boolean;
}
```

### 4. Frontend: Data Provider Configuration

**Location:** `apps/web/src/providers/data-provider/index.ts`

The data provider maps Refine's data hooks to nestjs-query's GraphQL API with Connection-based pagination.

**Key Functions:**

```typescript
// 1. Build filter object from Refine filters
function buildGraphQLFilter(filters?: CrudFilters): Record<string, unknown> | undefined {
  if (!filters || filters.length === 0) return undefined;

  const filterObj: Record<string, unknown> = {};

  for (const filter of filters) {
    if ('field' in filter) {
      const { field, operator, value } = filter;

      switch (operator) {
        case 'eq':
          filterObj[field] = { eq: value };
          break;
        case 'ne':
          filterObj[field] = { neq: value };
          break;
        case 'contains':
          filterObj[field] = { iLike: `%${value}%` }; // Case-insensitive LIKE
          break;
        case 'gt':
          filterObj[field] = { gt: value };
          break;
        case 'gte':
          filterObj[field] = { gte: value };
          break;
        case 'lt':
          filterObj[field] = { lt: value };
          break;
        case 'lte':
          filterObj[field] = { lte: value };
          break;
        case 'in':
          filterObj[field] = { in: value };
          break;
      }
    }
  }

  return Object.keys(filterObj).length > 0 ? filterObj : undefined;
}

// 2. Build sorting object from Refine sorters
function buildGraphQLSorting(
  sorters?: CrudSorting,
): Array<{ field: string; direction: string }> | undefined {
  if (!sorters || sorters.length === 0) return undefined;

  return sorters.map((sorter) => ({
    field: sorter.field,
    direction: sorter.order === 'asc' ? 'ASC' : 'DESC',
  }));
}

// 3. Cursor cache for pagination (nestjs-query uses cursor-based pagination)
const cursorCache = new Map<string, CursorCacheEntry>();

function getCacheKey(resource: string, filters?: CrudFilters, sorters?: CrudSorting): string {
  const filterStr = filters ? JSON.stringify(filters) : 'none';
  const sorterStr = sorters ? JSON.stringify(sorters) : 'none';
  return `${resource}:${filterStr}:${sorterStr}`;
}

function storeCursor(key: string, pageNumber: number, endCursor: string, totalCount: number): void {
  let entry = cursorCache.get(key);
  if (!entry) {
    entry = { cursors: [], totalCount };
    cursorCache.set(key, entry);
  }
  entry.totalCount = totalCount;
  entry.cursors[pageNumber - 1] = endCursor;
}
```

**Complete getList Implementation:**

```typescript
getList: async <TData extends BaseRecord = BaseRecord>({
  resource,
  pagination,
  filters,
  sorters,
}) => {
  if (resource === 'users') {
    const query = `
      query GetUsers($filter: UserFilter, $paging: CursorPaging, $sorting: [UserSort!]) {
        users(filter: $filter, paging: $paging, sorting: $sorting) {
          totalCount
          edges {
            node {
              id
              email
              username
              firstName
              lastName
              isActive
              role
              createdAt
              updatedAt
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    `;

    const currentPage = pagination?.currentPage || 1;
    const pageSize = pagination?.pageSize || 10;

    // Build GraphQL parameters
    const graphqlFilter = buildGraphQLFilter(filters);
    const graphqlSorting = buildGraphQLSorting(sorters) || [
      { field: 'createdAt', direction: 'DESC' },
    ];

    // Build paging (cursor-based)
    const graphqlPaging = buildGraphQLPaging(pagination, resource, filters, sorters);

    // Execute query
    const data = await executeGraphQL<{
      users: {
        totalCount: number;
        edges: Array<{ node: TData }>;
        pageInfo: {
          hasNextPage: boolean;
          hasPreviousPage: boolean;
          startCursor: string;
          endCursor: string;
        };
      };
    }>(query, {
      filter: graphqlFilter || {},
      paging: graphqlPaging,
      sorting: graphqlSorting,
    });

    // Extract data from Connection format
    const items = data.users.edges.map((edge) => edge.node);

    // Store cursor for next page navigation
    const cacheKey = getCacheKey(resource, filters, sorters);
    storeCursor(cacheKey, currentPage, data.users.pageInfo.endCursor, data.users.totalCount);

    return {
      data: items,
      total: data.users.totalCount,
    };
  }

  throw new Error(`Unknown resource: ${resource}`);
};
```

### 5. Frontend: Page Component with useList

**Location:** `apps/web/src/app/admin/{resource}/page.tsx`

**Reference:** `apps/web/src/app/admin/users/page.tsx`

```tsx
'use client';

import { useList } from '@refinedev/core';
import { useState, useMemo } from 'react';
import type { User } from '@/generated/graphql';

export default function AdminUsersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Build filters from UI state
  const refineFilters = useMemo(() => {
    const filterList = [];

    if (filters.role && filters.role !== 'all') {
      filterList.push({ field: 'role', operator: 'eq', value: filters.role });
    }

    if (filters.status && filters.status !== 'all') {
      filterList.push({
        field: 'isActive',
        operator: 'eq',
        value: filters.status === 'active',
      });
    }

    if (filters.search) {
      filterList.push({ field: 'email', operator: 'contains', value: filters.search });
    }

    return filterList;
  }, [filters]);

  // Use Refine's useList hook
  const listResult = useList<User>({
    resource: 'users',
    pagination: {
      current: currentPage,
      pageSize,
    },
    filters: refineFilters.length > 0 ? refineFilters : undefined,
    sorters: [{ field: 'createdAt', order: 'desc' }],
  });

  const { data, isLoading, refetch } = listResult.query;
  const users = (listResult.result?.data as unknown as User[]) || [];
  const total = listResult.result?.total || 0;

  return (
    <div>
      {/* Render table with users */}
      <table>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.email}</td>
            <td>{user.role}</td>
          </tr>
        ))}
      </table>

      {/* Pagination */}
      <div>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>Page {currentPage}</span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))}
          disabled={currentPage >= Math.ceil(total / pageSize)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### 6. Frontend: Custom Mutations

For operations not auto-generated by nestjs-query (business logic mutations):

```tsx
import { dataProvider } from '@providers/data-provider';
import type { GraphQLMutationConfig } from '@providers/data-provider';

const handleBulkAction = async (userIds: string[]) => {
  const mutationConfig: GraphQLMutationConfig<{ userIds: string[] }> = {
    url: '',
    method: 'post',
    config: {
      mutation: {
        operation: 'bulkActivateUsers',
        fields: ['success', 'failed { id error }'],
        variables: {
          input: { userIds },
        },
      },
    },
  };

  try {
    await (dataProvider as any).custom(mutationConfig);
    refetch();
  } catch (error) {
    console.error('Failed to activate users:', error);
  }
};
```

### 7. Resource Name Mapping

**Data Provider to GraphQL Query Mapping:**

| Resource Name   | GraphQL Query    | Data Key         |
| --------------- | ---------------- | ---------------- |
| `users`         | `users`          | `users`          |
| `audit_logs`    | `auditLogs`      | `auditLogs`      |
| `documents`     | `legalDocuments` | `legalDocuments` |
| `legalRulings`  | `legalRulings`   | `legalRulings`   |
| `notifications` | `notifications`  | `notifications`  |
| `demoRequests`  | `demoRequests`   | `demoRequests`   |

**Note:** Some resources use camelCase conversion (`audit_logs` → `auditLogs`).

### 8. Common Pitfalls and Solutions

| Issue                               | Cause                                                         | Solution                                                |
| ----------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| **Missing totalCount**              | `@QueryOptions({ enableTotalCount: true })` not set on entity | Add decorator to entity                                 |
| **Filters not working**             | Field not decorated with `@FilterableField()`                 | Use `@FilterableField()` instead of `@Field()`          |
| **Cannot sort by field**            | Field not filterable                                          | Add `@FilterableField()` decorator                      |
| **Empty edges array**               | Cursor pagination misconfiguration                            | Check `buildGraphQLPaging` and cursor cache             |
| **Type errors after schema change** | Codegen not run                                               | Run `pnpm codegen`                                      |
| **Page navigation broken**          | Direct page jump without cursor cache                         | Implement `ensureCursorsCached` for sequential fetching |
| **JSON field errors**               | Using wrong GraphQL type                                      | Use `GraphQLJSON` for jsonb columns                     |
| **Wrong mutation format**           | nestjs-query expects `input: { id, ...fields }`               | Include id inside input object                          |
| **Relation fields null**            | `@Relation()` decorator missing                               | Add `@Relation()` to entity                             |
| **Filtering by nested field**       | Not supported by default nestjs-query                         | Use custom resolver or query                            |

### 9. Adding a New Admin Resource (Step-by-Step)

**Step 1: Create Entity** (`apps/backend/src/modules/{module}/entities/{entity}.entity.ts`)

```typescript
@Entity('resources')
@ObjectType('Resource')
@QueryOptions({ enableTotalCount: true })
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @FilterableField()
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  @Field(() => GraphQLJSON, { nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;
}
```

**Step 2: Create DTOs** (`apps/backend/src/modules/{module}/dto/`)

```typescript
export class CreateResourceDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
```

**Step 3: Register in Module** (`apps/backend/src/modules/{module}/{module}.module.ts`)

```typescript
NestjsQueryGraphQLModule.forFeature({
  imports: [NestjsQueryTypeOrmModule.forFeature([Resource])],
  resolvers: [
    {
      DTOClass: Resource,
      EntityClass: Resource,
      CreateDTOClass: CreateResourceDto,
      UpdateDTOClass: UpdateResourceDto,
      enableTotalCount: true,
      read: { many: { name: 'resources' }, one: { name: 'resource' } },
      create: { one: { name: 'createOneResource' }, many: { disabled: true } },
      update: { one: { name: 'updateOneResource' }, many: { disabled: true } },
      delete: { one: { name: 'deleteOneResource' }, many: { disabled: true } },
    },
  ],
});
```

**Step 4: Run Codegen** (from project root)

```bash
pnpm codegen
```

**Step 5: Add Data Provider Entry** (`apps/web/src/providers/data-provider/index.ts`)

```typescript
if (resource === 'resources') {
  const query = `
    query GetResources($filter: ResourceFilter, $paging: CursorPaging, $sorting: [ResourceSort!]) {
      resources(filter: $filter, paging: $paging, sorting: $sorting) {
        totalCount
        edges {
          node {
            id
            name
            metadata
            createdAt
            updatedAt
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  `;
  // ... implement same pattern as users
}
```

**Step 6: Create Page** (`apps/web/src/app/admin/resources/page.tsx`)

```tsx
'use client';
import { useList } from '@refinedev/core';
import type { Resource } from '@/generated/graphql';

export default function AdminResourcesPage() {
  const listResult = useList<Resource>({
    resource: 'resources',
    pagination: { current: 1, pageSize: 10 },
    sorters: [{ field: 'createdAt', order: 'desc' }],
  });

  // ... render
}
```

### 10. Reference Examples

- **Entity with all decorators:** `apps/backend/src/modules/users/entities/user.entity.ts`
- **Module registration:** `apps/backend/src/modules/users/users.module.ts`
- **DTOs:** `apps/backend/src/modules/users/dto/create-user.dto.ts`
- **Data provider:** `apps/web/src/providers/data-provider/index.ts`
- **Working page:** `apps/web/src/app/admin/users/page.tsx`
- **JSON fields:** `apps/backend/src/modules/audit-log/entities/audit-log.entity.ts`
- **Custom mutations:** `apps/backend/src/modules/users/users-admin.resolver.ts`

### 11. External References

- [nestjs-query Documentation](https://tripti.github.io/nestjs-query/)
- [Refine.dev Data Provider](https://refine.dev/docs/api-reference/core/providers/data-provider/)
- [GraphQL Cursor Connection Spec](https://relay.dev/graphql/connections.htm)

### Anti-Patterns to Avoid

**1. Custom Table When useTable Works:**

```tsx
// ❌ AVOID - Reinventing table functionality
const [users, setUsers] = useState([]);
const [page, setPage] = useState(1);
const [sort, setSort] = useState({ field, order });
// Manual pagination, sorting, filtering...

// ✅ PREFERRED - Use Refine's useTable
const { reactTable, refineCore } = useTable<User>({
  columns,
  refineCoreProps: { resource: 'users' },
});
```

**2. Manual State Management for Filters:**

```tsx
// ❌ AVOID - Complex filter state
const [filters, setFilters] = useState({ role: '', status: '' });
useEffect(() => {
  fetchData();
}, [filters]);

// ✅ PREFERRED - Let Refine manage filter state
const { setFilters } = useTable({
  refineCoreProps: {
    filters: { initial: [{ field: 'role', operator: 'eq', value: 'admin' }] },
  },
});
```

**3. Custom Mutations for Simple CRUD:**

```tsx
// ❌ AVOID - Manual GraphQL for simple update
const updateUser = async (id, data) => {
  await fetch('/graphql', {
    body: JSON.stringify({
      query: 'mutation UpdateUser($id: ID!, $input: UpdateUserInput!) { ... }',
    }),
  });
};

// ✅ PREFERRED - Use useUpdate hook
const { mutate } = useUpdate();
mutate({ resource: 'users', id, values: data });
```

### Common Admin Patterns

**Bulk Operations Pattern:**

```tsx
// For complex bulk operations with progress tracking
const handleBulkAction = async (userIds: string[], action: string) => {
  const mutationConfig: GraphQLMutationConfig<{ userIds: string[] }> = {
    url: '',
    method: 'post',
    config: {
      mutation: {
        operation: 'bulkActivateUsers',
        fields: ['success', 'failed { id error }'],
        variables: { input: { userIds } },
      },
    },
  };
  await (dataProvider as any).custom(mutationConfig);
};
```

**Export Pattern:**

```tsx
// Client-side CSV export for selected items
const exportToCSV = (items: User[]) => {
  const headers = ['Email', 'Role', 'Status'];
  const rows = items.map((u) => [u.email, u.role, u.isActive ? 'Active' : 'Suspended']);
  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  // Download blob
};
```

### Summary

- **Standard CRUD:** User management, audit logs, settings, API keys, document listings → Use `useTable`, `useList`, `useEdit`, `useForm`
- **Custom Logic:** Temporal workflows, analytics, approval workflows → Use `useCustom`, `useCustomMutation`
- **New Features:** Start with standard patterns, only customize when standard patterns don't fit
- **Documentation:** https://refine.dev/docs/
