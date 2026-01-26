---
tags: [database]
summary: database implementation decisions and patterns
relevantTo: [database]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 90
  referenced: 22
  successfulFeatures: 22
---
# database

### Added constraint validation at DTO layer (max 200 chars for names, max 999B for amounts) rather than relying solely on database constraints. Fails fast at API boundary. (2026-01-12)
- **Context:** User/plaintiff names validated to 200 chars max, claim amounts to 999,999,999,999 before database insertion.
- **Why:** Immediate feedback to client (HTTP 400 vs database error). Reduces wasted database round-trip. Prevents partially-processed requests. Security - validates expected input format before persistence.
- **Rejected:** Database-only constraints - slow feedback, unclear error messages, harder to version API contracts.
- **Trade-offs:** Two validation layers but separated concerns. DTO is API contract, database is data integrity. If limits change, must update both layers.
- **Breaking if changed:** If DTO constraint is removed but database still enforces it, requests exceeding the constraint will succeed at API but fail at persistence (broken invariant). If database constraint is removed but DTO enforces it, invalid data can't be inserted even from other clients.

### Used @FilterableField() decorators on entity fields (sessionId, title, type, status, createdAt, updatedAt) instead of filtering via custom query handlers (2026-01-12)
- **Context:** Had to decide how to expose filtering capabilities for auto-generated queries in @ptc-org/nestjs-query
- **Why:** @FilterableField decorators are declarative and scale automatically - each field becomes queryable with all comparison operators (eq, neq, in, like, iLike). Custom query handlers would require manual operator implementation for each field
- **Rejected:** Creating custom QueryHandlers for each filter - would duplicate operator logic and create maintenance burden as new filters are needed
- **Trade-offs:** Easier to add new filters (just add decorator), but exposes all marked fields to query - requires careful security review of what data is filterable. Schema bloat with many filter operators
- **Breaking if changed:** Removing @FilterableField from a field removes it from FilterableFields in schema, breaking existing GraphQL queries that filter on that field

### JSONB column for changeDetails instead of separate versioning table (2026-01-12)
- **Context:** Need to store before/after values and changed fields for audit trail without creating schema complexity
- **Why:** JSONB provides flexible schema for variable change data while maintaining queryability. Avoids creating version history tables that would double storage and complexity
- **Rejected:** Separate audit_log_changes table with normalized fields - would require joins for every query and harder to store unstructured before/after snapshots
- **Trade-offs:** Easier: flexible schema, single query. Harder: JSONB queries are less efficient than indexed columns, requires JSON path expressions for filtering
- **Breaking if changed:** Switching to normalized table requires data migration and updates all service query methods

### IPv6-compatible ipAddress field (varchar 45) instead of INET type (2026-01-12)
- **Context:** Need to store both IPv4 and IPv6 addresses while ensuring compatibility across databases
- **Why:** varchar(45) works on all database systems (PostgreSQL, MySQL, SQLite) - max IPv6 is 45 chars. INET type only on PostgreSQL, would limit portability
- **Rejected:** Use INET type - PostgreSQL-specific, breaks if DB switches; Separate IPv4/IPv6 fields - adds schema complexity
- **Trade-offs:** Easier: portable, simple schema. Harder: no automatic IP validation at DB level, requires application validation
- **Breaking if changed:** Switching to INET would require conditional migrations for different databases

### Composite index on (resourceType, resourceId) instead of separate indexes (2026-01-12)
- **Context:** Queries frequently filter by both resource type AND resource ID together
- **Why:** Composite index allows single index lookup for both conditions. Separate indexes would require scanning one index then checking second condition
- **Rejected:** Two separate indexes - database must use either index, then filter - wastes I/O on false positives
- **Trade-offs:** Easier: faster queries. Harder: index doesn't help if querying only resourceId without type
- **Breaking if changed:** Removing composite index slows queries that filter by both fields; queries using only resourceId become slower

### Using UUID for ID with @PrimaryGeneratedColumn('uuid') instead of auto-increment integer (2026-01-13)
- **Context:** Primary key selection for LegalQuery entity matching existing patterns (UserSession, LegalDocument)
- **Why:** UUIDs prevent ID enumeration attacks, allow distributed system ID generation without coordination, and match established codebase patterns. UUID collisions are negligible (2^122 space) for all practical purposes.
- **Rejected:** Auto-increment integers are sequential, guessable, enable enumeration attacks, and require centralized ID coordination in distributed systems
- **Trade-offs:** Gained: security, distributed-system compatibility, codebase consistency. Lost: slightly larger index size (16 bytes vs 8), marginally slower comparison operations
- **Breaking if changed:** Switching to auto-increment requires migration of all existing records, invalidates any external references to UUIDs, and breaks distributed generation logic

