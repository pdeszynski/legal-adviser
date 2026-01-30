---
tags: [gotcha, mistake, edge-case, bug, warning]
summary: Mistakes and edge cases to avoid
relevantTo: [error, bug, fix, issue, problem]
importance: 0.9
relatedFiles: []
usageStats:
  loaded: 1307
  referenced: 504
  successfulFeatures: 504
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

#### [Gotcha] GraphQL @Field decorator requires explicit type function return type (2026-01-25)

- **Situation:** `UndefinedTypeError: Make sure you are providing an explicit type for the "company" of the "DemoRequestOrmEntity" class`
- **Root cause:** When using `@Field()` decorator in NestJS GraphQL, the type must be explicitly specified as a function that returns the type, not just `{ nullable: true }`. The decorator metadata system needs the explicit type function to properly generate GraphQL schema
- **How to avoid:** Always use the explicit type function in `@Field()` decorators:
  ```typescript
  // WRONG - causes UndefinedTypeError
  @Field({ nullable: true })
  company: string | null;

  // CORRECT - explicit type function
  @Field(() => String, { nullable: true })
  company: string | null;

  // For enum fields
  @Field(() => CompanySizeEnum, { nullable: true })
  companySize: CompanySizeEnum | null;
  ```

#### [Gotcha] Direct fetch() calls bypass GraphQL authentication headers (2026-01-25)

- **Situation:** `twoFactorSettings` query returns `{errors: [{message: "Authentication failed"}], data: {twoFactorSettings: null}}`
- **Root cause:** Frontend components making direct `fetch()` calls to GraphQL endpoint without including the `Authorization` header. The data provider automatically adds authentication, but raw fetch calls don't
- **How to avoid:** Use the data provider's `custom` method for all GraphQL queries/mutations in components:
  ```typescript
  // WRONG - direct fetch without auth
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },  // No Authorization!
    credentials: 'include',
    body: JSON.stringify({ query }),
  });

  // CORRECT - use data provider which adds auth headers
  const dp = dataProvider();
  if (!dp) throw new Error('Data provider not available');
  const result = await (dp as any).custom({
    method: 'post',
    config: {
      query: {
        operation: 'twoFactorSettings',
        fields: ['status', 'enabled', 'remainingBackupCodes', 'lastVerifiedAt'],
      },
    },
  });
  ```
  The data provider's `executeGraphQL` function automatically includes JWT tokens from `getAccessToken()`.

#### [Gotcha] Spread operator with null values overrides object defaults (2026-01-25)

- **Situation:** `Cannot return null for non-nullable field NotificationPreferences.documentUpdates` error when database contains `null` values
- **Root cause:** Using spread operator `{ ...defaults, ...this.notificationPreferences }` allows `null` values from the database to override default values. When `notificationPreferences` contains `{ documentUpdates: null }`, the spread operator propagates `null` instead of keeping the default value
- **How to avoid:** Use nullish coalescing operator (`??`) for each field to handle `null`/`undefined` values:
  ```typescript
  // WRONG - null values override defaults
  getNotificationPreferences(): NotificationPreferences {
    const defaults = { documentUpdates: true, ... };
    return { ...defaults, ...this.notificationPreferences };
  }

  // CORRECT - nullish coalescing preserves defaults
  getNotificationPreferences(): NotificationPreferences {
    const defaults = { documentUpdates: true, ... };
    const stored = this.notificationPreferences || {};
    return {
      documentUpdates: stored.documentUpdates ?? defaults.documentUpdates,
      queryResponses: stored.queryResponses ?? defaults.queryResponses,
      // ... etc
    };
  }
  ```

#### [Gotcha] GraphQL InputType/ObjectType decorators require declaration order - types must be declared before they are referenced (2026-01-28)

