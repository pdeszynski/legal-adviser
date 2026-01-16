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