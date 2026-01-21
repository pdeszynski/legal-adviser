---
tags: [api]
summary: api implementation decisions and patterns
relevantTo: [api]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 84
  referenced: 4
  successfulFeatures: 4
---

# api

### Used separate DTO classes for REST (CreateDocumentDto) and GraphQL input types (CreateLegalDocumentInput) despite identical validation rules. Decorators duplicated rather than shared. (2026-01-12)

- **Context:** CreateDocumentDto and CreateLegalDocumentInput have identical @IsUUID, @IsLength, @IsEnum validations but exist in separate files.
- **Why:** NestJS and GraphQL have different metadata requirements. REST DTOs need class-validator decorators. GraphQL types need @InputType decorators. Can't easily mix both on one class without framework pollution.
- **Rejected:** Single shared class with both decorator sets - works but mixes frameworks concerns. Creating a base class - adds indirection with minimal benefit since validation rules rarely diverge.
- **Trade-offs:** Code duplication but clean separation of concerns. Validation logic is duplicated (maintenance burden). Each framework sees its native types.
- **Breaking if changed:** If validation requirements diverge between REST and GraphQL, duplication makes it easy to update them independently (good). If they need to stay in sync, duplication becomes a liability (developers forget to update both).

#### [Gotcha] NestjsQueryGraphQLModule.forFeature() configuration must include both FilterableFields and create/update DTO types, even when using auto-generated CRUD - TypeScript compilation succeeds but GraphQL schema generation fails silently without them (2026-01-12)

- **Situation:** Module configuration lacked proper DTO references, causing build to pass but mutations not appearing in schema
- **Root cause:** nestjs-query uses DTO types at runtime (not just compile-time) to generate input types for createOne/updateOne mutations. Missing DTOs means no input type definition exists for GraphQL
- **How to avoid:** Need separate DTO classes (CreateLegalDocumentInput, UpdateLegalDocumentInput) but this enforces input validation layer and decouples API contract from entity structure

### Nullable resourceId with isFailed() logic independent of resource state (2026-01-12)

- **Context:** Some operations (LOGIN, LOGOUT, EXPORT) don't act on specific resources but still need to track success/failure
- **Why:** Boolean isFailed() uses HTTP status codes (4xx/5xx), not resource type. Allows audit log to work for system-level actions without artificial resource assignment
- **Rejected:** Require resourceId for all logs - would force fake resource IDs for auth events, polluting audit trail
- **Trade-offs:** Easier: semantic audit logs. Harder: service callers must understand which operations need resourceId
- **Breaking if changed:** Removing nullable resourceId breaks audit logs for auth and system events

#### [Pattern] Using nestjs-query decorators for automatic GraphQL CRUD generation instead of manual resolvers (2026-01-13)

- **Problem solved:** Exposing LegalQuery entity with full CRUD and filtering capabilities via GraphQL
- **Why this works:** Eliminates boilerplate resolver code, automatically generates consistent filtering/sorting/pagination, maintains DRY principle. Reduces surface area for bugs in query execution. Enables standardized filtering patterns (eq, gte, lte, in, etc.) automatically.
- **Trade-offs:** Gained: rapid development, consistency with existing entities (LegalDocument pattern). Lost: fine-grained control over resolver behavior, ability to add custom pre/post-processing hooks without extending the decorator system

#### [Pattern] Created separate Input DTOs (CreateLegalAnalysisInput, UpdateLegalAnalysisInput) for GraphQL mutations despite entity being auto-generated CRUD (2026-01-13)

- **Problem solved:** nestjs-query auto-generates basic input types, but user input needs additional validation and potentially different fields than internal entity representation
- **Why this works:** Explicit DTOs provide: 1) Granular validation with @IsNotEmpty/@Min/@Max decorators, 2) Different field requirements for create vs update (sessionId required on create, forbidden on update), 3) Documentation of accepted inputs, 4) Prevention of mass-assignment vulnerabilities
- **Trade-offs:** Gained: security, validation, clarity. Lost: more code to maintain, potential duplication with auto-generated types

### Implemented permanent filters array in GraphQL data provider to preserve filter state across re-renders without explicit UI state management in component. (2026-01-14)

