# Admin Panel GraphQL Error Analysis Report

**Generated:** 2025-01-30
**Feature ID:** analyze-admin-graphql-errors
**Analysis Scope:** All admin panel GraphQL requests

---

## Executive Summary

This report documents the GraphQL request errors occurring in the admin panel. The primary issue is **inconsistent response formats** between backend GraphQL resolvers and frontend data provider expectations.

### Key Finding
The admin panel uses **two different GraphQL response patterns**:
1. **Connection-based pagination** (nestjs-query standard): Returns `{ edges, pageInfo, totalCount }`
2. **Simple array pagination** (custom implementation): Returns a plain array

The frontend data provider assumes **Connection-based pagination** for all resources, but the `users` query returns a **simple array**.

---

## Critical Issues

### Issue #1: Users Query Response Format Mismatch

**Severity:** HIGH - Breaks the entire users admin page

**Location:**
- Backend Query: `apps/backend/src/schema.gql:6629`
- Frontend Page: `apps/web/src/app/admin/users/page.tsx`
- Data Provider: `apps/web/src/providers/data-provider/index.ts:475-561`

**Backend Schema:**
```graphql
users(filter: UserFilter, paging: UserPaging, sorting: [UserSort!]): [User!]!
```

**Frontend Data Provider Expects:**
```typescript
{
  users: {
    totalCount: number;
    edges: Array<{ node: TData }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string;
      endCursor: string;
    };
  };
}
```

**Actual Response:**
```json
{
  "data": {
    "users": [
      { "id": "1", "email": "user@example.com", ... },
      { "id": "2", "email": "admin@example.com", ... }
    ]
  }
}
```

**Error:**
When the data provider tries to access `data.users.edges.map()`, it gets `undefined` because the response is a plain array, not an object with `edges` property.

**Fix Required:**
Either:
1. Change backend to return `UserConnection!` type (recommended)
2. Change frontend data provider to handle simple array for `users` resource

---

### Issue #2: API Keys Resource Name Mismatch

**Severity:** MEDIUM - API Keys page returns no data

**Location:**
- Frontend Page: `apps/web/src/app/(authenticated)/admin/api-keys/page.tsx:68`
- Backend Query: `apps/backend/src/schema.gql:6070`

**Frontend Resource Name:**
```typescript
useList<ApiKey>({
  resource: 'apiKey',  // ❌ Singular form
  ...
})
```

**Backend Query Name:**
```graphql
apiKeys(filter: ApiKeyFilter! = {}, paging: CursorPaging! = {first: 10}, sorting: [ApiKeySort!]! = []): ApiKeyConnection!
```

**Data Provider Mapping:**
The data provider (`apps/web/src/providers/data-provider/index.ts`) does NOT have a `getList` handler for `apiKey` resource. It only handles:
- `users`
- `audit_logs`
- `documents`
- `legalRulings`
- `notifications`
- `subscription_plans`
- `demoRequests`

**Fix Required:**
Either:
1. Add `apiKeys` handler to data provider (recommended)
2. Change frontend to use `api_keys` resource name

---

## Resource Mapping Analysis

### Working Resources (Connection-based)

| Resource | Backend Query | Return Type | Frontend Resource | Data Provider Handler |
|----------|---------------|-------------|-------------------|----------------------|
| Audit Logs | `auditLogs` | `AuditLogConnection!` | `audit_logs` | ✅ Yes (line 564) |
| Documents | `legalDocuments` | `LegalDocumentConnection!` | `documents` | ✅ Yes (line 671) |
| Legal Rulings | `legalRulings` | `LegalRulingConnection!` | `legalRulings` | ✅ Yes (line 779) |
| Notifications | `notifications` | `NotificationConnection!` | `notifications` | ✅ Yes (line 876) |
| Demo Requests | `demoRequests` | `DemoRequestConnection!` | `demoRequests` | ✅ Yes (line 1014) |

### Broken Resources

