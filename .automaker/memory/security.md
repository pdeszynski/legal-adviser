---
tags: [security]
summary: security implementation decisions and patterns
relevantTo: [security]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 62
  referenced: 46
  successfulFeatures: 46
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

### Applied differentiated rate limiting: strict limits (10/min) on CPU-intensive operations (generateDocument, exportDocumentToPdf, submitLegalQuery) vs default limits (100/min) on standard endpoints, with read-only queries skipped entirely (2026-01-20)
- **Context:** Rate limiting all endpoints uniformly would throttle legitimate read traffic; CPU-intensive AI operations needed stronger protection
- **Why:** Granular rate limiting prevents brute force on expensive operations while maintaining usability for read-heavy workflows. Skipping read queries eliminates false-positive rate limit errors for data fetches
- **Rejected:** Flat rate limiting across all endpoints (wastes quota on reads) or purely request-count based without operation type consideration (allows DOS through expensive mutations)
- **Trade-offs:** Requires per-resolver configuration maintenance; simpler to audit but less flexible than dynamic cost-based limiting. Easier to implement than token-bucket with operation weights
- **Breaking if changed:** Removing @SkipThrottle from status queries breaks monitoring systems that poll frequently; removing @StrictThrottle from mutations allows DOS attacks on resource-intensive operations

### Implemented IP-based rate limiting (req.ip) rather than user-based, leaving per-user limits for future enhancement (2026-01-20)
- **Context:** Current implementation has no per-user tracking; single user behind shared proxy could exhaust quota for many legitimate users
- **Why:** IP-based is simpler to implement immediately and works for single-user scenarios; per-user requires extracting authenticated user from JWT context, which adds guard complexity
- **Rejected:** Per-user from start (adds JWT parsing dependency to guard, complicates anonymous request handling); hybrid approach (too complex for initial implementation)
- **Trade-offs:** IP-based is easier but vulnerable to proxy abuse; per-user is more precise but requires guard enhancement. Current approach is documented as future work
- **Breaking if changed:** IP-based limits allow single authenticated user on shared network to DOS others; removing IP-based without adding per-user removes all limiting

### Excluded passwordHash field from GraphQL schema using TypeORM select: false and omitting @Field() decorator (2026-01-20)
- **Context:** Password hash should never be exposed via GraphQL API, but entity has passwordHash property for authentication
- **Why:** Defense-in-depth: Multiple layers prevent exposure. select: false prevents TypeORM from loading it, @Field() absence prevents GraphQL schema inclusion. Single layer failure doesn't expose sensitive data
- **Rejected:** Relying only on @Field() omission - TypeORM could still load the field and a developer might accidentally add @Field()
- **Trade-offs:** Easier: Simple approach. Harder: Requires discipline across multiple frameworks
- **Breaking if changed:** If @Field() is added without removing select: false, data is still protected. If select: false is removed and @Field() is added, password hashes are exposed

### Sanitize sensitive fields (passwords, tokens) BEFORE storing in audit log, not at query time (2026-01-20)
- **Context:** Audit logs contain mutation arguments which may include sensitive user input
- **Why:** Prevents sensitive data from ever being persisted to database. Query-time sanitization is theater - data is already compromised if in DB. Also simpler to implement and query interface doesn't need to know about sanitization rules.
- **Rejected:** Sanitizing at query time - doesn't prevent data breach if database is accessed directly. Requires all consumers to implement same sanitization.
- **Trade-offs:** Easier: Single place to handle, data genuinely protected. Harder: Must know all sensitive fields upfront, if new sensitive field added must update interceptor
- **Breaking if changed:** If sanitization logic is removed, passwords and tokens will be logged in plaintext - compliance violation and major security risk.

