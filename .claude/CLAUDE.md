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

1. Lint: `eslint .`
2. Type check: `tsc --noEmit`
3. Unit tests: `jest` / `npm test` / `uv run pytest`
4. E2E tests: `npm run test:e2e` / `playwright test`

## Coding Guidelines

- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/)
- **API**: Service-to-Service = REST (OpenAPI), Frontend-Backend = GraphQL only
- **NestJS Query**: Auto-generated resolvers for CRUD, custom resolvers for business logic
- **SSOT**: Environment variables only for secrets/config

### refine.dev Custom Mutations

Use data provider's `custom` method directly (not `useCustom` hook):

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

## Database Seeding

**Location:** `apps/backend/src/seeds/data/`

```bash
cd apps/backend && pnpm seed
```

**Test Users:**
| Email | Password | Role |
|-------|----------|------|
| `admin@refine.dev` | `password` | Super Admin |
| `lawyer@example.com` | `password123` | Lawyer |
| `user@example.com` | `password123` | Client |

**2FA Test Users:**
| Email | Secret | Notes |
|-------|--------|-------|
| `user2fa@example.com` | `JBSWY3DPEHPK3PXP` | 2FA enabled |
| `admin2fa@example.com` | `KRSXG5DSQZKYQPZM` | Admin with 2FA |

**Generate TOTP Token:**

```bash
cd apps/backend && npm run test:totp JBSWY3DPEHPK3PXP
```

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

**Frontend Hook:**

```tsx
const { hasRole, hasRoleLevel, isAdmin } = useUserRole();
```

## GraphQL Authorization

**Guard Order:** `GqlAuthGuard` → `RoleGuard` → `DocumentPermissionGuard`

**Patterns:**

```typescript
// Authenticated only
@Resolver(() => MyEntity)
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

// Mixed public/protected (method-level guards)
@Resolver()
export class CatalogResolver {
  @Public()
  @Query(() => [CatalogEntity])
  async getCatalog() { ... }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => CatalogEntity)
  async purchaseItem() { ... }
}
```

**Public Endpoints:** `auth` (login, register), `demo-request`, `hubspot`, `subscriptions` (catalog), `system-settings` (public), `documents` (legalRulingBySignature), `api-keys` (validate)

## Authentication Context

**Token:** Bearer in Authorization header (`Authorization: Bearer <token>`)

**Context Access:**

```typescript
@Context() context: { req: { user: { id: string; username: string; email: string; roles: string[] } } }

const userId = context.req.user?.id;
if (!userId) throw new UnauthorizedException('User not authenticated');
```

**Common Pitfalls:**

1. Missing `GqlAuthGuard` before `RoleGuard`
2. Wrong context type: use `{ req: { user } }` not `{ user }`
3. Forgetting null check: `context.req.user?.id`
4. Missing `@Public()` on login/register
5. Class-level guards don't work with `@Public()` - use method-level

## Two-Factor Authentication

**Features:** TOTP (RFC 6238), QR codes, 10 backup codes, admin override

