---
tags: [security]
summary: security implementation decisions and patterns
relevantTo: [security]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 1
  referenced: 0
  successfulFeatures: 0
---
# security

#### [Gotcha] ValidationPipe with transform: true performs implicit type conversion (e.g., 'yes' -> boolean), but plainToInstance() in unit tests does NOT. Tests must account for this difference. (2026-01-12)
- **Situation:** Test expected ValidationPipe behavior where 'yes' string gets converted to boolean, but unit test with plainToInstance() showed the decorator rejects the invalid type instead.
- **Root cause:** ValidationPipe is NestJS middleware that applies transformations before validation. plainToInstance is a standalone class-transformer utility without that middleware layer. Tests need to verify decorator behavior, not transformation behavior.
- **How to avoid:** Unit tests can't fully replicate middleware behavior - they verify decorator constraints separately. This means E2E tests are more valuable for catching transformation edge cases.

#### [Pattern] Applied sanitization transforms (trim, remove HTML chars, normalize spaces) BEFORE validation, not after. Decorators handle both concerns in sequence: @Transform -> @IsEmail/@IsLength. (2026-01-12)
- **Problem solved:** User input like '  user@example.com  ' with extra spaces or '<script>alert(1)</script>' in name fields.
- **Why this works:** Validating transformed data is cleaner than validation-then-sanitization. Prevents edge cases where validation passes but sanitization changes meaning (e.g., '   ' passes IsNotEmpty before trim but is empty after).
- **Trade-offs:** Transform decorators must execute first (decorator order matters). Easier to reason about what validators see. Harder to debug if transform removes expected data.

### Helmet configured with CSP allowing 'unsafe-inline' for styleSrc in development (2026-01-12)
- **Context:** Setting up Content Security Policy to block XSS while maintaining development usability
- **Why:** strict-dynamic alone breaks inline styles needed during development; unsafe-inline is pragmatic compromise but creates security debt
- **Rejected:** Pure strict CSP without unsafe-inline would require complete build system changes to extract all inline styles
- **Trade-offs:** Development convenience vs. production security posture; requires explicit removal for production deployment
- **Breaking if changed:** Removing unsafe-inline breaks styling in development unless all inline styles are externalized first

#### [Gotcha] DTOs sanitize with regex replace(/[<>]/g) removing only angle brackets, not full XSS vectors (2026-01-12)
- **Situation:** Input sanitization in NestJS DTOs for user-supplied strings
- **Root cause:** Simple character removal chosen over HTML entity encoding or DOMPurify; matches existing codebase patterns
- **How to avoid:** Minimal sanitization sufficient for database storage but insufficient if outputs aren't context-escaped; depends on downstream template escaping

#### [Pattern] ValidationPipe with whitelist:true as secondary XSS defense mechanism (2026-01-12)
- **Problem solved:** Protecting against property injection and malicious payload escalation
- **Why this works:** Strips unknown properties before they reach business logic; prevents nested object injection that bypasses DTO sanitization
- **Trade-offs:** Strict validation catches more attacks but rejects legitimate optional fields unless explicitly whitelisted; requires API contract discipline

### Read-only GraphQL endpoints with service-only create access (2026-01-12)
- **Context:** Audit logs must be immutable and only created through controlled service methods, never directly by users
- **Why:** Prevents tampering - if mutations were exposed, users could create fake audit entries. Service-only creation ensures all audit logs go through business logic validation
- **Rejected:** Expose create/update/delete mutations - would allow bypassing audit controls and creating fraudulent logs
- **Trade-offs:** Easier: audit integrity guaranteed. Harder: must ensure service methods are called everywhere, not bypassed
- **Breaking if changed:** Exposing mutations would make audit logs untrustworthy as evidence of what actually happened

### Foreign key constraint on sessionId instead of optional/nullable reference (2026-01-13)
- **Context:** LegalQuery must belong to exactly one UserSession; no orphaned queries allowed
- **Why:** Database-level constraint prevents orphaned records and data corruption. Guarantees referential integrity. Enables cascade delete semantics (deleting session removes related queries). Catches application bugs early at database layer.
- **Rejected:** Optional sessionId allows orphaned records, requires application-level validation, creates ambiguous state where query exists without owner
- **Trade-offs:** Gained: data integrity, cascade operations. Lost: ability to store historical queries of deleted sessions (unless soft-delete implemented)
- **Breaking if changed:** Removing foreign key allows orphaned records. Changing to nullable requires data migration and changes referential integrity assumptions

#### [Pattern] Separate DTOs for each layer (Application, Presentation/GraphQL, Presentation/REST) rather than shared DTOs (2026-01-15)
- **Problem solved:** Could reuse single DTO class across layers vs creating layer-specific versions
- **Why this works:** Each layer has different validation rules, field requirements, and serialization needs. GraphQL requires specific type definitions, REST requires swagger decorators and validation pipes. Application DTOs focus on use case requirements, not presentation concerns. Prevents presentation validation rules leaking into domain logic
- **Trade-offs:** Easier: Clear validation ownership, framework-specific decorators stay in framework layer, evolving one layer's API doesn't affect others. Harder: More DTO boilerplate, mapper functions between layers

