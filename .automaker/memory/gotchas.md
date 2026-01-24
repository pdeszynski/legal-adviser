---
tags: [gotcha, mistake, edge-case, bug, warning]
summary: Mistakes and edge cases to avoid
relevantTo: [error, bug, fix, issue, problem]
importance: 0.9
relatedFiles: []
usageStats:
  loaded: 619
  referenced: 250
  successfulFeatures: 250
---
# Gotchas

Mistakes and edge cases to avoid. These are lessons learned from past issues.

---

#### [Gotcha] Locale cookie-based language switching requires explicit page reload to activate different translation context in server-rendered frameworks (2026-01-12)

- **Situation:** Login page test verified Polish locale via NEXT_LOCALE cookie, but translations only apply on fresh page load due to SSR middleware
- **Root cause:** Next.js/next-intl middleware runs at request time and reads locale from cookie/URL to set translation context; existing in-memory context persists until new request
- **How to avoid:** Cookie-based persistence works well across page navigations but requires full page navigation to change language; client-side state would be instant but lose persistence

#### [Gotcha] Server start requires database connectivity; Playwright tests cannot verify helmet headers without full infrastructure (2026-01-12)

- **Situation:** Testing security headers in E2E environment where database is unavailable
- **Root cause:** NestJS bootstrap initializes all modules including database connections before listening; failures prevent HTTP server startup
- **How to avoid:** Code review verification works but misses runtime header injection issues; security headers are invisible without actual HTTP response

#### [Gotcha] Polish character support (ąćęłńóśźż) requires explicit HTML encoding in template generation AND proper charset declaration (2026-01-16)

- **Situation:** Tests verify Polish legal document content includes special characters that don't render in PDFs without proper encoding
- **Root cause:** Headless Chrome interprets HTML charset from meta tags. Without UTF-8 declaration, characters get mojibaked. HTML escaping in templates prevents XSS but HTML entities must decode correctly in browser context.
- **How to avoid:** Extra boilerplate in template generation (charset meta tag, escape functions) buys international document support. Worth it for legal documents that must handle multilingual content.

#### [Gotcha] Default credentials are defined in seed file - keep frontend mock auth provider in sync (2026-01-23)

- **Situation:** Development login may fail if mock auth provider credentials don't match database seed data
- **Root cause:** `apps/backend/src/seeds/data/users.seed.ts` contains the source of truth for default user credentials (`admin@refine.dev` / `password`). Frontend mock auth provider at `apps/web/src/providers/auth-provider/` may have hardcoded different credentials.
- **How to avoid:** Always reference `users.seed.ts` as the single source of truth for default credentials. The admin user is:
  - Email: `admin@refine.dev`
  - Password: `password`
  - Username: `admin`
  Additional test users are also available - see seed file for complete list.

#### [Gotcha] refine.dev custom mutations require correct hook usage and data provider configuration (2026-01-24)

- **Situation:** Settings page save functionality was failing with "Custom query/mutation not configured properly" and "mutateProfile is not a function" errors
- **Root cause:** Multiple issues:
  1. `useCustom` hook is designed for queries (GET requests), not mutations. It returns `{ query, result }` but not a `mutate` function.
  2. `useCustomMutation` returns `{ mutate, mutation }` but has different configuration expectations than the data provider's `custom` method signature.
  3. `useDataProvider()` returns a function `(name?: string) => DataProvider`, not the data provider itself. You must call it: `const dp = dataProvider()`.
  4. The data provider's `custom` method expects specific configuration structure for mutations, which differs from what the hooks expect.
- **How to avoid:**
  1. For custom mutations, use `useDataProvider()` hook to get the data provider function, then call `custom()` on it:
     ```tsx
     const dp = dataProvider();
     if (!dp) throw new Error('Data provider not available');
     await (dp as any).custom({
       url: '',
       method: 'post',
       config: {
         mutation: {
           operation: 'mutationName',
           fields: ['id', 'field1', 'field2'],
           variables: {
             input: { /* mutation data */ },
           },
         },
       },
     });
     ```
  2. Define a reusable type for the mutation config (in `apps/web/src/providers/data-provider/index.ts`):
     ```tsx
     export type GraphQLMutationConfig<TInput = Record<string, unknown>> = {
       url: string;
       method: 'post';
       config: {
         mutation: {
           operation: string;
           fields: string[];
           variables: {
             input: TInput;
           };
         };
       };
     };
     ```
  3. Import and use the type in components:
     ```tsx
     import type { GraphQLMutationConfig } from '@providers/data-provider';

     const mutationConfig: GraphQLMutationConfig<UpdatePreferencesInput> = {
       url: '',
       method: 'post',
       config: {
         mutation: {
           operation: 'updateMyPreferences',
           fields: ['id', 'locale', 'theme', 'aiModel'],
           variables: { input: data },
         },
       },
     };
     await (dp as any).custom(mutationConfig);
     ```
  4. The `@tanstack/react-query` package is required for refine's QueryClient to work properly. If you see "No QueryClient set" errors, ensure the package is installed.