**Mutations:**

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
query TwoFactorSettings {
  twoFactorSettings {
    status
    enabled
    remainingBackupCodes
  }
}
```

**Admin:**

```graphql
mutation AdminForceDisableTwoFactor($input: AdminForceDisableTwoFactorInput!) {
  adminForceDisableTwoFactor(input: { userId: "..." }) {
    id
    twoFactorEnabled
  }
}
```

**Rate Limit:** 5/minute, 10 failures = 30 min lockout

**Frontend:** `apps/web/src/components/settings/two-factor-setup.tsx`

## HubSpot Integration

**Module:** `apps/backend/src/modules/integrations/hubspot/`

**Purpose:** Sync demo request leads to HubSpot CRM with automatic qualification scoring.

**Environment Variables:**

```bash
HUBSPOT_ENABLED=true
HUBSPOT_API_KEY=your-api-key
HUBSPOT_DEMO_REQUESTS_LIST_ID=123
HUBSPOT_WAITLIST_LIST_ID=456
HUBSPOT_DEAL_PIPELINE=default
HUBSPOT_DEAL_STAGE=appointmentscheduled
HUBSPOT_WEBHOOK_SECRET=your-webhook-secret
```

**Lead Qualification Scoring:**
| Criteria | Points |
|----------|--------|
| Immediate timeline | +50 |
| Within 1 month | +40 |
| Within 3 months | +20 |
| Enterprise (500+) | +30 |
| Mid-size (50-500) | +20 |
| Small/startup | +10 |
| Detailed use case | +15 |
| Company provided | +10 |
| Website provided | +5 |

**Qualified:** 50+ points → creates Deal in HubSpot

**Custom Contact Properties Required:**

- `use_case` (Single-line text)
- `timeline` (Dropdown: immediate, within_month, within_quarter, exploring)
- `company_size` (Single-line text)
- `message` (Multi-line text)

**GraphQL API:**

```graphql
mutation SubmitDemoRequest($input: DemoRequestInput!) {
  submitDemoRequest(input: $input) {
    success
    message
  }
}
```

**Workflow Configuration:** See `apps/backend/src/modules/integrations/hubspot/HUBSPOT_WORKFLOWS.md` for detailed HubSpot CRM workflow setup including:

- Automatic lead assignment by company size/geography
- Lead scoring rules and hot lead alerts
- Automated email sequences by segment
- Task creation for sales follow-up
- Lead nurturing workflows
- Calendly/HubSpot Meetings integration

## Temporal Schedules

**Schedules vs Workflows:** Schedules = recurring/time-based, Workflows = one-time/event-driven

**GraphQL API:**

```graphql
query DescribeSchedule($scheduleId: String!) {
  describeSchedule(scheduleId: $scheduleId) {
    scheduleId
    exists
    paused
    spec {
      cronExpression
    }
    nextRunAt
  }
}
mutation PauseSchedule($input: PauseScheduleInput!) {
  pauseSchedule(input: { scheduleId: "...", reason: "..." })
}
mutation ResumeSchedule($input: ResumeScheduleInput!) {
  resumeSchedule(input: { scheduleId: "...", reason: "..." })
}
mutation DeleteSchedule($input: DeleteScheduleInput!) {
  deleteSchedule(input: { scheduleId: "...", confirm: true })
}
```

**Backend Service:** `apps/backend/src/modules/temporal/temporal.service.ts`

```typescript
await temporalService.createSchedule({
  scheduleId: 'data-sync-nightly',
  action: {
    type: 'startWorkflow',
    workflowType: 'dataSyncWorkflow',
    workflowId: 'data-sync-${Date.now()}',
    taskQueue: 'legal-ai-task-queue',
    args: [{ source: 'external-api', batchSize: 100 }],
  },
  spec: {
    cronExpressions: [{ expression: '0 2 * * *' }], // Daily at 2 AM
    timezone: 'Europe/Warsaw',
  },
  policies: {
    overlap: 'SKIP', // Skip if previous run hasn't finished
    catchupWindow: '1 day',
  },
});
```

**Cron Format:** `minute hour day month weekday` (e.g., `0 2 * * *` = daily 2 AM, `0 3 * * 0` = Sunday 3 AM)

**Overlap Policies:** `SKIP` (default), `ALLOW_ALL`, `BUFFER_ONE`

**Env Vars:** `TEMPORAL_CLUSTER_URL`, `TEMPORAL_NAMESPACE`, `TEMPORAL_TASK_QUEUE`

**Scheduler Example:** `apps/backend/src/modules/temporal/workflows/billing/ruling-scheduler.service.ts`

## AI Engine

**Location:** `apps/ai-engine/`

**Purpose:** Python-based AI service for legal document generation, Q&A, and case analysis.

### Technology Stack

- **FastAPI**: Modern Python web framework
- **PydanticAI**: Type-safe AI agent framework (replaces LangChain)
- **LangGraph**: Workflow orchestration for multi-agent scenarios
- **Langfuse**: Observability and tracing
- **Python 3.11+**: Modern Python with type hints
- **uv**: Fast Python package manager

### Commands

```bash
# Development (with hot reload)
cd apps/ai-engine && uv run dev