#### [Pattern] Added database indexes on sessionId, status, and createdAt despite entity using auto-generated CRUD - manually configured performance hints (2026-01-13)
- **Problem solved:** nestjs-query auto-generates basic resolvers but doesn't automatically optimize for query patterns that will be executed frequently
- **Why this works:** User sessions will filter analyses by sessionId regularly, status-based queries will poll for PENDING/PROCESSING, and time-based sorting/pagination will use createdAt. These are read-heavy access patterns that benefit from indexes without adding storage/write overhead
- **Trade-offs:** Gained: predictable query performance even under load. Lost: slightly slower INSERT/UPDATE operations, additional disk space for indexes

#### [Gotcha] Only LegalDocumentRepository has full TypeORM implementation; other domain repositories are interface-only shells (2026-01-15)
- **Situation:** Building repository infrastructure incrementally across multiple bounded contexts
- **Root cause:** Full TypeORM implementation with mappers takes significant effort. Starting with contracts (interfaces) allows domain layer to be testable before infrastructure is complete. Can mock repositories in early testing phases
- **How to avoid:** Faster domain design iteration (interfaces first) but infrastructure build happens in phases; requires discipline to avoid test doubles becoming permanent

### Complex JSON fields (identifiedGrounds, relatedDocumentLinks, metadata) are exposed as GraphQL types but intentionally not made filterable (2026-01-15)
- **Context:** LegalAnalysis has nested arrays and objects that need to be queryable as return values but not as filter criteria
- **Why:** Filtering on nested JSON arrays requires complex database queries. Exposing only select fields as @FilterableField reduces query complexity while maintaining usability
- **Rejected:** Making all fields filterable would create N+1 problems and require complex MongoDB/SQL JSON queries that are hard to optimize
- **Trade-offs:** Users can query by sessionId, status, dates but not by specific legal grounds or document links. This is acceptable since analyses are typically fetched by primary attributes
- **Breaking if changed:** Adding filterability to JSON fields requires database index strategy and may impact query performance significantly

#### [Gotcha] PostgreSQL date type combined with GraphQL DateTime scalar causes serialization issues. Date fields store correctly but cannot be reliably queried through GraphQL responses. (2026-01-16)
- **Situation:** Attempted to use `date` type for `rulingDate` field in LegalRuling entity. Field worked for storage and filtering but GraphQL serialization failed when returning the field in query responses.
- **Root cause:** PostgreSQL's `date` type is date-only (no time component) while GraphQL's DateTime scalar expects full timestamp. TypeORM/GraphQL mismatch in type coercion during response serialization.
- **How to avoid:** Removed `rulingDate` from GraphQL response fields but kept in entity for storage/filtering. Simplified API surface vs losing client access to a important field. Field remains queryable via database filters but not in returned objects.

#### [Gotcha] DateTime serialization mismatch: TypeORM entity expects Date object but GraphQL receives string, causing serialization failures on response (2026-01-16)
- **Situation:** LegalRuling entity with rulingDate field failed serialization in GraphQL response despite successful database storage
- **Root cause:** The issue occurs at the GraphQL response layer, not the input layer. The date transforms correctly on input but the entity's date transformer doesn't properly serialize back to GraphQL DateTime scalar
- **How to avoid:** Lost rulingDate in API responses but gained stability. The entity stores rulingDate correctly in database but this is a known serialization issue requiring separate resolver-level transformation

#### [Pattern] PostgreSQL full-text search with weighted column ranking (A/B/C/D weights) and ts_headline for snippet generation (2026-01-16)
- **Problem solved:** Need performant search across multiple fields with relevance ordering and result context display
- **Why this works:** PostgreSQL tsvector + ts_rank provides O(log n) performance on indexed data vs O(n) LIKE queries. Weighted ranking (signature=A, court=B, summary=C, text=D) ensures most relevant matches appear first. ts_headline extracts context without additional queries
- **Trade-offs:** PostgreSQL-specific (not portable to other databases) but avoids separate service. Search vector requires denormalization and update triggers. Setup is more complex but query performance is superior

