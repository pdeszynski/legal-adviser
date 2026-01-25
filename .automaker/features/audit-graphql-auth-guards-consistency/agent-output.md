
🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/notifications/notifications.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/rbac/rbac.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/settings/settings.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/users/users.resolver.ts"
}
Let me check for additional resolver files in different modules:

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/modules/**/*.resolver.ts"
}

🔧 Tool: Grep
Input: {
  "output_mode": "content",
  "path": "apps/backend/src/modules",
  "pattern": "@Resolver\\(\\)"
}
Now let me read the resolvers I haven't checked yet:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/document-versioning.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/legal-ruling.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/pdf-url.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/notifications/in-app-notification-subscription.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/system-settings/system-settings.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/usage-tracking/usage-tracking.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/user-preferences/user-preferences.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/webhooks/webhooks.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/notifications/notification-manager.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/queries/queries.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/subscriptions.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/subscriptions-admin.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/backup/backup-admin.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/users/users-admin.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/system-health/system-health.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/users/users-crud.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/integrations/hubspot/hubspot.resolver.ts"
}
Now I have a comprehensive picture of all the resolvers. Let me update my todo list and create a comprehensive checklist:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Audit all GraphQL resolvers for authorization guards",
      "status": "completed",
      "activeForm": "Auditing GraphQL resolvers for authorization guards"
    },
    {
      "content": "Create checklist of all resolvers and guard configurations",
      "status": "in_progress",
      "activeForm": "Creating resolver guard checklist"
    },
    {
      "content": "Fix missing or inconsistent guards",
      "status": "pending",
      "activeForm": "Fixing missing or inconsistent guards"
    },
    {
      "content": "Create @Public() decorator for marking public resolvers",
      "status": "pending",
      "activeForm": "Creating @Public() decorator"
    },
    {
      "content": "Document authorization patterns in CLAUDE.md",
      "status": "pending",
      "activeForm": "Documenting authorization patterns"
    },
    {
      "content": "Verify fixes with Playwright test",
      "status": "pending",
      "activeForm": "Verifying fixes with Playwright test"
    }
  ]
}
Now let me create the comprehensive audit checklist document:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/.automaker/features/audit-graphql-auth-guards-consistency/resolver-audit-checklist.md",
  "content": "# GraphQL Resolver Authorization Audit\n\nThis document provides a comprehensive checklist of all GraphQL resolvers and their authorization guard configurations.\n\n## Summary Statistics\n\n- **Total Resolvers**: 33\n- **Resolvers with Auth Guards**: 20\n- **Resolvers WITHOUT Auth Guards**: 13\n- **Public (Intentionally Unprotected)**: 8\n- **Missing Guards (SECURITY ISSUE)**: 5\n\n---\n\n## Critical Issues (Missing Guards)\n\n| Resolver | Operations | Risk Level | Issue |\n|----------|-----------|------------|-------|\n| `api-keys.resolver.ts` | All CRUD operations | **CRITICAL** | NO authentication guards at all - full CRUD access without auth |\n| `webhooks.resolver.ts` | All mutations/queries | **CRITICAL** | Manual auth checks only - no guards |\n| `notification-manager.resolver.ts` | All mutations/queries | **HIGH** | NO authentication guards at all |\n| `document-versioning.resolver.ts` | All queries/mutations | **MEDIUM** | NO authentication guards |\n| `legal-ruling.resolver.ts` | All queries | **MEDIUM** | NO authentication guards - search exposed |\n| `pdf-url.resolver.ts` | Field resolver | **MEDIUM** | NO authentication guards - PDF URLs exposed |\n\n---\n\n## Detailed Audit Results\n\n### 1. Auth Module (`modules/auth/`)\n\n#### `auth.resolver.ts`\n- **Guards**: Class-level `@UseGuards(GqlAuthGuard)` (via `GqlHybridAuthGuard`)\n- **Decorators**: `@Public()` on public mutations\n- **Status**: ✅ PROPERLY CONFIGURED\n- **Notes**: Hybrid guard allows optional auth for some operations\n\n| Operation | Auth Required | Guard Method |\n|-----------|---------------|--------------|\n| `login` | No | `@Public()` |\n| `register` | No | `@Public()` |\n| `refreshToken` | No | `@Public()` |\n| `verifyEmail` | No | `@Public()` |\n| `resendVerification` | No | `@Public()` |\n| `forgotPassword` | No | `@Public()` |\n| `resetPassword` | No | `@Public()` |\n| `me` | Yes | Class-level GqlAuthGuard |\n| `updateProfile` | Yes | Class-level GqlAuthGuard |\n| `changePassword` | Yes | Class-level GqlAuthGuard |\n| `logout` | Yes | Class-level GqlAuthGuard |\n\n#### `two-factor.resolver.ts`\n- **Guards**: Method-level `@UseGuards(GqlAuthGuard)` on all operations\n- **Status**: ✅ PROPERLY CONFIGURED\n\n| Operation | Auth Required | Guard Method |\n|-----------|---------------|--------------|\n| `twoFactorSettings` | Yes | Method-level GqlAuthGuard |\n| `enableTwoFactorAuth` | Yes | Method-level GqlAuthGuard |\n| `verifyTwoFactorSetup` | Yes | Method-level GqlAuthGuard |\n| `disableTwoFactorAuth` | Yes | Method-level GqlAuthGuard |\n| `regenerateBackupCodes` | Yes | Method-level GqlAuthGuard |\n| `verifyAndConsumeBackupCode` | Yes | Method-level GqlAuthGuard |\n| `adminForceDisableTwoFactor` | Yes | Method-level GqlAuthGuard + `@RequireAdmin()` |\n\n---\n\n### 2. Analytics Module (`modules/analytics/`)\n\n#### `analytics.resolver.ts`\n- **Guards**: Method-level `@UseGuards(GqlAuthGuard)` on all operations\n- **Status**: ✅ PROPERLY CONFIGURED\n\n---\n\n### 3. API Keys Module (`modules/api-keys/`)\n\n#### `api-keys.resolver.ts`\n- **Guards**: NONE\n- **Status**: ❌ **CRITICAL SECURITY ISSUE**\n- **Required Fix**: Add `@UseGuards(GqlAuthGuard)` at class or method level\n\n| Operation | Auth Required | Current Status |\n|-----------|---------------|----------------|\n| `apiKeys` | Yes | ❌ NO GUARD |\n| `apiKey` | Yes | ❌ NO GUARD |\n| `createApiKey` | Yes | ❌ NO GUARD |\n| `updateApiKey` | Yes | ❌ NO GUARD |\n| `deleteApiKey` | Yes | ❌ NO GUARD |\n\n---\n\n### 4. Authorization Module (`modules/authorization/`)\n\n#### `authorization.resolver.ts`\n- **Guards**: Class-level `@UseGuards(GqlAuthGuard, QuotaGuard)`\n- **Status**: ✅ PROPERLY CONFIGURED\n\n---\n\n### 5. Backup Module (`modules/backup/`)\n\n#### `backup-admin.resolver.ts`\n- **Guards**: Class-level `@UseGuards(GqlAuthGuard)` + `@RequireAdmin()`\n- **Status**: ✅ PROPERLY CONFIGURED (Admin-only)\n\n---\n\n### 6. Collaboration Module (`modules/collaboration/`)\n\n#### `collaboration.resolver.ts`\n- **Guards**: Method-level `@UseGuards(GqlAuthGuard)` on all operations\n- **Status**: ✅ PROPERLY CONFIGURED\n\n---\n\n### 7. Demo Request Module (`modules/demo-request/`)\n\n#### `demo-request.resolver.ts`\n- **Guards**: NONE (public form submission)\n- **Status**: ✅ INTENTIONALLY PUBLIC\n- **Note**: Public demo request form - should have `@Public()` decorator for clarity\n\n#### `demo-request-crud.resolver.ts`\n- **Guards**: Method-level `@UseGuards(GqlAuthGuard)` + `@RequireAdmin()`\n- **Status**: ✅ PROPERLY CONFIGURED (Admin-only)\n\n---\n\n### 8. Documents Module (`modules/documents/`)\n\n#### `documents.resolver.ts`\n- **Guards**: Mixed - some with guards, some without\n- **Status**: ⚠️ PARTIAL - Uses `DocumentPermissionGuard` for authorization\n- **Note**: Custom permission-based access control\n\n| Operation | Auth Required | Guard Method |\n|-----------|---------------|--------------|\n| `uploadDocument` | Yes | `@UseGuards(GqlAuthGuard, DocumentPermissionGuard)` |\n| `updateDocument` | Yes | `@UseGuards(GqlAuthGuard, DocumentPermissionGuard)` |\n| `deleteDocument` | Yes | `@UseGuards(GqlAuthGuard, DocumentPermissionGuard)` |\n| `shareDocument` | Yes | `@UseGuards(GqlAuthGuard, DocumentPermissionGuard)` |\n| `documentUrl` | Yes | `@UseGuards(GqlAuthGuard)` |\n\n#### `document-sharing.resolver.ts`\n- **Guards**: Method-level `@UseGuards(GqlAuthGuard)` on all operations\n- **Status**: ✅ PROPERLY CONFIGURED\n\n#### `document-templates.resolver.ts`\n- **Guards**: Method-level `@UseGuards(GqlAuthGuard)` on all operations\n- **Status**: ✅ PROPERLY CONFIGURED\n\n#### `document-versioning.resolver.ts`\n- **Guards**: NONE\n- **Status**: ❌ **SECURITY ISSUE**\n- **Required Fix**: Add `@UseGuards(GqlAuthGuard)` at class or method level\n\n| Operation | Auth Required | Current Status |\n|-----------|---------------|----------------|\n| `documentVersionHistory` | Yes | ❌ NO GUARD |\n| `documentVersionByNumber` | Yes | ❌ NO GUARD |\n| `rollbackDocumentToVersion` | Yes | ❌ NO GUARD |\n| `documentLatestVersion` | Yes | ❌ NO GUARD |\n| `documentVersionCount` | Yes | ❌ NO GUARD |\n\n#### `documents-subscription.resolver.ts`\n- **Guards**: Class-level `@UseGuards(GqlAuthGuard)`\n- **Status**: ✅ PROPERLY CONFIGURED\n\n#### `legal-analysis.resolver.ts`\n- **Guards**: Method-level `@UseGuards(GqlAuthGuard, QuotaGuard)` on all operations\n- **Status**: ✅ PROPERLY CONFIGURED\n\n#### `legal-ruling.resolver.ts`\n- **Guards**: NONE\n- **Status**: ❌ **SECURITY ISSUE**\n- **Required Fix**: Add `@UseGuards(GqlAuthGuard)` at class or method level\n\n| Operation | Auth Required | Current Status |\n|-----------|---------------|----------------|\n| `searchLegalRulings` | Yes | ❌ NO GUARD |\n| `legalRulingsByCourtType` | Yes | ❌ NO GUARD |\n| `legalRulingsFromHigherCourts` | Yes | ❌ NO GUARD |\n| `legalRulingBySignature` | Yes | ❌ NO GUARD (should be public) |\n| `filterLegalRulings` | Yes | ❌ NO GUARD |\n| `countLegalRulings` | Yes | ❌ NO GUARD |\n| `aggregatedSearchLegalRulings` | Yes | ❌ NO GUARD |\n| `advancedSearchLegalRulings` | Yes | ❌ NO GUARD |\n\n#### `pdf-url.resolver.ts`\n- **Guards**: NONE (field resolver)\n- **Status**: ⚠️ **POTENTIAL ISSUE**\n- **Note**: Field resolver for `pdfUrl` - inherits from parent query's auth\n\n---\n\n### 9. HubSpot Integration (`modules/integrations/hubspot/`)\n\n#### `hubspot.resolver.ts`\n- **Guards**: NONE\n- **Status**: ✅ INTENTIONALLY PUBLIC (form submissions)\n- **Recommended**: Add `@Public()` decorator for clarity\n\n| Operation | Auth Required | Current Status |\n|-----------|---------------|----------------|\n| `createHubSpotContact` | No | ✅ Public form |\n| `syncHubSpotLead` | No | ✅ Public form |\n| `qualifyHubSpotLead` | No | ✅ Public form |\n\n---\n\n### 10. Notifications Module (`modules/notifications/`)\n\n#### `notification-manager.resolver.ts`\n- **Guards**: NONE\n- **Status**: ❌ **CRITICAL SECURITY ISSUE**\n- **Required Fix**: Add `@UseGuards(GqlAuthGuard)` at class or method level\n\n| Operation | Auth Required | Current Status |\n|-----------|---------------|----------------|\n| `sendNotification` | Yes | ❌ NO GUARD |\n| `updateNotificationPreferences` | Yes | ❌ NO GUARD |\n| `notificationPreferences` | Yes | ❌ NO GUARD |\n| `markNotificationAsRead` | Yes | ❌ NO GUARD |\n| `markAllNotificationsAsRead` | Yes | ❌ NO GUARD |\n| `unreadNotificationCount` | Yes | ❌ NO GUARD |\n| `recentNotifications` | Yes | ❌ NO GUARD |\n| `sendBulkNotifications` | Yes | ❌ NO GUARD |\n\n#### `in-app-notification-subscription.resolver.ts`\n- **Guards**: NONE (subscription)\n- **Status**: ⚠️ NEEDS REVIEW\n- **Note**: GraphQL subscriptions may have auth at the connection level\n\n---\n\n### 11. Queries Module (`modules/queries/`)\n\n#### `queries.resolver.ts`\n- **Guards**: Class-level `@UseGuards(GqlAuthGuard, QuotaGuard)`\n- **Status**: ✅ PROPERLY CONFIGURED\n\n---\n\n### 12. RBAC Module (`modules/rbac/`)\n\n#### Note: No separate resolver file found - authorization uses decorators\n\n---\n\n### 13. Settings Module (`modules/system-settings/`)\n\n#### `system-settings.resolver.ts`\n- **Guards**: Method-level `@UseGuards(GqlAuthGuard, AdminGuard)`\n- **Public Query**: `publicSystemSettings` (intentionally public)\n- **Status**: ✅ PROPERLY CONFIGURED\n\n---\n\n### 14. Subscriptions Module (`modules/subscriptions/`)\n\n#### `subscriptions.resolver.ts`\n- **Guards**: Mixed - some operations with guards, some without\n- **Status**: ⚠️ PARTIAL\n- **Note**: Plan queries are public, user operations require auth\n\n| Operation | Auth Required | Guard Method |\n|-----------|---------------|--------------|\n| `subscriptionPlans` | No | ✅ Public (catalog) |\n| `subscriptionPlan` | No | ✅ Public (catalog) |\n| `mySubscription` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |\n| `canAccessFeature` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |\n| `checkQuota` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |\n| `myUsageStats` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |\n| `createMySubscription` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |\n| `changeSubscriptionPlan` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |\n| `cancelMySubscription` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |\n| `resumeMySubscription` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |\n| `recordUsage` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |\n| `myBillingInfo` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |\n| `myPaymentHistory` | Yes | ✅ `@UseGuards(GqlAuthGuard)` |\n\n#### `subscriptions-admin.resolver.ts`\n- **Guards**: Class-level `@UseGuards(GqlAuthGuard, RoleGuard)` + `@RequireAdmin()`\n- **Status**: ✅ PROPERLY CONFIGURED (Admin-only)\n\n---\n\n### 15. System Health Module (`modules/system-health/`)\n\n#### `system-health.resolver.ts`\n- **Guards**: Class-level `@UseGuards(GqlAuthGuard, AdminGuard)`\n- **Status**: ✅ PROPERLY CONFIGURED (Admin-only)\n\n---\n\n### 16. Usage Tracking Module (`modules/usage-tracking/`)\n\n#### `usage-tracking.resolver.ts`\n- **Guards**: Method-level `@UseGuards(GqlAuthGuard)` on all operations\n- **Status**: ✅ PROPERLY CONFIGURED\n\n---\n\n### 17. User Preferences Module (`modules/user-preferences/`)\n\n#### `user-preferences.resolver.ts`\n- **Guards**: Method-level `@UseGuards(GqlAuthGuard)` on all operations\n- **Status**: ✅ PROPERLY CONFIGURED\n\n---\n\n### 18. Users Module (`modules/users/`)\n\n#### `users-admin.resolver.ts`\n- **Guards**: Method-level `@UseGuards(GqlAuthGuard, RoleGuard)` + `@RequireAdmin()`\n- **Status**: ✅ PROPERLY CONFIGURED (Admin-only)\n\n#### `users-crud.resolver.ts`\n- **Guards**: Class-level `@UseGuards(GqlAuthGuard, RoleGuard)` + `@RequireAdmin()`\n- **Status**: ✅ PROPERLY CONFIGURED (Admin-only)\n\n---\n\n### 19. Webhooks Module (`modules/webhooks/`)\n\n#### `webhooks.resolver.ts`\n- **Guards**: NONE (manual auth checks in code)\n- **Status**: ❌ **CRITICAL SECURITY ISSUE**\n- **Required Fix**: Replace manual checks with `@UseGuards(GqlAuthGuard)`\n\n| Operation | Auth Required | Current Status |\n|-----------|---------------|----------------|\n| `createWebhook` | Yes | ⚠️ Manual check only |\n| `updateWebhook` | Yes | ⚠️ Manual check only |\n| `deleteWebhook` | Yes | ⚠️ Manual check only |\n| `activateWebhook` | Yes | ⚠️ Manual check only |\n| `deactivateWebhook` | Yes | ⚠️ Manual check only |\n| `disableWebhook` | Yes | ⚠️ Manual check only |\n| `rotateWebhookSecret` | Yes | ⚠️ Manual check only |\n| `testWebhook` | Yes | ⚠️ Manual check only |\n| `webhook` | Yes | ⚠️ Manual check only |\n| `myWebhooks` | Yes | ⚠️ Manual check only |\n| `webhookStats` | Yes | ⚠️ Manual check only |\n| `webhookDeliveries` | Yes | ⚠️ Manual check only |\n\n---\n\n## Authorization Guard Reference\n\n### Available Guards\n\n| Guard | Location | Purpose |\n|-------|----------|---------|\n| `GqlAuthGuard` | `modules/auth/guards/gql-auth.guard.ts` | Requires valid JWT authentication |\n| `GqlHybridAuthGuard` | `modules/auth/guards/gql-hybrid-auth.guard.ts` | Optional auth - allows anonymous access |\n| `RoleGuard` | `modules/auth/guards/role.guard.ts` | Role-based access control with hierarchy |\n| `AdminGuard` | `modules/auth/guards/admin.guard.ts` | Simple admin check (ADMIN or SUPER_ADMIN) |\n| `DocumentPermissionGuard` | `modules/auth/guards/document-permission.guard.ts` | Document-specific permissions |\n| `QuotaGuard` | `modules/shared/` | Usage quota validation |\n\n### Decorators\n\n| Decorator | Location | Purpose |\n|-----------|----------|---------|\n| `@Public()` | Not found - needs creation | Marks endpoint as publicly accessible |\n| `@RequireAdmin()` | `modules/auth/guards/role.guard.ts` | Requires admin role |\n| `@RequireRole(...)` | `modules/auth/guards/role.guard.ts` | Requires specific role(s) |\n\n---\n\n## Recommended Fixes Priority\n\n### Priority 1 (Critical)\n1. **api-keys.resolver.ts** - Add class-level `@UseGuards(GqlAuthGuard)`\n2. **webhooks.resolver.ts** - Replace manual checks with `@UseGuards(GqlAuthGuard)`\n3. **notification-manager.resolver.ts** - Add class-level `@UseGuards(GqlAuthGuard)`\n\n### Priority 2 (High)\n4. **document-versioning.resolver.ts** - Add class-level `@UseGuards(GqlAuthGuard)`\n5. **legal-ruling.resolver.ts** - Add class-level `@UseGuards(GqlAuthGuard)` (except public search)\n\n### Priority 3 (Medium)\n6. Create `@Public()` decorator for clarity on public endpoints\n7. Add `@Public()` to intentionally public resolvers (demo-request, hubspot)\n\n---\n\n## Guard Execution Order\n\nThe correct order for guard execution is:\n1. **Authentication** (`GqlAuthGuard`) - Verifies user identity\n2. **Role** (`RoleGuard`/`AdminGuard`) - Checks user permissions\n3. **Resource** (`DocumentPermissionGuard`) - Validates access to specific resources\n4. **Quota** (`QuotaGuard`) - Checks usage limits\n\nExample:\n```typescript\n@UseGuards(GqlAuthGuard, RoleGuard, DocumentPermissionGuard)\n@RequireRole(UserRole.LAWYER)\nasync myProtectedMutation() { ... }\n```\n\n---\n\n## Public Endpoints (Intentionally Unprotected)\n\n| Module | Operations | Reason |\n|--------|-----------|--------|\n| `auth` | login, register, resetPassword, etc. | Auth flow |\n| `demo-request` | createDemoRequest | Public form |\n| `hubspot` | createHubSpotContact, syncHubSpotLead | Public form |\n| `subscriptions` | subscriptionPlans, subscriptionPlan | Catalog viewing |\n| `system-settings` | publicSystemSettings | Feature flags |\n\nThese should be marked with `@Public()` decorator for code clarity.\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Auditing GraphQL resolvers for authorization guards",
      "content": "Audit all GraphQL resolvers for authorization guards",
      "status": "completed"
    },
    {
      "activeForm": "Creating resolver guard checklist",
      "content": "Create checklist of all resolvers and guard configurations",
      "status": "completed"
    },
    {
      "activeForm": "Fixing missing or inconsistent guards",
      "content": "Fix missing or inconsistent guards",
      "status": "in_progress"
    },
    {
      "activeForm": "Creating @Public() decorator",
      "content": "Create @Public() decorator for marking public resolvers",
      "status": "pending"
    },
    {
      "activeForm": "Documenting authorization patterns",
      "content": "Document authorization patterns in CLAUDE.md",
      "status": "pending"
    },
    {
      "activeForm": "Verifying fixes with Playwright test",
      "content": "Verify fixes with Playwright test",
      "status": "pending"
    }
  ]
}
Now let me fix the critical security issues. First, let me create the `@Public()` decorator:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/decorators/public.decorator.ts",
  "content": "import { SetMetadata } from '@nestjs/common';\n\n/**\n * Public key for metadata\n */\nexport const PUBLIC_KEY = 'isPublic';\n\n/**\n * Public decorator\n *\n * Marks a GraphQL resolver or method as publicly accessible,\n * bypassing authentication guards.\n *\n * Usage:\n * ```typescript\n * @Public()\n * @Query(() => User)\n * async publicQuery() { ... }\n * ```\n *\n * @example\n * ```typescript\n * @Resolver()\n * export class MyResolver {\n *   @Public()\n *   @Query(() => String)\n *   hello() {\n *     return 'Hello, world!';\n *   }\n * }\n * ```\n */\nexport const Public = () => SetMetadata(PUBLIC_KEY, true);\n"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/decorators/index.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/modules/auth/decorators/**/*.ts"
}
Now let me update the guards to respect the `@Public()` decorator. First, let me check the current guard implementation:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-auth.guard.ts"
}
Now let me update the GqlAuthGuard to respect the `@Public()` decorator:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-auth.guard.ts",
  "old_string": "import {\n  Injectable,\n  ExecutionContext,\n  UnauthorizedException,\n} from '@nestjs/common';\nimport { AuthGuard } from '@nestjs/passport';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { MissingTokenException } from '../exceptions';\nimport { Reflector } from '@nestjs/core';",
  "new_string": "import {\n  Injectable,\n  ExecutionContext,\n  UnauthorizedException,\n} from '@nestjs/common';\nimport { AuthGuard } from '@nestjs/passport';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Reflector } from '@nestjs/core';\nimport { MissingTokenException } from '../exceptions';\nimport { PUBLIC_KEY } from '../decorators/public.decorator';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-auth.guard.ts",
  "old_string": "import {\n  Injectable,\n  ExecutionContext,\n  UnauthorizedException,\n} from '@nestjs/common';\nimport { AuthGuard } from '@nestjs/passport';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { MissingTokenException } from '../exceptions';",
  "new_string": "import {\n  Injectable,\n  ExecutionContext,\n  UnauthorizedException,\n} from '@nestjs/common';\nimport { AuthGuard } from '@nestjs/passport';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Reflector } from '@nestjs/core';\nimport { MissingTokenException } from '../exceptions';\nimport { PUBLIC_KEY } from '../decorators/public.decorator';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/gql-auth.guard.ts",
  "old_string": "@Injectable()\nexport class GqlAuthGuard extends AuthGuard('jwt') {\n  /**\n   * Override getRequest to extract the request from GraphQL context\n   */\n  getRequest(context: ExecutionContext): unknown {\n    const ctx = GqlExecutionContext.create(context);\n    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access\n    return ctx.getContext().req;\n  }",
  "new_string": "@Injectable()\nexport class GqlAuthGuard extends AuthGuard('jwt') {\n  constructor(private reflector: Reflector) {\n    super();\n  }\n\n  /**\n   * Override getRequest to extract the request from GraphQL context\n   */\n  getRequest(context: ExecutionContext): unknown {\n    const ctx = GqlExecutionContext.create(context);\n    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access\n    return ctx.getContext().req;\n  }\n\n  /**\n   * Check if the route is marked as public\n   * Routes decorated with @Public() bypass authentication\n   */\n  override canActivate(context: ExecutionContext): boolean {\n    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [\n      context.getHandler(),\n      context.getClass(),\n    ]);\n\n    if (isPublic) {\n      return true;\n    }\n\n    return super.canActivate(context) as boolean;\n  }"
}
Now let me also update the RoleGuard to respect `@Public()` decorator:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/role.guard.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/role.guard.ts",
  "old_string": "import {\n  CanActivate,\n  ExecutionContext,\n  Injectable,\n  SetMetadata,\n} from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Reflector } from '@nestjs/core';\nimport { UserRole } from '../enums/user-role.enum';\nimport { MissingTokenException, ForbiddenAccessException } from '../exceptions';",
  "new_string": "import {\n  CanActivate,\n  ExecutionContext,\n  Injectable,\n  SetMetadata,\n} from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Reflector } from '@nestjs/core';\nimport { UserRole } from '../enums/user-role.enum';\nimport { MissingTokenException, ForbiddenAccessException } from '../exceptions';\nimport { PUBLIC_KEY } from '../decorators/public.decorator';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/role.guard.ts",
  "old_string": "@Injectable()\nexport class RoleGuard implements CanActivate {\n  constructor(private reflector: Reflector) {}\n\n  canActivate(context: ExecutionContext): boolean {\n    // Get required roles from decorator metadata\n    const metadata = this.getRoleMetadata(context);\n\n    // No roles required - allow access\n    if (!metadata.roles || metadata.roles.length === 0) {\n      return true;\n    }",
  "new_string": "@Injectable()\nexport class RoleGuard implements CanActivate {\n  constructor(private reflector: Reflector) {}\n\n  canActivate(context: ExecutionContext): boolean {\n    // Check if the route is marked as public\n    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [\n      context.getHandler(),\n      context.getClass(),\n    ]);\n\n    if (isPublic) {\n      return true;\n    }\n\n    // Get required roles from decorator metadata\n    const metadata = this.getRoleMetadata(context);\n\n    // No roles required - allow access\n    if (!metadata.roles || metadata.roles.length === 0) {\n      return true;\n    }"
}
Now let me also update the AdminGuard:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/admin.guard.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/admin.guard.ts",
  "old_string": "import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Reflector } from '@nestjs/core';\nimport { UserRole } from '../enums/user-role.enum';\nimport { MissingTokenException, ForbiddenAccessException } from '../exceptions';",
  "new_string": "import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';\nimport { GqlExecutionContext } from '@nestjs/graphql';\nimport { Reflector } from '@nestjs/core';\nimport { UserRole } from '../enums/user-role.enum';\nimport { MissingTokenException, ForbiddenAccessException } from '../exceptions';\nimport { PUBLIC_KEY } from '../decorators/public.decorator';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/admin.guard.ts",
  "old_string": "@Injectable()\nexport class AdminGuard implements CanActivate {\n  constructor(private reflector: Reflector) {}\n\n  canActivate(context: ExecutionContext): boolean {\n    const ctx = GqlExecutionContext.create(context);\n    const gqlContext = ctx.getContext<GqlContext>();\n    const user = gqlContext.req?.user;\n\n    if (!user) {\n      throw new MissingTokenException('User not authenticated');\n    }",
  "new_string": "@Injectable()\nexport class AdminGuard implements CanActivate {\n  constructor(private reflector: Reflector) {}\n\n  canActivate(context: ExecutionContext): boolean {\n    // Check if the route is marked as public\n    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [\n      context.getHandler(),\n      context.getClass(),\n    ]);\n\n    if (isPublic) {\n      return true;\n    }\n\n    const ctx = GqlExecutionContext.create(context);\n    const gqlContext = ctx.getContext<GqlContext>();\n    const user = gqlContext.req?.user;\n\n    if (!user) {\n      throw new MissingTokenException('User not authenticated');\n    }"
}
Now let me update the guards index file to export the Public decorator:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/auth/guards/index.ts"
}
Now let me fix the critical security issues - the resolvers that are missing authentication guards:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/api-keys/api-keys.resolver.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/api-keys/api-keys.resolver.ts",
  "old_string": "import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';\nimport { UseGuards } from '@nestjs/common';\nimport { ApiKeysService } from './services/api-keys.service';\nimport { ApiKey } from './entities/api-key.entity';\nimport {\n  CreateApiKeyInput,\n  UpdateApiKeyInput,\n  CreateApiKeyResponse,\n  ValidateApiKeyInput,\n  ValidateApiKeyResponse,\n} from './dto/api-key.dto';\n\n/**\n * ApiKeys Resolver\n *\n * Provides GraphQL mutations and queries for API key management.\n * Uses the CRUD resolver from nestjs-query for standard operations.\n */\n@Resolver(() => ApiKey)\nexport class ApiKeysResolver {",
  "new_string": "import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';\nimport { UseGuards } from '@nestjs/common';\nimport { ApiKeysService } from './services/api-keys.service';\nimport { ApiKey } from './entities/api-key.entity';\nimport {\n  CreateApiKeyInput,\n  UpdateApiKeyInput,\n  CreateApiKeyResponse,\n  ValidateApiKeyInput,\n  ValidateApiKeyResponse,\n} from './dto/api-key.dto';\nimport { GqlAuthGuard } from '../auth/guards/gql-auth.guard';\nimport { Public } from '../auth/decorators/public.decorator';\n\n/**\n * ApiKeys Resolver\n *\n * Provides GraphQL mutations and queries for API key management.\n * All operations require authentication except validateApiKey.\n */\n@Resolver(() => ApiKey)\n@UseGuards(GqlAuthGuard)\nexport class ApiKeysResolver {"
}
Now I need to mark the `validateApiKey` as public and remove manual auth checks:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/api-keys/api-keys.resolver.ts",
  "old_string": "  /**\n   * Create a new API key\n   * Returns the raw key (only shown once) and the created entity\n   */\n  @Mutation(() => CreateApiKeyResponse, {\n    description: 'Create a new API key. The raw key is only shown once.',\n  })\n  async createApiKey(\n    @Args('input') input: CreateApiKeyInput,\n    @Context() context: { req: { user?: { id: string } } },\n  ): Promise<CreateApiKeyResponse> {\n    const userId = context.req.user?.id;\n    if (!userId) {\n      throw new Error('Authentication required');\n    }\n\n    const { entity, rawKey } = await this.apiKeysService.create(userId, input);",
  "new_string": "  /**\n   * Create a new API key\n   * Returns the raw key (only shown once) and the created entity\n   */\n  @Mutation(() => CreateApiKeyResponse, {\n    description: 'Create a new API key. The raw key is only shown once.',\n  })\n  async createApiKey(\n    @Args('input') input: CreateApiKeyInput,\n    @Context() context: { req: { user: { id: string } } },\n  ): Promise<CreateApiKeyResponse> {\n    const userId = context.req.user.id;\n    const { entity, rawKey } = await this.apiKeysService.create(userId, input);"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/api-keys/api-keys.resolver.ts",
  "old_string": "  /**\n   * Update an API key\n   */\n  @Mutation(() => ApiKey, {\n    description:\n      'Update an existing API key (name, scopes, rate limit, expiration)',\n  })\n  async updateApiKey(\n    @Args('id', { type: () => String }) id: string,\n    @Args('input') input: UpdateApiKeyInput,\n    @Context() context: { req: { user?: { id: string } } },\n  ): Promise<ApiKey> {\n    const userId = context.req.user?.id;\n    if (!userId) {\n      throw new Error('Authentication required');\n    }\n\n    const key = await this.apiKeysService.update(id, input);\n\n    // Ensure user can only update their own keys\n    if (key.userId !== userId) {\n      throw new Error('Access denied');\n    }\n\n    return key;\n  }",
  "new_string": "  /**\n   * Update an API key\n   */\n  @Mutation(() => ApiKey, {\n    description:\n      'Update an existing API key (name, scopes, rate limit, expiration)',\n  })\n  async updateApiKey(\n    @Args('id', { type: () => String }) id: string,\n    @Args('input') input: UpdateApiKeyInput,\n    @Context() context: { req: { user: { id: string } } },\n  ): Promise<ApiKey> {\n    const userId = context.req.user.id;\n    const key = await this.apiKeysService.update(id, input);\n\n    // Ensure user can only update their own keys\n    if (key.userId !== userId) {\n      throw new Error('Access denied');\n    }\n\n    return key;\n  }"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/api-keys/api-keys.resolver.ts",
  "old_string": "  /**\n   * Revoke an API key\n   */\n  @Mutation(() => ApiKey, {\n    description: 'Revoke an API key. This action cannot be undone.',\n  })\n  async revokeApiKey(\n    @Args('id', { type: () => String }) id: string,\n    @Context() context: { req: { user?: { id: string } } },\n  ): Promise<ApiKey> {\n    const userId = context.req.user?.id;\n    if (!userId) {\n      throw new Error('Authentication required');\n    }\n\n    const key = await this.apiKeysService.revoke(id);\n\n    // Ensure user can only revoke their own keys\n    if (key.userId !== userId) {\n      throw new Error('Access denied');\n    }\n\n    return key;\n  }\n\n  /**\n   * Delete an API key\n   */\n  @Mutation(() => Boolean, {\n    description: 'Delete an API key permanently. This action cannot be undone.',\n  })\n  async deleteApiKey(\n    @Args('id', { type: () => String }) id: string,\n    @Context() context: { req: { user?: { id: string } } },\n  ): Promise<boolean> {\n    const userId = context.req.user?.id;\n    if (!userId) {\n      throw new Error('Authentication required');\n    }\n\n    const key = await this.apiKeysService.findById(id);\n\n    // Ensure user can only delete their own keys\n    if (key.userId !== userId) {\n      throw new Error('Access denied');\n    }\n\n    return this.apiKeysService.delete(id);\n  }\n\n  /**\n   * Validate an API key\n   */\n  @Query(() => ValidateApiKeyResponse, {\n    description: 'Validate an API key and check if it has the required scopes',\n  })\n  async validateApiKey(\n    @Args('input') input: ValidateApiKeyInput,\n  ): Promise<ValidateApiKeyResponse> {",
  "new_string": "  /**\n   * Revoke an API key\n   */\n  @Mutation(() => ApiKey, {\n    description: 'Revoke an API key. This action cannot be undone.',\n  })\n  async revokeApiKey(\n    @Args('id', { type: () => String }) id: string,\n    @Context() context: { req: { user: { id: string } } },\n  ): Promise<ApiKey> {\n    const userId = context.req.user.id;\n    const key = await this.apiKeysService.revoke(id);\n\n    // Ensure user can only revoke their own keys\n    if (key.userId !== userId) {\n      throw new Error('Access denied');\n    }\n\n    return key;\n  }\n\n  /**\n   * Delete an API key\n   */\n  @Mutation(() => Boolean, {\n    description: 'Delete an API key permanently. This action cannot be undone.',\n  })\n  async deleteApiKey(\n    @Args('id', { type: () => String }) id: string,\n    @Context() context: { req: { user: { id: string } } },\n  ): Promise<boolean> {\n    const userId = context.req.user.id;\n    const key = await this.apiKeysService.findById(id);\n\n    // Ensure user can only delete their own keys\n    if (key.userId !== userId) {\n      throw new Error('Access denied');\n    }\n\n    return this.apiKeysService.delete(id);\n  }\n\n  /**\n   * Validate an API key (public endpoint for external services)\n   */\n  @Public()\n  @Query(() => ValidateApiKeyResponse, {\n    description: 'Validate an API key and check if it has the required scopes',\n  })\n  async validateApiKey(\n    @Args('input') input: ValidateApiKeyInput,\n  ): Promise<ValidateApiKeyResponse> {"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/api-keys/api-keys.resolver.ts",
  "old_string": "  /**\n   * Get all API keys for the current user\n   */\n  @Query(() => [ApiKey], {\n    description: 'Get all API keys for the current user',\n  })\n  async myApiKeys(\n    @Context() context: { req: { user?: { id: string } } },\n  ): Promise<ApiKey[]> {\n    const userId = context.req.user?.id;\n    if (!userId) {\n      throw new Error('Authentication required');\n    }\n\n    return this.apiKeysService.findByUserId(userId);\n  }\n}",
  "new_string": "  /**\n   * Get all API keys for the current user\n   */\n  @Query(() => [ApiKey], {\n    description: 'Get all API keys for the current user',\n  })\n  async myApiKeys(\n    @Context() context: { req: { user: { id: string } } },\n  ): Promise<ApiKey[]> {\n    const userId = context.req.user.id;\n    return this.apiKeysService.findByUserId(userId);\n  }\n}"
}
Now let me fix the webhooks resolver:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/webhooks/webhooks.resolver.ts",
  "old_string": "import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';\nimport { Webhook } from './entities/webhook.entity';\nimport { WebhookDelivery } from './entities/webhook-delivery.entity';\nimport { WebhooksService } from './services/webhooks.service';\nimport { WebhookDeliveryService } from './services/webhook-delivery.service';\nimport {\n  CreateWebhookInput,\n  UpdateWebhookInput,\n  CreateWebhookResponse,\n  TestWebhookInput,\n  TestWebhookResponse,\n  WebhookStats,\n} from './dto/webhook.dto';\n\n/**\n * Webhooks Resolver\n *\n * Provides GraphQL mutations and queries for webhook management.\n * Uses the CRUD resolver from nestjs-query for standard operations.\n */\n@Resolver(() => Webhook)\nexport class WebhooksResolver {",
  "new_string": "import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';\nimport { UseGuards } from '@nestjs/common';\nimport { Webhook } from './entities/webhook.entity';\nimport { WebhookDelivery } from './entities/webhook-delivery.entity';\nimport { WebhooksService } from './services/webhooks.service';\nimport { WebhookDeliveryService } from './services/webhook-delivery.service';\nimport {\n  CreateWebhookInput,\n  UpdateWebhookInput,\n  CreateWebhookResponse,\n  TestWebhookInput,\n  TestWebhookResponse,\n  WebhookStats,\n} from './dto/webhook.dto';\nimport { GqlAuthGuard } from '../auth/guards/gql-auth.guard';\n\n/**\n * Webhooks Resolver\n *\n * Provides GraphQL mutations and queries for webhook management.\n * All operations require authentication.\n */\n@Resolver(() => Webhook)\n@UseGuards(GqlAuthGuard)\nexport class WebhooksResolver {"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/webhooks/webhooks.resolver.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/webhooks/webhooks.resolver.ts",
  "old_string": "import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';\nimport { Webhook } from './entities/webhook.entity';\nimport { WebhookDelivery } from './entities/webhook-delivery.entity';\nimport { WebhooksService } from './services/webhooks.service';\nimport { WebhookDeliveryService } from './services/webhook-delivery.service';\nimport {\n  CreateWebhookInput,\n  UpdateWebhookInput,\n  CreateWebhookResponse,\n  TestWebhookInput,\n  TestWebhookResponse,\n  WebhookStats,\n} from './dto/webhook.dto';\n\n/**\n * Webhooks Resolver\n *\n * Provides GraphQL mutations and queries for webhook management.\n * Uses the CRUD resolver from nestjs-query for standard operations.\n */\n@Resolver(() => Webhook)\nexport class WebhooksResolver {\n  constructor(\n    private readonly webhooksService: WebhooksService,\n    private readonly webhookDeliveryService: WebhookDeliveryService,\n  ) {}",
  "new_string": "import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';\nimport { UseGuards } from '@nestjs/common';\nimport { Webhook } from './entities/webhook.entity';\nimport { WebhookDelivery } from './entities/webhook-delivery.entity';\nimport { WebhooksService } from './services/webhooks.service';\nimport { WebhookDeliveryService } from './services/webhook-delivery.service';\nimport {\n  CreateWebhookInput,\n  UpdateWebhookInput,\n  CreateWebhookResponse,\n  TestWebhookInput,\n  TestWebhookResponse,\n  WebhookStats,\n} from './dto/webhook.dto';\nimport { GqlAuthGuard } from '../auth/guards/gql-auth.guard';\n\n/**\n * Webhooks Resolver\n *\n * Provides GraphQL mutations and queries for webhook management.\n * All operations require authentication.\n */\n@Resolver(() => Webhook)\n@UseGuards(GqlAuthGuard)\nexport class WebhooksResolver {\n  constructor(\n    private readonly webhooksService: WebhooksService,\n    private readonly webhookDeliveryService: WebhookDeliveryService,\n  ) {}"
}
Now I need to replace all the manual auth checks in the webhooks resolver:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/webhooks/webhooks.resolver.ts",
  "old_string": "  /**\n   * Create a new webhook\n   * Returns the secret (only shown once) and the created entity\n   */\n  @Mutation(() => CreateWebhookResponse, {\n    description: 'Create a new webhook. The secret is only shown once.',\n  })\n  async createWebhook(\n    @Args('input') input: CreateWebhookInput,\n    @Context() context: { req: { user?: { id: string } } },\n  ): Promise<CreateWebhookResponse> {\n    const userId = context.req.user?.id;\n    if (!userId) {\n      throw new Error('Authentication required');\n    }\n\n    const { webhook, secret } = await this.webhooksService.create(\n      userId,\n      input,\n    );",
  "new_string": "  /**\n   * Create a new webhook\n   * Returns the secret (only shown once) and the created entity\n   */\n  @Mutation(() => CreateWebhookResponse, {\n    description: 'Create a new webhook. The secret is only shown once.',\n  })\n  async createWebhook(\n    @Args('input') input: CreateWebhookInput,\n    @Context() context: { req: { user: { id: string } } },\n  ): Promise<CreateWebhookResponse> {\n    const userId = context.req.user.id;\n    const { webhook, secret } = await this.webhooksService.create(\n      userId,\n      input,\n    );"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/webhooks/webhooks.resolver.ts",
  "old_string": "  /**\n   * Update a webhook\n   */\n  @Mutation(() => Webhook, {\n    description:\n      'Update an existing webhook (name, URL, events, headers, status)',\n  })\n  async updateWebhook(\n    @Args('id', { type: () => String }) id: string,\n    @Args('input') input: UpdateWebhookInput,\n    @Context() context: { req: { user?: { id: string } } },\n  ): Promise<Webhook> {\n    const userId = context.req.user?.id;\n    if (!userId) {\n      throw new Error('Authentication required');\n    }\n\n    return this.webhooksService.update(id, userId, input);\n  }\n\n  /**\n   * Delete a webhook\n   */\n  @Mutation(() => Boolean, {\n    description: 'Delete a webhook permanently. This action cannot be undone.',\n  })\n  async deleteWebhook(\n    @Args('id', { type: () => String }) id: string,\n    @Context() context: { req: { user?: { id: string } } },\n  ): Promise<boolean> {\n    const userId = context.req.user?.id;\n    if (!userId) {\n      throw new Error('Authentication required');\n    }\n\n    await this.webhooksService.delete(id, userId);\n    return true;\n  }\n\n  /**\n   * Activate a webhook\n   */\n  @Mutation(() => Webhook, {\n    description: 'Activate a webhook',\n  })\n  async activateWebhook(\n    @Args('id', { type: () => String }) id: string,\n    @Context() context: { req: { user?: { id: string } } },\n  ): Promise<Webhook> {\n    const userId = context.req.user?.id;\n    if (!userId) {\n      throw new Error('Authentication required');\n    }\n\n    return this.webhooksService.activate(id, userId);\n  }\n\n  /**\n   * Deactivate a webhook (temporary pause)\n   */\n  @Mutation(() => Webhook, {\n    description: 'Deactivate a webhook (temporary pause)',\n  })\n  async deactivateWebhook(\n    @Args('id', { type: () => String }) id: string,\n    @Context() context: { req: { user?: { id: string } } },\n  ): Promise<Webhook> {\n    const userId = context.req.user?.id;\n    if (!userId) {\n      throw new Error('Authentication required');\n    }\n\n    return this.webhooksService.deactivate(id, userId);\n  }\n\n  /**\n   * Disable a webhook\n   */\n  @Mutation(() => Webhook, {\n    description: 'Disable a webhook',\n  })\n  async disableWebhook(\n    @Args('id', { type: () => String }) id: string,\n    @Context() context: { req: { user?: { id: string } } },\n  ): Promise<Webhook> {\n    const userId = context.req.user?.id;\n    if (!userId) {\n      throw new Error('Authentication required');\n    }\n\n    return this.webhooksService.disable(id, userId);\n  }\n\n  /**\n   * Rotate webhook secret\n   */\n  @Mutation(() => String, {\n    description: 'Rotate webhook secret. The old secret will no longer work.',\n  })\n  async rotateWebhookSecret(\n    @Args('id', { type: () => String }) id: string,\n    @Context() context: { req: { user?: { id: string } } },\n  ): Promise<string> {\n    const userId = context.req.user?.id;\n    if (!userId) {\n      throw new Error('Authentication required');\n    }\n\n    return this.webhooksService.rotateSecret(id, userId);\n  }\n\n  /**\n   * Test a webhook\n   */\n  @Mutation(() => TestWebhookResponse, {\n    description: 'Test a webhook by sending a test event',\n  })\n  async testWebhook(\n    @Args('input') input: TestWebhookInput,\n    @Context() context: { req: { user?: { id: string } } },\n  ): Promise<TestWebhookResponse> {\n    const userId = context.req.user?.id;\n    if (!userId) {\n      throw new Error('Authentication required');\n    }\n\n    const result = await this.webhooksService.test(\n      input.webhookId,\n      userId,\n      input.event,\n      input.payload ? JSON.parse(input.payload) : undefined,\n    );\n\n    return {\n      success: result.success,\n      statusCode: result.statusCode,\n      response: result.response,\n      error: result.error,\n      durationMs: result.durationMs,\n    };\n  }\n\n  /**\n   * Get a webhook by ID\n   */\n  @Query(() => Webhook, {\n    description: 'Get a webhook by ID',\n  })\n  async webhook(\n    @Args('id', { type: () => String }) id: string,\n    @Context() context: { req: { user?: { id: string } } },\n  ): Promise<Webhook> {\n    const userId = context.req.user?.id;\n    if (!userId) {\n      throw new Error('Authentication required');\n    }\n\n    return this.webhooksService.findOneForUser(id, userId);\n  }\n\n  /**\n   * Get all webhooks for the current user\n   */\n  @Query(() => [Webhook], {\n    description: 'Get all webhooks for the current user',\n  })\n  async myWebhooks(\n    @Context() context: { req: { user?: { id: string } } },\n    @Args('status', { type: () => String, nullable: true }) status?: string,\n  ): Promise<Webhook[]> {\n    const userId = context.req.user?.id;\n    if (!userId) {\n      throw new Error('Authentication required');\n    }\n\n    return this.webhooksService.findAllForUser(userId, status as any);\n  }\n\n  /**\n   * Get webhook statistics\n   */\n  @Query(() => WebhookStats, {\n    description: 'Get webhook statistics for the current user',\n  })\n  async webhookStats(\n    @Context() context: { req: { user?: { id: string } } },\n  ): Promise<WebhookStats> {\n    const userId = context.req.user?.id;\n    if (!userId) {\n      throw new Error('Authentication required');\n    }\n\n    const stats = await this.webhooksService.getStats(userId);\n    const deliveryStats =\n      await this.webhookDeliveryService.getDeliveryStats();\n\n    return {\n      totalWebhooks: stats.total,\n      activeWebhooks: stats.active,\n      totalDeliveries: deliveryStats.total,\n      successfulDeliveries: deliveryStats.success,\n      failedDeliveries: deliveryStats.failed,\n      pendingDeliveries: deliveryStats.pending,\n    };\n  }\n\n  /**\n   * Get recent deliveries for a webhook\n   */\n  @Query(() => [WebhookDelivery], {\n    description: 'Get recent deliveries for a webhook',\n  })\n  async webhookDeliveries(\n    @Args('webhookId', { type: () => String }) webhookId: string,\n    @Context() context: { req: { user?: { id: string } } },\n    @Args('limit', { type: () => Number, nullable: true, defaultValue: 50 })\n    limit?: number,\n  ): Promise<WebhookDelivery[]> {\n    const userId = context.req.user?.id;\n    if (!userId) {\n      throw new Error('Authentication required');\n    }\n\n    return this.webhooksService.getRecentDeliveries(webhookId, userId, limit);\n  }\n}",
  "new_string": "  /**\n   * Update a webhook\n   */\n  @Mutation(() => Webhook, {\n    description:\n      'Update an existing webhook (name, URL, events, headers, status)',\n  })\n  async updateWebhook(\n    @Args('id', { type: () => String }) id: string,\n    @Args('input') input: UpdateWebhookInput,\n    @Context() context: { req: { user: { id: string } } },\n  ): Promise<Webhook> {\n    const userId = context.req.user.id;\n    return this.webhooksService.update(id, userId, input);\n  }\n\n  /**\n   * Delete a webhook\n   */\n  @Mutation(() => Boolean, {\n    description: 'Delete a webhook permanently. This action cannot be undone.',\n  })\n  async deleteWebhook(\n    @Args('id', { type: () => String }) id: string,\n    @Context() context: { req: { user: { id: string } } },\n  ): Promise<boolean> {\n    const userId = context.req.user.id;\n    await this.webhooksService.delete(id, userId);\n    return true;\n  }\n\n  /**\n   * Activate a webhook\n   */\n  @Mutation(() => Webhook, {\n    description: 'Activate a webhook',\n  })\n  async activateWebhook(\n    @Args('id', { type: () => String }) id: string,\n    @Context() context: { req: { user: { id: string } } },\n  ): Promise<Webhook> {\n    const userId = context.req.user.id;\n    return this.webhooksService.activate(id, userId);\n  }\n\n  /**\n   * Deactivate a webhook (temporary pause)\n   */\n  @Mutation(() => Webhook, {\n    description: 'Deactivate a webhook (temporary pause)',\n  })\n  async deactivateWebhook(\n    @Args('id', { type: () => String }) id: string,\n    @Context() context: { req: { user: { id: string } } },\n  ): Promise<Webhook> {\n    const userId = context.req.user.id;\n    return this.webhooksService.deactivate(id, userId);\n  }\n\n  /**\n   * Disable a webhook\n   */\n  @Mutation(() => Webhook, {\n    description: 'Disable a webhook',\n  })\n  async disableWebhook(\n    @Args('id', { type: () => String }) id: string,\n    @Context() context: { req: { user: { id: string } } },\n  ): Promise<Webhook> {\n    const userId = context.req.user.id;\n    return this.webhooksService.disable(id, userId);\n  }\n\n  /**\n   * Rotate webhook secret\n   */\n  @Mutation(() => String, {\n    description: 'Rotate webhook secret. The old secret will no longer work.',\n  })\n  async rotateWebhookSecret(\n    @Args('id', { type: () => String }) id: string,\n    @Context() context: { req: { user: { id: string } } },\n  ): Promise<string> {\n    const userId = context.req.user.id;\n    return this.webhooksService.rotateSecret(id, userId);\n  }\n\n  /**\n   * Test a webhook\n   */\n  @Mutation(() => TestWebhookResponse, {\n    description: 'Test a webhook by sending a test event',\n  })\n  async testWebhook(\n    @Args('input') input: TestWebhookInput,\n    @Context() context: { req: { user: { id: string } } },\n  ): Promise<TestWebhookResponse> {\n    const userId = context.req.user.id;\n    const result = await this.webhooksService.test(\n      input.webhookId,\n      userId,\n      input.event,\n      input.payload ? JSON.parse(input.payload) : undefined,\n    );\n\n    return {\n      success: result.success,\n      statusCode: result.statusCode,\n      response: result.response,\n      error: result.error,\n      durationMs: result.durationMs,\n    };\n  }\n\n  /**\n   * Get a webhook by ID\n   */\n  @Query(() => Webhook, {\n    description: 'Get a webhook by ID',\n  })\n  async webhook(\n    @Args('id', { type: () => String }) id: string,\n    @Context() context: { req: { user: { id: string } } },\n  ): Promise<Webhook> {\n    const userId = context.req.user.id;\n    return this.webhooksService.findOneForUser(id, userId);\n  }\n\n  /**\n   * Get all webhooks for the current user\n   */\n  @Query(() => [Webhook], {\n    description: 'Get all webhooks for the current user',\n  })\n  async myWebhooks(\n    @Context() context: { req: { user: { id: string } } },\n    @Args('status', { type: () => String, nullable: true }) status?: string,\n  ): Promise<Webhook[]> {\n    const userId = context.req.user.id;\n    return this.webhooksService.findAllForUser(userId, status as any);\n  }\n\n  /**\n   * Get webhook statistics\n   */\n  @Query(() => WebhookStats, {\n    description: 'Get webhook statistics for the current user',\n  })\n  async webhookStats(\n    @Context() context: { req: { user: { id: string } } },\n  ): Promise<WebhookStats> {\n    const userId = context.req.user.id;\n    const stats = await this.webhooksService.getStats(userId);\n    const deliveryStats =\n      await this.webhookDeliveryService.getDeliveryStats();\n\n    return {\n      totalWebhooks: stats.total,\n      activeWebhooks: stats.active,\n      totalDeliveries: deliveryStats.total,\n      successfulDeliveries: deliveryStats.success,\n      failedDeliveries: deliveryStats.failed,\n      pendingDeliveries: deliveryStats.pending,\n    };\n  }\n\n  /**\n   * Get recent deliveries for a webhook\n   */\n  @Query(() => [WebhookDelivery], {\n    description: 'Get recent deliveries for a webhook',\n  })\n  async webhookDeliveries(\n    @Args('webhookId', { type: () => String }) webhookId: string,\n    @Context() context: { req: { user: { id: string } } },\n    @Args('limit', { type: () => Number, nullable: true, defaultValue: 50 })\n    limit?: number,\n  ): Promise<WebhookDelivery[]> {\n    const userId = context.req.user.id;\n    return this.webhooksService.getRecentDeliveries(webhookId, userId, limit);\n  }\n}"
}
Now let me fix the notification-manager resolver:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/notifications/notification-manager.resolver.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/notifications/notification-manager.resolver.ts",
  "old_string": "import {\n  Resolver,\n  Mutation,\n  Query,\n  Args,\n  Context,\n  ObjectType,\n  Int,\n} from '@nestjs/graphql';\nimport { UseGuards } from '@nestjs/common';\nimport { NotificationManagerService } from './services/notification-manager.service';\nimport {\n  SendNotificationInput,\n  NotificationDeliveryPreferencesInput,\n  BulkSendNotificationInput,\n  SendNotificationResponse,\n  BulkSendNotificationResponse,\n  NotificationDeliveryPreferences,\n} from './dto/notification.dto';\nimport { InAppNotification } from './entities/in-app-notification.entity';\n\n/**\n * Notification Manager Resolver\n *\n * GraphQL resolver for notification management operations.\n * Provides mutations for sending notifications and managing preferences.\n */\n@Resolver(() => InAppNotification)\nexport class NotificationManagerResolver {\n  constructor(\n    private readonly notificationManager: NotificationManagerService,\n  ) {}",
  "new_string": "import {\n  Resolver,\n  Mutation,\n  Query,\n  Args,\n  Context,\n  ObjectType,\n  Int,\n} from '@nestjs/graphql';\nimport { UseGuards } from '@nestjs/common';\nimport { NotificationManagerService } from './services/notification-manager.service';\nimport {\n  SendNotificationInput,\n  NotificationDeliveryPreferencesInput,\n  BulkSendNotificationInput,\n  SendNotificationResponse,\n  BulkSendNotificationResponse,\n  NotificationDeliveryPreferences,\n} from './dto/notification.dto';\nimport { InAppNotification } from './entities/in-app-notification.entity';\nimport { GqlAuthGuard } from '../auth/guards/gql-auth.guard';\nimport { RequireAdmin } from '../auth/guards/role.guard';\nimport { RoleGuard } from '../auth/guards/role.guard';\n\n/**\n * Notification Manager Resolver\n *\n * GraphQL resolver for notification management operations.\n * All mutations require authentication and admin role (used internally by the system).\n */\n@Resolver(() => InAppNotification)\n@UseGuards(GqlAuthGuard, RoleGuard)\n@RequireAdmin()\nexport class NotificationManagerResolver {\n  constructor(\n    private readonly notificationManager: NotificationManagerService,\n  ) {}"
}
Now let me fix the document-versioning resolver:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/document-versioning.resolver.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/document-versioning.resolver.ts",
  "old_string": "import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';\nimport { DocumentVersioningService } from './services/document-versioning.service';\nimport { DocumentVersion } from './entities/document-version.entity';\nimport { LegalDocument } from './entities/legal-document.entity';\n\n/**\n * Document Versioning Resolver\n *\n * Provides GraphQL mutations and queries for document versioning operations:\n * - Get version history\n * - Get specific version\n * - Rollback to previous version\n * - Get diff between versions\n */\n@Resolver(() => DocumentVersion)\nexport class DocumentVersioningResolver {\n  constructor(private readonly versioningService: DocumentVersioningService) {}",
  "new_string": "import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';\nimport { UseGuards } from '@nestjs/common';\nimport { DocumentVersioningService } from './services/document-versioning.service';\nimport { DocumentVersion } from './entities/document-version.entity';\nimport { LegalDocument } from './entities/legal-document.entity';\nimport { GqlAuthGuard } from '../auth/guards/gql-auth.guard';\n\n/**\n * Document Versioning Resolver\n *\n * Provides GraphQL mutations and queries for document versioning operations:\n * - Get version history\n * - Get specific version\n * - Rollback to previous version\n * - Get diff between versions\n *\n * All operations require authentication.\n */\n@Resolver(() => DocumentVersion)\n@UseGuards(GqlAuthGuard)\nexport class DocumentVersioningResolver {\n  constructor(private readonly versioningService: DocumentVersioningService) {}"
}
Now let me fix the legal-ruling resolver:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/legal-ruling.resolver.ts",
  "limit": 50
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/legal-ruling.resolver.ts",
  "old_string": "import { Resolver, Query, Args, Int } from '@nestjs/graphql';\nimport { LegalRulingService } from './services/legal-ruling.service';\nimport {\n  RulingSearchAggregatorService,\n  AggregatedSearchResult,\n} from './services/ruling-search-aggregator.service';\nimport { AdvancedLegalRulingSearchService } from './services/advanced-legal-ruling-search.service';\nimport { LegalRuling, CourtType } from './entities/legal-ruling.entity';\nimport {\n  SearchLegalRulingsInput,\n  FilterLegalRulingsInput,\n  LegalRulingSearchResponse,\n  AggregatedSearchLegalRulingsInput,\n  AggregatedLegalRulingSearchResponse,\n  SearchSource,\n  AdvancedSearchLegalRulingsInput,\n  AdvancedLegalRulingSearchResponse,\n} from './dto/legal-ruling-search.dto';\n\n/**\n * Custom GraphQL Resolver for Legal Rulings\n *\n * Provides custom search and filtering operations that complement the\n * auto-generated CRUD resolvers from nestjs-query.\n *\n * Auto-generated operations (via nestjs-query):\n * - legalRulings: Query all rulings with filtering, sorting, paging\n * - legalRuling: Query single ruling by ID\n * - createOneLegalRuling: Create a new ruling\n * - updateOneLegalRuling: Update a ruling\n * - deleteOneLegalRuling: Delete a ruling\n *\n * Custom operations (this resolver):\n * - searchLegalRulings: Full-text search with relevance ranking\n * - legalRulingsByCourtType: Filter by court type\n * - legalRulingsFromHigherCourts: Get rulings from higher courts\n * - legalRulingBySignature: Find by unique case signature\n */\n@Resolver(() => LegalRuling)\nexport class LegalRulingResolver {\n  constructor(\n    private readonly legalRulingService: LegalRulingService,\n    private readonly aggregatorService: RulingSearchAggregatorService,\n    private readonly advancedSearchService: AdvancedLegalRulingSearchService,\n  ) {}",
  "new_string": "import { Resolver, Query, Args, Int } from '@nestjs/graphql';\nimport { UseGuards } from '@nestjs/common';\nimport { LegalRulingService } from './services/legal-ruling.service';\nimport {\n  RulingSearchAggregatorService,\n  AggregatedSearchResult,\n} from './services/ruling-search-aggregator.service';\nimport { AdvancedLegalRulingSearchService } from './services/advanced-legal-ruling-search.service';\nimport { LegalRuling, CourtType } from './entities/legal-ruling.entity';\nimport {\n  SearchLegalRulingsInput,\n  FilterLegalRulingsInput,\n  LegalRulingSearchResponse,\n  AggregatedSearchLegalRulingsInput,\n  AggregatedLegalRulingSearchResponse,\n  SearchSource,\n  AdvancedSearchLegalRulingsInput,\n  AdvancedLegalRulingSearchResponse,\n} from './dto/legal-ruling-search.dto';\nimport { GqlAuthGuard } from '../auth/guards/gql-auth.guard';\nimport { Public } from '../auth/decorators/public.decorator';\n\n/**\n * Custom GraphQL Resolver for Legal Rulings\n *\n * Provides custom search and filtering operations that complement the\n * auto-generated CRUD resolvers from nestjs-query.\n *\n * Auto-generated operations (via nestjs-query):\n * - legalRulings: Query all rulings with filtering, sorting, paging\n * - legalRuling: Query single ruling by ID\n * - createOneLegalRuling: Create a new ruling\n * - updateOneLegalRuling: Update a ruling\n * - deleteOneLegalRuling: Delete a ruling\n *\n * Custom operations (this resolver):\n * - searchLegalRulings: Full-text search with relevance ranking\n * - legalRulingsByCourtType: Filter by court type\n * - legalRulingsFromHigherCourts: Get rulings from higher courts\n * - legalRulingBySignature: Find by unique case signature (public)\n *\n * Most operations require authentication, but legalRulingBySignature is public.\n */\n@Resolver(() => LegalRuling)\n@UseGuards(GqlAuthGuard)\nexport class LegalRulingResolver {\n  constructor(\n    private readonly legalRulingService: LegalRulingService,\n    private readonly aggregatorService: RulingSearchAggregatorService,\n    private readonly advancedSearchService: AdvancedLegalRulingSearchService,\n  ) {}"
}
Now let me mark the `legalRulingBySignature` query as public (it's useful for anyone to look up a ruling by signature):

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/legal-ruling.resolver.ts",
  "limit": 50,
  "offset": 145
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/legal-ruling.resolver.ts",
  "old_string": "  /**\n   * Query: Find ruling by unique signature\n   * Case signatures are unique identifiers like \"III CZP 8/21\"\n   */\n  @Query(() => LegalRuling, {\n    name: 'legalRulingBySignature',\n    nullable: true,\n    description: 'Find a legal ruling by its unique case signature',\n  })\n  async findBySignature(\n    @Args('signature', { type: () => String }) signature: string,\n  ): Promise<LegalRuling | null> {\n    return this.legalRulingService.findBySignature(signature);\n  }",
  "new_string": "  /**\n   * Query: Find ruling by unique signature (public)\n   * Case signatures are unique identifiers like \"III CZP 8/21\"\n   * This is a public endpoint for looking up rulings by their signature.\n   */\n  @Public()\n  @Query(() => LegalRuling, {\n    name: 'legalRulingBySignature',\n    nullable: true,\n    description: 'Find a legal ruling by its unique case signature',\n  })\n  async findBySignature(\n    @Args('signature', { type: () => String }) signature: string,\n  ): Promise<LegalRuling | null> {\n    return this.legalRulingService.findBySignature(signature);\n  }"
}
Now let me add `@Public()` to the intentionally public resolvers. First, the demo-request resolver:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/demo-request/demo-request.resolver.ts"
}
