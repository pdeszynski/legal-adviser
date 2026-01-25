# GraphQL Resolver Authorization Audit

This document provides a comprehensive checklist of all GraphQL resolvers and their authorization guard configurations.

## Summary Statistics

- **Total Resolvers**: 33
- **Resolvers with Auth Guards**: 20
- **Resolvers WITHOUT Auth Guards**: 13
- **Public (Intentionally Unprotected)**: 8
- **Missing Guards (SECURITY ISSUE)**: 5

---

## Critical Issues (Missing Guards)

| Resolver | Operations | Risk Level | Issue |
|----------|-----------|------------|-------|
| `api-keys.resolver.ts` | All CRUD operations | **CRITICAL** | NO authentication guards at all - full CRUD access without auth |
| `webhooks.resolver.ts` | All mutations/queries | **CRITICAL** | Manual auth checks only - no guards |
| `notification-manager.resolver.ts` | All mutations/queries | **HIGH** | NO authentication guards at all |
| `document-versioning.resolver.ts` | All queries/mutations | **MEDIUM** | NO authentication guards |
| `legal-ruling.resolver.ts` | All queries | **MEDIUM** | NO authentication guards - search exposed |
| `pdf-url.resolver.ts` | Field resolver | **MEDIUM** | NO authentication guards - PDF URLs exposed |

---

## Detailed Audit Results

### 1. Auth Module (`modules/auth/`)

#### `auth.resolver.ts`
- **Guards**: Class-level `@UseGuards(GqlAuthGuard)` (via `GqlHybridAuthGuard`)
- **Decorators**: `@Public()` on public mutations
- **Status**: ✅ PROPERLY CONFIGURED
- **Notes**: Hybrid guard allows optional auth for some operations

| Operation | Auth Required | Guard Method |
|-----------|---------------|--------------|
| `login` | No | `@Public()` |
| `register` | No | `@Public()` |
| `refreshToken` | No | `@Public()` |
| `verifyEmail` | No | `@Public()` |
| `resendVerification` | No | `@Public()` |
| `forgotPassword` | No | `@Public()` |
| `resetPassword` | No | `@Public()` |
| `me` | Yes | Class-level GqlAuthGuard |
| `updateProfile` | Yes | Class-level GqlAuthGuard |
| `changePassword` | Yes | Class-level GqlAuthGuard |
| `logout` | Yes | Class-level GqlAuthGuard |

#### `two-factor.resolver.ts`
- **Guards**: Method-level `@UseGuards(GqlAuthGuard)` on all operations
- **Status**: ✅ PROPERLY CONFIGURED

| Operation | Auth Required | Guard Method |
|-----------|---------------|--------------|
| `twoFactorSettings` | Yes | Method-level GqlAuthGuard |
| `enableTwoFactorAuth` | Yes | Method-level GqlAuthGuard |
| `verifyTwoFactorSetup` | Yes | Method-level GqlAuthGuard |
| `disableTwoFactorAuth` | Yes | Method-level GqlAuthGuard |
| `regenerateBackupCodes` | Yes | Method-level GqlAuthGuard |
| `verifyAndConsumeBackupCode` | Yes | Method-level GqlAuthGuard |
| `adminForceDisableTwoFactor` | Yes | Method-level GqlAuthGuard + `@RequireAdmin()` |

---

### 2. Analytics Module (`modules/analytics/`)

#### `analytics.resolver.ts`
- **Guards**: Method-level `@UseGuards(GqlAuthGuard)` on all operations
- **Status**: ✅ PROPERLY CONFIGURED

---

### 3. API Keys Module (`modules/api-keys/`)

#### `api-keys.resolver.ts`
- **Guards**: NONE
- **Status**: ❌ **CRITICAL SECURITY ISSUE**
- **Required Fix**: Add `@UseGuards(GqlAuthGuard)` at class or method level

| Operation | Auth Required | Current Status |
|-----------|---------------|----------------|
| `apiKeys` | Yes | ❌ NO GUARD |
| `apiKey` | Yes | ❌ NO GUARD |
| `createApiKey` | Yes | ❌ NO GUARD |
| `updateApiKey` | Yes | ❌ NO GUARD |
| `deleteApiKey` | Yes | ❌ NO GUARD |

---

### 4. Authorization Module (`modules/authorization/`)

#### `authorization.resolver.ts`
- **Guards**: Class-level `@UseGuards(GqlAuthGuard, QuotaGuard)`
- **Status**: ✅ PROPERLY CONFIGURED

---

### 5. Backup Module (`modules/backup/`)