#### [Gotcha] UUID validation required on sessionId input; invalid UUID format must return GraphQL error rather than database error (2026-01-15)
- **Situation:** Test explicitly validates that invalid UUID like 'not-a-valid-uuid' returns GraphQL error, not server 500
- **Root cause:** Validates input at mutation boundary before database query; prevents confusion between validation errors (client) and system errors; UUID format is a business constraint, not a database artifact
- **How to avoid:** Added validation decorator overhead; gained clear error messaging and security boundary at API layer

#### [Pattern] XSS protection through HTML escaping in template service before rendering user content (2026-01-16)
- **Problem solved:** PDF templates render user-provided document content (title, body) from database. Content could contain malicious HTML/JavaScript
- **Why this works:** Puppeteer runs in a headless Chrome context with full DOM/script capabilities. Unescaped user content could execute arbitrary code. Escaping neutralizes HTML/JS tags before template compilation.
- **Trade-offs:** Slight overhead in template generation (string replacement) buys complete XSS protection. Markdown conversion already handles most formatting needs so raw HTML not needed.

### Applied `select: false` on passwordHash column in User entity to prevent accidental exposure via GraphQL queries (2026-01-19)
- **Context:** Password hashes should never be exposed in API responses, but authentication methods need access to them
- **Why:** Explicit opt-in prevents security leaks by default. Most queries shouldn't return passwords; only auth-specific methods use `findByUsernameOrEmailForAuth()` which explicitly includes it
- **Rejected:** Returning passwordHash in all queries and filtering in service layer (creates implicit rules and maintenance burden); creating separate User vs AuthUser entities (adds complexity)
- **Trade-offs:** Easier: prevents accidental exposure. Harder: requires developers to know about special auth methods; creates two query patterns
- **Breaking if changed:** If removed, passwords exposed in GraphQL schema and regular API responses, creating security vulnerability

#### [Gotcha] Password hashing must use bcrypt comparison method, not string equality, because bcrypt includes salt in hash (2026-01-19)
- **Situation:** Initial implementation might hash password at login and compare with database hash, but bcrypt hashes same password differently each time
- **Root cause:** bcrypt embeds salt in hash format. Only `bcrypt.compare()` can extract salt and verify. String equality would always fail
- **How to avoid:** Correct approach adds ~100ms per auth (acceptable). Wrong approach causes all logins to fail silently

### CORS configured to accept multiple localhost variants plus environment variable frontend URL, with credentials: true enabled (2026-01-19)
- **Context:** Backend needed to accept requests from frontend on multiple possible ports during development
- **Why:** Development flexibility requires accepting 3000, 3001, 4000 variants. Production uses env var. credentials:true needed for cookie-based auth session handling
- **Rejected:** Could have been stricter (single port only) but would break development workflow when ports drift
- **Trade-offs:** Easier: flexible dev setup. Harder: subtle port misconfigurations aren't caught by CORS, auth requests silently fail with 404 instead of CORS error
- **Breaking if changed:** If credentials:true is removed, authentication cookies won't be sent in cross-origin requests, breaking session persistence silently

### Test credentials (email, username, password) created during verification are intentionally documented in summary to remain discoverable (2026-01-19)
- **Context:** Tester created testuser@example.com / testuser / TestPassword123 but did not remove after verification completion
- **Why:** Allows subsequent manual testing and debugging without recreating test accounts; leaves audit trail of test data
- **Rejected:** Removing test user immediately would require rebuilding it for subsequent testing iterations
- **Trade-offs:** Easier testing convenience vs. accumulation of test data in production-like environment; test accounts could be confused with real users
- **Breaking if changed:** If test data is not cleaned up before production deployment, it creates security exposure (known credentials in live system)

### Admin credentials hardcoded in fixtures with bcrypt hashing during seed (2026-01-20)
- **Context:** Development database needs predictable login credentials for testing and local development
- **Why:** Hardcoded credentials in development-only fixtures are acceptable because: (1) fixtures only exist in dev environment, (2) password is hashed at seed time not stored plaintext, (3) matches common development pattern. Using env vars would add unnecessary complexity for dev-only data
- **Rejected:** Storing plaintext passwords; generating random passwords and losing them; requiring manual user creation for each dev setup
- **Trade-offs:** Credentials are predictable for all developers (easier collaboration on test data) but creates security risk if seed script is ever run on production (must be prevented at CI/deployment level)
- **Breaking if changed:** Removing hardcoding would require manual user creation; changing password would break all documented dev workflows; moving to plaintext would expose secrets in git history

### Used double-submit cookie pattern with SameSite=Strict instead of server-side session storage for CSRF tokens (2026-01-20)
- **Context:** Implementing CSRF protection for GraphQL API that needs to work with stateless JWT authentication
- **Why:** Double-submit cookies work with stateless authentication (no session store required), SameSite=Strict provides browser-level protection against cross-site requests, reducing reliance on custom validation logic
- **Rejected:** Server-side CSRF token storage (requires session management contradicting stateless JWT design), or relying solely on SameSite cookies (older browsers lack support)
- **Trade-offs:** Must keep cookie non-HttpOnly so frontend can read it for submission, requires careful HMAC signing to prevent token forgery, adds complexity to client-side token management vs simpler session approach
- **Breaking if changed:** If CSRF_SECRET environment variable changes or HMAC validation is removed, tokens become forgeable; if SameSite attribute is removed, vulnerable to old browser attacks