# Testing
cd apps/ai-engine && uv run pytest

# Type checking
cd apps/ai-engine && uv run mypy src/
```

### Environment Variables

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

# Langfuse Observability (Optional but recommended)
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...
LANGFUSE_ENABLED=true
LANGFUSE_SAMPLING_RATE=1.0
LANGFUSE_SESSION_ID_HEADER=x-session-id
```

### CORS Configuration

**Location:** `apps/ai-engine/src/main.py`

**Purpose:** Allow direct frontend requests to AI Engine with proper authorization headers.

**Environment Variables:**

```bash
FRONTEND_URL=http://localhost:3000  # Frontend origin (default: http://localhost:3000)
```

**Configuration:**

The CORS middleware is configured to:

- Allow origins from `FRONTEND_URL` environment variable plus `http://localhost:3000` for local development
- Allow credentials (`true`) for Authorization cookies/headers
- Allow methods: `GET`, `POST`, `OPTIONS` (explicitly defined)
- Allow headers: `Authorization`, `Content-Type` (explicitly defined)
- Handle preflight OPTIONS requests automatically

**CORS middleware is added before route definitions** to ensure all endpoints are protected.

**Verification:**

```bash
# Test CORS with curl (preflight request)
curl -X OPTIONS http://localhost:8000/api/v1/qa/ask \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization,Content-Type" \
  -v

# Check response headers for:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Credentials: true
# Access-Control-Allow-Methods: GET, POST, OPTIONS
# Access-Control-Allow-Headers: Authorization, Content-Type
```

**Browser DevTools Verification:**

1. Open Network tab in DevTools
2. Make a request from frontend to AI Engine
3. Check that `Authorization` header is sent in request
4. Verify response contains proper CORS headers
5. No CORS errors should appear in console

### Streaming Chat Architecture

**Overview:** Frontend communicates directly with AI Engine for real-time streaming responses, bypassing the GraphQL layer for improved latency and user experience.

#### Architecture Diagram

```
┌─────────────┐         JWT          ┌─────────────┐         SSE          ┌─────────────┐
│   Frontend  │ ────────────────────▶│  AI Engine  │ ────────────────────▶│   Frontend  │
│  (Next.js)  │   Authorization:     │  (FastAPI)  │   text/event-stream  │  (SSE Client)│
│             │      Bearer <token>   │             │                     │             │
└─────────────┘                      └─────────────┘                     └─────────────┘
       │                                         │
       │                                         │
       ▼                                         ▼
┌─────────────┐                         ┌─────────────┐
│   Backend   │◄────────────────────────│  AI Engine  │
│  (NestJS)   │     User Context        │  (FastAPI)  │
│             │      Validation          │             │
└─────────────┘                         └─────────────┘
```

#### JWT Token Format

The frontend includes JWT tokens from the backend in AI Engine requests:

**Token Claims:**
```json
{
  "sub": "user-uuid",           // User ID
  "username": "johndoe",        // Username
  "email": "user@example.com",  // Email
  "roles": ["LAWYER"],          // User roles
  "type": "access",             // Token type (must NOT be "refresh" or "2fa-temp")
  "exp": 1234567890             // Expiration timestamp
}
```

**Validation in AI Engine:**
- Algorithm: HS256
- Secret: `JWT_SECRET` environment variable (shared with backend)
- Required claims: `sub`, `email`
- Token type validation: Rejects `refresh` and `2fa-temp` tokens

#### Streaming Endpoint: `/api/v1/qa/ask-stream`

**Request:**
```bash
POST /api/v1/qa/ask-stream
Authorization: Bearer <jwt_token>

# Query parameters:
question=What are my rights?
mode=LAWYER|SIMPLE
session_id=uuid-v4
```

