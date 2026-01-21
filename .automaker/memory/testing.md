---
tags: [testing]
summary: testing implementation decisions and patterns
relevantTo: [testing]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 4
  referenced: 2
  successfulFeatures: 2
---

# testing

#### [Gotcha] Translation file validation requires deep key comparison across nested objects; shallow equality checks miss structural mismatches between locales (2026-01-12)

- **Situation:** Implemented tests to verify all locales have identical keys with same nesting structure
- **Root cause:** Translation systems commonly have keys missing at deeper nesting levels (e.g., documents.messages.notFound exists in one locale but not another), which shallow tests won't catch
- **How to avoid:** Recursive key extraction is slower but catches real structural mismatches that break rendering at specific paths

### Used temporary Playwright E2E tests for translation validation rather than static JSON schema validation or unit tests (2026-01-12)

- **Context:** Needed to verify translations work end-to-end: JSON validity, key consistency, locale cookie interaction, and page rendering with locale applied
- **Why:** Playwright tests the actual middleware + i18n integration path that users experience; static validation misses runtime middleware behavior and cookie-based locale switching logic
- **Rejected:** JSON schema validation - catches structural issues but not middleware/cookie behavior; unit tests of translation loading - too isolated, misses integration failures
- **Trade-offs:** Playwright is slower and heavier than static checks, but catches integration issues that static validation misses; requires browser environment setup
- **Breaking if changed:** Removing Playwright tests leaves no validation that locale cookie actually triggers translation switching in SSR context; static tests would only verify file structure, not behavior

#### [Gotcha] End-to-end tests couldn't be run due to pre-existing dependency conflicts (missing @as-integrations/express5), yet unit tests passed completely. This masks potential E2E validation issues. (2026-01-12)

- **Situation:** Infrastructure dependency issue prevented Playwright E2E test execution while 36 unit validation tests passed and build succeeded.
- **Root cause:** Unit tests validate decorator logic in isolation (plainToInstance + validate). E2E tests validate the full pipeline (HTTP request -> ValidationPipe -> decorator -> handler). These are different validation contexts.
- **How to avoid:** Unit tests give false confidence. Middleware transforms (like implicit type coercion) are only tested in E2E. Dependency issues can block comprehensive testing.

#### [Gotcha] Build passes successfully but full verification requires running Docker and PostgreSQL - schema.gql file validates structure but doesn't verify runtime behavior (2026-01-12)

- **Situation:** Build succeeded but couldn't test actual GraphQL queries without database connection
- **Root cause:** TypeScript compilation and schema generation happen without database - they only validate decorators and type definitions. Runtime verification needs actual database connectivity to test query execution
- **How to avoid:** Faster feedback loop from build (no database needed), but introduces gap between schema validation and actual query execution. Could mask runtime bugs like missing indexes or N+1 queries

#### [Gotcha] Enum value assertions must test string values not just existence (2026-01-12)

- **Situation:** Tests checked AuditActionType.CREATE exists but didn't verify it equals 'CREATE'
- **Root cause:** Enums can be defined but have wrong values - must verify the actual string value used in logs and queries
- **How to avoid:** Easier: catch value drift. Harder: more verbose tests but catches real bugs

#### [Gotcha] Schema verification test reads compiled schema.gql file as source of truth rather than testing resolver behavior or database integration (2026-01-13)

- **Situation:** Feature verification needed to confirm GraphQL schema generation produced expected types, fields, and operations
- **Root cause:** schema.gql is auto-generated from decorators during build - testing the output validates the entire pipeline (decorators→codegen→schema) in one step. Avoids need for running database-connected tests.
- **How to avoid:** Gained: Tests pass without database setup. Lost: Doesn't verify resolver logic executes correctly or database queries work

### Verification tests were created as temporary test files, run once to confirm implementation, then deleted rather than kept as permanent test suite (2026-01-13)