#### [Gotcha] TypeScript compilation errors from incorrect import paths in monorepo (2026-01-24)

- **Situation:** Domain layer imports from modules were failing with "Cannot find module" errors even though files existed
- **Root cause:** Incorrect relative path calculation. From `apps/backend/src/modules/authorization/` to `apps/backend/src/domain/authorization/`, the correct path is `../../domain/...` not `../../../domain/...`
- **Path Reference:**
  - `src/modules/authorization/` → `src/domain/authorization/` = `../../domain/...`
  - `src/seeds/` → `src/modules/authorization/entities/` = `../modules/authorization/entities/` (not individual files)
- **How to avoid:** Count directory levels carefully:
  - From `modules/X/` to `src/`: `../..`
  - From `modules/X/` to `domain/Y/`: `../../domain/Y/`

#### [Gotcha] NestJS decorator type errors when implementing custom decorators (2026-01-24)

- **Situation:** `SetMetadata` decorator calls fail TypeScript compilation with "Argument of type 'string | symbol | undefined' is not assignable" errors
- **Root cause:** Custom decorators must handle both method decorators (where `propertyKey` and `descriptor` are defined) and class decorators (where they're `undefined`)
- **How to avoid:** Always guard for undefined values:
  ```typescript
  export const RequireRole = (...roles: UserRole[]): MethodDecorator & ClassDecorator => {
    return (target, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
      if (descriptor && propertyKey) {
        // Method decorator
        SetMetadata(ROLES_KEY, roles)(target, propertyKey, descriptor);
      } else {
        // Class decorator - cast target to Function
        SetMetadata(ROLES_KEY, roles)(target as Function);
      }
    };
  };
  ```

#### [Gotcha] TypeORM entity exports from barrel index files (2026-01-24)

- **Situation:** Importing entity fails with "Cannot find module" even though the `.entity.ts` file exists
- **Root cause:** Entity files must be explicitly exported from the `index.ts` barrel file in the entities directory
- **How to avoid:** Always update the index file when creating new entities:
  ```typescript
  // entities/index.ts
  export * from './role.entity';
  export * from './user-role.entity'; // Add new entities here!
  ```

#### [Gotcha] Enum exports with barrel files using `export *` (2026-01-24)

- **Situation:** Importing enums from barrel index file fails even though the individual file exports them
- **Root cause:** While `export * from './file'` exports classes, some TypeScript configurations require explicit enum re-exports
- **How to avoid:** Re-export enums explicitly in barrel files:
  ```typescript
  export * from './permission-type.vo';
  export * from './resource-type.vo';
  // Re-export enums explicitly for convenience
  export { PermissionTypeEnum } from './permission-type.vo';
  export { ResourceTypeEnum } from './resource-type.vo';
  export { RoleTypeEnum } from './role-type.vo';
  ```

#### [Gotcha] Domain layer aggregates must generate IDs dynamically, not hardcode static values (2026-01-24)

- **Situation:** System role factory methods in domain aggregates were using hardcoded UUID strings like `'00000000-0000-4000-8000-000000000001'` for ID generation
- **Root cause:** Domain layer should use dynamic ID generation via `RoleId.generate()` rather than static hardcoded values. Hardcoded IDs violate DDD principles where the domain layer should be independent of persistence concerns
- **How to avoid:**
  1. **Domain aggregates** - Always use `RoleId.generate()` for creating new entities:
     ```typescript
     // Correct - domain/authorization/aggregates/role.aggregate.ts
     static createSuperAdmin(): RoleAggregate {
       return new RoleAggregate({
         id: RoleId.generate(),  // Dynamic generation
         name: 'Super Administrator',
         // ...
       });
     }
     ```
  2. **Seed data** - Use deterministic UUIDs only in seed files for reproducible test data:
     ```typescript
     // Correct - seeds/data/roles.seed.ts
     function seedUuid(namespace: string, index: number): string {
       const suffix = String(index).padStart(12, '0');
       return `00000000-0000-4000-8000-0000000${suffix}`;
     }
     export const rolesSeedData = [
       { id: seedUuid('roles', 1), name: 'Super Administrator', ... },
     ];
     ```
  3. The `reconstitute()` method is the exception - it uses `RoleId.fromString(id)` to restore entities from persistence (database, seeds) where IDs already exist
  4. Static IDs should only appear in:
     - Seed data files (for reproducible tests)
     - Database migrations (for consistency)
     - Test fixtures (for predictable test data)
