---
tags: [authentication]
summary: authentication implementation decisions and patterns
relevantTo: [authentication]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 44
  referenced: 41
  successfulFeatures: 41
---
# authentication

### Service layer validates permissions (canUserAccessDocument) rather than resolver only checking authentication (2026-01-20)

- **Context:** Preventing unauthorized users from accessing documents through the API
- **Why:** Service layer is called from multiple paths (GraphQL, REST, events, internal services). Putting authorization there ensures it's never bypassed by different calling contexts
- **Rejected:** Authorization only in resolver - works for GraphQL but fails if same service is later called from REST or other interfaces
- **Trade-offs:** Slightly more defensive code, but prevents authorization bypass bugs when codebase evolves
- **Breaking if changed:** Moving authorization to resolver only makes it vulnerable to bypass if service is called without resolver (internal calls, future APIs)
