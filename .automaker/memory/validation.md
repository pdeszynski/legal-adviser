---
tags: [validation]
summary: validation implementation decisions and patterns
relevantTo: [validation]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 3
  referenced: 4
  successfulFeatures: 4
---
# validation

### Validation constraints match exactly to backend schema (title 3-500 chars, currency 3-letter ISO code pattern) (2026-01-20)

- **Context:** Form validation implemented client-side but must prevent invalid states that backend would reject
- **Why:** Prevents round-trip validation errors and provides immediate user feedback. Matching backend validation prevents confusion where form accepts input but mutation fails
- **Rejected:** Could skip client validation and only validate on server (bad UX - delays feedback), or implement custom looser validation (causes mutation failures)
- **Trade-offs:** More validation code at UI level but eliminates mismatch between client and server expectations. Single source of truth for constraints is at backend
- **Breaking if changed:** If backend validation rules change, form validation must be updated in parallel or UX breaks with unexpected mutation rejections
