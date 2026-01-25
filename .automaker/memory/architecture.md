---
tags: [architecture]
summary: architecture implementation decisions and patterns
relevantTo: [architecture]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 71
  referenced: 5
  successfulFeatures: 5
---
# architecture

## Core Architectural Principles

### [Principle] Domain-Driven Design (DDD) (2026-01-13)
- **Context:** Building a legal AI platform with complex business logic around documents, queries, and legal processes
- **Why:** DDD provides strategic design patterns (bounded contexts, aggregates, entities, value objects) that align technical implementation with business domain. Legal domain has rich terminology and invariants that benefit from explicit modeling
- **Key Practices:**
  - **Ubiquitous Language:** Code uses legal domain terms (LegalDocument, LegalQuery, RulingSearch, UserSession with LAWYER/SIMPLE modes)
  - **Aggregates:** User, Session, Document, Query, and Search are modeled as distinct aggregates with clear boundaries and invariants (e.g., document cannot be COMPLETED without content)
  - **Bounded Contexts:** Separate modules for Documents, Users, Auth, Chat, Search - each with its own models and business rules
  - **Entities vs Value Objects:** User and LegalDocument are entities (have identity); DocumentMetadata and Citations are value objects (immutable, no identity)
- **Trade-offs:** Requires more upfront domain modeling and understanding business rules, but produces maintainable code that reflects real-world domain. Prevents anemic domain models where entities are just data bags
- **Breaking if changed:** Moving away from DDD to generic CRUD without domain logic loses business rule enforcement at domain layer, pushing all validation to controllers/services

### [Principle] Layered Architecture (2026-01-13)
- **Context:** Backend needs clear separation between presentation, business logic, and data access
- **Why:** Layered architecture enforces dependency flow (outer layers depend on inner layers, not vice versa) and makes each layer testable in isolation
- **Layers:**
  1. **Presentation Layer** (`*.resolver.ts`, `*.controller.ts`): GraphQL resolvers and REST controllers - handle HTTP/GraphQL protocol concerns, validation, authentication
  2. **Application Layer** (`*.service.ts`): Application services orchestrate use cases (e.g., DocumentsService.generateDocument() calls AI Engine, creates document, emits events)
  3. **Domain Layer** (`entities/*.entity.ts`, domain logic): Entities with business rules and invariants. Rich domain models, not anemic data bags
  4. **Infrastructure Layer** (`shared/*`, database, external APIs): TypeORM repositories, AI Engine HTTP client, Bull queues, EventEmitter
- **Dependency Rule:** Presentation → Application → Domain ← Infrastructure. Domain layer has no dependencies on outer layers (no imports of NestJS decorators in pure domain logic)
- **Trade-offs:** Clear separation improves testability and maintainability, but adds indirection. More files and abstractions than flat structure
- **Breaking if changed:** Violating dependency flow (e.g., domain layer importing controllers) creates circular dependencies and makes layers untestable

### [Principle] CQRS - Command Query Responsibility Segregation (2026-01-14)
- **Context:** Legal platform has distinct read and write patterns - complex queries for document search, Q&A history, analysis retrieval vs. simpler command operations for document creation, status updates
- **Why:** CQRS separates read models (optimized for queries) from write models (optimized for business rules). This allows read operations to bypass domain complexity when needed, improving performance for complex list/search operations
- **Implementation:**
  - **Single Database:** Both read and write models share the same PostgreSQL database - no event sourcing complexity needed at this stage
  - **Two Models:**
    - **Write Model:** Full domain entities with business rules, validation, state transitions (e.g., `LegalDocument` entity with `canComplete()`, `markCompleted()` methods)
    - **Read Model:** Simplified query-optimized projections, DTOs, or direct SQL results (e.g., `DocumentListItem` DTO for paginated lists)
  - **Query Strategy:**
    - **Simple reads:** Use TypeORM repositories with read model entities/DTOs
    - **Complex reads:** Use direct SQL queries via QueryBuilder or raw SQL - no need to hydrate full domain models for list views, reports, or aggregations, but usage of model is still allowed when needed and simplifying things.
    - **Write operations:** Always go through domain entities to enforce business rules
- **When to use direct queries:**
  - Paginated list views with filtering/sorting
  - Dashboard aggregations and statistics
  - Complex JOIN queries across multiple tables
  - Reports and exports
- **When to use domain models:**
  - Any operation that modifies state
  - Operations requiring business rule validation
  - Single entity retrieval that needs full domain behavior
- **Trade-offs:** Requires maintaining separate read/write models (potential for divergence), but gains query performance and simpler read paths. Eventual consistency not a concern with single DB
- **Breaking if changed:** Removing CQRS means all reads must go through domain models, impacting performance for complex list operations

### [Principle] Hexagonal Architecture (Ports and Adapters) for Core Domain (2026-01-14)
- **Context:** Core domain logic (document generation, legal analysis, query processing) must remain independent of infrastructure concerns (database, AI service, GraphQL)
- **Why:** Hexagonal architecture isolates business logic in the center, with ports (interfaces) defining how the domain interacts with the outside world. Adapters implement these ports for specific technologies
- **When to apply:** Focus hexagonal patterns on **core domain modules** where business logic complexity justifies the abstraction:
  - ✅ Documents module (complex generation workflow, state machines)
  - ✅ LegalAnalysis module (AI integration, multi-step processing)
  - ✅ LegalQuery module (Q&A processing, citation handling)
  - ⚠️ Users/Auth modules (simpler CRUD - apply lighter patterns)
  - ❌ Infrastructure modules (already adapters themselves)
- **Structure:**
  - **Domain (center):** Entities, value objects, domain services, domain events - NO framework imports
  - **Ports (interfaces):**
    - **Inbound/Driving:** Use cases defining application entry points (e.g., `GenerateDocumentUseCase`, `ProcessLegalQueryUseCase`)
    - **Outbound/Driven:** Repository interfaces, external service contracts (e.g., `DocumentRepository`, `AIEnginePort`)
  - **Adapters (outer ring):**
    - **Inbound:** GraphQL resolvers, REST controllers, event handlers - implement use cases
    - **Outbound:** TypeORM repositories, HTTP clients, message queues - implement outbound ports
- **Practical application in NestJS:**
  ```
  modules/documents/
    domain/           # Pure domain - no NestJS decorators
      entities/       # LegalDocument, DocumentVersion
      services/       # DocumentDomainService
      ports/          # IDocumentRepository, IAIEngine
    application/      # Use cases - orchestrates domain
      use-cases/      # GenerateDocumentUseCase
    infrastructure/   # Adapters
      persistence/    # TypeOrmDocumentRepository
      ai/             # AIEngineHttpAdapter
    presentation/     # Inbound adapters
      resolvers/      # DocumentsResolver
  ```
- **Trade-offs:** More abstractions and indirection in core modules, but gains testability (mock ports), replaceability (swap AI provider), and domain purity. Avoid over-applying to simple CRUD modules
- **Breaking if changed:** Domain importing infrastructure (e.g., TypeORM decorators in domain entities) breaks hexagonal isolation and makes domain untestable without database

### [Principle] Modular Monolith Architecture (2026-01-13)
- **Context:** Building a monorepo with multiple features (documents, chat, search, auth, users) that must scale independently but deploy together initially
- **Why:** Modular monolith provides microservices-like modularity (clear boundaries, independent development) without microservices complexity (distributed transactions, network calls, deployment overhead). Start as monolith, extract to microservices only when needed
- **Module Boundaries:**
  - Each module (`apps/backend/src/modules/*/`) is self-contained with its own entities, services, resolvers, DTOs
  - **Strict Rule:** Modules CANNOT directly import from other modules (no `import { UsersService } from '../users'`)
  - **Communication:** Modules communicate ONLY via async events (`@nestjs/event-emitter`) or through shared kernel (`apps/backend/src/shared/`)
  - Example: DocumentsModule emits `DOCUMENT.CREATED` event → AuditModule listens and logs it asynchronously
- **Enforcement:**
  - ESLint rules prevent cross-module imports: `import/no-restricted-paths` configured in `eslint.config.mjs`
  - Shared kernel (`shared/`) contains infrastructure code (events, queues, AI client) that modules can depend on
  - `packages/types/` contains shared DTOs/interfaces used across frontend and backend
- **Benefits:**
  - **Independent Development:** Teams can work on modules in parallel without merge conflicts
  - **Testability:** Each module can be tested in isolation with mocked events
  - **Future Microservices:** Modules can be extracted to separate services by replacing in-memory events with message queue (Redis Pub/Sub, RabbitMQ) with minimal code changes
- **Trade-offs:** More discipline required (developers must use events instead of direct service calls), slightly more complex testing setup (mock event emitter), eventual consistency between modules
- **Breaking if changed:** Allowing direct module imports creates tight coupling, making it impossible to extract modules to microservices later. Database transactions across modules become complex

### [Principle] Role-Based Access Control (RBAC) with Hierarchical Roles (2026-01-24)
- **Context:** Legal AI platform requires different access levels for various user types (super admins, platform admins, lawyers, paralegals, clients, guests)
- **Why:** Hierarchical RBAC provides flexible permission management with role inheritance, reducing permission matrix complexity. Higher roles automatically inherit lower role permissions
- **Role Hierarchy (Highest to Lowest):**
  - `SUPER_ADMIN` (5): Platform owner, full system access including user management and billing
  - `ADMIN` (4): Platform administrator, user management, content moderation, analytics
  - `LAWYER` (3): Legal professional, full document/analysis access, AI query generation
  - `PARALEGAL` (2): Legal support, limited document/analysis access, draft creation
  - `CLIENT` (1): Regular user, own documents only, basic AI queries
  - `GUEST` (0): Demo access, read-only public documents
- **Implementation:**
  - **Backend:** RoleGuard and AdminGuard in `apps/backend/src/modules/auth/guards/` protect GraphQL resolvers
  - **Frontend:** Admin layout protection at `apps/web/src/app/admin/layout.tsx`, role-based menu filtering in `apps/web/src/config/menu.config.tsx`
  - **Hook:** `useUserRole` in `apps/web/src/hooks/use-user-role.tsx` provides role checking utilities
- **Seed Users:** `admin@refine.dev` (SUPER_ADMIN), `lawyer@example.com` (LAWYER), `user@example.com` (CLIENT)
- **Trade-offs:** Hierarchical roles simplify permission checks but reduce fine-grained control; additional roles require level assignment
- **Breaking if changed:** Removing role hierarchy breaks all `hasRoleLevel()` checks; changing role levels requires database migration of existing user roles

#### [Pattern] Maintain translation key parity across all locales by using a validation gate that enforces identical key structures before code can proceed (2026-01-12)
- **Problem solved:** Multi-locale system where partial translations are deployed, causing runtime failures when UI components reference non-existent keys in some locales
- **Why this works:** Translation systems fail gracefully in development (key fallback to untranslated strings) but cause broken UX in production when keys are missing; enforcing parity at definition time prevents this
- **Trade-offs:** Stricter validation overhead during development, but eliminates entire class of locale-specific bugs; forces discipline of keeping all locales in sync