- **Context:** Document list needs title, type, and status filters that persist when user navigates or the component re-renders. Chose to use Refine's permanent filters mechanism rather than component-level useState.
- **Why:** Permanent filters in the data provider create single source of truth for active filters. They automatically serialize to URL if Refine router is configured, enabling shareable filtered views. Avoids prop drilling and local state synchronization bugs.
- **Rejected:** Local useState for filters - would require manual URL sync, prop drilling to controls, and complex state management for filter combinations. Direct GraphQL variable passing without filter array abstraction - would couple UI to GraphQL schema changes.
- **Trade-offs:** Permanent filters require understanding Refine's filter DSL (field, operator, value structure), but gain automatic URL serialization, browser back-button support, and testability. Trade complexity in filter definition for reduced component complexity.
- **Breaking if changed:** Removing permanent filters array forces UI filters to become controlled by component state (useState), losing URL persistence. GraphQL query must explicitly handle filter.permanent array - removing this breaks filter application entirely.

#### [Gotcha] useDelete hook API changed and no longer exports isLoading - requires local state management (2026-01-14)

- **Situation:** Attempted to destructure isLoading from useDelete() hook, but the hook no longer provides it. Found through grepping similar components that don't use it.
- **Root cause:** API design choice - possibly moved to handling async state differently or simplifying the hook interface. Other components in codebase show the pattern of managing deletion state locally.
- **How to avoid:** Local useState for isDeleting state adds boilerplate but gives more control. Must manually manage onSuccess/onError callbacks to set state.

### Made subscription filters (documentId and sessionId) optional rather than required (2026-01-14)

- **Context:** DocumentStatusChangePayload subscription needed to support both document-specific tracking and session-wide tracking simultaneously
- **Why:** Optional filters allow clients to subscribe to ALL document changes or filter to specific documents, providing flexibility without forcing one-or-the-other logic
- **Rejected:** Required filters would force clients to choose between document or session tracking; separate subscriptions would duplicate resolver logic
- **Trade-offs:** Slightly more complex resolver filter logic, but enables powerful client-side flexibility (e.g., listen to own session, or follow specific documents)
- **Breaking if changed:** Changing filters to required would break any client subscriptions that don't provide filter arguments

#### [Pattern] nestjs-query auto-generates full CRUD resolvers (Query, Mutation, Aggregate) from entity decorators without manual resolver code (2026-01-15)

- **Problem solved:** LegalAnalysis entity needed GraphQL API support for multiple operations with filtering, sorting, pagination
- **Why this works:** Eliminates boilerplate resolver code and ensures consistent API patterns. Decorators (@QueryOptions, @FilterableField, @IDField) drive code generation
- **Trade-offs:** Less control over individual resolver behavior, but massive reduction in repetitive code. Enables aggregate queries automatically

### Coexistence of auto-generated nestjs-query resolvers and custom resolver mutations on same LegalQuery type (2026-01-15)

- **Context:** nestjs-query decorators automatically expose legalQueries, legalQuery, CRUD mutations; QueriesResolver adds domain-specific mutations (submitLegalQuery, answerLegalQuery, pendingQueries, queriesBySession)
- **Why:** Provides both standard data access patterns (auto-generated) and semantic domain operations (custom). Consumers can use high-level mutations for workflows or low-level CRUD for direct manipulation
- **Rejected:** Single resolver approach would either lose auto-generated functionality or force domain logic into generic mutation names; separate entity types would fragment the schema
- **Trade-offs:** Schema complexity increases but semantic clarity is maintained; duplicates some querying capability (legalQueries with filter vs queriesBySession)
- **Breaking if changed:** Removing custom resolver breaks domain workflows like submitLegalQuery which emit events for async processing; the pendingQueries semantic query disappears, requiring manual filtering

#### [Gotcha] queriesBySession returns empty array for non-existent sessions, not an error, creating silent-failure semantic (2026-01-15)

- **Situation:** Test expects result.errors to be undefined and queriesBySession to be empty array for all-zeros UUID
- **Root cause:** Aligns with idempotent query semantics; no error means 'no data found' is valid state, not failure; consistent with legalQueries behavior
- **How to avoid:** Simpler error handling but less feedback when querying wrong session ID; gained idempotency and cache-friendly semantics

### Excluded `rulingDate` from GraphQL schema response fields despite keeping it in database. Field remains queryable via filters but not in returned data. (2026-01-16)

- **Context:** After discovering date serialization issues with GraphQL DateTime scalar, decided to remove field from GraphQL responses rather than implement a custom resolver or change field type.
- **Why:** Pragmatic tradeoff: database needs the field for filtering/sorting, GraphQL API doesn't need to return it due to serialization complexity. Avoids technical debt of custom scalar while maintaining functionality.
- **Rejected:** Custom GraphQL resolver - adds complexity for a single field. Timestamp type - loses semantic meaning. Complex date scalar - overengineering for one field.
- **Trade-offs:** API simpler and more reliable vs clients can't access ruling dates. Works if front-end doesn't need dates in responses. Problem if future feature requires date display.
- **Breaking if changed:** Any future client code attempting to query `rulingDate` will fail. Must be documented. Switching back to include it later requires solving the original serialization issue.

