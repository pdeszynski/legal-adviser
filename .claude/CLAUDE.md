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
mutation EnableTwoFactorAuth { enableTwoFactorAuth { secret, qrCodeDataUrl, backupCodes } }
mutation VerifyTwoFactorSetup($input: VerifyTwoFactorSetupInput!) { verifyTwoFactorSetup(input: $input) { success } }
mutation DisableTwoFactorAuth($input: DisableTwoFactorInput!) { disableTwoFactorAuth(input: { password: "..." }) }
mutation RegenerateBackupCodes { regenerateBackupCodes { codes } }
query TwoFactorSettings { twoFactorSettings { status, enabled, remainingBackupCodes } }
```

**Admin:**
```graphql
mutation AdminForceDisableTwoFactor($input: AdminForceDisableTwoFactorInput!) {
  adminForceDisableTwoFactor(input: { userId: "..." }) { id, twoFactorEnabled }
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
  submitDemoRequest(input: $input) { success, message }
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
  describeSchedule(scheduleId: $scheduleId) { scheduleId, exists, paused, spec { cronExpression }, nextRunAt }
}
mutation PauseSchedule($input: PauseScheduleInput!) { pauseSchedule(input: { scheduleId: "...", reason: "..." }) }
mutation ResumeSchedule($input: ResumeScheduleInput!) { resumeSchedule(input: { scheduleId: "...", reason: "..." }) }
mutation DeleteSchedule($input: DeleteScheduleInput!) { deleteSchedule(input: { scheduleId: "...", confirm: true }) }
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
    cronExpressions: [{ expression: '0 2 * * *' }],  // Daily at 2 AM
    timezone: 'Europe/Warsaw',
  },
  policies: {
    overlap: 'SKIP',  // Skip if previous run hasn't finished
    catchupWindow: '1 day',
  },
});
```

**Cron Format:** `minute hour day month weekday` (e.g., `0 2 * * *` = daily 2 AM, `0 3 * * 0` = Sunday 3 AM)

**Overlap Policies:** `SKIP` (default), `ALLOW_ALL`, `BUFFER_ONE`

**Env Vars:** `TEMPORAL_CLUSTER_URL`, `TEMPORAL_NAMESPACE`, `TEMPORAL_TASK_QUEUE`

**Scheduler Example:** `apps/backend/src/modules/temporal/workflows/billing/ruling-scheduler.service.ts`
