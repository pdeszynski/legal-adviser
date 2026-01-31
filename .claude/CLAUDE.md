# Legal AI Platform - Claude Instructions

> **IMPORTANT: This file must stay under 40,000 characters.** When adding new content, remove or condense existing content accordingly.

## Core Principles

- **DDD**: Software model reflects the legal business domain
- **Modular Monolith**: Strict boundaries between modules. No direct imports across modules - use events
- **English-First**: All code, comments, and commit messages in English
- **Strong Typing**: No `any` (TS) or untyped `Dict`/`Any` (Python)
- **Simplicity**: YAGNI - avoid over-engineering

## Tech Stack

- **Web**: Next.js, refine.dev, Tailwind CSS, shadcn/ui
- **Backend**: Nest.js, `@ptc-org/nestjs-query`, GraphQL (Code-First), PostgreSQL
- **AI**: Python, FastAPI, PydanticAI, LangGraph, Langfuse
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
- Frontend Unit: `apps/web/src/**/*.spec.tsx`
- Frontend E2E: `apps/web/tests/*.spec.ts`
- AI Engine: `apps/ai-engine/tests/unit/*.py`

**Post-Feature Checklist:**

1. Codegen: `pnpm codegen` (after GraphQL schema changes)
2. Lint: `eslint .`
3. Type check: `tsc --noEmit` / `uv run mypy src/`
4. Tests: `jest` / `npm test` / `uv run pytest`

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

## RBAC (Role-Based Access Control)

**Hierarchy:** `SUPER_ADMIN(5) > ADMIN(4) > LAWYER(3) > PARALEGAL(2) > CLIENT(1) > GUEST(0)`

**User Entity** (`apps/backend/src/modules/users/entities/user.entity.ts`):

- Single `role` field (enum): `guest | client | paralegal | lawyer | admin | super_admin`
- Default role: `CLIENT`
- JWT `roles` array contains one role for compatibility

**Backend Guards** (`apps/backend/src/modules/auth/guards/`):

```typescript
// Single required role (ADMIN or higher)
@UseGuards(GqlAuthGuard, RoleGuard)
@RequireRole(UserRole.ADMIN)
async adminQuery() { ... }

// Admin only
@UseGuards(GqlAuthGuard, AdminGuard)
async adminOnly() { ... }
```

**Frontend Hook** (`apps/web/src/hooks/use-user-role.tsx`):

```tsx
const { role, isAdmin, hasRole, hasRoleLevel } = useUserRole();
```

## GraphQL

**Codegen:** Run `pnpm codegen` after ANY schema changes. Generates:

- `apps/web/src/generated/graphql.ts` - Full types
- `apps/web/src/generated/introspection.json` - Schema
- `apps/web/src/generated/persisted-queries/client.json` - APQ

**Field Resolvers:** Use `@ResolveField`, never `@ResolveProperty` (deprecated)

```typescript
@ResolveField('pdfUrl', () => String, { nullable: true })
async getPdfUrl(@Parent() document: LegalDocument): Promise<string | null> {
  return this.pdfUrlService.getDocumentPdfUrl(document.id);
}
```

**Authorization:**

```typescript
// Authenticated only
@UseGuards(GqlAuthGuard)
export class MyResolver { ... }

// Public endpoint
@Public()
@Mutation(() => AuthResponse)
async login() { ... }
```

## TypeScript Input/Output Type Declaration Order

**Rule:** NestJS GraphQL decorators execute at class definition time. Types must be declared **before** they are referenced. Arrange in dependency order - leaf types first.

```typescript
// ✅ CORRECT
@InputType('AddressInput')
export class AddressInput {
  @Field(() => String) street: string;
}

@InputType('UserInput')
export class UserInput {
  @Field(() => AddressInput) address: AddressInput; // Already declared
}
```

## Refine.dev Custom Mutations

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

## NestJS-Query + Refine.dev Integration

**Entity Decorators** (`apps/backend/src/modules/{module}/entities/{entity}.entity.ts`):