#### [Pattern] Separate DTOs for search (SearchLegalRulingsInput) vs filtering (FilterLegalRulingsInput) with explicit result wrapper (LegalRulingSearchResponse) (2026-01-16)

- **Problem solved:** Custom resolver needs distinct input shapes and paginated output with metadata
- **Why this works:** Search requires 'query' field and returns ranked results with headlines. Filtering uses structured criteria (no query string). Wrapper DTO encapsulates pagination and total count at the response level, matching GraphQL conventions
- **Trade-offs:** More DTOs to maintain but clearer intent and validation. Search input can enforce non-empty query, filtering is optional. Response wrapper allows adding future metadata (execution time, search suggestions)

### Two mutation variants: async (exportDocumentToPdf) and sync (exportDocumentToPdfSync) for PDF export (2026-01-16)

- **Context:** PDF generation takes 2-5 seconds. Need to support both quick API responses and complete results in single request
- **Why:** Async version queues job and returns immediately (better UX for large documents), sync version waits for completion (simpler for small documents, better for integrations). Gives clients choice based on timeout tolerance.
- **Rejected:** Single async-only mutation (forces client to poll for results), or single sync-only mutation (poor UX on slow documents)
- **Trade-offs:** Doubles mutation surface area but prevents API timeout frustration. Sync variant suitable for <5s documents; async better for larger documents or batch exports.
- **Breaking if changed:** Removing async variant forces clients to implement polling; removing sync variant breaks integrations expecting immediate PDF data

### Made login endpoint async even though it could theoretically be sync, to support future JWT signing and database operations (2026-01-19)

- **Context:** Current implementation synchronously generates test tokens. Real implementation needs async JWT signing and optional database session logging
- **Why:** Prevents breaking change when JWT signing becomes async (which it should be). Establishes correct contract now
- **Rejected:** Keeping sync API (forces breaking change later when JWT generation needs async)
- **Trade-offs:** Easier: future-proof. Harder: added async/await boilerplate now
- **Breaking if changed:** If reverted to sync and JWT signing becomes async later, consumers can't adapt gracefully

### Three separate mutation payloads (AuthPayload, RefreshTokenPayload) vs single unified response structure (2026-01-19)

- **Context:** refreshToken returns only accessToken while login/register return full user + tokens
- **Why:** Schema specificity prevents over-exposing user data; refresh operation should be minimal bandwidth operation, clients already have user data
- **Rejected:** Unified AuthPayload for all mutations (leaks unnecessary data in refresh responses, increases token refresh latency)
- **Trade-offs:** Client code complexity handling different response shapes vs reduced query payload and narrower API surface
- **Breaking if changed:** Clients expecting consistent response structure would break; changing to unified payload unnecessarily exposes user data on refresh which could impact security scanning

### Bearer token passed in Authorization header for all authenticated GraphQL requests instead of cookies or custom headers (2026-01-19)

- **Context:** Data provider needed to propagate access tokens from auth provider to all downstream GraphQL queries
- **Why:** Bearer tokens in Authorization header are standard GraphQL convention and HTTP best practice. Separates authentication (token) from authorization context. Allows server-side middleware to easily extract and validate tokens without custom parsing
- **Rejected:** Cookie-based would require httpOnly flags and CORS configuration; custom Authorization-Token header breaks client library expectations; request context object would require thread-local storage in server
- **Trade-offs:** Authorization header visible in request logs (security consideration) but more transparent than hidden cookies; requires manual token passing in data provider vs automatic cookie handling
- **Breaking if changed:** Removing Bearer token mechanism breaks all authenticated GraphQL requests; server middleware expecting Authorization header fails on missing token

#### [Gotcha] CORS configuration with hardcoded localhost variants masking the real issue - port mismatch remained hidden until actually testing (2026-01-19)

- **Situation:** Backend had generic CORS setup but frontend was making requests to wrong port (4000 vs actual 3001)
- **Root cause:** CORS errors are distinct from port connection errors - the setup appeared 'correct' but was fundamentally misconfigured. CORS permissiveness can hide deeper architectural issues
- **How to avoid:** Easier: development flexibility. Harder: bugs manifest as subtle 404s rather than clear connection errors, delayed problem identification

### CORS configuration explicitly allows credentials with specific origin and methods rather than wildcard headers (2026-01-19)

