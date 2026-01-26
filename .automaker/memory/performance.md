---
tags: [performance]
summary: performance implementation decisions and patterns
relevantTo: [performance]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 81
  referenced: 16
  successfulFeatures: 16
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

#### [Gotcha] Default in-memory storage is suitable for single-instance only; multi-instance deployments require Redis adapter, but this was not automatically detected or warned (2026-01-20)
- **Situation:** Implementation works locally and in single-container deployments but silently fails in horizontally-scaled scenarios
- **Root cause:** In-memory storage is simple and works for development/single-node; migration to Redis is explicit decision not enforced by defaults. No environment detection triggers warnings
- **How to avoid:** Simpler default setup vs silent failure in production; implementation is simpler but requires documentation/discipline to scale

#### [Gotcha] Audit log creation is asynchronous (fire-and-forget) rather than awaited, but errors are caught silently (2026-01-20)
- **Situation:** Interceptor publishes event and continues without waiting for audit persistence
- **Root cause:** Prevents audit log creation from delaying mutations. Non-blocking is essential for user experience. Silent error catching prevents one bad audit log from failing the user's mutation.
- **How to avoid:** Easier: Fast mutations, resilient to audit failures. Harder: Audit failures are invisible, no guarantee logs were created, harder to debug missing audits

### Statistics calculation uses useMemo despite simple operations, activity timeline uses pageSize: 10 limit despite having 1000+ records (2026-01-20)
- **Context:** Dashboard renders frequently with real-time data updates possible
- **Why:** Statistics recalculation from 1000 documents on every render becomes expensive at scale. Pagination prevents rendering massive lists. Defensive optimization pattern - low cost, prevents future pain.
- **Rejected:** Calculating stats inline and fetching unlimited audit logs - works initially but becomes bottleneck as data grows
- **Trade-offs:** Slightly more code complexity now vs significant performance cliff later; pagination requires 'view all' handling
- **Breaking if changed:** If pagination removed, dashboard becomes slow with modest data growth; if stats recalculation moved inline, re-renders trigger expensive calculations

### Template rendering happens at send-time, not pre-compiled at module initialization (2026-01-21)
- **Context:** Email templates use string substitution for variables (${userEmail}, ${userName}) requiring runtime rendering
- **Why:** Simpler implementation, templates change independently of code. No need for template precompilation infrastructure. Rendering is fast (simple string replacement) and only happens when sending actual emails (which are already async).
- **Rejected:** Handlebars/EJS compilation - more features but higher startup cost and dependency bloat. Pre-compiled templates - requires template versioning and cache invalidation.
- **Trade-offs:** Easier to maintain and modify templates, but rendering adds small latency to email send (not visible since emails are async anyway)
- **Breaking if changed:** Removing template rendering and using raw HTML would lose variable substitution. Pre-compiling would require template caching strategy.