**Response Format:** Server-Sent Events (SSE)

```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

#### SSE Event Types

| Event Type | Structure | Description |
|------------|-----------|-------------|
| `token` | Partial response content | Streaming text chunks |
| `citation` | Legal citation reference | Source, article, URL |
| `clarification` | Follow-up questions needed | Questions array |
| `error` | Error information | Error message and code |
| `done` | Final completion | Metadata and stats |

**Event Format Examples:**

```javascript
// Token event (streaming content)
data: {"type":"token","content":"Based on Polish labor law","metadata":{}}

// Citation event
data: {"type":"citation","content":"","metadata":{"source":"Labour Code","article":"Art. 94 § 1","url":"https://isap.sejm.gov.pl/..."}}

// Clarification event (follow-up questions needed)
data: {"type":"token","content":"{\"type\":\"clarification\",\"questions\":[\"When did the employment end?\"],\"context_summary\":\"More details needed\",\"next_steps\":\"Please answer\"}","metadata":{}}

// Error event
data: {"type":"error","content":"","metadata":{"error":"OpenAI API error","error_code":"LLM_API_ERROR"}}

// Done event (completion)
data: {"type":"done","content":"","metadata":{"citations":[...],"confidence":0.87,"processing_time_ms":1234,"query_type":"EMPLOYMENT_LAW","key_terms":["notice period","severance"]}}
```

#### Frontend Integration: `useStreamingChat` Hook

**Location:** `apps/web/src/hooks/useStreamingChat.ts`

```tsx
import { useStreamingChat } from '@/hooks/useStreamingChat';

function ChatInterface() {
  const { sendMessage, isStreaming, abortStream, currentContent } = useStreamingChat({
    onToken: (token) => console.log('Received token:', token),
    onCitation: (citation) => console.log('Citation:', citation),
    onStreamEnd: (response) => console.log('Complete:', response),
    onStreamError: (error) => console.error('Error:', error),
  });

  const handleSend = async () => {
    const response = await sendMessage(
      'What are my rights as an employee?',
      'LAWYER'
    );
    console.log('Final response:', response);
  };

  return (
    <div>
      <p>{currentContent}</p>
      <button onClick={handleSend} disabled={isStreaming}>
        Send
      </button>
      {isStreaming && <button onClick={abortStream}>Stop</button>}
    </div>
  );
}
```

**Hook Return Values:**
- `sendMessage(question, mode, sessionId?)` - Send a streaming request
- `abortStream()` - Cancel the current stream
- `isStreaming` - Whether a stream is active
- `error` - Current error message
- `currentContent` - Accumulated response during streaming
- `currentCitations` - Citations received so far

**Hook Options:**
- `enabled` - Enable/disable streaming (default: `true`)
- `fallbackToGraphQL` - Fallback to GraphQL on error (default: `true`)
- `onStreamStart` - Callback when stream starts
- `onToken` - Callback for each token received
- `onCitation` - Callback when citation is received
- `onStreamEnd` - Callback when stream completes
- `onStreamError` - Callback on error

#### Error Handling and Retry Strategies

**Automatic Fallback:**

If streaming fails, the hook automatically falls back to GraphQL mutation:

```tsx
const { sendMessage } = useStreamingChat({
  fallbackToGraphQL: true,  // Default behavior
  onStreamError: (error) => {
    // User sees: "Falling back to GraphQL: <error>"
  },
});
```

**Common Error Codes:**

| Error Code | Description | Retry Strategy |
|------------|-------------|----------------|
| `MISSING_TOKEN` | No Authorization header | Prompt user to login |
| `INVALID_TOKEN` | Token validation failed | Refresh token or re-login |
| `TOKEN_EXPIRED` | Token expired | Refresh token |
| `INVALID_TOKEN_TYPE` | Refresh token used for API | Use access token instead |
| `INCOMPLETE_AUTH` | 2FA not completed | Complete 2FA flow |
| `LLM_API_ERROR` | OpenAI API error | Retry with backoff |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |

**Manual Error Handling:**

```tsx
const { sendMessage } = useStreamingChat({
  fallbackToGraphQL: false,  // Disable auto-fallback
  onStreamError: async (error) => {
    if (error.includes('TOKEN_EXPIRED')) {
      // Trigger token refresh
      await refreshToken();
      // Retry the request
    }
  },
});
```

#### CORS and Security Configuration

**CORS Setup in AI Engine:**

```python
# apps/ai-engine/src/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
```

**Security Considerations:**

1. **JWT Secret:** Must match backend's `JWT_SECRET` exactly
2. **Token Type Validation:** AI Engine rejects refresh tokens
3. **CORS Origins:** Only allow frontend domains
4. **HTTPS:** Required in production for token security
5. **Session Management:** Use persistent session IDs for conversation context

#### Monitoring and Debugging

**Health Checks:**

```bash
# Check AI Engine health
curl http://localhost:8000/health