#### `backup-admin.resolver.ts`
- **Guards**: Class-level `@UseGuards(GqlAuthGuard)` + `@RequireAdmin()`
- **Status**: ✅ PROPERLY CONFIGURED (Admin-only)

---

### 6. Collaboration Module (`modules/collaboration/`)

#### `collaboration.resolver.ts`
- **Guards**: Method-level `@UseGuards(GqlAuthGuard)` on all operations
- **Status**: ✅ PROPERLY CONFIGURED

---

### 7. Demo Request Module (`modules/demo-request/`)

#### `demo-request.resolver.ts`
- **Guards**: NONE (public form submission)
- **Status**: ✅ INTENTIONALLY PUBLIC
- **Note**: Public demo request form - should have `@Public()` decorator for clarity

#### `demo-request-crud.resolver.ts`
- **Guards**: Method-level `@UseGuards(GqlAuthGuard)` + `@RequireAdmin()`
- **Status**: ✅ PROPERLY CONFIGURED (Admin-only)

---

### 8. Documents Module (`modules/documents/`)

#### `documents.resolver.ts`
- **Guards**: Mixed - some with guards, some without
- **Status**: ⚠️ PARTIAL - Uses `DocumentPermissionGuard` for authorization
- **Note**: Custom permission-based access control

| Operation | Auth Required | Guard Method |
|-----------|---------------|--------------|
| `uploadDocument` | Yes | `@UseGuards(GqlAuthGuard, DocumentPermissionGuard)` |
| `updateDocument` | Yes | `@UseGuards(GqlAuthGuard, DocumentPermissionGuard)` |
| `deleteDocument` | Yes | `@UseGuards(GqlAuthGuard, DocumentPermissionGuard)` |
| `shareDocument` | Yes | `@UseGuards(GqlAuthGuard, DocumentPermissionGuard)` |
| `documentUrl` | Yes | `@UseGuards(GqlAuthGuard)` |

#### `document-sharing.resolver.ts`
- **Guards**: Method-level `@UseGuards(GqlAuthGuard)` on all operations
- **Status**: ✅ PROPERLY CONFIGURED

#### `document-templates.resolver.ts`
- **Guards**: Method-level `@UseGuards(GqlAuthGuard)` on all operations
- **Status**: ✅ PROPERLY CONFIGURED

#### `document-versioning.resolver.ts`
- **Guards**: NONE
- **Status**: ❌ **SECURITY ISSUE**
- **Required Fix**: Add `@UseGuards(GqlAuthGuard)` at class or method level

| Operation | Auth Required | Current Status |
|-----------|---------------|----------------|
| `documentVersionHistory` | Yes | ❌ NO GUARD |
| `documentVersionByNumber` | Yes | ❌ NO GUARD |
| `rollbackDocumentToVersion` | Yes | ❌ NO GUARD |
| `documentLatestVersion` | Yes | ❌ NO GUARD |
| `documentVersionCount` | Yes | ❌ NO GUARD |

#### `documents-subscription.resolver.ts`
- **Guards**: Class-level `@UseGuards(GqlAuthGuard)`
- **Status**: ✅ PROPERLY CONFIGURED

#### `legal-analysis.resolver.ts`
- **Guards**: Method-level `@UseGuards(GqlAuthGuard, QuotaGuard)` on all operations
- **Status**: ✅ PROPERLY CONFIGURED

#### `legal-ruling.resolver.ts`
- **Guards**: NONE
- **Status**: ❌ **SECURITY ISSUE**
- **Required Fix**: Add `@UseGuards(GqlAuthGuard)` at class or method level

| Operation | Auth Required | Current Status |
|-----------|---------------|----------------|
| `searchLegalRulings` | Yes | ❌ NO GUARD |
| `legalRulingsByCourtType` | Yes | ❌ NO GUARD |
| `legalRulingsFromHigherCourts` | Yes | ❌ NO GUARD |
| `legalRulingBySignature` | Yes | ❌ NO GUARD (should be public) |
| `filterLegalRulings` | Yes | ❌ NO GUARD |
| `countLegalRulings` | Yes | ❌ NO GUARD |
| `aggregatedSearchLegalRulings` | Yes | ❌ NO GUARD |
| `advancedSearchLegalRulings` | Yes | ❌ NO GUARD |

#### `pdf-url.resolver.ts`
- **Guards**: NONE (field resolver)
- **Status**: ⚠️ **POTENTIAL ISSUE**
- **Note**: Field resolver for `pdfUrl` - inherits from parent query's auth

---

### 9. HubSpot Integration (`modules/integrations/hubspot/`)

