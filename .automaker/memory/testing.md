---
tags: [testing]
summary: testing implementation decisions and patterns
relevantTo: [testing]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 1
  referenced: 0
  successfulFeatures: 0
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
- **Why this works:** Specific test files allow targeted verification without cluttering permanent test suite. Deletion after validation keeps codebase clean. Generic config (*.spec.ts) prevents brittleness
- **Trade-offs:** Adds verification step during implementation but ensures config doesn't encode implementation details. Makes future test discovery consistent

#### [Pattern] Introspection-based schema validation via GraphQL __type queries for mutation field presence (2026-01-15)
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