#### [Gotcha] CSRF protection on GraphQL mutations makes automated E2E testing impractical without full auth flow (2026-01-20)
- **Situation:** GraphQL API requires CSRF tokens for mutations, preventing simple direct API testing or Playwright tests
- **Root cause:** CSRF protection is correct and necessary security practice. However, it means test setup must include full browser authentication flow rather than just calling mutations directly
- **How to avoid:** Security is maintained at cost of simpler automated testing. Manual verification is recommended as pragmatic compromise rather than fighting the security layer

### Implemented ownership validation (canShare check) before allowing document sharing, not relying solely on GraphQL authorization guards (2026-01-20)
- **Context:** Preventing non-owners from sharing documents they can view
- **Why:** GraphQL guards authenticate the user but don't authorize against specific resource ownership; service layer must verify ownership to prevent privilege escalation where a user with VIEW access tries to share a document
- **Rejected:** Relying only on @UseGuards(JwtAuthGuard) on resolver - would allow any authenticated user to share any document they can view
- **Trade-offs:** Adds service-layer authorization check (+security, +correctness) but creates two levels of authorization to maintain (-complexity)
- **Breaking if changed:** Removing ownership check would allow any authenticated user to share documents; existing tests assume ownership validation exists

#### [Pattern] Permission validation happens at three layers: GraphQL decorator guards, service-level ownership check, and database constraints (2026-01-20)
- **Problem solved:** Securing multi-user document sharing against various attack vectors
- **Why this works:** Defense in depth - each layer catches different attack vectors. Guards catch unauthenticated users, service checks authorization, database prevents logical inconsistencies
- **Trade-offs:** Multiple layers (+security) create redundancy (-performance, -complexity) but failures don't cascade catastrophically

#### [Pattern] Cascade delete configured asymmetrically: users/documents deletion cascades to shares, but shares deletion doesn't cascade (2026-01-20)
- **Problem solved:** Maintaining referential integrity when users or documents are deleted vs. when shares are explicitly revoked
- **Why this works:** Deleting a document should clean up all shares (no dangling permissions). Deleting a user should clean up all their shares (no orphaned records). But revoking a share is a normal operation that shouldn't trigger cascades
- **Trade-offs:** More complex schema definition, but prevents both data loss and orphaned records

#### [Pattern] Store authorUserId as reference field enabling audit of who created each version, with validation that author is provided (2026-01-21)
- **Problem solved:** Legal documents require knowing who made changes and when
- **Why this works:** Recording authorUserId at version creation time creates immutable audit trail. Validation at entity level prevents accidental creation of orphan versions. Links to UserSession enables reconstructing context (timezone, location) if needed for forensic analysis
- **Trade-offs:** Easier: query author motivation complete. Harder: introduces foreign key constraint, requires user context at version creation

#### [Gotcha] SendGrid API key validation happens at runtime (isConfigured check) not at startup (2026-01-21)
- **Situation:** Service initializes even with missing/invalid SendGrid key if EMAIL_ENABLED=true, only fails when attempting to send
- **Root cause:** Development mode needs to work without SendGrid (EMAIL_ENABLED=false). Lazy validation allows dev setup without secrets. Hard failure at startup would block entire app if email config is missing.
- **How to avoid:** Easier dev experience, but bad config only discovered when first email queued (not at app start). Difficult to catch in testing.

### HMAC SHA256 webhook signature verification using SendGrid-provided verification key (2026-01-21)
- **Context:** Public webhook endpoint needs protection against spoofed webhook requests that could corrupt notification status
- **Why:** Webhooks are publicly exposed HTTP endpoints. Without verification, attacker could send fake bounce events to mark emails as failed. HMAC ensures only SendGrid can trigger state changes. Standard practice for webhook security
- **Rejected:** IP whitelisting alone - too fragile as SendGrid changes IPs. Simple shared secret without HMAC - vulnerable to replay attacks
- **Trade-offs:** Adds verification overhead on each webhook but eliminates entire class of injection attacks. Small performance cost for significant security gain
- **Breaking if changed:** Removing verification allows arbitrary state mutations to notification records through crafted HTTP requests to webhook endpoint