---
tags: [validation]
summary: validation implementation decisions and patterns
relevantTo: [validation]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 113
  referenced: 45
  successfulFeatures: 45
---
# validation

### Validation constraints match exactly to backend schema (title 3-500 chars, currency 3-letter ISO code pattern) (2026-01-20)

- **Context:** Form validation implemented client-side but must prevent invalid states that backend would reject
- **Why:** Prevents round-trip validation errors and provides immediate user feedback. Matching backend validation prevents confusion where form accepts input but mutation fails
- **Rejected:** Could skip client validation and only validate on server (bad UX - delays feedback), or implement custom looser validation (causes mutation failures)
- **Trade-offs:** More validation code at UI level but eliminates mismatch between client and server expectations. Single source of truth for constraints is at backend
- **Breaking if changed:** If backend validation rules change, form validation must be updated in parallel or UX breaks with unexpected mutation rejections

### GraphQL custom mutations require specific configuration pattern for data provider (2026-01-24)

- **Context:** Settings forms need to call custom GraphQL mutations (`updateMyPreferences`, `updateProfile`, `changePassword`) via refine's data provider
- **Why:** refine's `useCustom` hook is for queries, not mutations. The data provider's `custom` method expects a specific structure for mutation configuration that differs from what the hooks expect.
- **Pattern:**
  ```tsx
  // 1. Get data provider (it's a function that returns the actual provider)
  const dp = dataProvider();
  if (!dp) throw new Error('Data provider not available');

  // 2. Call custom with mutation config
  await (dp as any).custom({
    url: '',
    method: 'post',
    config: {
      mutation: {
        operation: 'updateMyPreferences',
        fields: ['id', 'locale', 'theme', 'aiModel', 'timezone', 'dateFormat'],
        variables: {
          input: data,
        },
      },
    },
  });
  ```
- **Type Safety:** Define `GraphQLMutationConfig<TInput>` type in `apps/web/src/providers/data-provider/index.ts` and import it to ensure type-safe mutation calls.
- **Breaking if changed:** If the data provider's `custom` method signature changes, all type casts and config structures need updating. The type extraction mitigates this by centralizing the definition.

### Post-feature validation: Always run lint-staged checks (TypeScript + ESLint + Tests) (2026-01-24)

- **Context:** TypeScript errors accumulate when features are implemented without running proper validation. Recent changes introduced 9 TypeScript errors due to missing files, incorrect import paths, and decorator type issues.
- **Why:** Catching type errors early prevents cascading build failures. lint-staged runs all necessary checks (ESLint, TypeScript compilation, tests) on staged files before commits.
- **Required Checks After Each Feature:**
  1. **TypeScript Compilation:** `pnpm build` must pass without errors
  2. **ESLint:** `pnpm lint` must pass without errors (or run via lint-staged on commit)
  3. **Unit Tests:** `pnpm test` must pass
  4. **E2E Tests:** `pnpm test:e2e` must pass for relevant features
- **How to Run:**
  ```bash
  # Run all checks (recommended before committing)
  pnpm run lint-staged

  # Individual checks
  pnpm build          # TypeScript compilation
  pnpm lint           # ESLint
  pnpm test           # Unit tests
  pnpm test:e2e       # E2E tests
  ```
- **Validation Agent:** A dedicated subagent (`validate-feature`) should be invoked after each feature completion to ensure all checks pass.
- **Breaking if changed:** Skipping validation allows type errors and broken code to enter the codebase, causing build failures for other developers.

### Common TypeScript errors to avoid (2026-01-24)

- **Missing Entity Files:** When creating a new entity, ensure the `.entity.ts` file exists AND is exported from `entities/index.ts`
- **Incorrect Import Paths:** From `modules/authorization/` to `domain/authorization/` use `../../domain/...` not `../../../domain/...`
- **Decorator Type Issues:** When using `SetMetadata` in custom decorators, handle both method and class decorator cases:
  ```typescript
  // For method decorators (descriptor present)
  if (descriptor && propertyKey) {
    SetMetadata(KEY, value)(target, propertyKey, descriptor);
  }
  // For class decorators (descriptor undefined)
  else {
    SetMetadata(KEY, value)(target as Function);
  }
  ```
- **Enum Exports:** Ensure enums are re-exported from barrel files (index.ts) when using `export * from`:
  ```typescript
  export * from './permission-type.vo';
  export * from './resource-type.vo';
  // Re-export enums explicitly for convenience
  export { PermissionTypeEnum } from './permission-type.vo';
  export { ResourceTypeEnum } from './resource-type.vo';
  ```