### Search vector maintained via TypeORM lifecycle hooks (BeforeInsert/BeforeUpdate) rather than database triggers or migration-based index (2026-01-16)
- **Context:** LegalRuling entity needs searchVector column updated whenever searchable fields change
- **Why:** Application-level updates (hooks) allow complex logic like getSearchableContent() weighting to be version-controlled with code. Easier to test and debug than trigger functions. No migration complexity
- **Rejected:** Database triggers would require PL/pgSQL and separate migration. SQL-only index wouldn't support dynamic weighting logic
- **Trade-offs:** Entity code becomes responsible for search maintenance - coupling but testability. If logic fails, entire write fails (fail-safe). Requires careful hook ordering to avoid data loss
- **Breaking if changed:** Removing hooks leaves searchVector null/stale, breaking all full-text searches. Must either add triggers or lose search functionality

### Document content and metadata passed through job queue instead of fetched during processing (2026-01-16)
- **Context:** Processor needs document data to generate PDF. Could fetch from DB or pass through queue.
- **Why:** Passing data through queue makes job self-contained and immutable. If document is deleted before processing completes, job still has data. Avoids: permission race conditions, deleted document errors, concurrent update issues.
- **Rejected:** Fetching from DB in processor (introduces race conditions, requires DB access layer in processor)
- **Trade-offs:** Slightly larger queue messages vs complete isolation from document mutations. Better for audit trail and error recovery.
- **Breaking if changed:** Switching to DB fetch in processor means deleted documents cause processing failures, or require complex reconciliation logic

### Salt rounds set to 10 (not configurable per request) for bcrypt hashing (2026-01-19)
- **Context:** bcrypt hashing is expensive; balance between security (higher rounds = slower attacks) and performance (user experience at login)
- **Why:** 10 rounds = ~100ms per hash. Acceptable for human users during login. Further increases would impact UX noticeably. Making it configurable adds no value since it should never change at runtime
- **Rejected:** Higher rounds like 12-14 (unacceptable login delay); configurable per-request (maintenance burden, inconsistent security); lower rounds like 6-8 (weakens brute force resistance)
- **Trade-offs:** Easier: fixed, no runtime decisions. Harder: can't tune per-environment without code change
- **Breaking if changed:** If changed to lower rounds, reduces password security against brute force attacks

### Idempotent seeding with --clean flag instead of destructive migrations (2026-01-20)
- **Context:** Database initialization for development/testing needs to be safe and repeatable without data loss
- **Why:** Allows developers to run seeding multiple times without manual cleanup. The --clean flag provides explicit opt-in for destructive operations, preventing accidental data wipes while maintaining safety
- **Rejected:** Always-destructive seeding would require manual rollback; separate migration system would add complexity
- **Trade-offs:** Requires existence checks on every entity (performance cost) but gains safety and developer ergonomics. Makes seed-status command necessary for debugging
- **Breaking if changed:** Removing idempotency check would cause errors on re-runs; removing --clean would force destructive behavior always

#### [Gotcha] Bcrypt hashing requires explicit 10-round salt iterations - not idempotent hashing (2026-01-20)
- **Situation:** User password fixtures needed consistent hashing to match test credentials (admin@refine.dev / password)
- **Root cause:** Bcrypt with random salt generates different hash each execution. For fixtures to work, same plaintext password must always hash to same value for login to work consistently. 10 rounds chosen as security/speed balance
- **How to avoid:** Fixtures must be re-seeded when password changes (--clean flag needed). Hashing is slow (0.5s per user) but necessary for security

### Configured nested @Relation decorators on both User→UserSession (one-to-many) and UserSession→User (many-to-one) relationships (2026-01-20)
- **Context:** Enabling full relationship traversal in GraphQL queries without manual resolver implementation
- **Why:** nestjs-query automatically generates nested query resolvers when @Relation is present. Bidirectional relations allow queries like user.sessions and session.user without extra resolver code
- **Rejected:** Single-direction relation - would require separate resolvers to query back-references
- **Trade-offs:** Easier: GraphQL schema automatically includes nested queries. Harder: Must maintain relation consistency on both sides, potential circular reference issues
- **Breaking if changed:** Removing @Relation from either side breaks nested GraphQL queries on that direction, requires manual resolver implementation