```typescript
@Entity('users')
@ObjectType('User')
@QueryOptions({ enableTotalCount: true }) // Required for Connection totalCount
export class User {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @FilterableField() // Makes field filterable/sortable
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true }) // Non-filterable
  username: string | null;
}
```

**Module Registration** (`apps/backend/src/modules/{module}/{module}.module.ts`):

```typescript
NestjsQueryGraphQLModule.forFeature({
  imports: [NestjsQueryTypeOrmModule.forFeature([User])],
  resolvers: [{
    DTOClass: User,
    EntityClass: User,
    enableTotalCount: true,
    read: { many: { name: 'users' }, one: { name: 'user' } },
    create: { one: { name: 'createOneUser' } },
    update: { one: { name: 'updateOneUser' } },
    delete: { one: { name: 'deleteOneUser' } },
  }],
}),
```

**Frontend Page** (`apps/web/src/app/admin/{resource}/page.tsx`):

```tsx
import { useList } from '@refinedev/core';

const listResult = useList<User>({
  resource: 'users',
  pagination: { current: 1, pageSize: 10 },
  filters: [{ field: 'role', operator: 'eq', value: 'admin' }],
  sorters: [{ field: 'createdAt', order: 'desc' }],
});
```

**Common Pitfalls:**
| Issue | Cause | Fix |
|-------|-------|-----|
| Missing totalCount | `@QueryOptions({ enableTotalCount: true })` not set | Add decorator |
| Filters not working | Field not decorated with `@FilterableField()` | Use `@FilterableField()` |
| Type errors after schema change | Codegen not run | Run `pnpm codegen` |

## Next.js App Router Admin Layout

**Single root layout** at `apps/web/src/app/admin/layout.tsx`. All admin subdirectories inherit this layout.

**DO NOT:** Add `layout.tsx` to admin subdirectories (breaks inheritance)

**DO:** Place pages under `/admin/` and add menu entry to `apps/web/src/config/menu.config.tsx`

## AI Engine

**Location:** `apps/ai-engine/`
**Tech:** FastAPI, PydanticAI, LangGraph, Langfuse

**Commands:**

```bash
cd apps/ai-engine && uv run dev      # Hot reload
cd apps/ai-engine && uv run pytest    # Tests
cd apps/ai-engine && uv run mypy src/ # Type check
```

**Streaming Chat:** Frontend → AI Engine (JWT auth) → SSE stream back. Session IDs track conversations (UUID v4).

**PydanticAI Agents:** Lazy loading pattern, `ModelDeps` for settings.

**LangGraph Workflows:** Orchestration between agents, not for direct LLM calls.

**Langfuse:** Auto-tracing via `Agent.instrument_all()`. Add metadata with `update_current_trace()`.

## CSRF Protection

**Pattern:** Double-submit cookie. Frontend: `apps/web/src/lib/csrf.ts`

```tsx
const response = await fetch(GRAPHQL_URL, {
  headers: { Authorization: `Bearer ${token}`, ...getCsrfHeaders() },
  credentials: 'include',
});
```

## CQRS + Simplified DDD Architecture

**Pattern:** We use CQRS (Command Query Responsibility Segregation) with a simplified DDD approach:

```
┌─────────────────────────────────────────────────────────────────┐
│                        QUERY SIDE (READ)                        │
│              modules/{module}/entities/{entity}.entity.ts      │
├─────────────────────────────────────────────────────────────────┤
│ • TypeORM entities with @Entity() decorators                   │
│ • Used for queries via nestjs-query auto-generated CRUD         │
│ • GraphQL resolvers return these directly                      │
│ • Optimized for reading data                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        COMMAND SIDE (WRITE)                     │
│        domain/{aggregate}/ + application/use-cases/            │
├─────────────────────────────────────────────────────────────────┤
│ • Domain aggregates with rich business logic                   │
│ • Use cases orchestrate write operations                        │
│ • Repositories map aggregates ↔ entities for persistence       │
│ • Optimized for business rules and invariants                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principles:**

1. **Accept TypeORM in domain** - Entities have TypeORM decorators (pragmatic DDD)
2. **No separate ORM entities** - No `UserOrmEntity`, no mappers needed
3. **Repository handles mapping** - `toDomain()` / `toEntity()` methods in repository only
4. **One entity per table** - Never create duplicate `@Entity()` decorators for same table

**Example - User Repository:**

```typescript
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)  // Read model entity
    private readonly repository: Repository<User>,
  ) {}

  async findById(id: string): Promise<UserAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null; // Map to write model
  }

  async save(aggregate: UserAggregate): Promise<void> {
    const entity = this.toEntity(aggregate); // Map from write model
    await this.repository.save(entity);
  }

  private toDomain(entity: User): UserAggregate { ... }
  private toEntity(aggregate: UserAggregate): User { ... }
}
```

**When to use which side:**

- **Read (Query)**: Direct TypeORM queries, nestjs-query auto-generated CRUD
- **Write (Command)**: Use cases → aggregates → repositories

**DO NOT:**

- Create separate `*OrmEntity` classes with `@Entity()` decorators (causes sync errors)
- Create separate mapper files (mapping in repository is sufficient)
- Copy entities between domain and infrastructure layers

## Key File Locations

| Purpose         | Location                                                 |
| --------------- | -------------------------------------------------------- |
| Admin Layout    | `apps/web/src/app/admin/layout.tsx`                      |
| Menu Config     | `apps/web/src/config/menu.config.tsx`                    |
| Data Provider   | `apps/web/src/providers/data-provider/index.ts`          |
| User Entity     | `apps/backend/src/modules/users/entities/user.entity.ts` |
| Auth Guards     | `apps/backend/src/modules/auth/guards/`                  |
| Database Config | `apps/backend/src/database/database.module.ts`           |
| GraphQL Schema  | `apps/backend/src/schema.gql` (auto-generated)           |

## Common Issues

| Issue                                        | Solution                              |
| -------------------------------------------- | ------------------------------------- |
| "Field not found" after backend change       | Run `pnpm codegen`                    |
| Direct fetch() returns auth errors           | Use data provider's `custom()` method |
| Spread operator with null overrides defaults | Use `??` (nullish coalescing)         |
| Decorator type errors                        | Check types declared before reference |
| "Cannot access before initialization"        | Reorder DTOs - dependencies first     |

## Post-Feature Checklist

1. [ ] Run `pnpm codegen` (if GraphQL changed)
2. [ ] Run `eslint .`
3. [ ] Run `tsc --noEmit`
4. [ ] Run unit tests
5. [ ] Run E2E tests
6. [ ] Verify character count of this file < 40,000

## Summary (Detailed Documentation Links)

### Architecture: CQRS + Simplified DDD

- **Query Side (Read)**: `modules/{module}/entities/` - TypeORM entities with decorators
- **Command Side (Write)**: `domain/{aggregate}/` + `application/use-cases/` - Rich domain logic
- **Repositories**: Map between read entities and write aggregates (no separate ORM entities)
- **Acceptable**: TypeORM annotations leak to domain (pragmatic approach)

### Admin Layout

- Single root layout at `apps/web/src/app/admin/layout.tsx`
- All admin subdirectories inherit this layout
- **DO NOT** add `layout.tsx` to admin subdirectories
- Add menu entries to `apps/web/src/config/menu.config.tsx`

### RBAC (Role-Based Access Control)

- Hierarchy: `SUPER_ADMIN(5) > ADMIN(4) > LAWYER(3) > PARALEGAL(2) > CLIENT(1) > GUEST(0)`
- Higher roles inherit permissions from lower roles
- Single `role` field on User entity (enum)
- JWT `roles` array for token compatibility
- Backend: `RoleGuard`, `AdminGuard` in `apps/backend/src/modules/auth/guards/`
- Frontend: `useUserRole` hook in `apps/web/src/hooks/use-user-role.tsx`

### GraphQL

- **Always run `pnpm codegen` after schema changes**
- Generated types in `apps/web/src/generated/`
- Use `@ResolveField`, never `@ResolveProperty` (deprecated)
- Decorator execution order: types must be declared before reference
- Guard order: `GqlAuthGuard` → `RoleGuard` → `DocumentPermissionGuard`
- Use `@Public()` for public endpoints (login, register)

### NestJS-Query + Refine.dev

- Entity decorators: `@Entity()`, `@ObjectType()`, `@QueryOptions({ enableTotalCount: true })`
- Field decorators: `@IDField()`, `@FilterableField()` (for filtering/sorting), `@Field()` (read-only)
- Relations: `@Relation()` for OneToMany/ManyToOne
- JSON fields: Use `GraphQLJSON` from `graphql-type-json`
- Module registration: `NestjsQueryGraphQLModule.forFeature()` with resolver config
- Frontend: `useList`, `useTable` hooks from `@refinedev/core`
- Data provider: `apps/web/src/providers/data-provider/index.ts`

### refine.dev Custom Mutations

```tsx
const dp = dataProvider();
await (dp as any).custom<GraphQLMutationConfig<InputType>>({
  url: '',
  method: 'post',
  config: {
    mutation: { operation: 'name', fields: ['id'], variables: { input: {...} } }
  }
});
```

### Two-Factor Authentication

- TOTP (RFC 6238), QR codes, 10 backup codes, admin override
- Rate limit: 5/minute, 10 failures = 30 min lockout
- Frontend: `apps/web/src/components/settings/two-factor-setup.tsx`

### CSRF Protection

- Double-submit cookie pattern
- Frontend: `apps/web/src/lib/csrf.ts`
- Cookie: `csrf-token`, Header: `x-csrf-token`

### AI Engine (`apps/ai-engine/`)

- FastAPI, PydanticAI, LangGraph, Langfuse
- Commands: `uv run dev`, `uv run pytest`, `uv run mypy src/`
- Streaming: Frontend → AI Engine (JWT) → SSE
- PydanticAI: Lazy loading, `ModelDeps` for settings
- LangGraph: Orchestration between agents
- Langfuse: Auto-tracing via `Agent.instrument_all()`

### HubSpot Integration

- Location: `apps/backend/src/modules/integrations/hubspot/`
- Lead scoring: Timeline + Company size + Details
- Required contact properties: `use_case`, `timeline`, `company_size`, `message`

### Temporal

- Schedules vs Workflows: Schedules = recurring/time-based, Workflows = one-time/event-driven
- Cron format: `minute hour day month weekday`
- Overlap policies: `SKIP` (default), `ALLOW_ALL`, `BUFFER_ONE`

### TypeORM Entity Rules

- **CRITICAL: Only ONE entity per database table**
- Database module uses glob: `**/*.{entity,orm-entity}{.ts,.js}`
- Use main entity in `modules/{module}/entities/` as source of truth
- For DDD infrastructure: use plain classes (no `@Entity()` decorator)
- Multiple `@Entity()` decorators on same table cause "tables can have at most 1600 columns" error

### Common Issues

| Issue                                 | Solution                                        |
| ------------------------------------- | ----------------------------------------------- |
| "Field not found"                     | Run `pnpm codegen`                              |
| Direct fetch() auth errors            | Use data provider's `custom()`                  |
| Null overrides defaults               | Use `??` (nullish coalescing)                   |
| Decorator type errors                 | Check type declaration order                    |
| "Cannot access before initialization" | Reorder DTOs - dependencies first               |
| Missing totalCount                    | Add `@QueryOptions({ enableTotalCount: true })` |
| Filters not working                   | Use `@FilterableField()` instead of `@Field()`  |

## References

- [nestjs-query Docs](https://tripss.github.io/nestjs-query/)
- [Refine.dev Data Provider](https://refine.dev/docs/api-reference/core/providers/data-provider/)
- [GraphQL Cursor Connections](https://relay.dev/graphql/connections.htm)
- [Conventional Commits](https://www.conventionalcommits.org/)