# Check JWT validation health
curl http://localhost:8000/health/jwt
```

**SSE Testing with curl:**

```bash
curl -N -X POST "http://localhost:8000/api/v1/qa/ask-stream?question=Test&mode=SIMPLE&session_id=test-123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Browser DevTools:**

1. Network tab → Filter by "event-stream" or "ask-stream"
2. Check Headers: `Content-Type: text/event-stream`
3. Check Messages tab for SSE events
4. Look for `Authorization: Bearer <token>` in request headers

**Langfuse Observability:**

Streaming requests are automatically traced in Langfuse with:
- `streaming: true` flag
- Token count and processing time
- User ID and session ID from JWT

#### Migration Guide: GraphQL to Streaming

**Before (GraphQL Mutation):**

```tsx
const { data } = await graphqlClient.mutation({
  operation: 'askLegalQuestion',
  variables: {
    input: { question: '...', mode: 'LAWYER' }
  }
});
// Wait for complete response...
const answer = data.askLegalQuestion.answerMarkdown;
```

**After (Streaming):**

```tsx
const { sendMessage } = useStreamingChat();
const response = await sendMessage('...', 'LAWYER');
// Content streams in real-time via onToken callback
const answer = response.content;
```

**Key Differences:**

| Aspect | GraphQL | Streaming |
|--------|---------|-----------|
| Latency | Full generation time | First token ~100ms |
| UX | Loading spinner | Progressive text |
| Abort | Not supported | Built-in |
| Citations | At end only | As received |
| Fallback | N/A | Automatic |

#### Troubleshooting

**CORS Errors:**

```
Error: Access to fetch at 'http://localhost:8000/api/v1/qa/ask-stream'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions:**
1. Verify `FRONTEND_URL` matches exactly (no trailing slash)
2. Check CORS middleware is added before routes
3. Ensure `allow_credentials=True` is set
4. Verify `Authorization` is in `allow_headers`

**Token Validation Failures:**

```
401 Unauthorized: {"error_code":"MISSING_TOKEN","message":"Authorization header required"}
```

**Solutions:**
1. Check `getAccessToken()` returns a valid token
2. Verify header format: `Authorization: Bearer <token>`
3. Ensure token hasn't expired
4. Confirm `JWT_SECRET` matches backend

**Stream Drops:**

```
Stream stops mid-response without 'done' event
```

**Solutions:**
1. Check AI Engine logs for errors
2. Verify `keep-alive` headers
3. Disable nginx buffering: `X-Accel-Buffering: no`
4. Check network connectivity
5. Implement automatic reconnection in hook

**No Events Received:**

**Solutions:**
1. Verify `Content-Type: text/event-stream` in response
2. Check browser supports EventSource (most do)
3. Ensure query parameters are URL-encoded
4. Test with curl to isolate frontend issues

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        AI Engine                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐      ┌──────────────────────────────┐  │
│  │   FastAPI       │──────│   LangGraph Orchestrator     │  │
│  │   Endpoints     │      │   (multi-agent workflows)    │  │
│  └─────────────────┘      └──────────────────────────────┘  │
│           │                          │                       │
│           │                          ▼                       │
│           │              ┌───────────────────────┐          │
│           │              │  PydanticAI Agents    │          │
│           │              ├───────────────────────┤          │
│           └─────────────→│ • QA Agent            │          │
│                          │ • Classifier Agent    │          │
│                          │ • Drafting Agent      │          │
│                          │ • Clarification Agent │          │
│                          └───────────────────────┘          │
│                                     │                        │
│                                     ▼                        │
│                          ┌───────────────────────┐          │
│                          │  ModelDeps            │          │
│                          │  (dependencies)       │          │
│                          └───────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### PydanticAI Agent Patterns

#### Creating a New Agent

```python
from pydantic_ai import Agent
from .dependencies import ModelDeps, get_model_deps