#### [Pattern] Storing user.author as full object with id, name, email, ipAddress in audit log rather than just user ID (2026-01-20)
- **Problem solved:** Need to display audit log without N+1 queries joining against current Users table which may have changed
- **Why this works:** Audit logs are immutable snapshots. Denormalizing user info preserves 'who acted' even if user record is deleted or email changed. Avoids join queries
- **Trade-offs:** More storage (duplicate user data) but O(1) query performance and referential integrity. User changes don't affect audit log accuracy

### Activity data sourced from audit_logs resource sorted by createdAt DESC with pageSize: 10 rather than custom document events table (2026-01-20)
- **Context:** Dashboard needed recent activity feed with audit trail compliance
- **Why:** Audit logs provide immutable, compliance-friendly activity records automatically. Avoids building parallel event tracking system. Single source of truth for activity history.
- **Rejected:** Creating separate document_events table with manual event creation - duplicates audit functionality and adds sync burden
- **Trade-offs:** Limited filtering options (stuck with audit log schema) but gains automatic compliance tracking; GraphQL query complexity slightly higher due to nested data
- **Breaking if changed:** If switched to custom events table, lose audit trail compliance and create maintenance burden to keep both systems in sync

### Used composite unique index on (documentId, sharedWithUserId) instead of preventing duplicates at application layer (2026-01-20)
- **Context:** Ensuring users cannot be shared with multiple times for same document
- **Why:** Database constraint prevents race conditions where concurrent share requests could create duplicates; application logic alone vulnerable to concurrent requests
- **Rejected:** Application-level uniqueness check before insert - vulnerable to race conditions in high concurrency
- **Trade-offs:** Database constraint guarantees consistency (+) but requires handling unique violation exception in service layer (-), complicates error messages
- **Breaking if changed:** Removing index could allow duplicate shares to be created in concurrent scenarios; application code expects unique constraint and doesn't implement distributed locking

#### [Gotcha] Cascade deletion on document/user removal can silently revoke shares without audit trail if not careful with event emission (2026-01-20)
- **Situation:** Setting up cascade delete in TypeORM for referential integrity
- **Root cause:** Cascade delete prevents orphaned shares (correct) but database-level deletion bypasses service layer where events are emitted
- **How to avoid:** Cascade delete is performant and maintains referential integrity (+) but can lose audit trail if document/user deleted directly in database (-)

#### [Gotcha] Optional expiration date required careful NULL handling - queries must check for NULL or expired_at > NOW() (2026-01-20)
- **Situation:** Supporting both permanent and time-limited shares
- **Root cause:** NULL expiration_at means no expiration (permanent share); non-NULL means expires at that timestamp. Must check both in authorization queries
- **How to avoid:** NULL explicitly represents 'infinite' (+) but queries must handle NULL checks (-), three-valued logic adds complexity

### Used composite unique index on (documentId, sharedWithUserId) instead of relying on application-level duplicate prevention (2026-01-20)
- **Context:** Preventing duplicate shares between the same user-document pair
- **Why:** Database-level constraints are enforced at the source, preventing race conditions in concurrent scenarios where application logic alone could allow duplicates to slip through
- **Rejected:** Application-level validation in service before insert - less reliable under concurrent load, requires transactional guarantees application must manage
- **Trade-offs:** Simpler code (database handles constraint), but requires explicit error handling for constraint violation exceptions in service layer
- **Breaking if changed:** Removing this constraint allows duplicate shares which breaks the assumption that each document can only be shared once per user, complicating permission checks and share revocation

#### [Gotcha] Explicit index naming (IDX_document_share_unique) was required instead of relying on TypeORM's auto-generated names (2026-01-20)
- **Situation:** Discovered naming conflicts when multiple entities had similarly named indexes during migration to database
- **Root cause:** TypeORM's default index naming can cause collisions in large schemas with many entities using similar patterns. Explicit names provide predictable, conflict-free naming that survives schema evolution
- **How to avoid:** More verbose entity definitions, but eliminates migration conflicts and makes schema introspection clearer

#### [Gotcha] DTO validation excludes status and contentRaw fields - these must be set post-creation through separate update call (2026-01-21)
- **Situation:** Initial implementation tried to pass status and contentRaw directly to create() but CreateDocumentDto doesn't accept these fields
- **Root cause:** Document service separates creation (metadata only) from content updates, likely for transaction isolation and audit trail separation
- **How to avoid:** Requires two database operations (create + update) instead of one, but maintains clean DTO contracts and allows audit trail for status changes

