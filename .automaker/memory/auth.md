---
tags: [auth]
summary: auth implementation decisions and patterns
relevantTo: [auth]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 12
  referenced: 12
  successfulFeatures: 12
---
# auth

#### [Pattern] Created dedicated `findByUsernameOrEmailForAuth()` method instead of adding credentials to standard `findByUsername()`/`findByEmail()` (2026-01-19)

- **Problem solved:** Need to query users with passwordHash selected during authentication, but normal queries should exclude it
- **Why this works:** Explicit naming signals intent. Prevents accidental use of wrong query method. Centralizes auth-specific logic. Creates clear contract: this method exists only for authentication
- **Trade-offs:** Easier: clear intent, no hidden logic. Harder: more methods to maintain

#### [Gotcha] Inactive users must be checked AFTER credential validation, not before, to avoid timing attack vulnerabilities (2026-01-19)

- **Situation:** Validation flow: lookup user, verify password, check if active. Checking active status before password validation reveals which usernames exist
- **Root cause:** Timing attacks can distinguish between 'user not found' vs 'invalid password' by measuring response time. Consistent flow means always doing password comparison regardless of active status
- **How to avoid:** Easier: marginal, since password comparison is always done anyway. Harder: requires careful implementation ordering

#### [Pattern] Password validation DTO (RegisterDto) enforces regex pattern instead of relying on service-layer validation (2026-01-19)

- **Problem solved:** Password complexity requirements (minimum length, character types) must be enforced before database operations
- **Why this works:** DTO validation happens at HTTP layer before reaching business logic. Fails fast with clear error messages. Prevents invalid passwords from ever reaching database
- **Trade-offs:** Easier: clear error messages to clients. Harder: password rules hardcoded in DTO

### JWT payload includes both 'sub' (user ID) and 'email' fields despite email being queryable from user ID (2026-01-19)

- **Context:** When migrating REST auth to GraphQL, needed to decide what information to embed in JWT token
- **Why:** Avoids N+1 queries in GraphQL resolvers - email is frequently needed in me query and mutations without requiring additional database lookup
- **Rejected:** Minimal payload with only 'sub', requiring resolver to fetch user details on every request
- **Trade-offs:** Slightly larger token payload vs eliminates database query per request; token becomes invalid if user email changes (acceptable since email changes rare)
- **Breaking if changed:** If removed, GraphQL resolvers using email from context.user would fail; queries relying on cached email information would return stale data until token refresh

#### [Gotcha] JwtStrategy required explicit UUID user ID handling instead of string ID assumptions (2026-01-19)

- **Situation:** Pre-existing JWT strategy assumed string-based IDs; auth module uses UUID user IDs from Users table
- **Root cause:** TypeScript type mismatch causes validation errors during token verification if ID type doesn't match exactly
- **How to avoid:** Explicit type handling upstream vs potential runtime errors downstream; discovered during GraphQL integration that pre-existing code had unaddressed type mismatch

#### [Pattern] Separate GqlAuthGuard extending from base GraphQL context guard instead of reusing REST guard (2026-01-19)

- **Problem solved:** GraphQL and REST have different context structures; token extraction location differs between @Headers decorator and GraphQL context object
- **Why this works:** GraphQL context is dictionary-based while Express guards work with Request objects - extracting from wrong source silently fails rather than throwing
- **Trade-offs:** Code duplication vs explicit, debuggable guard behavior; small module size increase prevents hidden context-related bugs

#### [Pattern] Using dynamic email in test (Date.now()) instead of static test account (2026-01-19)

- **Problem solved:** Registration mutation creates real users in database; test isolation requires unique identifiers
- **Why this works:** Avoids flaky tests from duplicate key errors when tests run multiple times; each test run gets fresh unique user
- **Trade-offs:** Database grows with test runs vs guaranteed test isolation; simple pattern that works with any test runner

### Separate cookie storage for access_token (1hr), refresh_token (7d), and auth (user data) instead of single auth cookie (2026-01-19)

- **Context:** GraphQL-based auth provider needed to manage JWT tokens and user state across requests
- **Why:** Separate concerns: access_token has short expiry for security, refresh_token has long expiry for UX, auth cookie separates identity data from credentials. Enables independent refresh logic without reshuffling user data
- **Rejected:** Single auth cookie with all data would require re-parsing and re-setting entire cookie on token refresh, increasing cookie size and mutation complexity
- **Trade-offs:** Three cookies increase payload per request marginally but enable granular expiry policies; refresh token in cookie requires httpOnly consideration for XSS protection
- **Breaking if changed:** Existing users lose session on deploy since cookie structure changed; downstream code expecting single auth cookie structure breaks

#### [Pattern] Dual-path token refresh: automatic in check() when access_token missing + error-driven in onError() on 401 (2026-01-19)

- **Problem solved:** Need to handle expired tokens seamlessly without requiring user intervention or forcing logout
- **Why this works:** check() path catches stale tokens during session validity checks (proactive); onError() path handles race conditions where token expires between request and execution (reactive). Two paths catch both anticipated and unanticipated expiry scenarios
- **Trade-offs:** Dual paths mean refresh can happen twice in sequence (overhead) but guarantees tokens are valid before sensitive operations; adds complexity to trace which path triggered refresh

#### [Gotcha] Spread operator order matters: ...userData spread must come AFTER name property to allow name override (2026-01-19)

- **Situation:** Refactored to reduce redundant explicit field mapping (id, email) by spreading all user data, but name needs computed fallback logic
- **Root cause:** GraphQL me query returns all user fields; spreading them prevents accidental field loss from future backend changes. But name needs conditional logic (firstName+lastName vs username vs email), so must be calculated and placed after spread to override backend name
- **How to avoid:** Spread-based approach is more maintainable with schema evolution but obscures which fields are used; code review can't catch silent field additions