# Define output schema
from pydantic import BaseModel

class MyResult(BaseModel):
    answer: str
    confidence: float

# Create agent with lazy loading
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

# Use the agent
async def my_function(question: str) -> dict[str, str]:
    deps = get_model_deps()
    agent = get_my_agent()
    result = await agent.run(question, deps=deps)
    return result.data.model_dump()
```

#### Dependency Injection

All agents use `ModelDeps` for consistent access to settings and OpenAI client:

```python
class ModelDeps:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.openai_client = get_openai_client()
```

#### Existing Agents

| Agent               | Location                            | Purpose                       |
| ------------------- | ----------------------------------- | ----------------------------- |
| QA Agent            | `src/agents/qa_agent.py`            | Legal Q&A with RAG, citations |
| Classifier Agent    | `src/agents/classifier_agent.py`    | Identify legal grounds        |
| Drafting Agent      | `src/agents/drafting_agent.py`      | Generate legal documents      |
| Clarification Agent | `src/agents/clarification_agent.py` | Generate follow-up questions  |

### LangGraph Workflow Patterns

LangGraph is used **only for orchestration** between PydanticAI agents, not for direct LLM calls.

#### Workflow Structure

```python
from typing import TypedDict
from langgraph.graph import StateGraph

class MyWorkflowState(TypedDict, total=False):
    input: Required[str]
    intermediate_result: str | None
    final_output: str | None
    metadata: dict[str, Any]

def create_my_workflow() -> StateGraph:
    workflow = StateGraph(MyWorkflowState)

    # Add nodes
    workflow.add_node("step1", step1_function)
    workflow.add_node("step2", step2_function)

    # Add edges
    workflow.add_edge("step1", "step2")
    workflow.set_entry_point("step1")
    workflow.set_finish_point("step2")

    return workflow.compile()
```

#### Workflow Best Practices

1. **State Schemas**: Use `TypedDict` with `total=False` for optional fields
2. **Error Handling**: Wrap all node functions in try-catch, store error in state
3. **Singleton Pattern**: Cache compiled workflows with `@lru_cache`
4. **Factory Functions**: Provide `create_*_state()` functions for initial state

#### Existing Workflows

| Workflow            | Location                                        | Purpose                          |
| ------------------- | ----------------------------------------------- | -------------------------------- |
| Case Analysis       | `src/workflows/case_analysis_workflow.py`       | Classify and analyze legal cases |
| Document Generation | `src/workflows/document_generation_workflow.py` | Generate documents with revision |
| Complex Q&A         | `src/workflows/complex_qa_workflow.py`          | Deep research and citation       |

### Clarification Flow Design

The clarification system generates follow-up questions when queries are incomplete.

#### Decision Logic

- Low confidence (< 0.6) → Needs clarification
- No legal grounds identified → Needs clarification
- Pre-filled user responses → Skip clarification

#### Question Structure

```python
class ClarificationQuestion(BaseModel):
    question: str
    question_type: str  # timeline, parties, documents, amounts, jurisdiction
    options: list[str] | None  # Optional predefined choices
    hint: str | None  # Help text for users