- **Context:** Need to verify 22 specific schema generation behaviors to confirm feature completeness
- **Why:** These behaviors are compile-time guarantees from the build process, not runtime behavior - once verified once, they don't need continuous testing. Keeping them would create redundant test coverage.
- **Rejected:** Could have added permanent schema verification tests, but that creates brittleness if schema format changes
- **Trade-offs:** Gained: Lightweight CI/CD, no redundant tests. Lost: No permanent record of what was verified, requires manual re-verification if schema generation changes
- **Breaking if changed:** If someone modifies the schema generation process, there's no automated test to catch regressions in what was previously verified

#### [Gotcha] Unit tests pass but E2E tests cannot run without database infrastructure - both are needed to validate GraphQL integration (2026-01-13)

- **Situation:** Implementation verified with 19 unit tests, but actual GraphQL query execution couldn't be tested due to PostgreSQL unavailable
- **Root cause:** Unit tests verify entity logic and decorators in isolation. E2E tests verify the full GraphQL resolver chain, database persistence, and response serialization. Without E2E confirmation, schema generation bugs or decorator configuration errors remain undetected.
- **How to avoid:** Gained: fast local testing without infrastructure. Lost: confidence in GraphQL schema correctness, resolver response formatting, and database integration

#### [Gotcha] Non-null assertion operator (!) was required on JSONB array accesses in tests to satisfy TypeScript strict null checks (2026-01-13)

- **Situation:** Test assertions like `analysis.relatedDocumentLinks[0]` failed compilation because TypeScript couldn't guarantee non-null array contents
- **Root cause:** JSONB columns are typed as optional (nullable) in TypeScript/ORM layer. Without null coalescing, accessing array indices needs explicit non-null assertions or optional chaining guards
- **How to avoid:** Gained: compile-time null safety. Lost: slightly more verbose test code with ! operators

#### [Gotcha] E2E tests for queue system cannot run without full environment setup (Redis, database, AI service mocking), making verification difficult during development (2026-01-13)

- **Situation:** Created E2E test but had to delete it because test environment had missing dependencies unrelated to queue implementation
- **Root cause:** Queue processor touches multiple systems (Redis, database, external AI service). Unit tests alone cannot verify integration without mocking all dependencies. E2E tests need full stack.
- **How to avoid:** Settled on TypeScript compilation + ESLint verification only; requires higher confidence in code review and manual testing; E2E tests should be integrated into CI/CD pipeline with proper environment setup

#### [Gotcha] Playwright's waitForTimeout(500) is necessary because React re-renders aren't deterministic - state updates don't guarantee DOM updates in measurable time. Relying on element visibility checks alone misses render cycles. (2026-01-14)

- **Situation:** Tests that set filter values immediately checked for clear button visibility and failed intermittently. Problem: React batches state updates, and TanStack Table filters may trigger additional re-renders. Hard waits prevented race conditions.
- **Root cause:** E2E tests interact with real async component lifecycle. useTable hook updates state asynchronously, table re-renders, then clear button should appear. Visibility check alone doesn't account for in-flight updates.
- **How to avoid:** Hard waits make tests slightly slower (~500ms added per interaction), but eliminate flakiness. Better approach would be using data-testid attributes and custom waiters, but framework constraints made this impossible.

#### [Gotcha] networkidle wait strategy causes timeouts on development servers with persistent connections (2026-01-14)

- **Situation:** Playwright tests were timing out indefinitely when using waitForLoadState('networkidle') against a local Next.js dev server
- **Root cause:** Development servers often keep connections alive (hot reload, HMR), preventing network from ever being completely idle. Production builds don't have this issue.
- **How to avoid:** Using 'domcontentloaded' + explicit selector wait is less reliable than networkidle but works with dev servers. Must manually verify elements load with waitForSelector.

#### [Pattern] Delete confirmation modal must be explicitly tested with modal visibility check before interaction (2026-01-14)

- **Problem solved:** Modal component doesn't render until showDeleteModal state is true. Must verify modal exists before attempting to interact with its buttons.
- **Why this works:** Prevents false positives where tests pass because the button never existed. Makes test failures clear about what actually happened.
- **Trade-offs:** Extra assertions add test verbosity but catch real issues. Without them, tests might pass incorrectly.

#### [Gotcha] Test file (documents.service.spec.ts) required immediate update to mock GraphQLPubSubService after it became a required dependency (2026-01-14)