#### [Pattern] Legal domain terminology requires explicit review and synchronization across translation files because direct word-for-word translation produces legally inaccurate results (2026-01-12)
- **Problem solved:** Polish legal terms like 'Powód' (plaintiff) and 'Pozwany' (defendant) are specific legal terminology, not generic translations of English words
- **Why this works:** Legal systems have domain-specific terms that don't translate directly from English; using wrong term in legal form context creates confusion and legal inaccuracy
- **Trade-offs:** Requires domain expert review of translations, slowing localization; but produces legally valid forms that users trust and that lawyers can use correctly

### Applied whitelist: true and forbidNonWhitelisted: true globally on ValidationPipe instead of per-DTO. This rejects ALL unexpected properties across the entire API surface. (2026-01-12)
- **Context:** Preventing property injection attacks where clients send extra fields hoping they'll be processed (e.g., adding admin: true to user creation).
- **Why:** Global configuration ensures uniform security posture across all endpoints. Per-DTO configuration is error-prone because developers might forget to apply it.
- **Rejected:** Per-DTO whitelisting or relying on @Exclude decorators - harder to audit and easier to misconfigure.
- **Trade-offs:** Stricter validation prevents accidental field injection but breaks any client code sending extra properties. Requires API contract alignment. Makes backward compatibility harder (adding new fields requires client coordination).
- **Breaking if changed:** Any client sending extra properties (even benign ones) will get 400 Bad Request. This is intentional - the API contract must be strict.

### Helmet configured at application bootstrap level, not per-route or middleware chain (2026-01-12)
- **Context:** Deciding where to apply security headers in NestJS middleware stack
- **Why:** Global middleware application ensures headers on all responses; early in pipeline prevents bypasses through route-specific handlers
- **Rejected:** Route-specific helmet would require wrapping each controller; custom middleware ordering risks accidental disabling
- **Trade-offs:** Cannot selectively disable headers for health checks or public endpoints; requires manual exception handling if needed
- **Breaking if changed:** Removing helmet from main.ts disables ALL security headers globally; no granular override mechanism exists

### Kept custom business logic mutations (generateDocument, updateDocument) separate from auto-generated CRUD operations instead of replacing them entirely (2026-01-12)
- **Context:** When migrating to @ptc-org/nestjs-query, faced choice between using auto-generated mutations or preserving custom domain logic
- **Why:** Custom generateDocument mutation combines document creation with AI generation workflow - this business logic cannot be expressed through generic CRUD decorators. Separating concerns keeps auto-generated CRUD clean while preserving domain complexity
- **Rejected:** Replacing all mutations with auto-generated ones would lose AI document generation capability and force refactoring of business logic into hooks/interceptors
- **Trade-offs:** Easier to maintain domain logic in resolvers, but requires developers to know which mutations are custom vs auto-generated. Schema becomes more intuitive for clients
- **Breaking if changed:** Removing custom mutations breaks AI-powered document generation feature entirely. Removing auto-generated mutations removes filtering/pagination

#### [Gotcha] Had to explicitly register GraphQL enums (DocumentType, DocumentStatus, SessionMode) via registerEnumType() even though entities use @EnumField decorators (2026-01-12)
- **Situation:** Enums were defined in TypeScript but weren't appearing in GraphQL schema until explicit registration
- **Root cause:** @EnumField decorator in nestjs-query requires the enum type to be registered with GraphQL's type system separately. The decorator alone doesn't auto-register - it only marks the field
- **How to avoid:** Extra boilerplate for enum registration, but ensures type safety on both TypeScript and GraphQL sides. Without registration, schema generation silently fails for filtered fields using enums

#### [Pattern] Used @IDField(() => ID) decorator on entity IDs instead of relying on TypeORM @PrimaryGeneratedColumn alone (2026-01-12)
- **Problem solved:** nestjs-query requires explicit ID field definition for GraphQL schema generation and cursor-based pagination to work properly
- **Why this works:** @IDField tells nestjs-query which field uniquely identifies the entity for pagination cursors and relay-style queries. Without it, pagination doesn't work and ID isn't exposed in GraphQL schema correctly
- **Trade-offs:** Slightly more code, but enables sophisticated cursor-based pagination and relay-compliant GraphQL APIs. Without it, must implement custom pagination

### Deprecated old deleteDocument mutation in favor of auto-generated deleteOneLegalDocument instead of removing it entirely (2026-01-12)
- **Context:** Migration introduced new auto-generated mutation with similar functionality
- **Why:** Gradual deprecation prevents breaking existing client code. @Deprecated() decorator allows clients to migrate incrementally. Keeping it temporarily with deprecation warning gives teams time to update queries
- **Rejected:** Immediate removal would break all existing queries using deleteDocument
- **Trade-offs:** Schema temporarily has duplicate functionality (old and new delete), but prevents client-side breaking changes. Eventually needs to be fully removed
- **Breaking if changed:** Immediate removal breaks all clients using deleteDocument. Keeping it forever creates confusion about which mutation to use

#### [Gotcha] Had to add @QueryOptions({ enableTotalCount: true }) to entity decorator for pagination totalCount to be available - it's not enabled by default (2026-01-12)
- **Situation:** GraphQL queries included totalCount field but it wasn't being calculated, returning null values
- **Root cause:** nestjs-query optimizes by default and doesn't calculate totalCount in every query (expensive COUNT query). Must be explicitly enabled per entity. Without it, the field exists in schema but always returns null
- **How to avoid:** Slight performance cost for each paginated query (adds COUNT(*) SQL query), but provides crucial UX data for pagination UI (total pages, result count)

#### [Pattern] Event pattern (AUDIT_LOG.CREATED) for decoupled async processing (2026-01-12)
- **Problem solved:** Multiple services may need to react to audit logs (alerting, archival, real-time sync) without tight coupling
- **Why this works:** Event-driven pattern allows subscribers to add listeners without modifying AuditLogService. Enables async heavy operations (external archive, notifications) without blocking request
- **Trade-offs:** Easier: loosely coupled, scalable. Harder: debugging event flow, eventual consistency, testing async handlers

#### [Pattern] Specialized query methods (findByUserId, findByResource, findFailedOperations) vs generic findAll with filters (2026-01-12)
- **Problem solved:** Common audit queries need efficient indexes and clear semantics
- **Why this works:** Specialized methods document intent and ensure correct indexes are used. findAll with filters is generic but developers must know index strategy. Explicit methods improve discoverability
- **Trade-offs:** Easier: obvious intent, guaranteed performance. Harder: service method proliferation, must update for new common queries

### Used nestjs-query decorators (@QueryOptions, @FilterableField, @Relation) to auto-generate GraphQL CRUD operations and filtering logic instead of manually implementing resolvers (2026-01-13)
- **Context:** LegalDocument entity needed full GraphQL query/mutation support with filtering, sorting, pagination, and relationship handling
- **Why:** Declarative decorator-based approach eliminates boilerplate resolver code and maintains single source of truth - the entity definition. Auto-generation ensures schema consistency with implementation.
- **Rejected:** Manual resolver implementation with custom Query/Mutation classes would require maintaining parallel filter input types and CRUD mutation definitions
- **Trade-offs:** Gained: Less code to maintain, automatic schema generation, consistent patterns. Lost: Fine-grained control over resolver behavior and custom business logic integration points
- **Breaking if changed:** Removing decorators breaks auto-generation pipeline - queries/mutations disappear from schema, filter inputs become undefined, relationships are severed

#### [Pattern] Enum field filtering (@FilterableField(() => DocumentType)) generates specialized filter comparison types (DocumentTypeFilterComparison) instead of generic string filters (2026-01-13)
- **Problem solved:** Type and Status fields are enums that need to be filterable, but should only accept valid enum values
- **Why this works:** Type-specific filter inputs prevent invalid filter values at the GraphQL validation layer rather than runtime. Leverages GraphQL's type system for data integrity.
- **Trade-offs:** Gained: Schema-level type safety, better IDE autocomplete for clients. Lost: Slightly more complex schema with additional input types

#### [Gotcha] Auto-generated schema file (schema.gql) should not be manually edited despite being checked into version control - it's a build artifact (2026-01-13)
- **Situation:** Developer might be tempted to manually fix schema issues rather than fixing the source decorators
- **Root cause:** Build process overwrites manual changes on next run, creating merge conflicts and lost work. Source decorators are the real definition.
- **How to avoid:** Gained: Single source of truth in decorators. Lost: Can't review schema changes in code review (only decorator changes visible)

#### [Pattern] @Relation decorator creates strong entity relationship in GraphQL schema (session: UserSession!) making the relationship non-nullable and eagerly loaded (2026-01-13)
- **Problem solved:** LegalDocument has required reference to UserSession - this relationship is critical for data integrity
- **Why this works:** Non-nullable relationships force consumers to always have session context, preventing orphaned documents. Declarative relationship definition keeps entity cohesion.
- **Trade-offs:** Gained: Type safety, data integrity guarantees. Lost: Can't create LegalDocument without session, increases query complexity

### JSONB for citations storage instead of separate junction table (2026-01-13)
- **Context:** Storing citation references (source, article, url, excerpt) for legal query responses
- **Why:** Denormalized storage allows flexible citation structure without schema migrations, supports efficient querying via JSONB operators, and keeps related data together for performance. Citations are query-specific metadata, not shared resources requiring normalization.
- **Rejected:** Normalized relation table (LegalQueryCitation entity) would require JOIN operations, migrations for schema changes, and harder to version citation formats alongside responses
- **Trade-offs:** Gained: schema flexibility and query performance. Lost: enforced referential integrity and ability to independently query citation statistics across queries
- **Breaking if changed:** Switching to normalized citations requires data migration, changes to entity field type from JSON[] to OneToMany relation, and query performance regression during JOIN operations

#### [Pattern] Entity helper methods (hasAnswer, hasCitations, setAnswer, addCitation) as opposed to business logic in DTOs or resolvers (2026-01-13)
- **Problem solved:** Encapsulating citation and answer state operations within the entity
- **Why this works:** Entity methods keep domain logic colocated with data, improve readability, enable reuse across resolvers/services, and make entity contracts explicit. Easier to test and maintain than scattered resolver logic.
- **Trade-offs:** Gained: cohesion, testability, reusability. Lost: entity becomes stateful class rather than pure data structure

### Used JSONB columns for complex nested structures (identifiedGrounds, relatedDocumentLinks, metadata) instead of separate relational tables (2026-01-13)
- **Context:** LegalAnalysis entity needs to store variable-length arrays of domain objects with multiple attributes
- **Why:** JSONB provides flexibility for evolving schema without migrations, better performance for read-heavy operations on structured data, avoids N+1 queries, and keeps logically grouped data together
- **Rejected:** Separate junction tables (legal_grounds, document_links) would enforce strict schema but require migrations on every structure change and multiple JOIN queries
- **Trade-offs:** Gained: flexibility and query performance. Lost: SQL-level constraints and strict schema validation at database level
- **Breaking if changed:** Changing JSONB to relational tables would require significant data migration and query rewriting throughout the application

