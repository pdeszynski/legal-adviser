---
tags: [gotcha, mistake, edge-case, bug, warning]
summary: Mistakes and edge cases to avoid
relevantTo: [error, bug, fix, issue, problem]
importance: 0.9
relatedFiles: []
usageStats:
  loaded: 584
  referenced: 211
  successfulFeatures: 211
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