#### `hubspot.resolver.ts`
- **Guards**: NONE
- **Status**: ✅ INTENTIONALLY PUBLIC (form submissions)
- **Recommended**: Add `@Public()` decorator for clarity

| Operation | Auth Required | Current Status |
|-----------|---------------|----------------|
| `createHubSpotContact` | No | ✅ Public form |
| `syncHubSpotLead` | No | ✅ Public form |
| `qualifyHubSpotLead` | No | ✅ Public form |

---

### 10. Notifications Module (`modules/notifications/`)

#### `notification-manager.resolver.ts`
- **Guards**: NONE
- **Status**: ❌ **CRITICAL SECURITY ISSUE**
- **Required Fix**: Add `@UseGuards(GqlAuthGuard)` at class or method level

| Operation | Auth Required | Current Status |
|-----------|---------------|----------------|
| `sendNotification` | Yes | ❌ NO GUARD |
| `updateNotificationPreferences` | Yes | ❌ NO GUARD |
| `notificationPreferences` | Yes | ❌ NO GUARD |
| `markNotificationAsRead` | Yes | ❌ NO GUARD |
| `markAllNotificationsAsRead` | Yes | ❌ NO GUARD |
| `unreadNotificationCount` | Yes | ❌ NO GUARD |
| `recentNotifications` | Yes | ❌ NO GUARD |
| `sendBulkNotifications` | Yes | ❌ NO GUARD |

#### `in-app-notification-subscription.resolver.ts`
- **Guards**: NONE (subscription)
- **Status**: ⚠️ NEEDS REVIEW
- **Note**: GraphQL subscriptions may have auth at the connection level

---

### 11. Queries Module (`modules/queries/`)

#### `queries.resolver.ts`
- **Guards**: Class-level `@UseGuards(GqlAuthGuard, QuotaGuard)`
- **Status**: ✅ PROPERLY CONFIGURED

---

### 12. RBAC Module (`modules/rbac/`)

#### Note: No separate resolver file found - authorization uses decorators

---

### 13. Settings Module (`modules/system-settings/`)

#### `system-settings.resolver.ts`
- **Guards**: Method-level `@UseGuards(GqlAuthGuard, AdminGuard)`
- **Public Query**: `publicSystemSettings` (intentionally public)
- **Status**: ✅ PROPERLY CONFIGURED

---

### 14. Subscriptions Module (`modules/subscriptions/`)

#### `subscriptions.resolver.ts`
- **Guards**: Mixed - some operations with guards, some without
- **Status**: ⚠️ PARTIAL
- **Note**: Plan queries are public, user operations require auth

| Operation | Auth Required | Guard Method |
|-----------|---------------|--------------|
| `subscriptionPlans` | No | ✅ Public (catalog) |
| `subscriptionPlan` | No | ✅ Public (catalog) |
| `mySubscription` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |
| `canAccessFeature` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |
| `checkQuota` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |
| `myUsageStats` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |
| `createMySubscription` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |
| `changeSubscriptionPlan` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |
| `cancelMySubscription` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |
| `resumeMySubscription` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |
| `recordUsage` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |
| `myBillingInfo` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |
| `myPaymentHistory` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |

#### `subscriptions-admin.resolver.ts`
- **Guards**: Class-level `@UseGuards(GqlAuthGuard, RoleGuard)` + `@RequireAdmin()`
- **Status**: ✅ PROPERLY CONFIGURED (Admin-only)

---

### 15. System Health Module (`modules/system-health/`)

#### `system-health.resolver.ts`
- **Guards**: Class-level `@UseGuards(GqlAuthGuard, AdminGuard)`
- **Status**: ✅ PROPERLY CONFIGURED (Admin-only)

---

### 16. Usage Tracking Module (`modules/usage-tracking/`)

#### `usage-tracking.resolver.ts`
- **Guards**: Method-level `@UseGuards(GqlAuthGuard)` on all operations
- **Status**: ✅ PROPERLY CONFIGURED

---

### 17. User Preferences Module (`modules/user-preferences/`)

#### `user-preferences.resolver.ts`
- **Guards**: Method-level `@UseGuards(GqlAuthGuard)` on all operations
- **Status**: ✅ PROPERLY CONFIGURED

---

### 18. Users Module (`modules/users/`)

#### `users-admin.resolver.ts`
- **Guards**: Method-level `@UseGuards(GqlAuthGuard, RoleGuard)` + `@RequireAdmin()`
- **Status**: ✅ PROPERLY CONFIGURED (Admin-only)