- **Context:** Frontend at http://localhost:3000 must authenticate with backend at http://localhost:3001 with token-bearing requests
- **Why:** Credentials mode ('include') requires explicit origin matching and specific header allowlisting; wildcard CORS would reject credential requests by spec
- **Rejected:** Wildcard CORS (Access-Control-Allow-Origin: \*) - browsers reject this when credentials are included for security
- **Trade-offs:** More configuration required but prevents credential leakage to unauthorized origins; must maintain origin whitelist
- **Breaking if changed:** If origin whitelist is removed or made too restrictive, frontend requests fail with 403; if made too permissive (\*, credentials), browser security model rejects it

### Created separate REST endpoint (GET /api/csrf-token) for clients to fetch CSRF tokens instead of embedding in page responses (2026-01-20)

- **Context:** Clients need a way to obtain CSRF tokens before making mutations without relying on form-based page rendering patterns
- **Why:** Explicit token endpoint works for SPA/API clients that don't load HTML pages; separates concerns (token issuance from mutation handling); allows prefetching tokens on app initialization
- **Rejected:** Embedding token in GraphQL schema as a query (couples CSRF layer to GraphQL, less accessible), returning token in response headers (client may not capture headers for first mutation)
- **Trade-offs:** Requires one extra HTTP request on app load but gives clients full control over when/how tokens are obtained; simpler testing and debugging since token endpoint is isolated
- **Breaking if changed:** If REST endpoint is removed or requires authentication, unauthenticated users cannot get CSRF tokens and cannot register/login; if token expiration is added, must synchronize with client-side token refresh logic

#### [Gotcha] CORS response headers are case-sensitive in some HTTP clients/scenarios. Testing must normalize header names to lowercase for reliable assertions. (2026-01-20)

- **Situation:** Playwright test was checking for exact case-sensitive header names but server returned differently-cased variants
- **Root cause:** HTTP headers should be case-insensitive per spec, but header value extraction can return mixed case. Normalizing ensures tests pass regardless of server's capitalization choices.
- **How to avoid:** Added slight complexity to test assertions but made them robust across different HTTP implementations

### Explicitly expose Set-Cookie header via CORS exposedHeaders configuration. Without this, frontend cannot access Set-Cookie in response headers even when CORS succeeds. (2026-01-20)

- **Context:** CORS was configured but Set-Cookie headers weren't visible to frontend JavaScript in response objects
- **Why:** Set-Cookie is a restricted header by default in CORS - browsers block JavaScript access even from same-origin-like CORS responses. Must be explicitly exposed server-side.
- **Rejected:** Assuming Set-Cookie would be visible by default with credentials: 'include'
- **Trade-offs:** Adds explicit configuration but doesn't actually expose the value to JavaScript (browser security model) - only makes it present in response metadata
- **Breaking if changed:** Without exposedHeaders configuration, CORS + cookies work for sending cookies but frontend cannot programmatically verify Set-Cookie headers were received

#### [Gotcha] Preflight requests return 204 No Content, not 200 OK (2026-01-20)

- **Situation:** Standard HTTP behavior for successful CORS preflight is 204, but developers often expect 200
- **Root cause:** 204 No Content is semantically correct for OPTIONS requests that have no response body—the CORS headers in the response are the only meaningful data
- **How to avoid:** 204 is more correct but less intuitive; test assertions must specifically check for 204 or tests will fail

#### [Gotcha] nestjs-query GraphQL mutations require nested input structure: input: { user: { ...fields } } not input: { ...fields } (2026-01-20)

- **Situation:** Initial mutation testing failed because curl commands used flat input structure instead of nested structure
- **Root cause:** nestjs-query auto-wraps the entity fields in a parent field matching the entity name (user) to allow potential future extensions and to match GraphQL best practices for input organization
- **How to avoid:** Harder: API consumers must understand nested structure. Easier: Consistent pattern for all entities

#### [Gotcha] GraphQL filter structure requires nested equality operators: {resourceType: {eq: 'USER'}} not {resourceType: 'USER'} (2026-01-20)

- **Situation:** Data provider maps Refine filters to nestjs-query GraphQL syntax but developers expect flat filter objects
- **Root cause:** nestjs-query generates GraphQL where every field becomes an object with operation keys (eq, ne, gt, etc) to support complex queries uniformly
- **How to avoid:** More verbose but explicit about comparison operators. Enables advanced filtering at cost of initial confusion

#### [Pattern] Using Refine's useList hook with GraphQL to fetch documents, calculating statistics client-side with useMemo (2026-01-20)