### Implemented domain methods (canComplete, markCompleted, markFailed) as entity methods rather than service-level logic (2026-01-13)
- **Context:** Entity state transitions and validations needed to occur consistently regardless of which service calls them
- **Why:** Entity methods enforce business rules at the domain object level - state machine logic lives with the data. Prevents bypass of validations when multiple services might modify the entity
- **Rejected:** Service-level methods would require every service to duplicate validation logic and could be bypassed if entity modified directly
- **Trade-offs:** Gained: single source of truth for business rules, encapsulation. Lost: entity class becomes less anemic, more test setup required
- **Breaking if changed:** Moving logic to services would require establishing service layer coordination to prevent state inconsistencies

#### [Gotcha] Removed LegalDocument import from entity even though relatedDocumentLinks reference documents - created circular dependency (2026-01-13)
- **Situation:** Entity tried to import LegalDocument type but that module imports LegalAnalysis for relationship tracking
- **Root cause:** Documents module and Analysis module are separate concerns. The relationship is expressed via foreign key (documentId string) rather than direct object reference. This maintains module independence and prevents circular imports
- **How to avoid:** Gained: loose coupling, independent modules. Lost: type safety on documentId (it's a string, not validated reference)

---

## Feature Organization Guidelines (2026-01-13)

### [Principle] Features should be VERTICAL SLICES, not HORIZONTAL LAYERS
- **Problem:** Features organized by layer (`*-entity` → `*-graphql` → `*-service` → `*-ui`) create fragmented aggregates and coordination nightmares
- **Solution:** Each feature should deliver complete user value through ALL layers (entity + service + resolver + UI)
- **Example:** Instead of 10 separate features for document management, have ONE `document-management` feature containing all layers
- **Trade-offs:** Larger features, but developer can complete a user story without touching multiple features

### [Principle] Features should map to DDD AGGREGATES, not database tables
- **Problem:** Creating a feature per entity fragments domain logic and creates artificial dependencies
- **Solution:** Group features by aggregate root - all entities within an aggregate belong to ONE feature
- **Bounded Contexts for this project:**
  - **Documents**: LegalDocument, DocumentVersion, DocumentComment, DocumentPermission
  - **Legal Q&A**: LegalQuery, ChatSession
  - **Case Law**: LegalRuling, RulingSearch
  - **Analysis**: LegalAnalysis
  - **Users**: User, UserSession, UserPreferences
  - **Notifications**: Notification
  - **Billing**: Subscription, Usage, Payment
  - **API Access**: ApiKey
  - **Webhooks**: Webhook
  - **Audit**: AuditLog

### [Principle] Cross-module features use EVENTS, not direct dependencies
- **Problem:** Direct feature dependencies (e.g., `document-completion-notification` depends on `email-queue-processor`) violate modular monolith boundaries
- **Solution:** Features declare `emits` (events they publish) and `listensTo` (events they subscribe to) instead of `dependencies`
- **Implementation:** Use `EVENT_PATTERNS` from `shared/events/base/event-patterns.ts`
- **Example:**
  ```json
  {
    "id": "document-completion-notification",
    "listensTo": ["DOCUMENT.GENERATION_COMPLETED"],
    "dependencies": []  // Empty! Use events instead
  }
  ```

### [Principle] Infrastructure features are SEPARATE from domain features
- **Problem:** Mixing infrastructure (email, queues, monitoring) with domain logic makes domain features dependent on technical choices
- **Solution:** Create dedicated infrastructure features that domain features subscribe to via events
- **Infrastructure categories:**
  - `email-infrastructure` - Queue, processor, templates
  - `queue-infrastructure` - Bull setup, job patterns
  - `security-middleware` - XSS, CSRF, rate limiting
  - `i18n-infrastructure` - Translations, locale switching
  - `monitoring-infrastructure` - Health checks, logging, analytics

### Feature Schema Recommendations
Features should include:
- `boundedContext`: Which DDD context (Documents, Q&A, Users, etc.)
- `aggregateRoot`: Which entity is the aggregate root
- `emits`: Array of events this feature publishes
- `listensTo`: Array of events this feature subscribes to
- `layers`: Object mapping layer names to file paths

**See:** `.automaker/FEATURE-RESTRUCTURE-PROPOSAL.md` for full migration plan

#### [Pattern] Exponential backoff polling for async job completion instead of webhook callbacks or event streams (2026-01-13)
- **Problem solved:** Document generation queue processor needs to wait for AI service to complete document generation before updating database
- **Why this works:** Polling with exponential backoff (500ms → 1s → 2s → 4s) provides resilience to temporary AI service delays without requiring webhook infrastructure or event bus complexity. Simpler than managing callbacks while still respecting service availability.
- **Trade-offs:** Simpler to implement but consumes polling connections during job execution; scales with job volume rather than being event-driven; max 10 retries means 2047ms total wait for a single job

### Queue processor updates document status directly via DocumentsService.completeGeneration/failGeneration rather than publishing events (2026-01-13)
- **Context:** Job completion needs to update document status and store generated content in database
- **Why:** Direct service calls maintain transactional consistency within the same module boundary and avoid introducing distributed transaction complexity. DocumentsService already handles document state transitions, centralizing business logic.
- **Rejected:** Publishing completion events (decouples modules but creates eventual consistency issues), storing results in separate table and batch-syncing (adds synchronization complexity)
- **Trade-offs:** Tighter coupling to DocumentsService but guaranteed consistency; synchronous update means job completes only after database write succeeds; simplifies testing since no event pub-sub system needed
- **Breaking if changed:** If DocumentsService methods are removed, jobs will crash on completion; if service moves to different module, job processing stops working

#### [Gotcha] Job data must include sessionId and documentType because AI service response contains only documentId, insufficient to update document correctly (2026-01-13)
- **Situation:** Processor receives documentId from job completion but needs additional context to mark correct document as complete
- **Root cause:** Job data acts as captured context snapshot at queue time. DocumentsService.completeGeneration() requires both documentId and sessionId to validate ownership and update correctly. If these aren't captured in job, processor cannot safely update document.
- **How to avoid:** Increases job data size but prevents data corruption from orphaned jobs; requires discipline to capture all needed context at queue time rather than lazy-loading

#### [Pattern] Separate Producer and Processor classes for queue operations vs a monolithic queue service (2026-01-13)
- **Problem solved:** Both HTTP endpoints and GraphQL resolver need to queue jobs; separate components handle job status checks and removal
- **Why this works:** Separation of concerns: Producer handles queueing and job lifecycle (add/remove/status), Processor handles job execution logic. Allows multiple queue producers (REST, GraphQL, events) to reuse same producer class; keeps business logic in Processor separate from job management
- **Trade-offs:** More files to maintain but cleaner responsibilities; easier to test in isolation; enables job status endpoint without exposing processor logic

#### [Pattern] Use direct QueryBuilder/SQL for read-heavy list operations instead of loading full domain entities (2026-01-14)
- **Problem solved:** List views loading 50+ documents were slow because each row hydrated full domain entity with relationships
- **Why this works:** CQRS read path optimization - skip domain model overhead for queries that don't need business logic. QueryBuilder returns plain objects (DTOs) without entity lifecycle events, lazy loading, or validation overhead
- **Implementation examples:**
  - **List with filters:** `queryBuilder.select(['d.id', 'd.title', 'd.status', 'd.createdAt']).where(...).getRawMany()` → returns `DocumentListItemDto[]`
  - **Aggregations:** `queryBuilder.select('COUNT(*)', 'count').addSelect('status').groupBy('status').getRawMany()` → returns statistics
  - **Complex JOINs:** Direct SQL via `manager.query()` for reports spanning multiple aggregates
- **When to fall back to repository:** Single entity fetch for update, any write operation, operations needing domain method execution
- **Trade-offs:** Faster queries but DTOs can drift from entity schema; requires manual mapping; loses TypeORM change tracking (which is intentional for reads)

#### [Gotcha] Refine's useTable hook returns { reactTable, refineCore } structure, not a flat object. Accessing pagination/filtering requires destructuring refineCore properties explicitly. (2026-01-14)
- **Situation:** Initial implementation attempts failed when trying to access pagination and filter methods directly from useTable result. The hook combines TanStack Table (reactTable) with Refine's data management (refineCore) into separate namespaces.
- **Root cause:** Refine v6+ separates concerns: reactTable handles UI rendering logic, refineCore handles server-side state (pagination, filters, sorting). This prevents prop drilling and allows independent updates.
- **How to avoid:** Requires careful destructuring and understanding dual responsibility model, but provides clear separation between server state management and client-side rendering concerns. Enables advanced patterns like optimistic updates on refineCore while TanStack Table re-renders.

### Used TanStack Table (via @refinedev/react-table) for column headers and sorting instead of custom table implementation, accepting the complexity of dual-hook integration. (2026-01-14)
- **Context:** Document list needs sortable columns with visual indicators. Could build custom table with onClick handlers, or use TanStack Table which handles sort state, column metadata, and accessibility.
- **Why:** TanStack Table is headless - provides sort state management without forcing UI structure. Column headers automatically expose isSorted, sortDirection properties. Enables moving sort logic to server-side in future (prefetch columns API). Built-in a11y for table semantics.
- **Rejected:** Custom onClick handlers on headers - would duplicate sort state management (UI state + API filters), making server-side sorting sync complex. HTML table element with manual header classes - less maintainable, harder to add advanced features like resizing.
- **Trade-offs:** Requires learning TanStack Table API and Refine integration pattern, but gains sortable columns with 5 lines of code. Dependency on external library means updates could break sort behavior.
- **Breaking if changed:** Removing TanStack Table integration requires manually managing sort state (which column, asc/desc), syncing with API filters, and losing built-in accessibility. Refine's useTable assumes TanStack Table for column rendering.

### Generation history derived from document status/timestamps rather than separate history records (2026-01-14)
- **Context:** Implemented timeline showing document generation progress using existing status and timestamp fields
- **Why:** Minimal database schema requirements. Works well for simple state transitions. Avoids need for separate generation_history table and join queries.
- **Rejected:** Separate generation_history table with detailed records - adds complexity, requires migrations, more queries
- **Trade-offs:** Current approach is simpler but loses detailed history (retries, intermediate failures). If detailed history needed later, requires schema change.
- **Breaking if changed:** If business requirements change to need detailed generation history (retry counts, error messages per attempt), this approach won't scale - would need separate table.

### Chose in-memory PubSub (graphql-subscriptions) over Redis-based PubSub for initial implementation (2026-01-14)
- **Context:** Real-time document status updates needed via GraphQL subscriptions with optional filtering by documentId and sessionId
- **Why:** Faster to implement, lower operational overhead for single-server deployments, sufficient for MVP. Explicitly documented limitation for future scaling.
- **Rejected:** Redis-based PubSub adapter would be required immediately for horizontal scaling, adds complexity and infrastructure dependency
- **Trade-offs:** Easy deployment and fewer dependencies now, but will require refactoring to Redis adapter when scaling to multiple servers. Current implementation has hard dependency on PubSub adapter location.
- **Breaking if changed:** Switching to Redis adapter requires interface change since PubSub instance location would shift from local service to external Redis, affecting all subscription resolution logic

#### [Pattern] Decoupled event publishing from subscription logic using event emitter (EventEmitter2) for domain events, separate from GraphQL PubSub (2026-01-14)
- **Problem solved:** DocumentsService status changes already used EventEmitter2 for domain events; added GraphQL PubSub publishing in separate method calls
- **Why this works:** Maintains separation of concerns: domain layer publishes typed domain events (EventEmitter2), infrastructure layer (GraphQL subscriptions) adapts those to client subscriptions. Allows future event handlers without modifying resolver.
- **Trade-offs:** Two separate event systems running (domain events + GraphQL PubSub), but provides architectural flexibility. Requires explicit bridging in service methods.

### Exported GraphQLPubSubService from StreamingModule as global provider rather than local to DocumentsModule (2026-01-14)
- **Context:** DocumentsService needed to inject GraphQLPubSubService for publishing subscription events
- **Why:** Global export allows other modules (Comments, Notifications, etc.) to publish to subscriptions without circular dependencies. Single source of PubSub instance ensures all modules publish to same channel.
- **Rejected:** Local provider in DocumentsModule would prevent reuse; creating separate PubSub instances per module would fragment subscription channels
- **Trade-offs:** GraphQLPubSubService is now tightly coupled to app initialization, but ensures guaranteed single instance. Cannot be easily swapped for testing without affecting other modules.
- **Breaking if changed:** Any module importing GraphQLPubSubService directly depends on StreamingModule being initialized; removing global export would require individual imports in each module

### Aggregate Root as the sole entry point to bounded context entities, with internal entity composition rather than exposing child entities directly (2026-01-14)
- **Context:** DDD structure design where aggregates own multiple entities (e.g., LegalDocumentAggregate containing DocumentVersion entities)
- **Why:** Enforces consistency boundaries at the aggregate level. Only the root can be loaded/saved to repository, preventing distributed transactions and ensuring atomicity of domain operations. Protects internal state from external modification.
- **Rejected:** Individual entity repositories for all entities - would allow bypassing aggregate invariants and creating consistency issues across the domain model
- **Trade-offs:** Easier: Consistency guarantees, simpler transaction model. Harder: Querying specific child entities requires loading entire aggregate, potential performance cost with large aggregates
- **Breaking if changed:** If aggregates expose internal entities via public properties, clients may bypass root logic, violating invariants. Would require refactoring all repository patterns and client code.

#### [Pattern] Separation of DomainEvent (internal) vs IntegrationEvent (cross-context) in shared kernel base classes (2026-01-14)
- **Problem solved:** Multi-bounded-context system where AI Operations, Billing, and Legal Documents need to communicate without tight coupling
- **Why this works:** DomainEvents are synchronous, in-process, and only meaningful within a context. IntegrationEvents are the contract for async cross-context communication. This separation prevents internal implementation details from leaking into contracts between contexts.
- **Trade-offs:** Easier: Clear separation of concerns, simpler domain logic. Harder: Requires publisher abstraction to handle both event types differently

### Value Objects as immutable primitives with validation in constructor, stored alongside aggregate root rather than in separate tables (2026-01-14)
- **Context:** Modeling domain concepts like Money, SubscriptionPlan, QueryStatus as distinct types rather than primitives
- **Why:** Prevents invalid state (e.g., negative Money, invalid SubscriptionPlan) at construction time. Immutability enables safe sharing and makes reasoning about state changes explicit at aggregate level. Constructor validation is cheaper than database constraints.
- **Rejected:** Storing value objects in separate tables with foreign keys - adds complexity, violates DDD principle that VOs are embedded in aggregates, creates unnecessary joins
- **Trade-offs:** Easier: Type safety, business rule enforcement. Harder: Database schema doesn't map 1:1 to tables (requires custom ORM mapping)
- **Breaking if changed:** If value objects are mutable or lack constructor validation, invalid states slip through domain logic. If stored separately, consistency becomes distributed and requires coordination.

#### [Gotcha] Domain event storage and publishing must happen atomically with aggregate persistence or events get lost on failure (2026-01-14)
- **Situation:** Aggregates produce events during command execution, but those events need to be persisted alongside the aggregate
- **Root cause:** If aggregate saves but event publishing fails, consumers never know about state change. If event publishes but aggregate save fails, system enters inconsistent state. Root cause: Events and aggregates are separate concerns but have synchronous dependency.
- **How to avoid:** Easier: Forcing atomic write (single database transaction). Harder: Requires event sourcing or transactional outbox pattern to guarantee exactly-once semantics

#### [Pattern] Factory methods (e.g., `create()`) on AggregateRoot for construction with mandatory validation before state exists (2026-01-14)
- **Problem solved:** Creating new LegalDocumentAggregate or SubscriptionAggregate with multiple value objects and initial events
- **Why this works:** Constructor is called during both creation and reconstitution (loading from persistence). Factory methods enforce business rules at creation time only. Separate from reconstitution to avoid double-validation or lost state during reload.
- **Trade-offs:** Easier: Clear intent, testable business rules. Harder: Two paths to valid state require careful testing

### Interface-first repository design (ILegalDocumentRepository, IUserRepository, etc.) with no concrete implementation in domain layer (2026-01-14)
- **Context:** Repositories bridging domain layer and data access layer while maintaining DDD isolation
- **Why:** Domain layer remains persistence-agnostic. Implementation details (SQL, MongoDB, event store) don't leak into business logic. Enables testing with in-memory repositories without hitting database.
- **Rejected:** Abstract classes or concrete implementations in domain - creates tight coupling to persistence technology, violates dependency inversion
- **Trade-offs:** Easier: Substitutable implementations, technology-agnostic business logic. Harder: Requires infrastructure layer to provide implementation
- **Breaking if changed:** If repository implementation is in domain layer, changing databases requires recompiling and redeploying domain logic. If repository isn't injected, testing aggregate logic becomes impossible in isolation.

### Placed shared configs (@legal/tsconfig, @legal/eslint-config) as separate publishable packages rather than root-level config files (2026-01-14)
- **Context:** Monorepo structure needed consistent TypeScript and ESLint configurations across multiple apps and libraries with different targets (Next.js, NestJS, React library)
- **Why:** Packageable configs enable: (1) Version-controlled config updates, (2) Reusability across multiple monorepos/projects, (3) Clear dependency graph tracked by package managers, (4) Separation of concerns - configs are first-class packages not root artifacts
- **Rejected:** Alternative: root-level tsconfig.json and .eslintrc.js with app-level extends. This tightly couples configs to repo structure and makes cross-repo reuse impossible.
- **Trade-offs:** Easier to reuse and version, but adds package overhead and requires pnpm dependency resolution. Every config change needs package version bump.
- **Breaking if changed:** If converted back to root-level configs, all apps lose ability to import configs as dependencies. Tools expecting packages/@legal/tsconfig to exist will fail. Version pinning is lost.

#### [Gotcha] tsup build output must preserve external peer dependencies (React) to avoid bundling conflicts when packages are consumed (2026-01-14)
- **Situation:** Initial @legal/ui build included React in bundle, causing duplicate React instances when consumed by Next.js app
- **Root cause:** React is declared as peerDependency, not dependency. tsup needs external: ['react', 'react-dom'] config to prevent bundling. Consuming apps expect to provide React themselves.
- **How to avoid:** Prevents code duplication but requires consumers to have React installed. Creates stricter peer dependency contract.

### Structured shared packages with src/ directories and tsup build scripts instead of direct TypeScript exports (2026-01-14)
- **Context:** Packages (@legal/types, @legal/ui) needed to produce CJS, ESM, and type declaration outputs for maximum tool compatibility
- **Why:** tsup handles: (1) src→dist transpilation, (2) Dual CJS/ESM output, (3) Type declaration generation, (4) Environment-specific builds. Direct TypeScript exports require consumers to run TypeScript compiler themselves.
- **Rejected:** Alternative: export src/ directly as TypeScript. Consumers must handle TS compilation, can't tree-shake, no type declaration auto-generation.
- **Trade-offs:** Build step required but enables proper CommonJS/ESM consumption in any environment. Type safety guaranteed via dist/ type declarations.
- **Breaking if changed:** If removed, consumers importing from @legal/types would get raw TypeScript, breaking in CommonJS environments and bundlers without TS support. No type declarations available.

### Added prepare script to auto-build packages on pnpm install rather than requiring manual build step (2026-01-14)
- **Context:** Developers installing dependencies need @legal/types and @legal/ui dist/ outputs to exist for imports to resolve
- **Why:** prepare hook runs after npm/pnpm install, auto-compiling packages before apps try to import them. Eliminates manual 'pnpm run build:packages' step and reduces onboarding friction.
- **Rejected:** Alternative: document manual build requirement. Leads to 'works on my machine' bugs when developers forget step.
- **Trade-offs:** Install time slower but dependencies always buildable. Clearer contract: install = everything ready.
- **Breaking if changed:** If removed, fresh clones fail at build time with module resolution errors (can't find @legal/types). CI/CD needs explicit build:packages before build.

### Used shared @legal/eslint-config as package with environment-specific rule sets (nextjs.js, nestjs.js, react-library.js) rather than single universal config (2026-01-14)
- **Context:** Monorepo contains frontend (Next.js), backend (NestJS), and library (React) with different linting requirements
- **Why:** Environment-specific configs allow: (1) Backend-specific rules (async/await patterns, no JSX), (2) Frontend-specific rules (React hooks, JSX), (3) Library-specific rules (exports checking). Single config would need complex overrides.
- **Rejected:** Alternative: single universal eslint-config with all rule sets. Apps override specific rules they don't need. Creates noise and maintenance burden.
- **Trade-offs:** More config files but each is focused and clear. Easier to add environment-specific linting rules without affecting others.
- **Breaking if changed:** If consolidated to single config, backend would enforce React rules (e.g., rules-of-hooks) causing false positives. Frontend would enforce Node.js patterns (e.g., no browser APIs).

#### [Pattern] Used tsup with entry point aliasing (packages/ui/src/index.tsx) to control public API surface and hide internal utilities (2026-01-14)
- **Problem solved:** UI package had utils (cn() function) and components that both needed to be exported but with different visibility rules
- **Why this works:** Single index.tsx entry point becomes the official public API. Everything exported there is versioned. Internal utilities in src/utils.ts aren't part of the contract unless explicitly re-exported.
- **Trade-offs:** Explicit exports make contract clear but require updating index.tsx when adding public APIs. Prevents accidental public API surface.

### Module files (*.module.ts) excluded from architecture layer boundary enforcement - allowed to import from Infrastructure for dependency injection wiring (2026-01-15)
- **Context:** Presentation layer module needed to wire Infrastructure repositories into the DI container, violating strict layer boundaries
- **Why:** NestJS requires concrete implementations at module level for @Module decorators and provider registration. Pure DDD layering cannot coexist with NestJS's DI mechanics without creating a technical debt layer or service locator pattern
- **Rejected:** Strict enforcement of no Infrastructure imports in Presentation - would require abstraction layer over NestJS decorators or separate module initialization file
- **Trade-offs:** Easier: NestJS modules are simpler and more idiomatic. Harder: Architecture tests become less strict; need to explicitly exempt module files from validation rules
- **Breaking if changed:** Removing this exception would require either: (1) moving module definitions outside Presentation layer entirely, (2) creating a separate 'bootstrap' layer for DI wiring, or (3) using service locator pattern to resolve dependencies at runtime

#### [Pattern] Strict layered architecture with separate Application layer (use cases) between Presentation and Domain (2026-01-15)
- **Problem solved:** Backend API needed clear separation of concerns: HTTP/GraphQL concerns vs business logic vs domain rules
- **Why this works:** Application layer acts as orchestration boundary - handles transaction management, validation errors, DTO mapping, and use case flow without domain entities knowing about framework details. Prevents Presentation from directly using Domain entities
- **Trade-offs:** Easier: Clear separation of concerns, framework-agnostic business logic, testable without HTTP/GraphQL. Harder: More files per feature, more mapper boilerplate, use case interfaces can become redundant

### TypeORM entities kept separate from Domain entities with explicit mapper layer - ORM entity is presentation detail of persistence, not domain model (2026-01-15)
- **Context:** Could use Domain entities directly with TypeORM decorators vs keeping them separate
- **Why:** Domain entities must remain framework-agnostic. TypeORM decorators (@Entity, @Column, @Relation) are infrastructure details. Separation allows swapping ORM implementations without domain refactoring; enables using Domain entities in non-persistence contexts
- **Rejected:** Decorating Domain entities with @Entity/@Column - couples Domain to TypeORM, makes offline domain logic testing require ORM machinery
- **Trade-offs:** Easier: Domain is pure, testable without ORM, can model domain relationships differently from table structure. Harder: Requires bidirectional mapper, doubles entity count, mapper sync becomes a maintenance burden
- **Breaking if changed:** Removing mapper layer would require either: (1) adding TypeORM decorators to Domain entities (framework leakage), (2) using Domain entities directly as ORM models (breaks DDD principle of domain independence)

#### [Pattern] Repository interfaces defined in domain layer, implementations in infrastructure layer with explicit separation (2026-01-15)
- **Problem solved:** Creating repository pattern for domain aggregates while maintaining DDD boundaries
- **Why this works:** Keeps domain layer dependency-free and testable; prevents infrastructure concerns (TypeORM, database specifics) from leaking into domain logic. Domain layer only knows the contract, not the implementation
- **Trade-offs:** Requires mapper layer to convert between domain and persistence models (adds code) but gains framework independence and cleaner architecture

### Base repository interfaces (IRepository, IExtendedRepository) use generic types with separate ID type parameter (T, TId) (2026-01-15)
- **Context:** Designing reusable repository pattern across multiple aggregates with different ID types
- **Why:** Some aggregates might use UUID, others numeric IDs, some composite keys. Separating T and TId allows flexible ID typing without forcing all aggregates to use same ID scheme
- **Rejected:** Single generic parameter would require ID to always be part of aggregate or force casting
- **Trade-offs:** Slightly more verbose method signatures but significantly more flexible; TId can be UUID | number | string | composite key
- **Breaking if changed:** If TId is removed and forced to aggregate type, would break repositories handling non-standard ID patterns

#### [Pattern] Domain-specific repository interfaces extend base interfaces with aggregate-specific query methods rather than generic filters (2026-01-15)
- **Problem solved:** Supporting business-specific queries while maintaining repository abstraction
- **Why this works:** Generic find/filter methods force client code to know persistence details. Domain-specific methods like findByStatus, findByUserId express intent and domain language. Queries that cross-cut (findByOwnerAndStatus) indicate important domain rules
- **Trade-offs:** More methods per repository interface but self-documenting code; easier to change query implementation without affecting domain logic

### IUnitOfWork interface separated from IRepository despite both dealing with persistence concerns (2026-01-15)
- **Context:** Handling transactions across multiple aggregates
- **Why:** UoW manages transaction lifecycle and coordination across repositories; mixing into IRepository creates confusion about single vs multiple aggregate persistence. Separation allows optional transaction support per context
- **Rejected:** Adding transaction methods to base IRepository would clutter interface and confuse single-aggregate vs multi-aggregate patterns
- **Trade-offs:** Requires explicit UoW dependency in services needing transactions but keeps repository interface focused and composable
- **Breaking if changed:** If UoW is merged into IRepository, it becomes unclear whether every save() triggers transaction scope

### Application services implemented as thin orchestrators that delegate to use cases rather than containing business logic (2026-01-15)
- **Context:** Need for separation between application layer and domain layer in a DDD-based architecture
- **Why:** Services act as anti-corruption layer and coordinate cross-cutting concerns (error handling, logging) while keeping business logic isolated in use cases. This maintains domain purity and testability.
- **Rejected:** Alternative of placing business logic directly in services would violate DDD separation and make domain logic dependent on application framework (NestJS)
- **Trade-offs:** Added indirection layer (service -> use case) increases code paths slightly but gains: domain isolation, reusability of use cases across multiple entry points (REST, GraphQL, events), and cleaner testing
- **Breaking if changed:** If services contained business logic directly, moving to a different application framework or adding new entry points would require duplicating domain logic or massive refactoring

#### [Pattern] Consistent ServiceResult<T> wrapper for all service returns with success/failure result helpers (2026-01-15)
- **Problem solved:** Need to standardize error handling across multiple services without throwing exceptions at application layer boundaries
- **Why this works:** Exceptions are domain-specific (NotFoundError, ApplicationError) but at application boundary need structured responses. ServiceResult provides type-safe, predictable error handling that's easier to map to HTTP responses and GraphQL errors.
- **Trade-offs:** Requires unwrapping result in controllers but gains: explicit error handling, better logging, easier GraphQL integration, prevents accidental unhandled exceptions

#### [Gotcha] Services verify ownership/authorization (e.g., checkDocumentOwnership) at application layer rather than domain or infrastructure layer (2026-01-15)
- **Situation:** DocumentApplicationService includes ownership checks mixed with orchestration logic
- **Root cause:** Ownership is cross-cutting concern tied to request context (user ID from JWT), not pure domain rule. Application layer has access to both domain objects and request context.
- **How to avoid:** Service becomes slightly more than pure orchestrator but eliminates: scattered authorization checks across controllers, tight coupling of domain to request context, repeated permission logic

#### [Pattern] Module-level service interfaces (DocumentApplicationService, UserApplicationService) rather than generic ApplicationService<T> (2026-01-15)
- **Problem solved:** Four distinct services with different method signatures for documents, users, queries, and billing
- **Why this works:** Each domain module has fundamentally different operations (documents: publish/statistics, billing: upgrade/payment) that don't fit generic interface. Domain-specific interfaces provide better type safety and IDE autocomplete.
- **Trade-offs:** More interfaces to maintain but gained: compile-time type safety, clear contract per domain, impossible to call publish() on a User service

#### [Gotcha] Billing module structure (use-cases/index.ts file created without use-case implementations) suggests incomplete domain implementation (2026-01-15)
- **Situation:** BillingApplicationService delegates to use cases that don't exist yet (CreateSubscriptionUseCase, etc.)
- **Root cause:** Application service layer was created independent of use-case layer completion. Services define the contract but depend on use-case implementations.
- **How to avoid:** Gained: early definition of application API contract, code completion for future use-case implementation. Lost: service methods will fail at runtime until use-cases exist

#### [Gotcha] Value objects must expose raw primitive values, not nested object properties. fullName.toValue() was returning FullNameProps object instead of string primitive (2026-01-15)
- **Situation:** User use-cases were failing TypeScript compilation because GraphQL resolvers expected string values but received object properties
- **Root cause:** Value objects encapsulate logic but need accessor methods to extract primitives for serialization. toValue() was incorrectly implemented or misunderstood
- **How to avoid:** Using .fullName property directly bypasses the value object abstraction, but it's necessary for proper serialization across 8 use-case files consistently

### Relation decorators (@Relation) create navigable associations between GraphQL types without auto-generating nested mutations (2026-01-15)
- **Context:** LegalAnalysis needed to reference UserSession but shouldn't expose mutations to create/update sessions through analysis endpoints
- **Why:** Keeps mutation scope bounded to the primary entity. Related entities are readable but modifications happen through their own endpoints (DDD bounded contexts)
- **Rejected:** Auto-generating nested mutations would violate single responsibility and create inconsistent update paths for sessions
- **Trade-offs:** Clients can fetch session details within analysis query (fewer requests), but must use separate session endpoints to modify sessions (cleaner separation)
- **Breaking if changed:** Removing @Relation decorator breaks ability to navigate to related session in GraphQL queries, forcing separate queries

### Layered service architecture with separate QueriesService for business logic despite nestjs-query providing auto-generated CRUD resolvers (2026-01-15)
- **Context:** nestjs-query provides automatic CRUD operations via decorators, but domain-specific business logic (submitLegalQuery, answerLegalQuery with citations) requires custom mutations
- **Why:** Service layer encapsulates domain workflows and event emission that cannot be expressed declaratively through nestjs-query decorators. Enables async processing patterns (query.asked events) and complex multi-step operations like citation management
- **Rejected:** Implementing all logic directly in resolver would couple presentation concerns with business logic; relying solely on auto-generated CRUD would expose raw data operations without workflow semantics
- **Trade-offs:** Added service boilerplate but gained separation of concerns and testability; auto-generated operations remain available for simple CRUD without service overhead
- **Breaking if changed:** Removing the service layer would require re-implementing event emission and validation logic in resolvers, losing the async processing workflow for AI query answering

#### [Pattern] Domain event emission pattern for inter-module communication (query.asked, query.answered) (2026-01-15)
- **Problem solved:** Legal query submission requires async AI processing that should not block the mutation response; answer generation needs to notify other modules
- **Why this works:** Decouples query submission from AI processing implementation; allows multiple consumers to react to query lifecycle without tight coupling; enables retry policies and dead-letter handling
- **Trade-offs:** Added event dispatcher dependency and eventual consistency semantics; gained horizontal scalability and loose coupling for AI processing module

### Input validation via class-validator decorators with implicit sanitization for XSS protection rather than explicit sanitization layer (2026-01-15)
- **Context:** SubmitLegalQueryInput uses @IsString, @MinLength(3) decorators; no explicit XSS sanitization logic in service
- **Why:** class-validator is standard in NestJS ecosystem and provides consistent validation UX; length constraints implicitly prevent some XSS vectors; separation of concerns assumes downstream systems handle escaping
- **Rejected:** Explicit sanitization layer would be redundant if GraphQL/database later escape output; library coupling would increase; input validation responsibility should be clear at boundaries
- **Trade-offs:** Simpler code but requires assumption that all output paths properly escape/sanitize; less defense-in-depth
- **Breaking if changed:** Removing decorators allows arbitrary questions including null/undefined which would fail in AI processing or cause schema violations

### Marking deleteLegalQuery as deprecated in favor of auto-generated deleteOneLegalQuery despite both existing (2026-01-15)
- **Context:** Custom resolver implements deleteLegalQuery mutation; nestjs-query auto-generates deleteOneLegalQuery; implementation notes mark custom version as deprecated
- **Why:** Auto-generated operation is more discoverable in schema and consistent with CRUD pattern naming; custom implementation was likely placeholder before auto-generation configured; consolidates around standard patterns
- **Rejected:** Keeping custom implementation duplicates functionality and creates naming confusion; removing auto-generation would lose standardization
- **Trade-offs:** Requires client migration; gained schema consistency and reduced duplicate code paths
- **Breaking if changed:** If clients depend on deleteLegalQuery name, deprecation path is required; switching to deleteOneLegalQuery changes mutation contract

#### [Pattern] Entity helper methods (`isComplete()`, `isFromHigherCourt()`, `getRulingYear()`, `getKeywords()`) provide domain logic encapsulation. These methods centralize business rules rather than scattering them across resolvers/services. (2026-01-16)
- **Problem solved:** LegalRuling entity needed methods to check completeness, extract year from date, identify court hierarchy level, and access nested metadata without direct property access.
- **Why this works:** Encapsulating domain logic in the entity makes it reusable across GraphQL resolvers, services, and tests. Single source of truth for what 'complete' means. Enables type-safe refactoring if properties change.
- **Trade-offs:** Entity becomes less of a pure data holder but gains significant maintainability. Small performance cost of method calls offset by cleaner, more testable code. Entity size increases but remains focused on domain.

### Dual resolver strategy: Both nestjs-query auto-generated CRUD resolvers AND custom resolver for domain-specific search operations (2026-01-16)
- **Context:** Need standard CRUD operations plus advanced full-text search with ranking and highlighting
- **Why:** nestjs-query provides instant CRUD endpoints but cannot express complex PostgreSQL features like ts_rank and ts_headline. Custom resolver coexists without conflicts because they expose different query names (searchLegalRulings vs auto-generated legalRulings)
- **Rejected:** Single resolver approach would require either losing CRUD functionality or manually reimplementing all CRUD operations
- **Trade-offs:** Dual approach means two ways to query (legalRulings auto-generated + searchLegalRulings custom), potential confusion but maximum capability. Requires disciplined naming to avoid confusion
- **Breaking if changed:** Removing custom resolver loses search capabilities but CRUD remains. Removing nestjs-query decorator loses basic CRUD but search persists - they're orthogonal

#### [Pattern] Lazy browser initialization with singleton pattern in PDF generator service (2026-01-16)
- **Problem solved:** Puppeteer browser instance is expensive to create and should persist across PDF generation requests for efficiency
- **Why this works:** Avoids spawning a new Chrome process for every PDF request. Browser initialization is expensive (~500ms+), so singleton pattern amortizes cost. Lazy initialization defers cost until first PDF generation.
- **Trade-offs:** Increased complexity in lifecycle management vs significant performance gain. Requires proper cleanup on module destroy to prevent zombie processes. Shared state means must handle concurrent requests safely.

### Bull queue processor pattern for async PDF generation with job status tracking (2026-01-16)
- **Context:** PDF generation is async I/O bound. Need durable processing with retry semantics and job status visibility
- **Why:** Bull provides built-in Redis persistence, automatic retries on failure, job lifecycle hooks, and status tracking. Decouples API layer from generation layer. Survives process crashes - pending jobs resume on restart.
- **Rejected:** Direct async/await (loses job persistence and retry logic), or custom queue implementation (reinventing Bull)
- **Trade-offs:** Adds Redis dependency and Bull complexity vs clean separation of concerns and production-grade reliability. Worth it for document processing where durability matters.
- **Breaking if changed:** Removing Bull queue loses job persistence - in-flight PDF exports are lost on crash. No retry mechanism for transient failures.

#### [Pattern] Helper function exports (getAccessToken, getRefreshToken, tryRefreshToken) expose internal auth state to other providers (2026-01-19)
- **Problem solved:** Data provider and other client code need access to tokens and refresh logic without reimplementing token management
- **Why this works:** Centralizes token access pattern and forces consumers to use consistent refresh mechanism. Exporting functions (not raw cookie access) enforces refresh logic rather than allowing stale token usage. Enables data provider to add Bearer header without reimplementing refresh
- **Trade-offs:** Exported functions create tighter coupling between auth provider and consumers but enforce correct token handling; harder to test consumers in isolation

### Separated frontend and backend to different ports (3000 vs 3001) instead of proxying or using same port (2026-01-19)
- **Context:** Initial setup had both services competing for port 3000, causing connection failures and 404 errors
- **Why:** Allows independent scaling, easier local development workflow, clearer separation of concerns. Monorepo with multiple services needs explicit port allocation strategy
- **Rejected:** Could have used single port with reverse proxy or API proxying through Next.js - but adds complexity and masks service boundaries
- **Trade-offs:** Easier: independent service restart, clearer debugging. Harder: requires environment variable coordination, CORS must be properly configured
- **Breaking if changed:** If ports are changed without updating all three configuration points (main.ts default, .env files, provider URLs), frontend breaks silently with 404s

#### [Pattern] Separated seed data fixtures from seeding logic (data/*.seed.ts vs seed.service.ts) (2026-01-20)
- **Problem solved:** Managing 7 different entity types with complex interdependencies and realistic test data
- **Why this works:** Fixture files become the source of truth for test/dev data, reusable across multiple contexts (unit tests, e2e, migrations). Service layer handles orchestration logic separately, respecting single-responsibility principle
- **Trade-offs:** More files to manage but enables fixture reuse in unit tests and migrations. Makes data updates easier since fixtures are isolated

#### [Pattern] Explicit entity dependency ordering in SeedService (Users → Sessions → Documents/Analyses/Queries) (2026-01-20)
- **Problem solved:** Multiple entities have foreign key relationships; seeding must respect referential integrity
- **Why this works:** Database transactions/FK constraints will fail if children are created before parents. Explicit ordering in seeding makes dependency graph visible and prevents subtle race conditions. NestJS module initialization order is not guaranteed to match data dependency order
- **Trade-offs:** Seeding is sequential (slower) but guaranteed correct. Makes explicit what the implicit data model is

#### [Gotcha] CSRF guard applied globally to all contexts but failed on REST controllers because GraphQL execution context is unavailable in HTTP requests (2026-01-20)
- **Situation:** Guard checked `info.parentType.name` without verifying context type, causing crashes when REST endpoints were executed with the global guard registered
- **Root cause:** Initial implementation assumed all protected operations would be GraphQL mutations; REST endpoints have different execution context flow
- **How to avoid:** Added context-type checking adds minimal overhead but prevents crashes; must explicitly skip non-GraphQL contexts rather than letting them fail

### AuthModule was pre-registered in app.module.ts imports array rather than being lazily loaded or conditionally imported (2026-01-20)
- **Context:** Feature task claimed to 'import AuthModule' but it was already imported, suggesting this is core infrastructure
- **Why:** Authentication is a cross-cutting concern needed at application bootstrap time. Eager loading ensures auth guards and middleware are available for all routes immediately
- **Rejected:** Lazy loading auth module per route - would require runtime guard registration and delay auth availability
- **Trade-offs:** Eager loading increases initial bundle size but guarantees auth availability; lazy loading defers cost but complicates guard registration logic
- **Breaking if changed:** Removing AuthModule from imports would cause 401/auth-related route guards to fail silently or throw at runtime, not compile-time

### AuthModule uses NestJS module pattern with separate controller, resolver, and service layers rather than monolithic auth file (2026-01-20)
- **Context:** File structure shows auth.controller.ts, auth.resolver.ts, auth.module.ts, auth.service.ts organization
- **Why:** Separation of concerns allows HTTP/GraphQL transport layers to be independent from business logic; enables testing transport layer separately from auth logic
- **Rejected:** Single-file auth handler would be faster to write but couples transport to logic, making REST/GraphQL refactoring risky
- **Trade-offs:** More files and imports required but enables independent testing of controller/resolver from service; service can be reused by multiple transports
- **Breaking if changed:** If AuthService API changes, both controller AND resolver must be updated; forgetting to update one creates inconsistent behavior between REST/GraphQL

#### [Gotcha] Initially created custom GqlThrottlerGuard wrapper, then reverted to standard ThrottlerGuard after discovering it handles both GraphQL and REST transparently (2026-01-20)
- **Situation:** Assumed GraphQL required custom guard implementation due to different request structure vs HTTP
- **Root cause:** NestJS @nestjs/throttler has built-in GraphQL support through middleware that extracts IP before execution layer. Custom wrapper added complexity without benefit
- **How to avoid:** Standard guard is simpler but less visible in resolver code (guard is global, not decorated per-resolver). Decorators provide discovery but don't replace guard responsibility

#### [Pattern] Separated rate limiting concerns into composable decorators (@SkipThrottle, @StrictThrottle) while keeping guard application global, creating a hybrid intent-declaration + global-enforcement pattern (2026-01-20)
- **Problem solved:** Needed to express rate limit intent at resolver level for maintainability while ensuring all endpoints are covered by default
- **Why this works:** Global guard ensures no endpoint accidentally escapes rate limiting; decorators serve as documentation of special cases. Solves 'undecorated endpoints silently bypass security' problem while keeping per-resolver control
- **Trade-offs:** Developers must understand both global guard + decorator intent; more discoverable than config map but requires discipline. Prevents accidental gaps at cost of dual-layer thinking

### Used NestjsQueryGraphQLModule.forFeature() to auto-generate CRUD resolvers instead of manually implementing resolvers (2026-01-20)
- **Context:** Refactoring User entity to use nestjs-query framework for GraphQL API
- **Why:** Auto-generation reduces boilerplate and ensures consistency. nestjs-query handles resolver creation, validation, filtering, and pagination automatically based on entity decorators
- **Rejected:** Manual resolver implementation - would require writing create, read, update, delete resolvers for each entity with duplicate validation and filtering logic
- **Trade-offs:** Easier: Less code, consistent patterns, built-in filtering/sorting. Harder: Less control over resolver behavior, must follow nestjs-query conventions, debugging generated code
- **Breaking if changed:** Removing NestjsQueryGraphQLModule loses all auto-generated resolvers. Must revert to manual resolver implementation with significant code duplication

### Created separate UserOrmEntity and UserMapper to transform between domain (UserAggregate) and persistence (TypeORM) layers (2026-01-20)
- **Context:** Maintaining DDD pattern while integrating with nestjs-query which requires TypeORM entities with decorators
- **Why:** DDD requires domain entities to be persistence-agnostic. nestjs-query requires entities decorated with @Entity and @Relation which are infrastructure concerns. Mapper pattern isolates these concerns
- **Rejected:** Adding @Entity and @Relation decorators directly to UserAggregate - would violate DDD separation of domain logic from infrastructure
- **Trade-offs:** Easier: Clean domain model, infrastructure concerns isolated. Harder: Extra mapping layer, more files to maintain, slight performance overhead
- **Breaking if changed:** Removing mapper pattern requires either: (1) polluting domain entity with infrastructure decorators, or (2) passing ORM entities through domain layer which violates DDD

#### [Pattern] Used separate CreateUserInput and UpdateUserInput DTOs instead of single UserInput DTO (2026-01-20)
- **Problem solved:** GraphQL input validation requires different rules for creation (all fields required) vs update (all fields optional)
- **Why this works:** Separation allows different validation rules and field requirements. Create requires email/firstName/lastName, Update makes all optional. Single DTO would require nullable fields and conditional validation
- **Trade-offs:** Easier: Clear validation rules per operation. Harder: More DTOs to maintain, more code

### Implemented audit logging via global NestJS interceptor rather than scattered mutation-level decorators (2026-01-20)
- **Context:** Needed to audit all GraphQL mutations without modifying each resolver
- **Why:** Interceptor provides single point of control for cross-cutting concern. Ensures 100% coverage of mutations without developer effort at call-site. Centralizes audit logic and makes it easier to evolve audit rules.
- **Rejected:** Per-resolver decorators - would require updating every mutation, risk of missed mutations, harder to maintain consistent audit behavior
- **Trade-offs:** Easier: Universal coverage, single maintenance point. Harder: Mutation mapping logic concentrated in one place, requires understanding interceptor execution model for debugging
- **Breaking if changed:** Removing interceptor loses audit for ALL mutations. No way to audit selectively per mutation without re-implementing decorator approach.

#### [Pattern] Separated application layer (use case + service) from presentation layer (interceptor). Interceptor delegates to application service which delegates to use case. (2026-01-20)
- **Problem solved:** Needed to maintain layered architecture while capturing mutations at HTTP level
- **Why this works:** Allows audit logic to be tested independently of HTTP/GraphQL transport. Domain logic stays in use case, orchestration in service, transport concerns in interceptor. Multiple transport layers (REST, gRPC) could reuse same audit logic.
- **Trade-offs:** Easier: Testing, reusability, separation of concerns. Harder: More files and indirection to follow the flow

### Map GraphQL mutation names to audit action types (CREATE, UPDATE, DELETE) via naming convention rather than explicit configuration (2026-01-20)
- **Context:** Needed to derive action type from mutation name without per-mutation setup
- **Why:** Scalable - works for any mutation that follows naming convention (createUser, updateDocument, deleteSession). Zero configuration overhead. Self-documenting if convention is consistent.
- **Rejected:** Configuration map of mutation name to action - would require maintenance as new mutations added. Decorators on resolvers - couples audit logic to resolvers.
- **Trade-offs:** Easier: No config drift, automatic for new mutations. Harder: Requires enforcing naming convention, mutation names must be semantic
- **Breaking if changed:** If mutations don't follow naming convention, audit actions will be wrong or default to generic type. If logic for deriving action is removed, mutations won't be categorized.

#### [Gotcha] Extracting user ID from JWT token in interceptor creates implicit dependency on auth implementation details (2026-01-20)
- **Situation:** Interceptor accesses JWT payload directly from request context to get user ID for audit
- **Root cause:** User ID needed immediately in interceptor, before resolver runs. Interceptor executes before guards/pipes that would validate token, so token structure assumed to be valid.
- **How to avoid:** Easier: Capture user ID at right time. Harder: Tightly coupled to JWT payload structure, breaks if auth changes (switch to OIDC, different token format, etc.)

### Read-only auditLogProvider implementation where create/update methods are no-ops rather than throwing errors (2026-01-20)
- **Context:** Audit logs are immutable records created by backend interceptors, not user-facing mutations
- **Why:** Allows seamless integration with Refine's AuditLogProvider interface without exposing a confusing error state. Backend enforcement via AuditLoggingInterceptor is the source of truth
- **Rejected:** Throwing NotImplementedError on create/update would signal contract violation to Refine. Making auditLogProvider a separate non-mutation resource
- **Trade-offs:** Simpler integration but obscures immutability at type level. Developers must understand that audit logs are backend-managed. Guards database constraints via backend-only logic
- **Breaking if changed:** If audit logs become mutable in future, implementations assuming no-op behavior will silently fail to persist changes

#### [Pattern] Backend auto-generates audit logs via AuditLoggingInterceptor on every mutation, frontend only reads via auditLogProvider (2026-01-20)
- **Problem solved:** Need comprehensive 'who did what when' tracking across all resources without duplicating audit logic
- **Why this works:** Interceptor captures full mutation context (user, timestamp, changes) at source. Frontend reading immutable logs prevents inconsistency. Single source of truth in backend
- **Trade-offs:** Frontend can't create audit records (simpler contract) but dependent on backend always capturing them. Audit visibility lag if backend logs asynchronously

#### [Gotcha] Dashboard page already existed from previous implementation attempt, causing confusion during verification process (2026-01-20)
- **Situation:** Feature implementation appeared to be new task, but components were partially implemented in earlier work
- **Root cause:** Previous implementation was not cleaned up or documented, leading to duplicate effort and verification delays
- **How to avoid:** Required git inspection and verification instead of straightforward new implementation; reduced development time but increased verification complexity

### Dashboard implemented as page component within (authenticated) route group rather than as separate sub-application (2026-01-20)
- **Context:** Feature needed to be accessible only to authenticated users with access to user-specific data
- **Why:** Next.js route groups provide built-in authentication boundary; shared layout inheritance; cleaner file organization
- **Rejected:** Separate app directory; middleware-based protection; portal pattern
- **Trade-offs:** Simplified authentication model but restricted to file-system based routing; gained layout inheritance at cost of less flexible route organization
- **Breaking if changed:** Moving dashboard outside (authenticated) group would require explicit auth checks in page component; changing layout structure would break inherited context providers

### Composite widget pattern: ActivityTimeline wraps ActivityItem components rather than flat list rendering (2026-01-20)
- **Context:** Building reusable activity feed component that could be used in multiple pages
- **Why:** Enables ActivityItem to be independently reusable for other contexts (e.g., inline activity in detail pages) while ActivityTimeline handles layout, pagination, and empty states. Composition over monolithic components.
- **Rejected:** Single monolithic ActivityFeed component that renders everything - would reduce reusability and make item-level customization difficult
- **Trade-offs:** Slight additional prop threading but significantly improved flexibility and testability; enables atomic component library
- **Breaking if changed:** If ActivityTimeline becomes a direct renderer instead of composing ActivityItem, consumers can't substitute custom item renderers or reuse item styling elsewhere

### Widget components accept optional loading/empty states as props rather than managing data fetching internally (2026-01-20)
- **Context:** StatCard, ActivityTimeline, NotificationBell needed to work with external data sources
- **Why:** Separates presentation from data concerns - parent components handle GraphQL queries via Refine hooks, widgets only render. Enables reuse with different data sources and makes testing/mocking trivial.
- **Rejected:** Components fetching their own data with built-in useList hooks - creates tight coupling to data layer and makes components harder to test
- **Trade-offs:** Requires more discipline at consumption point but enables true reusability; parent becomes slightly more complex but gains full control
- **Breaking if changed:** If widgets internalize data fetching, they become source-specific and can't be reused across different data models or contexts

#### [Pattern] Internationalization handled at component consumption level (parent imports translations) not component level (2026-01-20)
- **Problem solved:** Adding translations for activity/notification labels and empty states
- **Why this works:** Avoids creating translation dependencies in reusable components. Widget components remain i18n-agnostic and text-agnostic, receiving labels as props when needed.
- **Trade-offs:** Parent becomes responsible for translation strings but components remain pure and testable; enables multi-language consumers more easily

### Dedicated edit page at /documents/edit/[id] instead of inline editing on detail page (2026-01-20)
- **Context:** Original design had inline editing on the detail page, but this was refactored to a dedicated page
- **Why:** Separates concerns and simplifies state management. Dedicated form page allows for focused UX without mixing read and write concerns. Cleaner code by removing conditional rendering logic from detail page
- **Rejected:** Inline edit mode toggled from detail page would require prop drilling, conditional form rendering, and complex state management for switching between view and edit modes
- **Trade-offs:** User must navigate to new page (one extra page load) but gains clearer mental model and simpler maintenance. Detail page code becomes simpler and more readable
- **Breaking if changed:** If changed back to inline editing, detail page component complexity increases significantly, edit state management becomes harder to track

#### [Pattern] Reusing refine's useForm hook with action: 'edit' pattern rather than custom form logic (2026-01-20)
- **Problem solved:** Project uses refine framework which provides form abstraction layer
- **Why this works:** Leverages framework conventions = consistent with create form, automatic mutation handling, built-in loading/error states. Reduces boilerplate and maintenance
- **Trade-offs:** Constrained by refine's API but gains consistency and less code. Form behavior mirrors create flow exactly (familiar to developers)

### Avoided over-engineering: no rich text editor, auto-save, revision history, or concurrent edit detection (2026-01-20)
- **Context:** Implementation notes explicitly call out future enhancements that were NOT implemented
- **Why:** MVP principle: deliver core requirement (edit existing documents) without speculative features. Each omitted feature adds complexity with unclear ROI until user requests it
- **Rejected:** Could implement rich text editor (increases complexity 3-5x, requires new dependency), auto-save (adds backend load, state sync complexity), revision history (increases storage and query complexity)
- **Trade-offs:** Simpler, more maintainable code now. If features needed later, adding them is straightforward (not architecturally locked out). Avoids premature optimization
- **Breaking if changed:** If requirements expand (e.g., WYSIWYG editor becomes critical), current textarea-based content field doesn't support rich formatting - would need refactoring

### Implemented permission hierarchy (ADMIN > EDIT > COMMENT > VIEW) with enum-based permission levels rather than role-based access control (2026-01-20)
- **Context:** Document sharing required granular per-user permissions independent of system-wide roles
- **Why:** Enum-based permissions allow fine-grained control per shared relationship, avoiding complexity of RBAC matrix. Hierarchy simplifies permission validation logic - can check if permission >= required_level
- **Rejected:** RBAC with role inheritance - would require creating new roles for each sharing combination and complex role assignment logic per document
- **Trade-offs:** Simpler permission checks (+) but requires custom permission logic in service layer (-) instead of using framework's built-in authorization guards
- **Breaking if changed:** Changing to role-based system would require rewriting DocumentSharingService.canUserAccessDocument() and resolver guards; existing permission validation assumes flat hierarchy

#### [Pattern] Separated DocumentShare entity from Document entity with explicit foreign keys rather than embedding sharing logic in Document entity (2026-01-20)
- **Problem solved:** Adding sharing capability to existing document system
- **Why this works:** Separates concerns - Document focuses on document content/metadata, DocumentShare handles permission relationships. Avoids Document entity bloat and makes sharing optional conceptually
- **Trade-offs:** Clean separation (+) requires extra join query to load shares (-), but queries are optimized with proper indexes

#### [Pattern] Permission hierarchy enforced numerically (VIEW=1, COMMENT=2, EDIT=3, ADMIN=4) with comparison logic in hasRequiredPermission() (2026-01-20)
- **Problem solved:** Determining if a user with one permission level can perform actions requiring another level
- **Why this works:** Numeric comparison scales better than string-based permission checks or role matrix lookups. Allows single line checks like `userPermission >= requiredPermission` across the codebase
- **Trade-offs:** Permission semantics are implicit in numeric values (developers must know the ordering), but eliminates permission lookup table and makes permission checks O(1) instead of O(n)

#### [Pattern] Domain events (emitted via DomainEventsPublisher) instead of direct audit service calls in sharing operations (2026-01-20)
- **Problem solved:** Logging who shared documents, when, and with whom for compliance and auditing
- **Why this works:** Decouples sharing logic from audit concerns. Events can be consumed by audit, analytics, notifications, or other systems without modifying sharing code. Supports eventual consistency
- **Trade-offs:** Slightly more code (event publishing), but gains loose coupling and ability to add audit consumers without touching sharing code

### Template processing performs two-step creation: create document shell, then update with processed content, then manually assign properties to returned object (2026-01-21)
- **Context:** Update operation doesn't return the updated document, creating impedance between service response and what resolver needs to return
- **Why:** Maintains clean separation between document metadata persistence and content persistence; allows services to have focused responsibilities
- **Rejected:** Modifying update() to return the updated document would work but creates inconsistent return types across service methods
- **Trade-offs:** Requires manual property assignment on returned object (creates potential staleness), but keeps service contracts clear and allows for async content processing if needed
- **Breaking if changed:** If update() starts returning full document, manual assignment becomes redundant but the pattern still works

#### [Pattern] JSONB storage for template variables, conditional sections, and formatting rules provides schema flexibility without migration churn (2026-01-21)
- **Problem solved:** Legal document templates need to support arbitrary variable types, validation rules, and locale-specific formatting that vary by document category
- **Why this works:** JSONB allows template schema evolution without database migrations; supports polymorphic template types without entity inheritance complexity
- **Trade-offs:** Trades strict schema validation for operational flexibility; query performance requires proper JSONB indexing; no schema inference in queries

#### [Gotcha] Usage tracking (usageCount) incremented on template processing, but increment happens silently without transaction guarantee or visibility (2026-01-21)
- **Situation:** Template is processed in resolver, usageCount incremented in service, but no explicit feedback or error handling if increment fails
- **Root cause:** Usage tracking is non-critical side effect; failure shouldn't block document generation; follows fire-and-forget pattern for analytics
- **How to avoid:** Usage counts may be inaccurate under high concurrency or failures, but document generation always succeeds; enables future async analytics

### Store contentSnapshot as full text field rather than delta/diff storage (2026-01-21)
- **Context:** Legal documents require ability to render any historical version independently
- **Why:** Full snapshots eliminate dependency chain - don't need to replay all prior versions to reconstruct history. Critical for legal context where you may need to prove exactly what was in effect at specific timestamp. Delta compression would save space but add reconstruction latency and dependency risk
- **Rejected:** Differential storage (like git patches), compression algorithms
- **Trade-offs:** Easier: instant version retrieval, no reconstruction risk, audit compliance simple. Harder: storage cost scales with document count and frequency of changes
- **Breaking if changed:** If changed to delta storage, any corruption in middle version makes all subsequent versions unrecoverable. Timestamp reconstruction becomes dependent on full history integrity.

### Used append-only immutable version history with complete content snapshots rather than delta storage (2026-01-21)
- **Context:** Designing version storage mechanism for document audit trail
- **Why:** Ensures complete audit compliance, eliminates dependency chain problems where applying deltas in sequence could fail, enables fast point-in-time restore, simplifies rollback logic by directly swapping content without reconstruction
- **Rejected:** Delta-based storage (storing only changes between versions) would be more space-efficient but creates brittleness: a single corrupted delta breaks all subsequent versions, and restoring requires sequential application
- **Trade-offs:** Higher storage costs versus guaranteed data integrity and simple, reliable recovery logic. Immutability prevents accidental version deletion but requires new versions on rollback
- **Breaking if changed:** If changed to delta-based, rollback logic must be rewritten to reconstruct versions, and corruption handling becomes critical. Audit compliance risk increases significantly.

### Implemented automatic versioning via hook in DocumentsService.update() rather than database triggers or event listeners (2026-01-21)
- **Context:** Ensuring versions are created consistently whenever document content changes
- **Why:** Application-level logic is testable without database setup, versioning is transparent to callers, no risk of version creation being bypassed if trigger logic fails, simplifies debugging by keeping all version logic in one service layer
- **Rejected:** Database triggers would be faster but create tight coupling to DB schema, harder to test, and version-related logic split between application and DB. Event listeners add async complexity where version creation could race with other operations.
- **Trade-offs:** Slightly slower (application code vs native DB operation) but gains testability, debuggability, and consistency guarantees. Required detecting actual content changes to avoid duplicate versions.
- **Breaking if changed:** Direct database updates bypass versioning. Any service or endpoint that updates document content must go through DocumentsService.update() or versioning breaks silently.

#### [Gotcha] Had to use forwardRef() to resolve circular dependency between DocumentsService and DocumentVersioningService (2026-01-21)
- **Situation:** DocumentsService needs to call DocumentVersioningService.createVersion(), but DocumentVersioningService needed DocumentsService for rollback operations
- **Root cause:** TypeScript circular dependencies at module load time cause 'undefined' service injections. ForwardRef defers service resolution until runtime after both are instantiated.
- **How to avoid:** ForwardRef adds minor complexity but preserves clean service separation. Without it, rollback feature would not work.

#### [Pattern] Change description auto-generation from diff output (e.g., '+2 lines, -1 line, ~3 lines') instead of requiring manual description (2026-01-21)
- **Problem solved:** Users need to understand what changed between versions
- **Why this works:** Automatic generation ensures descriptions are always accurate and up-to-date with actual content. Manual descriptions create maintenance burden and can diverge from reality. Diff library provides structured change data.
- **Trade-offs:** Descriptions are technical/statistical rather than business-context focused, but always accurate and maintenance-free

### Event-driven email triggering via EventEmitter instead of direct service calls in domain logic (2026-01-21)
- **Context:** Email notifications needed to trigger on user registration and document events without coupling email service to domain modules
- **Why:** Decouples notification concerns from core business logic. Emails become optional infrastructure rather than required behavior. Allows service to be disabled (EMAIL_ENABLED=false) without affecting other modules. Follows CQRS-like pattern where events drive side effects.
- **Rejected:** Direct service injection in user/document services - would couple multiple modules and require notification service presence
- **Trade-offs:** Easier to disable/modify email logic, harder to guarantee delivery in transaction boundaries. Emails are eventual-consistent, not atomic with domain changes.
- **Breaking if changed:** If removed, user registration and document events lose auto-notification. Other modules don't know emails exist (correct isolation).

### Two-stage email processing: queue producer → Bull queue → processor service (2026-01-21)
- **Context:** Needed to decouple email transmission timing from user request handling without blocking responses
- **Why:** Bull queues with Redis provide reliable job persistence, retry logic, and worker scalability. Separating producer (async enqueue) from processor (actual sending) allows multiple workers and handles failures. Producer pattern lets any module queue emails without knowing SendGrid details.
- **Rejected:** Direct SendGrid calls would block requests. Simple in-memory queue would lose jobs on restart. Async/await without persistence loses failed emails.
- **Trade-offs:** Added Redis dependency and complexity, but gained failure recovery, monitoring, and scalability. Emails take milliseconds to enqueue (fast) but may take seconds to actually send.
- **Breaking if changed:** Removing Bull queue loses retry logic, persistence, and queue monitoring. Failed emails vanish silently. All email events would need synchronous handling.

#### [Pattern] EMAIL_ENABLED flag gates actual SendGrid calls but allows full service operation in dev mode (2026-01-21)
- **Problem solved:** Backend needs to work in development without SendGrid account/API key, but system must be testable end-to-end
- **Why this works:** Development velocity: developers can test email features without secrets management. Logging emails to console shows what would be sent. No Redis/SendGrid setup required locally. Flag is cleaner than trying to mock SendGrid or skip email-dependent code paths.
- **Trade-offs:** Easier local development and testing, but dry-run mode can't catch SendGrid-specific errors (auth, rate limits, address validation) until production

#### [Pattern] Webhook-driven status tracking integrated with Bull queue processor instead of polling SendGrid API (2026-01-21)
- **Problem solved:** Email delivery status needs to be tracked in real-time as SendGrid processes queued emails
- **Why this works:** Webhooks are event-driven and eliminate polling overhead. Reduces API quota consumption and provides real-time updates. Complements async queue architecture by maintaining loose coupling between SendGrid and application state
- **Trade-offs:** Requires webhook signature verification complexity and assumes SendGrid reliability for event delivery. Gains real-time accuracy and operational efficiency

#### [Gotcha] Webhook events must handle 'bounce' event type with bounce classification logic to correctly set notification status (2026-01-21)
- **Situation:** SendGrid sends generic 'bounce' events but classifies them into permanent vs temporary. Application needs BOUNCED status regardless of bounce type
- **Root cause:** Webhook payload structure has nested bounce classification. Code must extract and normalize this to application's simpler BOUNCED state. Different bounce types may require different user-facing messaging but all mark notification as bounced
- **How to avoid:** Normalizes SendGrid's classification layer but loses detailed bounce type info in notification record. Must preserve full bounce data in metadata if detailed analysis needed later

#### [Pattern] Event emission from webhook handler (emit EMAIL.DELIVERED, EMAIL.BOUNCED, etc.) creates secondary notification pathway for other modules (2026-01-21)
- **Problem solved:** Webhook controller updates notification status directly but other system components may need to react to delivery status changes
- **Why this works:** Event-driven architecture allows loose coupling. Other modules (e.g., user analytics, retry logic) can subscribe to email events without modifying webhook controller. Maintains single responsibility principle
- **Trade-offs:** Adds abstraction layer and EventEmitter overhead but enables extensibility without modifying webhook logic. New event subscribers don't require webhook changes

### Webhook handler continues processing remaining events if one event fails (graceful degradation) rather than failing entire batch (2026-01-21)
- **Context:** SendGrid can batch multiple webhook events in single POST. If one event processing throws error, decision needed: fail entire batch or skip failed event
- **Why:** Partial failure should not block entire webhook delivery. Single malformed event shouldn't prevent processing of 9 valid events in batch. Aligns with fault-tolerance principles. Failed events logged for investigation
- **Rejected:** Fail entire batch on first error - single bad webhook event would block all subsequent notifications from being updated until retry succeeds. Cascading failure
- **Trade-offs:** Requires error handling and logging but ensures webhook resilience. Failed events must be tracked separately for monitoring
- **Breaking if changed:** If changed to fail-fast behavior, single problematic webhook event stops all batch processing; notification status updates lag or fail completely until problem resolved