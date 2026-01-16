---
tags: [performance]
summary: performance implementation decisions and patterns
relevantTo: [performance]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 67
  referenced: 2
  successfulFeatures: 2
---
# performance

### Three automatic retry attempts with exponential backoff for failed jobs rather than infinite retries or single attempt (2026-01-13)
- **Context:** AI service might be temporarily unavailable; job failures should be recoverable but not indefinitely
- **Why:** Three retries (5s → 25s → 125s spacing) covers transient failures while preventing resource exhaustion from jobs stuck in retry loop. Exponential backoff prevents hammering failing service. After three attempts, job failure is more likely due to invalid input than service issue.
- **Rejected:** No retries (lose work on transient failures), infinite retries (stuck jobs consume resources), fixed backoff (no improvement as service recovers)
- **Trade-offs:** Catches most transient failures without over-retrying; means some valid jobs fail if service down for >2+ minutes; requires manual intervention or admin endpoint to requeue after recovery
- **Breaking if changed:** If retry count is increased to infinity, stuck jobs will never fail; if removed entirely, transient failures cause job loss; backoff formula is critical to prevent service hammering

#### [Gotcha] Pagination control binds directly to refineCore.setCurrentPage without debouncing, but this is safe because users can only click buttons one at a time. Pre-optimization would harm UX by debouncing user intent. (2026-01-14)
- **Situation:** Document list allows page selection and size selection. Initial concern: multiple rapid page changes could queue requests. Reality: UI buttons prevent rapid-fire clicks naturally.
- **Root cause:** HTML button elements have inherent click debounce - user fingers physically can't click faster than ~200ms. Adding software debounce contradicts UX by delaying page load on intentional clicks.
- **How to avoid:** No debounce means slightly more API calls if user clicks quickly, but provides snappy UX feedback. Could add button disabled state during loading, but current approach favors responsiveness.

#### [Pattern] Used turbo cache keying based on global dependencies and per-task env variables rather than input-only hashing (2026-01-14)
- **Problem solved:** Build pipeline needed deterministic caching across shared packages (@legal/types, @legal/ui) that feed into multiple apps (backend, web)
- **Why this works:** Turbo's cache invalidation requires knowing what env vars affect output. By explicitly listing globals, cache hits work predictably. Alternative (implicit deps) causes cache misses on environment changes.
- **Trade-offs:** More explicit configuration but guaranteed correct cache behavior. Less 'magic' means debugging is straightforward.

#### [Gotcha] Puppeteer page timeout and resource cleanup must be explicit, not implicit (2026-01-16)
- **Situation:** Browser pages consume memory. Each PDF generation creates a page that must be explicitly closed.
- **Root cause:** Puppeteer doesn't auto-garbage-collect pages. Without explicit page.close(), memory accumulates. Module destroy hook cleanup only catches crash case, not normal operation.
- **How to avoid:** Explicit try-finally in processor adds boilerplate but prevents memory leaks in long-running services. Critical for high-volume PDF generation.