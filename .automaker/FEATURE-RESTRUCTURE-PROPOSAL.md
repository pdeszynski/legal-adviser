# Feature Restructure Proposal

**Date**: 2026-01-13  
**Purpose**: Align `.automaker/features/` with DDD, Modular Monolith, and Layered Architecture principles

---

## Current State: 98 Features (Fragmented)

Features are organized by **technical layer** (entity → graphql → service → ui), creating:
- Horizontal coupling across layers
- Fragmented aggregates
- Direct dependencies instead of events
- Impossible to complete a user story without touching 5+ features

---

## Proposed State: ~25 Domain Features + ~10 Infrastructure Features

### Principles Applied

1. **Vertical Slicing**: Each feature delivers complete user value through all layers
2. **Aggregate Cohesion**: Features map to DDD aggregates, not database tables
3. **Event-Driven Communication**: Cross-module features use events, not imports
4. **Infrastructure Separation**: Technical concerns isolated from business logic

---

## Bounded Contexts & Domain Features

### 📁 Context: Documents (Core Domain)

**Aggregate Root**: `LegalDocument`

| New Feature ID | Consolidates | Description |
|----------------|--------------|-------------|
| `document-management` | `legal-document-nestjs-query`, `document-edit-form`, `document-list-view`, `document-detail-view` | Full CRUD for legal documents with UI |
| `document-generation` | `document-generation-queue`, part of `pdf-export-service` | AI-powered document creation workflow |
| `document-versioning` | `document-version-entity`, `document-versioning-logic` | Version history and diff tracking |
| `document-collaboration` | `document-comments-entity`, `comment-system-ui`, `document-sharing`, `share-dialog` | Comments, sharing, permissions |
| `document-export` | `pdf-export-service`, `pdf-export-queue`, `pdf-download-endpoint` | PDF generation and download |
| `document-templates` | `template-entity`, `template-graphql`, `template-editor`, `template-library-page` | Reusable document templates |

**Events Emitted**:
- `DOCUMENT.CREATED`
- `DOCUMENT.UPDATED`
- `DOCUMENT.GENERATION_STARTED`
- `DOCUMENT.GENERATION_COMPLETED`
- `DOCUMENT.SHARED`
- `DOCUMENT.EXPORTED`

---

### 📁 Context: Legal Q&A (Core Domain)

**Aggregate Root**: `LegalQuery`

| New Feature ID | Consolidates | Description |
|----------------|--------------|-------------|
| `legal-qa` | `legal-query-entity`, `legal-query-graphql`, `qa-agent-implementation`, `qa-backend-integration`, `qa-rest-endpoint`, `qa-langgraph-workflow` | Complete Q&A flow: entity → AI agent → API |
| `legal-qa-ui` | `chat-page`, `chat-ui-component`, `citation-rendering` | Chat interface with citation display |
| `legal-qa-rag` | `rag-vector-store`, `rag-retrieval-logic` | RAG infrastructure for Q&A context |

**Events Emitted**:
- `QUERY.ASKED`
- `QUERY.ANSWERED`
- `QUERY.FAILED`

---

### 📁 Context: Case Law Search (Core Domain)

**Aggregate Root**: `LegalRuling`

| New Feature ID | Consolidates | Description |
|----------------|--------------|-------------|
| `ruling-search` | `legal-ruling-entity`, `legal-ruling-graphql`, `ruling-search-service`, `ruling-search-graphql` | Full ruling search capability |
| `ruling-search-ui` | `ruling-search-page`, `ruling-detail-page` | Search interface and detail views |
| `ruling-indexing` | `ruling-indexing-job`, `saos-integration`, `isap-integration` | External source integration |

**Events Emitted**:
- `RULING.INDEXED`
- `RULING.SEARCH_PERFORMED`

---

### 📁 Context: Legal Analysis (Core Domain)

**Aggregate Root**: `LegalAnalysis`

| New Feature ID | Consolidates | Description |
|----------------|--------------|-------------|
| `case-analysis` | `legal-analysis-entity`, `legal-analysis-graphql`, `classifier-agent`, `classifier-backend-integration`, `classifier-rest-endpoint`, `legal-grounds-suggestions` | Complete case classification flow |
| `case-analysis-ui` | `analyze-case-page` | Analysis interface |

**Events Emitted**:
- `ANALYSIS.STARTED`
- `ANALYSIS.COMPLETED`
- `ANALYSIS.GROUNDS_IDENTIFIED`

---

### 📁 Context: Users & Auth (Supporting Domain)

**Aggregate Root**: `User`, `UserSession`

| New Feature ID | Consolidates | Description |
|----------------|--------------|-------------|
| `user-management` | (existing users module), `user-management-admin` | User CRUD and admin interface |
| `user-preferences` | `user-preferences-entity`, `user-preferences-graphql`, `settings-page` | User settings and preferences |
| `authentication` | (existing auth module), `graphql-auth-mutations` | Auth flow (GraphQL-based) |