| Resource | Backend Query | Return Type | Frontend Resource | Data Provider Handler | Issue |
|----------|---------------|-------------|-------------------|----------------------|-------|
| Users | `users` | `[User!]!` | `users` | ✅ Yes (line 475) | **Returns array, not Connection** |
| API Keys | `apiKeys` | `ApiKeyConnection!` | `apiKey` | ❌ No | **Resource name mismatch + no handler** |

---

## Detailed Error Scenarios

### Scenario 1: Users Page Load

**Request:**
```graphql
query GetUsers($filter: UserFilter, $paging: CursorPaging, $sorting: [UserSort!]) {
  users(filter: $filter, paging: $paging, sorting: $sorting) {
    totalCount
    edges {
      node {
        id
        email
        username
        ...
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
```

**Variables:**
```json
{
  "filter": {},
  "paging": { "first": 10 },
  "sorting": [{ "field": "createdAt", "direction": "DESC" }]
}
```

**Expected Response:**
```json
{
  "data": {
    "users": {
      "totalCount": 100,
      "edges": [...],
      "pageInfo": {...}
    }
  }
}
```

**Actual Response:**
```json
{
  "data": {
    "users": [
      { "id": "1", "email": "user@example.com", ... }
    ]
  }
}
```

**Frontend Error:**
```
TypeError: Cannot read properties of undefined (reading 'map')
at dataProvider.getList (apps/web/src/providers/data-provider/index.ts:552)
```

---

### Scenario 2: API Keys Page Load

**Request via Refine:**
```javascript
useList<ApiKey>({
  resource: 'apiKey',  // ← Wrong resource name
  pagination: { current: 1, pageSize: 20 }
})
```

**Data Provider Behavior:**
1. Checks if `resource === 'apiKey'` → NO match
2. Checks other resources → NO match
3. Throws: `Error: Unknown resource: apiKey`

**Expected Resource Name:**
- Backend: `apiKeys` (plural)
- Frontend should use: `api_keys` or add mapping for `apiKey`

---

## Backend Schema Comparison

### Connection-based Queries (Standard Pattern)

```graphql
auditLogs(
  filter: AuditLogFilter! = {}
  paging: CursorPaging! = {first: 10}
  sorting: [AuditLogSort!]! = []
): AuditLogConnection!

type AuditLogConnection {
  edges: [AuditLogEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}
```

### Non-Connection Query (Users - Anomaly)

```graphql
users(
  filter: UserFilter
  paging: UserPaging
  sorting: [UserSort!]
): [User!]!

input UserPaging {
  after: String
  first: Int
}
```

---

## Pagination Type Differences

### CursorPaging (Standard)
```graphql
input CursorPaging {
  after: ConnectionCursor
  before: ConnectionCursor
  first: Int
  last: Int
}
```

### UserPaging (Custom - Users Only)
```graphql
input UserPaging {
  after: String
  first: Int
}
```

**Difference:** `UserPaging` is missing `before` and `last` parameters, uses plain `String` instead of `ConnectionCursor`.

---

## Frontend Data Provider Implementation

The data provider (`apps/web/src/providers/data-provider/index.ts`) has handlers for:

1. **users** (line 475) - ❌ Broken (expects Connection, gets array)
2. **audit_logs** (line 564) - ✅ Works
3. **documents** (line 671) - ✅ Works
4. **legalRulings** (line 779) - ✅ Works
5. **notifications** (line 876) - ✅ Works
6. **subscription_plans** (line 967) - ⚠️ Special case (simple array, handled correctly)
7. **demoRequests** (line 1014) - ✅ Works

**Missing:**
- **apiKeys** / **api_keys** - No handler exists

---

## Recommended Fixes

### Fix 1: Backend - Change Users to Return Connection (Recommended)

**File:** `apps/backend/src/modules/users/users.resolver.ts`

Change the `users` query to return a `UserConnection` instead of a plain array:

```typescript
@Query(() => UserConnection, { name: 'users' })
async users(
  @Args('filter', { type: () => UserFilter, nullable: true }) filter?: UserFilter,
  @Args('paging', { type: () => CursorPaging, nullable: true }) paging?: CursorPaging,
  @Args('sorting', { type: () => [UserSort], nullable: true }) sorting?: UserSort[],
): Promise<UserConnection> {
  // Use nestjs-query standard pattern
}
```

This aligns with the standard pattern used by other resources.

### Fix 2: Frontend - Handle Users Array Fallback

**File:** `apps/web/src/providers/data-provider/index.ts`

Add special handling for the users resource (temporary fix):

```typescript
if (resource === 'users') {
  // Check if response is array or Connection
  const isArray = Array.isArray(data.users);
  if (isArray) {
    return {
      data: data.users,
      total: data.users.length,
    };
  }
  // Continue with Connection handling...
}
```

### Fix 3: Add API Keys Data Provider Handler

**File:** `apps/web/src/providers/data-provider/index.ts`

Add after line 1017 (demoRequests):

```typescript
if (resource === 'api_keys' || resource === 'apiKey') {
  const query = `
    query GetApiKeys($filter: ApiKeyFilter, $paging: CursorPaging, $sorting: [ApiKeySort!]) {
      apiKeys(filter: $filter, paging: $paging, sorting: $sorting) {
        totalCount
        edges {
          node {
            id
            name
            keyPrefix
            description
            userId
            user { id email firstName lastName }
            scopes
            status
            rateLimitPerMinute
            usageCount
            lastUsedAt
            lastUsedIp
            expiresAt
            createdAt
            updatedAt
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  `;
  // ... rest of implementation
}
```

### Fix 4: Update API Keys Page Resource Name

**File:** `apps/web/src/app/(authenticated)/admin/api-keys/page.tsx`

Change line 68:
```typescript
// Before
resource: 'apiKey',

// After
resource: 'api_keys',
```

---

## Test Plan

After fixes are applied, verify:

1. **Users Page**
   - [ ] Page loads without errors
   - [ ] Users table displays data
   - [ ] Pagination works correctly
   - [ ] Filters apply correctly
   - [ ] Sorting works

2. **API Keys Page**
   - [ ] Page loads without errors
   - [ ] API keys table displays data
   - [ ] Pagination works correctly
   - [ ] Create API key works
   - [ ] Delete API key works

3. **Audit Logs Page**
   - [ ] Continue to work (already working)

4. **Documents Page**
   - [ ] Continue to work (already working)

---

## Additional Findings

### Unused Resources in Data Provider

The data provider has handlers for resources that may not have admin pages:
- `legalRulings` - No admin page found
- `notifications` - No admin page found

### Frontend Filter Operator Support

The data provider supports these filter operators (line 366-399):
- `eq`, `ne`, `contains`, `startswith`, `endswith`, `in`
- `gt`, `gte`, `lt`, `lte`

The filter builder correctly converts Refine operators to nestjs-query format.

---

## Summary of Errors by Page

| Page | Status | Error Type | Fix Priority |
|------|--------|------------|--------------|
| `/admin/users` | ❌ Broken | Response format mismatch | HIGH |
| `/admin/api-keys` | ❌ Broken | Resource name mismatch | MEDIUM |
| `/admin/audit-logs` | ✅ Works | N/A | N/A |
| `/admin/documents` | ✅ Works | N/A | N/A |
| `/admin/demo-requests` | ✅ Works | N/A | N/A |

---

## References

- Backend Schema: `apps/backend/src/schema.gql`
- Data Provider: `apps/web/src/providers/data-provider/index.ts`
- Users Page: `apps/web/src/app/admin/users/page.tsx`
- API Keys Page: `apps/web/src/app/(authenticated)/admin/api-keys/page.tsx`
- Audit Logs Page: `apps/web/src/app/(authenticated)/admin/audit-logs/page.tsx`
- Documents Page: `apps/web/src/app/admin/documents/page.tsx`