### Soft delete via isActive flag instead of hard deletion; queries automatically exclude inactive templates (2026-01-21)
- **Context:** Templates are referenced from generated documents (stored in metadata); hard delete would break referential integrity for historical documents
- **Why:** Preserves audit trail and historical document context; allows template modification detection (template exists but is archived/replaced)
- **Rejected:** Hard delete with cascade would lose template history; foreign keys would complicate schema; archive table would duplicate schema management
- **Trade-offs:** Requires isActive filtering in all queries; unused templates remain in database forever; but enables audit and historical analysis
- **Breaking if changed:** Hard-deleting templates would orphan references in generated document metadata and lose template evolution history

### Implemented append-only pattern with immutable version records - only changeDescription is updatable, versions themselves cannot be deleted or modified (2026-01-21)
- **Context:** Legal document versioning requires complete audit trail without tampering risk
- **Why:** Append-only ensures compliance audit requirements. Immutability prevents accidental data loss and maintains integrity of historical record. Update-only-description provides flexibility for corrections without breaking chain of custody
- **Rejected:** Full mutability of versions (would compromise audit trail) or complete immutability including description (would prevent correcting metadata)
- **Trade-offs:** Easier: guaranteed audit trail, compliance, no data corruption. Harder: cannot fix content errors retroactively, must create new version
- **Breaking if changed:** If versions become mutable, entire audit trail becomes unreliable. Chain of custody breaks for legal compliance.

### Composite unique index on (documentId, versionNumber) instead of single auto-incrementing ID (2026-01-21)
- **Context:** Need to track multiple versions of same document with sequential numbering
- **Why:** Composite index ensures version numbers are meaningful and sequential per document. Allows querying 'latest version' via sort descending. Auto-increment would tie versions globally, breaking multi-document semantics
- **Rejected:** Global auto-increment version ID (would lose per-document versioning context), separate sequence table (adds complexity)
- **Trade-offs:** Easier: query for version history by document straightforward, version numbers human-readable. Harder: application must manage version number increment logic
- **Breaking if changed:** If composite index removed, version numbers could duplicate across documents, breaking version lookup queries and sorting semantics

### Rollback creates a NEW version instead of reverting to old version number or deleting history (2026-01-21)
- **Context:** User rolls back document to version 3 when current is version 5
- **Why:** Preserves complete audit trail - you can see that a rollback happened and who did it. Creates immutable history where each version number appears exactly once, making audits unambiguous. Prevents confusion about what 'current' is.
- **Rejected:** Could revert version numbers (lose audit trail), or just replace content (can't tell rollback happened). Both violate audit compliance for legal documents.
- **Trade-offs:** More storage and complexity versus legally defensible audit trail. End users see the rollback in history.
- **Breaking if changed:** If changed to not create new version on rollback, audit trail becomes incomplete and legal compliance risk increases.

#### [Pattern] Notification entity tracks full email lifecycle: queueing → sending → delivery success/failure with timestamps (2026-01-21)
- **Problem solved:** Needed visibility into email delivery without external SendGrid API calls for debugging and analytics
- **Why this works:** Database record becomes audit trail and recovery point. Allows queries like 'find users who never got welcome email' without calling SendGrid API. Status progression (queued→sent→delivered→failed) shows where breakdowns occur. Timestamps enable SLA monitoring.
- **Trade-offs:** Extra database writes on every email event, but gained complete offline visibility and analytics capability

### Store SendGrid message ID in notification record and use it as cross-reference key for webhook event matching (2026-01-21)
- **Context:** Webhook events arrive with SendGrid-generated message IDs but application needs to update corresponding notification in database
- **Why:** SendGrid webhooks contain message IDs but not application notification IDs. Storing message ID creates bidirectional mapping. Prevents ambiguity when matching incoming webhooks to database records. More reliable than email address matching (duplicate sends exist)
- **Rejected:** Using email address as lookup key - multiple notifications to same email exist (retries, different templates), would corrupt wrong records. Using timestamps - not unique enough
- **Trade-offs:** Requires additional field in notification entity but eliminates entire class of data corruption bugs. Minimal storage overhead for significant reliability gain
- **Breaking if changed:** Without message ID storage, webhook system cannot reliably identify which notification to update; would default to ambiguous email-based lookups causing cross-notifications updates