**Events Emitted**:
- `USER.REGISTERED`
- `USER.LOGGED_IN`
- `USER.PREFERENCES_UPDATED`

---

### 📁 Context: Notifications (Supporting Domain)

**Aggregate Root**: `Notification`

| New Feature ID | Consolidates | Description |
|----------------|--------------|-------------|
| `notifications` | `notification-entity`, `notification-service`, `notification-graphql`, `notification-center`, `notification-bell` | Complete notification system |
| `document-completion-notification` | (same) | **Listens to**: `DOCUMENT.GENERATION_COMPLETED` |

**Events Emitted**:
- `NOTIFICATION.CREATED`
- `NOTIFICATION.READ`
- `NOTIFICATION.DISMISSED`

---

### 📁 Context: Billing & Subscriptions (Supporting Domain)

**Aggregate Root**: `Subscription`, `Usage`

| New Feature ID | Consolidates | Description |
|----------------|--------------|-------------|
| `subscriptions` | `subscription-plans-entity`, `subscription-management`, `billing-page` | Subscription management |
| `usage-tracking` | `usage-entity`, `usage-tracking`, `usage-dashboard`, `quota-enforcement` | Usage monitoring and limits |
| `payments` | `payment-integration` | Payment provider integration |

**Events Emitted**:
- `SUBSCRIPTION.CREATED`
- `SUBSCRIPTION.UPGRADED`
- `SUBSCRIPTION.CANCELLED`
- `USAGE.QUOTA_EXCEEDED`

---

### 📁 Context: API Access (Supporting Domain)

**Aggregate Root**: `ApiKey`

| New Feature ID | Consolidates | Description |
|----------------|--------------|-------------|
| `api-keys` | `api-keys-entity`, `api-key-authentication`, `api-key-management-ui` | API key management |

**Events Emitted**:
- `API_KEY.CREATED`
- `API_KEY.REVOKED`
- `API_KEY.USED`

---

### 📁 Context: Webhooks (Supporting Domain)

**Aggregate Root**: `Webhook`

| New Feature ID | Consolidates | Description |
|----------------|--------------|-------------|
| `webhooks` | `webhook-entity`, `webhook-system`, `webhook-delivery-queue` | Webhook configuration and delivery |

**Listens To** (all domain events for external notification):
- `DOCUMENT.*`
- `QUERY.*`
- `ANALYSIS.*`

---

### 📁 Context: Audit & Compliance (Supporting Domain)

**Aggregate Root**: `AuditLog`

| New Feature ID | Consolidates | Description |
|----------------|--------------|-------------|
| `audit-logging` | `audit-log-entity`, `audit-logging-interceptor`, `audit-log-provider` | Complete audit trail |

**Listens To** (cross-cutting):
- All domain events for audit trail

---

## Infrastructure Features (Cross-Cutting)

These are NOT domain features - they provide technical capabilities used by domain features.

| Feature ID | Consolidates | Purpose |
|------------|--------------|---------|
| `email-infrastructure` | `email-notification-service`, `email-queue-processor` | Email sending capability |
| `queue-infrastructure` | Bull setup, queue processors | Async job processing |
| `search-infrastructure` | `search-functionality`, `search-bar-component`, `advanced-search-page` | Generic search UI/UX |
| `security-middleware` | `xss-protection`, `csrf-protection`, `rate-limiting-middleware`, `input-validation-decorators` | Security hardening |
| `i18n-infrastructure` | `polish-translations`, `german-translations`, `locale-switcher-component` | Internationalization |
| `monitoring-infrastructure` | `health-check-endpoints`, `monitoring-setup`, `error-tracking-integration`, `logging-infrastructure`, `analytics-dashboard` | Observability |
| `admin-infrastructure` | `admin-panel-layout`, `system-settings-admin` | Admin UI shell |
| `disaster-recovery` | `disaster-recovery-plan`, `backup-strategy` | Ops documentation |

---

## New Feature Schema

```json
{
  "id": "document-management",
  "category": "Domain",
  "boundedContext": "Documents",        // NEW: Which context
  "aggregateRoot": "LegalDocument",     // NEW: DDD aggregate
  "title": "Document Management",
  "description": "Full CRUD for legal documents including entity, GraphQL API, and UI components",
  "status": "backlog",
  "priority": 1,
  "complexity": "moderate",
  
  // NEW: Event-driven dependencies
  "emits": [
    "DOCUMENT.CREATED",
    "DOCUMENT.UPDATED", 
    "DOCUMENT.DELETED"
  ],
  "listensTo": [],                      // No direct dependencies!
  
  // NEW: Vertical slice definition
  "layers": {
    "entity": "apps/backend/src/modules/documents/entities/",
    "service": "apps/backend/src/modules/documents/services/",
    "resolver": "apps/backend/src/modules/documents/",
    "ui": "apps/web/src/app/documents/"
  },
  
  // OLD: Replace with event subscriptions
  "dependencies": [],                   // EMPTY - use listensTo instead
  
  "createdAt": "2026-01-13T00:00:00.000Z",
  "updatedAt": "2026-01-13T00:00:00.000Z"
}
```

