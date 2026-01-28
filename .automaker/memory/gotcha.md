---
tags: [gotcha]
summary: gotcha implementation decisions and patterns
relevantTo: [gotcha]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 53
  referenced: 31
  successfulFeatures: 31
---
# gotcha

#### [Gotcha] Email processor doesn't validate sender address format, delegates to SendGrid (2026-01-21)

- **Situation:** Invalid from-address would cause SendGrid 403 errors at send-time, not queue-time
- **Root cause:** SendGrid API validates sender format and verified addresses. Local validation would duplicate their logic and might diverge. Errors at send-time still trigger retries and notification status updates, so not silent failures.
- **How to avoid:** Simpler code but errors only discoverable when running against actual SendGrid, not in unit tests