- **Situation:** Added GraphQLPubSubService as constructor dependency in DocumentsService, breaking existing unit tests that didn't provide this mock
- **Root cause:** NestJS TestingModule strict mode requires all provider dependencies to be declared in test setup, even if not directly tested
- **How to avoid:** Required synchronous test fix before build passes, but caught integration issues early. Better than discovering at deployment.

#### [Pattern] Playwright filesystem structure verification as alternative to dynamic runtime checks for architectural compliance (2026-01-14)

- **Problem solved:** 34 tests checking that required events, value objects, aggregates exist with correct naming in 4 bounded contexts
- **Why this works:** Catches architectural violations at build time before they reach production. Verifies team follows naming conventions (e.g., `.vo.ts`, `.event.ts` suffixes) automatically. Cheaper than runtime reflection across module system.
- **Trade-offs:** Easier: Instant feedback, clear contract. Harder: False positives if file exists but not properly exported/used

#### [Gotcha] Turbo cache output contains ANSI color codes when logged to stdout, breaking string matching in tests (2026-01-14)

- **Situation:** Playwright test checking for 'FULL TURBO' cache hit marker was failing despite cache working correctly
- **Root cause:** Turbo colors terminal output by default. execSync() captures raw terminal output including escape sequences. String literal matching fails on colored output.
- **How to avoid:** Using regex with /cached|FULL TURBO/i catches both colored and plain text variants. Slightly less strict but more robust.

#### [Gotcha] Architecture verification tests cannot run with Playwright's default web server config - requires custom configuration for file-system-only tests (2026-01-15)

- **Situation:** Attempted to run Playwright tests checking file structure imports/exports without starting web server, but Playwright defaults to launching browser and server
- **Root cause:** Playwright is designed for browser automation; its testMatch patterns and configuration expect integration tests. Static analysis tests (reading files, checking imports) are orthogonal to Playwright's purpose but can be technically executed in its test runner
- **How to avoid:** Easier: Unified test runner and reporting. Harder: Had to create custom Playwright config, requires understanding that architecture tests are anti-pattern for Playwright

#### [Gotcha] UUID ESM module requires Jest configuration with module mapping and transformIgnorePatterns; naive config causes module loading failures (2026-01-15)

- **Situation:** Running tests that import uuid from domain aggregates
- **Root cause:** UUID is pure ESM, Jest defaults don't transform node_modules. Without explicit mapping to mock, Jest fails to load uuid in test environment. Standard `transformIgnorePatterns` regex was too permissive
- **How to avoid:** Adding explicit uuid mock adds small overhead but guarantees consistent test behavior; prevents flaky UUID generation in tests

### File-based verification tests (checking for UseCase invocations, error handling patterns) rather than runtime integration tests (2026-01-15)