```

#### UX Pattern

- Maximum 2-4 specific questions
- Clear "next steps" explanation
- Context-aware questioning based on classification results

### Langfuse Observability

#### Official PydanticAI Integration

The AI Engine uses the official Langfuse + PydanticAI integration pattern. See: https://langfuse.com/integrations/frameworks/pydantic-ai

**How it works:**

1. On startup, `init_langfuse()` is called from `src/main.py`
2. After authenticating with Langfuse, it calls `Agent.instrument_all()`
3. All PydanticAI agents created with `instrument=True` automatically send traces to Langfuse

**Environment Variables:**

```bash
# Get credentials from: https://cloud.langfuse.com
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com  # EU region (default)
# LANGFUSE_HOST=https://us.cloud.langfuse.com  # US region

# Optional settings
LANGFUSE_ENABLED=true
LANGFUSE_SAMPLING_RATE=1.0  # 1.0 = trace all requests
LANGFUSE_SESSION_ID_HEADER=x-session-id
```

#### Initialization Code

The key initialization happens in `src/langfuse_init.py`:

```python
def init_langfuse() -> None:
    # Set environment variables
    os.environ["LANGFUSE_PUBLIC_KEY"] = settings.LANGFUSE_PUBLIC_KEY
    os.environ["LANGFUSE_SECRET_KEY"] = settings.LANGFUSE_SECRET_KEY

    # Get Langfuse client (initializes OpenTelemetry)
    _langfuse_client = get_client()

    # Test connection
    if _langfuse_client.auth_check():
        # KEY STEP: Enable PydanticAI instrumentation globally
        Agent.instrument_all()
```

#### Agent Configuration

All agents are created with `instrument=True` for automatic tracing:

```python
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel

def get_my_agent() -> Agent:
    settings = get_settings()
    return Agent(
        OpenAIModel(settings.OPENAI_MODEL),
        system_prompt="You are a helpful assistant.",
        instrument=True,  # Enable automatic Langfuse tracing
    )
```

#### Adding Custom Metadata

Use `update_current_trace()` to add additional metadata to the auto-created traces:

```python
from ..langfuse_init import is_langfuse_enabled, update_current_trace

async def my_workflow(question: str, user_id: str, session_id: str):
    # Add trace metadata
    if is_langfuse_enabled():
        update_current_trace(
            input=question,
            user_id=user_id,
            session_id=session_id,
            metadata={"workflow": "my_workflow"},
        )

    # Run agent (automatically traced)
    result = await agent.run(question)

    # Update with output metadata
    if is_langfuse_enabled():
        update_current_trace(
            output={"result_length": len(result.output)}
        )
```

#### What Gets Traced Automatically

- **LLM calls**: Model name, tokens used, latency, cost
- **Agent runs**: Input, output, system prompt
- **Tools**: Tool calls and results
- **HTTP requests**: Via middleware in `src/langfuse_middleware.py`

#### PII Redaction

The `langfuse_init.py` module provides automatic PII redaction for all traces:

- Email addresses → `[REDACTED_EMAIL]`
- Polish phone numbers → `[REDACTED_PHONE]`
- PESEL numbers (11 digits) → `[REDACTED_PESEL]`
- NIP numbers (10 digits) → `[REDACTED_NIP]`
- Credit card numbers → `[REDACTED_CARD]`
- Common Polish names → `[REDACTED_NAME]`

#### Viewing Traces

Go to `https://cloud.langfuse.com` to view:

- Agent performance (latency, success rate)
- Token usage and costs
- User analytics by `user_id`
- Session grouping by `session_id`
- Error correlation with Sentry traces

#### Troubleshooting

**No traces appearing:**

1. Verify environment variables are set correctly
2. Check that `LANGFUSE_ENABLED=true`
3. Look for "PydanticAI instrumentation enabled" message in startup logs
4. Test authentication: `langfuse.auth_check()` should return `True`

