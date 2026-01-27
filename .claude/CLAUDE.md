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

# Langfuse Observability (Optional but recommended)
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...
LANGFUSE_ENABLED=true
LANGFUSE_SAMPLING_RATE=1.0
LANGFUSE_SESSION_ID_HEADER=x-session-id
```

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

#### Setup

1. Get credentials from [Langfuse Cloud](https://cloud.langfuse.com)
2. Set environment variables (see above)
3. All agents and workflows are automatically traced

#### What Gets Traced

- All LLM calls (model, tokens, latency)
- HTTP requests (middleware)
- Workflow nodes (spans)
- User sessions and IDs

#### PII Redaction

Automatic redaction for:

- Email addresses
- Polish phone numbers
- PESEL numbers (Polish national ID)
- NIP numbers (Polish tax ID)
- Credit card numbers

#### Viewing Traces

Go to `https://cloud.langfuse.com` to view:

- Agent performance (latency, success rate)
- Token usage and costs
- User analytics
- Error correlation with Sentry

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
