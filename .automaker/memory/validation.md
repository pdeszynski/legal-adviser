---
tags: [validation]
summary: validation implementation decisions and patterns
relevantTo: [validation]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 28
  referenced: 27
  successfulFeatures: 27
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