#### [Gotcha] Server-side auth check must validate new cookie structure but cannot rely on frontend auth provider being called first (2026-01-19)

- **Situation:** Updated server auth provider to check access_token + refresh_token + auth cookies, but frontend may call server code before establishing authenticated session
- **Root cause:** Server-side rendering or API routes may execute before any client-side auth provider setup. Server auth check must be self-contained and not assume browser context exists. Checking all three cookies ensures consistency across client and server paths
- **How to avoid:** Checking multiple cookies adds logic complexity but handles both SPA and SSR flows; increases validation surface area

#### [Pattern] Hardcoded GraphQL endpoint URLs in auth/data providers with environment variable fallback, discovered through provider files not environment config (2026-01-19)

- **Problem solved:** Frontend providers had hardcoded port 4000 defaults that didn't match backend actual port or environment setup
- **Why this works:** Providers needed defaults for development, but defaults should have matched actual development environment setup. Pattern reveals: provider layer is wrong place for URL authority
- **Trade-offs:** Easier: providers are self-contained. Harder: URL source of truth is fragmented across multiple files and .env files

#### [Gotcha] Bull queue duplicate handler registration failure during backend startup - caused by @nestjs/bull hot-reloading or Redis connection handling (2026-01-19)

- **Situation:** Backend failed to start with queue processors enabled; queue handlers were being registered multiple times
- **Root cause:** Bull/NestJS queue processors appear to re-register handlers on module initialization, causing conflicts when the same queue connection is accessed multiple times
- **How to avoid:** Temporarily disabling processors allowed testing to proceed, but leaves async job processing non-functional and investigation incomplete

### GraphQL schema uses `username` field for login mutation that accepts both email addresses and usernames as valid input values (2026-01-19)

- **Context:** Frontend login form collects email but must submit to username field; backend validates credential flexibility
- **Why:** Allows users to authenticate with either their email or chosen username, improving UX without requiring separate endpoints
- **Rejected:** Separate email/username endpoints would require duplicate validation logic and frontend conditional logic
- **Trade-offs:** Single endpoint is simpler to maintain but requires clear schema documentation; field naming is misleading
- **Breaking if changed:** If validation changed to only accept actual usernames and reject emails, it would break existing users who authenticate with email

#### [Pattern] Dual token storage strategy: JWT tokens stored in HttpOnly cookies AND available as Authorization headers for GraphQL requests (2026-01-19)

- **Problem solved:** Cross-origin GraphQL requests need both CORS-compatible credentials and explicit bearer authentication
- **Why this works:** HttpOnly cookies prevent XSS token theft; explicit Authorization headers allow fine-grained token control per request and work with CORS credentials: 'include'
- **Trade-offs:** Dual storage adds complexity but provides defense-in-depth; requires careful cookie configuration (Secure, SameSite flags)

#### [Pattern] Excluded authentication mutations (login, register, refreshToken) from CSRF protection using @SkipCsrf decorator (2026-01-20)

- **Problem solved:** New users cannot possess a CSRF token before registration; existing users cannot refresh tokens if CSRF validation blocks the refresh mutation
- **Why this works:** These mutations are identity-establishing operations where CSRF protection creates a chicken-egg problem - attacker cannot gain meaningful access by forcing these mutations on an unauthenticated user
- **Trade-offs:** Slightly reduces attack surface on auth mutations but gains usability; must carefully audit which mutations truly don't need CSRF protection vs which ones do

### Add credentials: 'include' to ALL cross-origin fetch requests, not just login/auth endpoints. This is required for ANY cookie-based auth in CORS scenarios. (2026-01-20)

- **Context:** Authentication cookies weren't being sent with data-provider GraphQL queries despite CORS being configured
- **Why:** Browsers default to credentials: 'omit' for cross-origin requests - cookies are NOT sent by default even with CORS headers present. Every request needs explicit opt-in.
- **Rejected:** Assuming CORS headers alone would make cookies work; assuming only auth endpoints need credentials
- **Trade-offs:** Requires discipline to add credentials flag consistently across all fetch calls. Forgetting it on one request breaks auth silently.
- **Breaking if changed:** Removing credentials: 'include' from any fetch call will cause authentication to fail silently - no error, just lost cookies

#### [Gotcha] Registration endpoint returns 201 on success but login endpoint returns 201 instead of 200, inconsistent HTTP semantics (2026-01-20)

- **Situation:** Playwright test expected 200 for login but got 201 Created response
- **Root cause:** Likely implementation detail - login may be creating a session/token record rather than retrieving existing credentials
- **How to avoid:** Returning 201 communicates that something was created (session/token) but violates REST expectations that login is a read operation not create

### Allowing multiple localhost ports (3000, 3001, 4000) plus environment variable for dynamic origins (2026-01-20)

- **Context:** Development environment needs flexibility for different frontend dev servers while production needs security control via environment variable
- **Why:** Hardcoding all possible origins in code doesn't scale; multiple ports support different local development scenarios. Using env var for production allows secure configuration without code changes
- **Rejected:** Hardcoding only 3000 would break developers using other ports; using only env var would require recompilation for local development
- **Trade-offs:** Code lists specific ports (less secure if exhaustive list is assumed complete) but env var provides production safety; requires developers to know about FRONTEND_URL variable
- **Breaking if changed:** Removing localhost port allowances would break development workflows; removing env var support would force hardcoding production URLs or restart requirement for URL changes