### Skipped CSRF validation for all GraphQL queries based on read-only assumption rather than explicit mutation-only checks (2026-01-20)
- **Context:** Need to distinguish between safe queries and state-changing mutations in GraphQL
- **Why:** GraphQL queries should never modify state by design; `info.parentType.name` directly identifies operation type, making this a natural security boundary that aligns with GraphQL semantics
- **Rejected:** Analyzing operation complexity/fields to determine safety (error-prone and breaks GraphQL contracts), protecting all operations equally (unnecessary overhead on read operations)
- **Trade-offs:** Simpler implementation leveraging GraphQL's own type system, but relies on developer discipline to use mutations for state changes rather than queries
- **Breaking if changed:** If a developer uses a Query type for state-changing operations (GraphQL anti-pattern), those operations will bypass CSRF protection; if parentType check is removed, queries become protected when they shouldn't be

### Used HMAC-SHA256 signing of tokens with timing-safe comparison instead of cryptographic randomness alone (2026-01-20)
- **Context:** Need to validate that CSRF tokens haven't been tampered with while preventing timing attacks during comparison
- **Why:** HMAC prevents attackers from generating valid tokens even if they steal one token (token is bound to secret); timing-safe comparison prevents attackers from using response timing to guess valid tokens byte-by-byte
- **Rejected:** Simple string comparison (vulnerable to timing attacks), random tokens without signatures (vulnerable to forgery if one token is compromised)
- **Trade-offs:** Adds cryptographic overhead to every CSRF validation but provides defense-in-depth; requires SECRET_KEY management in production
- **Breaking if changed:** If HMAC validation is bypassed or signature checking is removed, attackers can forge valid CSRF tokens; if timing-safe comparison is replaced with normal string comparison, tokens become vulnerable to timing side-channel attacks

#### [Gotcha] CSRF cookie must have httpOnly: false for double-submit CSRF pattern to work, despite being a security anti-pattern. The cookie needs to be readable by JavaScript to extract and send as header. (2026-01-20)
- **Situation:** Implementing CSRF protection with Set-Cookie headers while maintaining cookie accessibility for CSRF token transmission
- **Root cause:** Double-submit CSRF pattern requires client-side access to the CSRF token value. Making it httpOnly would break the pattern entirely since JavaScript couldn't read it to send as X-CSRF-Token header.
- **How to avoid:** Slightly reduced XSS protection (httpOnly=false) vs functional CSRF protection. Mitigated by ensuring X-CSRF-Token header validation server-side.

### Use environment-aware SameSite policy: 'lax' in development (to allow cross-port requests during local testing) and 'strict' in production (maximum security). (2026-01-20)
- **Context:** Backend running on port 3333, frontend on 3000/3001 during development, but same origin in production
- **Why:** Development requires cookies to work across different localhost ports for testing. Production should enforce strict same-site to prevent CSRF. Strict in development would block legitimate local cross-port requests.
- **Rejected:** Static 'strict' would break development workflow; static 'lax' reduces production security unnecessarily
- **Trade-offs:** Added environment branching complexity but maintains both development ergonomics and production security posture
- **Breaking if changed:** If environment detection fails and defaults to wrong value, either development becomes impossible (strict in dev) or production security is weakened (lax in prod)

#### [Pattern] AuthModule exports both REST endpoints (/auth/login, /auth/register) AND GraphQL mutations, providing multiple attack surfaces for same functionality (2026-01-20)
- **Problem solved:** Implementation log shows auth.resolver.ts (GraphQL) exists alongside auth.controller.ts (REST)
- **Why this works:** Supporting both REST and GraphQL APIs requires parallel implementations to maintain feature parity across interface types
- **Trade-offs:** Multiple endpoints increase implementation and testing burden but allow GraphQL clients (more efficient) and REST clients (simpler) to coexist

### Exposing Set-Cookie header via Access-Control-Expose-Headers for frontend access (2026-01-20)
- **Context:** Frontend needs to detect and handle authentication cookies set by backend in cross-origin requests, which are hidden by default due to CORS restrictions
- **Why:** By default, browsers hide Set-Cookie from frontend JavaScript due to security restrictions. Explicitly exposing it allows the frontend to know when authentication succeeded, but only if credentials mode is also enabled
- **Rejected:** Not exposing Set-Cookie would require the frontend to rely on response body for auth token instead, losing automatic cookie handling benefits
- **Trade-offs:** Allows cookie-based auth across origins but requires careful XSS protection since frontend can now see cookie presence; combined with credentials:true, enables cookie theft if XSS exists
- **Breaking if changed:** Removing this header would break frontend's ability to detect successful authentication in cookie-based flows, forcing a switch to token-in-body patterns