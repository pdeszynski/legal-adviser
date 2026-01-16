---
tags: [api]
summary: api implementation decisions and patterns
relevantTo: [api]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 69
  referenced: 2
  successfulFeatures: 2
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