---

## Migration Path

### Phase 1: Schema Update
1. Add new fields to `feature.json` schema: `boundedContext`, `aggregateRoot`, `emits`, `listensTo`, `layers`
2. Keep existing features but mark as `deprecated`

### Phase 2: Feature Consolidation
1. Create new consolidated features per bounded context
2. Map old features to new ones with migration notes
3. Update status to `migrated` for old features

### Phase 3: Dependency Cleanup
1. Replace direct `dependencies` with `listensTo` event subscriptions
2. Validate no cross-module direct imports exist
3. Update feature implementation to use EventEmitter2

### Phase 4: Archive
1. Move deprecated features to `.automaker/features/_archived/`
2. Document mapping from old → new for reference

---

## Event Catalog

Central registry of all domain events:

```typescript
// apps/backend/src/shared/events/catalog.ts

export const DOMAIN_EVENTS = {
  // Documents Context
  DOCUMENT: {
    CREATED: 'document.created',
    UPDATED: 'document.updated',
    DELETED: 'document.deleted',
    GENERATION_STARTED: 'document.generation.started',
    GENERATION_COMPLETED: 'document.generation.completed',
    GENERATION_FAILED: 'document.generation.failed',
    SHARED: 'document.shared',
    EXPORTED: 'document.exported',
  },
  
  // Legal Q&A Context
  QUERY: {
    ASKED: 'query.asked',
    ANSWERED: 'query.answered',
    FAILED: 'query.failed',
  },
  
  // Case Law Context
  RULING: {
    INDEXED: 'ruling.indexed',
    SEARCH_PERFORMED: 'ruling.search.performed',
  },
  
  // Analysis Context
  ANALYSIS: {
    STARTED: 'analysis.started',
    COMPLETED: 'analysis.completed',
    GROUNDS_IDENTIFIED: 'analysis.grounds.identified',
  },
  
  // User Context
  USER: {
    REGISTERED: 'user.registered',
    LOGGED_IN: 'user.logged.in',
    PREFERENCES_UPDATED: 'user.preferences.updated',
  },
  
  // Subscription Context
  SUBSCRIPTION: {
    CREATED: 'subscription.created',
    UPGRADED: 'subscription.upgraded',
    CANCELLED: 'subscription.cancelled',
  },
  
  // Usage Context
  USAGE: {
    RECORDED: 'usage.recorded',
    QUOTA_EXCEEDED: 'usage.quota.exceeded',
  },
  
  // API Key Context
  API_KEY: {
    CREATED: 'api_key.created',
    REVOKED: 'api_key.revoked',
    USED: 'api_key.used',
  },
  
  // Audit Context (listens to all, emits none to prevent loops)
  AUDIT_LOG: {
    CREATED: 'audit_log.created',
  },
  
  // Notification Context
  NOTIFICATION: {
    CREATED: 'notification.created',
    READ: 'notification.read',
    DISMISSED: 'notification.dismissed',
  },
} as const;
```

---

## Benefits of Restructure

| Metric | Before | After |
|--------|--------|-------|
| Features count | 98 | ~35 |
| Avg. dependencies per feature | 1.5 | 0 (event-based) |
| Features to complete User Story 1 | 10+ | 2-3 |
| Cross-module imports | Many | None |
| Testability | Mock 5+ services | Mock event emitter |
| Developer cognitive load | High | Low |

---

## Example: User Story 1 Implementation

**Story**: "User generates a legal document from natural language"

### Before (10 features):
1. `legal-document-nestjs-query`
2. `document-generation-queue`
3. `pdf-export-service`
4. `pdf-export-queue`
5. `pdf-download-endpoint`
6. `document-edit-form`
7. `document-detail-view`
8. `document-list-view`
9. `document-completion-notification`
10. `email-queue-processor`

### After (2 features + infrastructure):
1. `document-management` - Entity, CRUD, UI
2. `document-generation` - AI workflow, events

**Infrastructure** (already exists, just subscribes):
- `email-infrastructure` - Listens to `DOCUMENT.GENERATION_COMPLETED`
- `notifications` - Listens to `DOCUMENT.GENERATION_COMPLETED`

---

## Next Steps

1. [ ] Review and approve this proposal
2. [ ] Update feature.json schema with new fields
3. [ ] Create event catalog in `shared/events/catalog.ts`
4. [ ] Migrate features context by context (start with Documents)
5. [ ] Update `.automaker` tooling to support new schema
6. [ ] Archive deprecated features