- **Problem solved:** Dashboard needs real-time document statistics without creating dedicated backend aggregation endpoints
- **Why this works:** Avoids backend complexity and keeps statistics current with actual data; useMemo prevents recalculation on every render
- **Trade-offs:** Client-side calculation transfers computation cost to browser but eliminates backend endpoint maintenance; single source of truth in data provider

#### [Pattern] Relying on pre-existing GraphQL mutation (updateOneLegalDocument) rather than creating new one (2026-01-20)

- **Problem solved:** Backend GraphQL schema already had update mutation with proper input types before feature was implemented
- **Why this works:** No schema changes needed = no backend deployment coupling = faster iteration. Pre-existing mutation means the contract was already validated and integrated with other systems
- **Trade-offs:** Constrained to existing mutation shape but gains speed and reduced risk. No additional backend work or coordination needed

#### [Pattern] Emitted domain events from DocumentSharingService for sharing operations rather than directly calling audit service (2026-01-20)

- **Problem solved:** Needing to log all sharing operations for compliance and auditability
- **Why this works:** Domain events decouple sharing logic from audit concerns; service doesn't know/care about audit implementation. Allows audit system to subscribe independently, follows DDD principle of events as side effects
- **Trade-offs:** Event-driven is loosely coupled (+) but audit gaps are harder to debug if event handler fails silently (-), requires event infrastructure

### Created separate updateSharePermission mutation instead of combining with shareDocument (2026-01-20)

- **Context:** Needing to modify existing share permissions after initial creation
- **Why:** Separates concerns - shareDocument creates new shares, updateSharePermission modifies existing ones. Different validation logic (share must exist vs must not exist), clearer API semantics
- **Rejected:** Single shareDocument mutation with optional ID field - would require complex conditional logic, unclear if operation creates or updates
- **Trade-offs:** More mutations in schema (+clarity) but more API surface to maintain and test (-)
- **Breaking if changed:** Merging mutations would break clients that distinguish between create and update operations; different error cases (already shared vs not shared)

### Exposed separate queries documentShares (for owner) and documentsSharedWithMe (for recipient) instead of single unified query (2026-01-20)

- **Context:** Querying shares from different perspectives - documents I own vs documents shared with me
- **Why:** Separates concerns and prevents authorization logic bloat. Owner and recipient queries have different filters, sort orders, and permission requirements. Keeps query intent clear
- **Rejected:** Single documentShares query with optional filters/parameters - would require complex authorization logic to determine if requester is owner or recipient
- **Trade-offs:** Client calls two endpoints instead of one, but each endpoint is simpler and authorization is unambiguous
- **Breaking if changed:** Merging into single query requires adding authorization logic that handles both perspectives, increasing complexity and maintenance burden

### Special mutation `generateDocumentFromTemplate` instead of embedding template generation in document creation flow (2026-01-21)

- **Context:** Document creation and template-based document generation are distinct business operations with different validation and processing needs
- **Why:** Maintains single responsibility - documentsResolver handles template-agnostic operations, documentTemplatesResolver handles template-specific logic; makes audit trail clear
- **Rejected:** Adding templateId parameter to createDocument mutation would create coupling and make template processing logic live in wrong resolver
- **Trade-offs:** Requires two separate mutations instead of one, but makes the system more extensible for other document sources (imports, uploads, etc.)
- **Breaking if changed:** Merging into single mutation would require moving template processing into documents resolver, creating bidirectional dependency

#### [Gotcha] Delete mutations disabled at entity registration level in NestJS Query - must explicitly disable rather than relying on application logic (2026-01-21)

- **Situation:** GraphQL auto-generation creates mutations for all CRUD operations including delete, but versions should never be deletable
- **Root cause:** Explicit disabling at registration prevents accidental API exposure. Application-level checks alone are insufficient - need framework-level enforcement. GraphQL schema must accurately reflect business rules or client applications will request invalid operations
- **How to avoid:** Easier: impossible to delete accidentally via GraphQL, schema is source of truth. Harder: requires understanding NestJS Query registration syntax

### Exposed separate GraphQL queries (documentVersionHistory, documentLatestVersion, documentVersionByNumber) instead of single nested query (2026-01-21)

- **Context:** Allowing clients to query version information flexibly
- **Why:** Prevents N+1 query problems - clients get exactly what they need without over-fetching. Separate queries are easier to cache and optimize individually. Clear, explicit API surface.
- **Rejected:** Could nest all version data on Document type, but that forces clients to receive all versions even when they only want count or latest
- **Trade-offs:** Slightly more queries from client perspective versus predictable performance and clear API contracts
- **Breaking if changed:** If consolidated into single nested query, client requests with documentVersionHistory will suddenly fetch ALL versions and impact performance on documents with many versions.