- **Situation:** `ReferenceError: Cannot access 'ChatMessageMetadataInput' before initialization` when starting NestJS server
- **Root cause:** NestJS GraphQL decorators (`@InputType`, `@ObjectType`, `@Field`) execute at class definition time, not at runtime. When a class uses another type in its `@Field()` decorator (e.g., `@Field(() => ChatMessageMetadataInput)`), that referenced type **must already be declared** earlier in the file. This is a temporal dead zone issue where TypeScript cannot access a class before initialization
- **How to avoid:** Always declare types in **dependency order** - leaf types (no dependencies on other types) first, composite types last:
  ```typescript
  // CORRECT - Leaf type declared first
  @InputType('MetadataInput')
  export class MetadataInput {
    @Field(() => Number, { nullable: true })
    confidence?: number;
  }

  // CORRECT - Composite type declared after its dependency
  @InputType('MessageInput')
  export class MessageInput {
    @Field(() => String)
    content: string;

    @Field(() => MetadataInput, { nullable: true })  // MetadataInput already declared
    metadata?: MetadataInput;
  }
  ```
  **Wrong order causes error:**
  ```typescript
  // WRONG - References type before declaration
  @InputType('MessageInput')
  export class MessageInput {
    @Field(() => MetadataInput, { nullable: true })  // ERROR: MetadataInput not yet declared!
    metadata?: MetadataInput;
  }

  @InputType('MetadataInput')
  export class MetadataInput { ... }
  ```
- **Documentation reminder:** When creating new DTO files, add a comment above leaf types referencing `CLAUDE.md "TypeScript Input/Output Type Declaration Order"` section
- **Related files:** `apps/backend/src/modules/chat/dto/chat-message.dto.ts` - correct ordering of `ChatMessageMetadataInput` before `CreateAssistantMessageInput`

#### [Gotcha] NestJS GraphQL @ResolveProperty decorator deprecated - use @ResolveField instead (2026-01-28)

- **Situation:** Server startup warning: `The "@ResolveProperty()" decorator has been deprecated. Please, use the "@ResolveField()" decorator instead.`
- **Root cause:** NestJS GraphQL renamed `@ResolveProperty` to `@ResolveField` for consistency with GraphQL terminology. The old decorator still works but is deprecated and will be removed in future versions
- **How to avoid:**
  1. **Never use `@ResolveProperty`** - Always use `@ResolveField` for field resolvers
  2. **Import the correct decorator:**
     ```typescript
     // CORRECT
     import { Resolver, ResolveField, Parent } from '@nestjs/graphql';

     @Resolver(() => LegalDocument)
     export class PdfUrlResolver {
       @ResolveField('pdfUrl', () => String, { nullable: true })
       async getPdfUrl(@Parent() document: LegalDocument): Promise<string | null> {
         return this.pdfUrlService.getDocumentPdfUrl(document.id);
       }
     }
     ```
  3. **Check for deprecated imports:** When reviewing PRs or creating new resolvers, search for `ResolveProperty` to catch deprecated usage
- **Related files:** `apps/backend/src/modules/documents/pdf-url.resolver.ts` - fixed to use `@ResolveField`

#### [Gotcha] GraphQL schema changes require running codegen before frontend types match - build succeeds but runtime errors occur (2026-01-29)

- **Situation:** After adding/modifying GraphQL queries, mutations, or types, frontend builds successfully but TypeScript types don't match runtime behavior, causing "field not found" or type mismatch errors at runtime
- **Root cause:** GraphQL codegen generates TypeScript types from backend schema. When backend schema changes but codegen isn't run, frontend uses stale types. Build passes because TypeScript compiles against the (stale) generated types, but runtime breaks because actual GraphQL response differs
- **How to avoid:**
  1. **Always run codegen after GraphQL changes:**
     ```bash
     pnpm codegen    # Generate types from backend schema
     pnpm build      # Verify frontend builds with new types
     pnpm typecheck  # Verify no TypeScript errors
     ```
  2. **Generated files location:** `apps/web/src/generated/`
     - `graphql.ts` - Full GraphQL types
     - `introspection.json` - Schema introspection
     - `persisted-queries/client.json` - Persisted queries
  3. **Common issues after schema changes:**
     - Field not found in generated types → Backend field added, codegen not run
     - Type mismatch (e.g., string vs string | null) → Backend nullability changed, types stale
     - Mutation missing → Resolver not exported or module not registered
  4. **Add to post-feature checklist:** Run `pnpm codegen` as first step after any GraphQL schema modification
- **Verification:** Check `apps/web/src/generated/graphql.ts` for new fields/types after schema changes