- **Context:** Pre-existing TypeScript errors in use-cases prevented web server from starting for integration tests
- **Why:** Services are thin orchestrators - verifying they delegate to use cases and handle errors correctly can be done via static analysis. This avoids bootstrap failures from unrelated compilation errors.
- **Rejected:** Running full integration tests would require fixing all upstream errors and maintaining test environment, but the real verification (services don't contain logic) is code-structural
- **Trade-offs:** File-based tests are fragile to refactoring but gained: ability to verify layer contract independent of other layers, faster feedback loop, avoids bootstrap coupling
- **Breaking if changed:** If services are modified to contain business logic directly or stop delegating to use cases, these tests wouldn't catch it without explicitly checking for absence of domain operations

#### [Pattern] Temporary verification tests should be written and deleted after confirming functionality, with Playwright config updated to generic patterns (2026-01-15)

- **Problem solved:** Needed to validate 14 specific GraphQL operations (CRUD, filtering, pagination, aggregates) before committing
- **Why this works:** Specific test files allow targeted verification without cluttering permanent test suite. Deletion after validation keeps codebase clean. Generic config (\*.spec.ts) prevents brittleness
- **Trade-offs:** Adds verification step during implementation but ensures config doesn't encode implementation details. Makes future test discovery consistent

#### [Pattern] Introspection-based schema validation via GraphQL \_\_type queries for mutation field presence (2026-01-15)

- **Problem solved:** Test uses introspection query to verify AnswerLegalQueryInput has answerMarkdown and citations fields, rather than attempting mutation
- **Why this works:** Validates schema definition without requiring valid data or downstream dependencies; decouples schema verification from behavioral testing; detects schema generation issues early
- **Trade-offs:** Schema tests are metadata-level and don't catch behavioral bugs; gained fast feedback on schema structure and auto-generated type definitions

### Playwright integration tests must run in serial mode (--workers=1) when tests have dependencies. Skipped tests need previous test's state (created entity ID) to execute. (2026-01-16)

- **Context:** Integration tests created entity in first test, then subsequent tests queried/updated/deleted it using the generated ID. Tests appeared to skip or fail until serial execution was enforced.
- **Why:** Playwright defaults to parallel execution across workers. When test B depends on entity created by test A, parallel execution causes B to run before A completes, or in a different worker without access to shared state.
- **Rejected:** Using global state/fixtures - breaks test isolation. Refactoring tests to be fully independent - requires creating separate entities for each test, defeating the purpose of integration flow testing.
- **Trade-offs:** Serial execution adds time (~120s for 8 tests) vs parallel would be faster. But gains comprehensive flow testing showing real dependencies between operations (create→read→update→delete).
- **Breaking if changed:** Removing --workers=1 flag causes dependent tests to be skipped silently. CI pipelines may not catch this without explicit configuration. Running tests in isolation (e.g., single test file) may hide failures that appear in full suite.

#### [Gotcha] E2E test validation requires excluding problematic serialization fields - removed rulingDate from GraphQL query but kept in mutation input (2026-01-16)

- **Situation:** Test created legal ruling with rulingDate input (valid) but response query would fail if rulingDate included in response fields
- **Root cause:** Input transformation succeeds (string → Date in database) but response serialization fails (Date → GraphQL DateTime scalar). The entity stores the value but GraphQL layer cannot serialize it
- **How to avoid:** Test passes but doesn't validate rulingDate is actually returned. Data is stored correctly but API contract doesn't expose it. Need separate integration test with custom resolver to verify date handling

#### [Pattern] PDF magic byte verification (%PDF-) instead of full PDF parsing in unit tests (2026-01-16)

- **Problem solved:** Tests need to verify PDF generation produces valid PDFs without parsing entire PDF structure
- **Why this works:** PDF parsing is complex; magic byte check is lightweight and catches 95% of PDF generation failures (wrong format, corruption, truncation). Balance between coverage and test speed (30s timeout for each test).
- **Trade-offs:** Misses edge cases like corrupted PDF structure but catches major generation failures with O(1) check. Acceptable for unit tests; integration tests would do full validation.

### Unit tests mock password hashing but verify actual bcrypt format, then separate e2e test validates complete flow with real hashing (2026-01-19)

- **Context:** Can't efficiently test bcrypt password comparison in unit tests without real hashing (would be slow). Need both unit test coverage and real integration verification
- **Why:** Unit tests use hardcoded hash values for speed. E2E tests verify bcrypt actually works. Combined approach catches both logic errors and crypto failures
- **Rejected:** Only unit tests with mocks (misses crypto integration bugs); mocking bcrypt in all tests (defeats purpose); only e2e (too slow for frequent runs)
- **Trade-offs:** Easier: fast feedback from unit tests. Harder: must maintain separate test files
- **Breaking if changed:** If bcrypt verification removed from e2e tests, real authentication bugs won't be caught until production

#### [Gotcha] Cannot verify GraphQL auth mutations end-to-end due to Bull queue handler conflict unrelated to auth implementation (2026-01-19)

- **Situation:** Project has pre-existing duplicate Bull queue handler registration that prevents server startup needed for E2E tests
- **Root cause:** External dependency initialization happens before auth routes load; test infrastructure blocked at server bootstrap stage
- **How to avoid:** Code review and compilation verification sufficient for type safety but loses integration test coverage; future Bull fix unblocks Playwright tests

#### [Gotcha] Playwright tests created to verify fix but then deleted - verification was incomplete because backend restart requirement wasn't communicated in test (2026-01-19)

- **Situation:** Test showed 'connection refused on 3001' which was correct indicator that backend hadn't been restarted, but this wasn't documented as expected/normal state
- **Root cause:** Configuration changes require service restart but this dependency wasn't explicit in the change set. Test cleanup removed evidence of what needed to be verified
- **How to avoid:** Easier: cleaner state after fix. Harder: no remaining verification that restart actually completes the fix

#### [Pattern] Progressive verification strategy: curl backend tests → CORS headers check → Playwright browser integration tests (2026-01-19)

- **Problem solved:** Login flow spans GraphQL API, HTTP headers, browser cookies, and UI rendering - each layer has different failure modes
- **Why this works:** Each layer tests different aspects (API logic, network headers, browser behavior); failures at lower layers are faster to diagnose than integration test failures
- **Trade-offs:** Multiple test types require more setup but provide confidence that each layer works; faster debugging when issues occur

#### [Gotcha] GraphQL API connection format changed from nodes/totalCount to edges.node pattern during implementation (2026-01-20)

- **Situation:** Verification test broke when querying legalDocuments - API contract didn't match test assumptions
- **Root cause:** Production GraphQL API uses relay-style cursor pagination (edges/nodes) rather than simple array. Test was written against expected old format before checking actual API specification
- **How to avoid:** Test required refactoring to match actual API (map edges to nodes). Revealed mismatch between documentation and implementation

### Verification test checked fixture existence via GraphQL queries instead of direct database inspection (2026-01-20)

- **Context:** Need to validate that seeding actually created usable data accessible through the application API
- **Why:** GraphQL endpoint is the actual contract with clients. Testing through it validates end-to-end: seeding → database → API layer → response format. Direct DB queries would miss API layer bugs (schema mismatches, authorization, pagination format)
- **Rejected:** Direct database SQL queries would verify seed data exists but not that API exposes it correctly; unit tests of seed service alone wouldn't catch integration issues
- **Trade-offs:** Slower than DB queries but catches more bugs. Requires running full server; can't test database-only issues
- **Breaking if changed:** Removing GraphQL validation would miss API contract bugs (like the edges/node format issue that was discovered); tests become database-centric rather than API-centric

#### [Pattern] Use Playwright for integration testing CORS + auth flows because it respects browser security models and CORS policies that unit tests/mocks would skip. (2026-01-20)

- **Problem solved:** Manual header checking passed but actual browser CORS + cookie behavior needed verification
- **Why this works:** CORS and cookie behavior are browser-enforced security policies. Playwright runs real browser context respecting these policies. Direct HTTP client tests skip browser validation entirely.
- **Trade-offs:** Playwright tests are slower and require running application but catch real-world CORS failures that mock tests miss

#### [Pattern] Verification approach used Playwright HTTP request API to test REST endpoints instead of direct E2E browser tests (2026-01-20)

- **Problem solved:** AuthModule functionality needed verification but feature doesn't require browser UI interaction
- **Why this works:** HTTP request testing is faster and more reliable than browser automation for API-only endpoints; doesn't require rendering browser context
- **Trade-offs:** Playwright request API is lightweight and fast (no browser overhead) but cannot catch UI-layer auth bugs or integration with frontend

#### [Pattern] Using Playwright request API for CORS verification instead of unit tests (2026-01-20)

- **Problem solved:** Verifying CORS headers requires testing HTTP preflight requests (OPTIONS) and response headers, which cannot be properly tested in traditional unit tests without mocking the entire HTTP layer
- **Why this works:** Playwright's request API makes actual HTTP calls and captures real response headers, allowing verification of CORS behavior at the integration level. Testing preflight behavior requires actual HTTP semantics that unit tests cannot verify
- **Trade-offs:** Integration tests are slower than unit tests but provide confidence that CORS actually works end-to-end; temporary test files must be cleaned up afterward

#### [Gotcha] Temporary test files need explicit deletion; test discovery doesn't distinguish temporary from permanent tests (2026-01-20)

- **Situation:** Created cors-verification.spec.ts as temporary verification, but Playwright test discovery would run it in CI/CD permanently if not deleted
- **Root cause:** Playwright discovers all .spec.ts files in the test directory regardless of intent; no built-in way to mark tests as temporary or one-time verification
- **How to avoid:** Manual deletion is simple but requires discipline; adding skip markers would keep the file but requires cleanup later

#### [Gotcha] Global ThrottlerGuard fails with GraphQL context that lacks proper request object structure (Cannot read properties of undefined reading 'ip') (2026-01-20)

- **Situation:** Playwright test for GraphQL mutations failed with throttler error, preventing validation of mutations even though schema generation worked
- **Root cause:** ThrottlerGuard expects HTTP request object with IP address for rate limiting. GraphQL context wraps the request differently, causing undefined access. This is a configuration issue not a feature issue
- **How to avoid:** Easier: Schema can be verified via introspection without executing mutations. Harder: Cannot do end-to-end testing without fixing throttler configuration

### Created Playwright test to verify end-to-end behavior rather than unit testing the interceptor (2026-01-20)

- **Context:** Needed to verify interceptor actually captures mutations when integrated with rest of system
- **Why:** Interceptor only has value when integrated - unit test wouldn't catch issues with middleware ordering, missing registration, or integration with persistence. E2E test shows the feature works from user perspective.
- **Rejected:** Pure unit tests of interceptor class - would test in isolation but not real-world execution. Manual testing - not reproducible.
- **Trade-offs:** Easier: Confident feature works end-to-end, catches integration issues. Harder: Test requires running server, more fragile, slower to run
- **Breaking if changed:** Without E2E test, interceptor could be registered incorrectly (wrong order, not global, etc.) and nobody would know until production.

#### [Gotcha] ThrottlerGuard rejects repeated test requests in E2E tests even with different test IDs, causing verification failures despite working feature (2026-01-20)

- **Situation:** Playwright test ran multiple GraphQL queries in sequence against production-like ThrottlerGuard configuration
- **Root cause:** ThrottlerGuard rate limits by client IP (all test requests appear from same IP). Test environment configuration didn't exempt test client or adjust burst limits
- **How to avoid:** Test verification skipped in favor of manual testing. Feature works correctly but confidence gap for CI/CD pipelines. Manual testing more thorough but not automated

#### [Gotcha] Playwright automated tests failed silently due to authentication requirement not being handled in test setup (2026-01-20)

- **Situation:** Dashboard is protected by (authenticated) layout, but test attempted to access /dashboard without login flow
- **Root cause:** Test infrastructure lacked authentication setup; endpoint returned 500 error rather than 401/403
- **How to avoid:** Manual verification replaced automated testing; gained confidence through code inspection but lost automated regression coverage

### Verification tests check for component exports in index.ts barrel file rather than direct imports (2026-01-20)

- **Context:** Needed to verify components are properly exposed for consumption throughout application
- **Why:** Barrel files enforce explicit component contracts and prevent accidental internal imports. Tests validate that public API surface is correct.
- **Rejected:** Testing only that components exist as files - misses critical export/import setup and allows broken public APIs
- **Trade-offs:** Tests are more fragile to refactoring but catch real integration issues; adds maintenance burden for barrel file updates
- **Breaking if changed:** If barrel exports are removed/changed, tests fail immediately - this is intentional to prevent silent breaking changes

#### [Gotcha] Manual verification recommended over automated testing due to CSRF complexity, not because feature is untestable (2026-01-20)

- **Situation:** Implementation log notes manual testing recommended rather than attempting full E2E Playwright tests
- **Root cause:** CSRF token flow requires full browser authentication context. Setting up auth in test environment adds significant complexity for marginal additional confidence beyond manual verification
- **How to avoid:** Faster iteration (skip complex test setup) but relies on manual verification for production confidence. Acceptable for CRUD forms with standard validation

#### [Gotcha] Database seeding and user account setup was critical blocker - couldn't run Playwright tests without proper test fixtures (2026-01-20)

- **Situation:** Integration testing sharing feature end-to-end
- **Root cause:** Sharing requires multiple users, documents, and proper authentication state. Manual setup per test run is error-prone
- **How to avoid:** Proper test fixtures enable reliable tests (+) but require upfront infrastructure investment (-), increased setup complexity (-)

### Used unit tests on entity class instead of E2E Playwright tests for permission verification (2026-01-20)

- **Context:** Validating that permission hierarchy, expiration logic, and access control work correctly
- **Why:** Entity logic doesn't depend on HTTP/GraphQL transport layer. Unit tests run in milliseconds vs seconds for E2E, are deterministic, and test the core logic in isolation without database/server setup
- **Rejected:** E2E Playwright tests - slower (setup server, navigate UI), brittle (timing, selectors), harder to iterate when debugging permission logic
- **Trade-offs:** Unit tests don't verify GraphQL schema exposure, but database and resolver tests handle those. Trade off breadth for speed and reliability
- **Breaking if changed:** Skipping entity tests and relying only on E2E means permission bugs surface in production testing, not dev cycle

#### [Pattern] Polish locale formatting (dates, numbers, booleans as tak/nie) validated through unit tests with hardcoded locale expectations, not configuration-driven (2026-01-21)

- **Problem solved:** System supports Polish legal document generation with specific formatting requirements (DD.MM.YYYY dates, space-separated thousands, 'tak'/'nie' for booleans)
- **Why this works:** Hardcoding Polish rules keeps template engine focused and prevents scope creep; Polish formatting is core domain requirement, not a configuration option
- **Trade-offs:** Adding new locale requires code changes and test updates, but current system is simpler and focused on actual business requirement

#### [Pattern] Test three sequential versions with different authors in same session to verify version number uniqueness and authorship tracking (2026-01-21)

- **Problem solved:** Need confidence that multi-author document history is correctly tracked
- **Why this works:** Single test case demonstrates composite key constraint (documentId + versionNumber uniqueness), session tracking (all in same session), and multi-user scenarios. Catching version number collisions requires multiple versions; different authors expose authorship tracking bugs
- **Trade-offs:** Easier: single consolidated test covers critical scenarios. Harder: test is less focused, harder to debug if one scenario fails

### Used unit tests with mock entities instead of integration tests against real database (2026-01-21)

- **Context:** Verifying version creation, rollback, and diff logic works correctly
- **Why:** Unit tests run instantly, no DB setup needed, easier to test edge cases (missing documents, invalid versions). All domain logic is deterministic and doesn't depend on DB state. Integration tests were created separately for end-to-end GraphQL verification.
- **Rejected:** Pure integration tests would catch more bugs but require Docker/postgres running, much slower feedback loop, harder to test error paths
- **Trade-offs:** Faster development cycle but integration tests are still needed. Unit tests verify logic, integration tests verify plumbing.
- **Breaking if changed:** If database behavior changes (cascade deletes, constraints), unit tests won't catch it. Integration tests must still be run before production.

### Verification test created then deleted rather than adding permanent test suite (2026-01-21)

- **Context:** Needed to verify service builds and integrates correctly without leaving test files in codebase
- **Why:** Tests verify implementation correctness then are removed - acknowledges that actual service tests should be written by developer with full context. Temporary verification ensures no build errors or TypeScript issues, but permanent tests require business logic understanding we don't have.
- **Rejected:** Leaving mock tests in codebase - would be incorrect tests that fail when real business logic added. No tests at all - couldn't verify integration.
- **Trade-offs:** Caught integration issues early but didn't create maintainable test suite. Developer must write real tests knowing requirements.
- **Breaking if changed:** Without any verification, bad imports or missing dependencies discovered in production. With permanent wrong tests, they'd require immediate fixing.

#### [Pattern] Comprehensive test suite (9 tests) created to verify webhook controller before deployment, then deleted after verification (2026-01-21)

- **Problem solved:** New webhook endpoint has no existing test coverage and handles critical state mutations
- **Why this works:** Temporary verification tests catch integration issues before committing to codebase. Confirms webhook signature verification works, event handling logic is correct, and error cases don't crash. Deleted after success because temporary test code shouldn't persist
- **Trade-offs:** Higher initial setup cost for thorough verification but catches bugs early before production exposure. Prevents silent failures in webhook handler