#### `users-crud.resolver.ts`
- **Guards**: Class-level `@UseGuards(GqlAuthGuard, RoleGuard)` + `@RequireAdmin()`
- **Status**: ✅ PROPERLY CONFIGURED (Admin-only)

---

### 19. Webhooks Module (`modules/webhooks/`)

#### `webhooks.resolver.ts`
- **Guards**: NONE (manual auth checks in code)
- **Status**: ❌ **CRITICAL SECURITY ISSUE**
- **Required Fix**: Replace manual checks with `@UseGuards(GqlAuthGuard)`

| Operation | Auth Required | Current Status |
|-----------|---------------|----------------|
| `createWebhook` | Yes | ⚠️ Manual check only |
| `updateWebhook` | Yes | ⚠️ Manual check only |
| `deleteWebhook` | Yes | ⚠️ Manual check only |
| `activateWebhook` | Yes | ⚠️ Manual check only |
| `deactivateWebhook` | Yes | ⚠️ Manual check only |
| `disableWebhook` | Yes | ⚠️ Manual check only |
| `rotateWebhookSecret` | Yes | ⚠️ Manual check only |
| `testWebhook` | Yes | ⚠️ Manual check only |
| `webhook` | Yes | ⚠️ Manual check only |
| `myWebhooks` | Yes | ⚠️ Manual check only |
| `webhookStats` | Yes | ⚠️ Manual check only |
| `webhookDeliveries` | Yes | ⚠️ Manual check only |

---

## Authorization Guard Reference

### Available Guards

| Guard | Location | Purpose |
|-------|----------|---------|
| `GqlAuthGuard` | `modules/auth/guards/gql-auth.guard.ts` | Requires valid JWT authentication |
| `GqlHybridAuthGuard` | `modules/auth/guards/gql-hybrid-auth.guard.ts` | Optional auth - allows anonymous access |
| `RoleGuard` | `modules/auth/guards/role.guard.ts` | Role-based access control with hierarchy |
| `AdminGuard` | `modules/auth/guards/admin.guard.ts` | Simple admin check (ADMIN or SUPER_ADMIN) |
| `DocumentPermissionGuard` | `modules/auth/guards/document-permission.guard.ts` | Document-specific permissions |
| `QuotaGuard` | `modules/shared/` | Usage quota validation |

### Decorators

| Decorator | Location | Purpose |
|-----------|----------|---------|
| `@Public()` | Not found - needs creation | Marks endpoint as publicly accessible |
| `@RequireAdmin()` | `modules/auth/guards/role.guard.ts` | Requires admin role |
| `@RequireRole(...)` | `modules/auth/guards/role.guard.ts` | Requires specific role(s) |

---

## Recommended Fixes Priority

### Priority 1 (Critical)
1. **api-keys.resolver.ts** - Add class-level `@UseGuards(GqlAuthGuard)`
2. **webhooks.resolver.ts** - Replace manual checks with `@UseGuards(GqlAuthGuard)`
3. **notification-manager.resolver.ts** - Add class-level `@UseGuards(GqlAuthGuard)`

### Priority 2 (High)
4. **document-versioning.resolver.ts** - Add class-level `@UseGuards(GqlAuthGuard)`
5. **legal-ruling.resolver.ts** - Add class-level `@UseGuards(GqlAuthGuard)` (except public search)

### Priority 3 (Medium)
6. Create `@Public()` decorator for clarity on public endpoints
7. Add `@Public()` to intentionally public resolvers (demo-request, hubspot)

---

## Guard Execution Order

The correct order for guard execution is:
1. **Authentication** (`GqlAuthGuard`) - Verifies user identity
2. **Role** (`RoleGuard`/`AdminGuard`) - Checks user permissions
3. **Resource** (`DocumentPermissionGuard`) - Validates access to specific resources
4. **Quota** (`QuotaGuard`) - Checks usage limits

Example:
```typescript
@UseGuards(GqlAuthGuard, RoleGuard, DocumentPermissionGuard)
@RequireRole(UserRole.LAWYER)
async myProtectedMutation() { ... }
```

---

## Public Endpoints (Intentionally Unprotected)

| Module | Operations | Reason |
|--------|-----------|--------|
| `auth` | login, register, resetPassword, etc. | Auth flow |
| `demo-request` | createDemoRequest | Public form |
| `hubspot` | createHubSpotContact, syncHubSpotLead | Public form |
| `subscriptions` | subscriptionPlans, subscriptionPlan | Catalog viewing |
| `system-settings` | publicSystemSettings | Feature flags |

These should be marked with `@Public()` decorator for code clarity.