**Missing agent traces:**

1. Ensure `instrument=True` is set on agent creation
2. Verify `Agent.instrument_all()` is called after `init_langfuse()`
3. Agents created before `init_langfuse()` won't be traced - use lazy loading pattern

### API Endpoints

#### Simple Agent Endpoints

```bash
POST /api/v1/qa                 # Simple Q&A
POST /api/v1/classify           # Case classification
POST /api/v1/documents/generate # Document generation
```

#### Enhanced RAG Endpoints

```bash
POST /api/v1/qa/ask             # Q&A with user context
POST /api/v1/qa/ask-rag         # RAG-based Q&A
POST /api/v1/search/semantic    # Vector search
```

#### Workflow Endpoints

```bash
POST /api/v1/workflows/case-analysis        # Multi-step case analysis
POST /api/v1/workflows/document-generation  # Document with revision
POST /api/v1/workflows/complex-qa           # Comprehensive Q&A
```

#### System Endpoints

```bash
GET /health          # Health check with startup status
GET /health/ready    # Kubernetes readiness probe
GET /health/live     # Kubernetes liveness probe
```

### Testing

#### Test Locations

- Unit tests: `apps/ai-engine/tests/unit/*.py`
- Integration tests: `apps/ai-engine/tests/integration/*.py`

#### Test Configuration

```python
# conftest.py sets test defaults
os.environ.setdefault("OPENAI_API_KEY", "test-key-for-pytest")
os.environ.setdefault("OPENAI_MODEL", "gpt-4-test")
```

#### Test Patterns

```python
# Model validation
def test_create_legal_ground():
    ground = LegalGround(
        name="Breach of Contract",
        confidence_score=0.85,
        legal_basis=["Art. 471 KC"]
    )
    assert ground.confidence_score == 0.85

# State creation
def test_create_case_analysis_state():
    state = create_case_analysis_state(
        case_description="Test case",
        session_id="test-123"
    )
    assert state["metadata"]["current_step"] == "classify"

# Conditional edge routing
def test_should_clarify_with_low_confidence():
    state = {"classification_confidence": 0.5, "needs_clarification": True}
    assert should_clarify(state) == "clarify"
```

### Migration from LangChain

If migrating from LangChain patterns:

| LangChain            | PydanticAI                       |
| -------------------- | -------------------------------- |
| `@chain` decorator   | `Agent` class with `output_type` |
| `RunnableSequence`   | LangGraph `StateGraph`           |
| `BasePromptTemplate` | System prompt string             |
| `StructuredOutput`   | `output_type=BaseModel`          |
| `bind_tools()`       | Tool registration on Agent       |

#### Before (LangChain-style)

```python
from langchain.schema import BasePromptTemplate
from langchain.chains import LLMChain

prompt = BasePromptTemplate.from_template("You are a lawyer. {question}")
chain = LLMChain(llm=llm, prompt=prompt)
result = chain.run(question="What is...?")
```

#### After (PydanticAI)

```python
from pydantic_ai import Agent
from pydantic import BaseModel

class Result(BaseModel):
    answer: str

agent = Agent(
    "openai:gpt-4o",
    system_prompt="You are a lawyer.",
    output_type=Result,
)
result = await agent.run("What is...?")
```

### Key Design Principles

1. **Lazy Loading**: Agents are initialized on-demand to avoid startup failures
2. **Singleton Pattern**: Workflows and orchestrators are singletons for performance
3. **Error Resilience**: Each node handles errors gracefully without crashing the workflow
4. **Separation of Concerns**: PydanticAI for agents, LangGraph for orchestration
5. **Observability First**: Comprehensive tracing and monitoring built-in
6. **Type Safety**: Strong typing throughout with Pydantic models and TypedDict
7. **Extensibility**: Easy to add new agents or workflow branches

### Integration with Backend

The NestJS backend communicates with AI Engine via HTTP:

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
