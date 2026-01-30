# User Role Duplication Analysis

## Executive Summary

The codebase contains **two parallel role systems** that are **inconsistent** and **partially implemented**:

1. **`User.role` column** - A simple enum (`'user' | 'admin'`) - **ACTIVELY USED**
2. **`UserRoleEntity` many-to-many table** - Complex RBAC with RoleEntity - **MOSTLY UNUSED**

The critical issue: **JWT tokens are populated from `User.role` only**, meaning the sophisticated many-to-many RBAC system exists but is **completely bypassed** at runtime.

---

## Data Schema Overview

### User Entity (ACTIVE)
**File:** `apps/backend/src/modules/users/entities/user.entity.ts`

```typescript
@Column({ type: 'enum', enum: ['user', 'admin'], default: 'user' })
@FilterableField(() => String)
role: 'user' | 'admin';
```

**Database Table:** `users.role`
- **Type:** ENUM ('user', 'admin')
- **Default:** 'user'
- **Constraints:** NOT NULL, DEFAULT 'user'

### RoleEntity (DEFINED BUT UNUSED)
**File:** `apps/backend/src/modules/authorization/entities/role.entity.ts`

```typescript
@Column({
  type: 'enum',
  enum: ['super_admin', 'admin', 'lawyer', 'paralegal', 'client', 'guest'],
})
type: 'super_admin' | 'admin' | 'lawyer' | 'paralegal' | 'client' | 'guest';
```

**Database Table:** `roles`
- **Type:** UUID primary key
- **Fields:** id, name, description, type, permissions[], inheritsFrom, isSystemRole
- **Status:** Seeded in database, but never queried for auth

### UserRoleEntity (DEFINED BUT UNUSED)
**File:** `apps/backend/src/modules/authorization/entities/user-role.entity.ts`

```typescript
@Entity('user_roles')
export class UserRoleEntity {
  @PrimaryColumn('uuid') id: string;
  @Column({ name: 'user_id', type: 'uuid' }) userId: string;
  @Column({ name: 'role_id', type: 'uuid' }) roleId: string;
  @Column({ type: 'int', default: 100 }) priority: number;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @Column({ name: 'expires_at', type: 'timestamp', nullable: true }) expiresAt: Date | null;
  @Column({ type: 'boolean', default: true }) isActive: boolean;
}
```

**Database Table:** `user_roles`
- **Purpose:** Many-to-many relationship between users and roles
- **Status:** Seeded for test users, but never used in authentication flow

---

## Code Path Analysis Matrix

### Authentication Flow (CRITICAL PATH)

| Component | File | Data Source | Notes |
|-----------|------|-------------|-------|
| **AuthService.validateUser** | `auth/auth.service.ts:88` | `user.role` | Returns `roles: [user.role \|\| 'user']` |
| **AuthService.generateTokenPair** | `auth/auth.service.ts:142` | `user.role` | JWT payload: `roles: [user.role \|\| 'user']` |
| **JwtStrategy.validate** | `auth/jwt.strategy.ts:48` | JWT `roles[]` | Passes through to request.user |
| **ApiKeyStrategy.validate** | `auth/strategies/api-key.strategy.ts:84` | `user.role` | Returns `roles: [user.role \|\| 'user']` |

**FINDING:** The many-to-many `user_roles` table is **NEVER queried** during authentication. JWT tokens only contain values from `User.role`.

### Authorization Guards

| Guard | File | Data Source | Role Enum Used |
|-------|------|-------------|----------------|
| **RoleGuard** | `auth/guards/role.guard.ts:169` | `user.roles[]` OR `user.role` | `UserRole.USER/ADMIN` |
| **AdminGuard** | `auth/guards/admin.guard.ts:64` | `user.roles[]` OR `user.role` | `UserRole.ADMIN` |
| **ChatDataCleanupController** | `chat/chat-data-cleanup.controller.ts:57` | `user.roles[]` OR `user.role` | `UserRole.ADMIN` |

**FINDING:** Guards support both `user.roles[]` (from JWT) and `user.role` (entity), but since JWT only contains values from `User.role`, the many-to-many system is effectively bypassed.

### Frontend Role Checks

| Component | File | Data Source | Role Values Supported |
|-----------|------|-------------|----------------------|
| **useUserRole hook** | `web/src/hooks/use-user-role.tsx:9-16` | `identity.role` OR `permissions[]` | `'super_admin', 'admin', 'lawyer', 'paralegal', 'client', 'guest', 'user'` |

**FINDING:** Frontend expects rich role types ('lawyer', 'paralegal', etc.) but backend JWT only sends 'user' or 'admin'. This is a **mismatch**.

### Backend Enum Definitions

| Enum | File | Values | Purpose |
|------|------|--------|---------|
| **UserRole** | `auth/enums/user-role.enum.ts` | `USER, ADMIN` | Used in guards |
| **RoleEntity.type** | `authorization/entities/role.entity.ts` | `super_admin, admin, lawyer, paralegal, client, guest` | RBAC system (unused) |

**INCONSISTENCY:** Two different enum sets for the same concept.

---

## Seed Data Analysis

### users.seed.ts
- Creates users with **NO role assignment** in the User entity
- User entity defaults `role` to 'user'
- Test users: admin@refine.dev, lawyer@example.com, user@example.com

### roles.seed.ts
- Creates 6 role types: super_admin, admin, lawyer, paralegal, client, guest
- Includes permissions and inheritance hierarchy
- **Initialized but never used**

### user-roles.seed.ts
- Maps users to roles via UserRoleEntity:
  - admin@refine.dev → super_admin
  - lawyer@example.com → lawyer
  - user@example.com → client
- **Stored in database but never queried**

---

## Inconsistencies Found

### 1. Type Mismatch
| Location | Expects | Actually Gets |
|----------|---------|---------------|
| Frontend `useUserRole` | 'lawyer', 'paralegal', etc. | JWT only sends 'user' or 'admin' |
| RoleEntity.type | 6 role types with hierarchy | User.role only has 2 values |

### 2. Database vs Runtime
- **Database:** Has `roles` table, `user_roles` table with rich RBAC structure
- **Runtime:** Only uses `users.role` column (enum: 'user' | 'admin')

### 3. Seed Data Confusion
- Seed creates users in `user_roles` table
- But authentication never reads from this table
- Test users have "lawyer" role in `user_roles` but JWT contains "user" from `User.role`

### 4. Unused Code
- `AuthorizationModule` is loaded but its services are not used in auth flow
- `RoleHierarchyService` exists but is never called
- `UserRoleEntity` is defined and seeded but never queried

---

## Database Schema Status

| Table | Status | Used in Auth? |
|-------|--------|---------------|
| `users.role` | **ACTIVE** | YES - only source of truth |
| `roles` | **DEFINED** | NO - only for admin UI queries |
| `user_roles` | **DEFINED** | NO - seeded but never queried |

---

## Impact Assessment

### Critical Issues
1. **Security:** The sophisticated RBAC system (permissions, expiration, priority) is not enforced
2. **Data Integrity:** Seed data creates role assignments that don't affect actual permissions
3. **Confusion:** Two parallel systems make it unclear where "truth" lives

### Medium Issues
1. **Frontend-Backend Mismatch:** Frontend code expects 'lawyer' role that never arrives
2. **Technical Debt:** Unused tables, entities, and services add maintenance burden
3. **Testing:** Tests may pass locally but fail in production if data differs

### Low Issues
1. **Documentation:** CLAUDE.md references role types that don't exist in JWT
2. **Naming:** `UserRole` enum vs `UserRoleEntity` causes confusion

---

## Recommendations

### Option A: Fully Migrate to Many-to-Many RBAC (RECOMMENDED)

**Pros:**
- Rich permissions system already designed
- Supports role expiration, priority, notes
- Aligns with frontend expectations
- More scalable for future requirements

**Cons:**
- Requires AuthService to query `user_roles` table
- Need to migrate JWT population logic
- Must update all existing users

**Migration Steps:**
1. Update `AuthService.generateTokenPair` to query `UserRoleEntity`
2. Populate JWT with role types from `RoleEntity.type`
3. Update `RoleGuard` to use full role hierarchy
4. Remove `User.role` column after migration
5. Add database migration to populate historical users

### Option B: Simplify to Single Column (QUICK FIX)

**Pros:**
- Simple immediate fix
- Less code to maintain
- Faster performance (no joins)

**Cons:**
- Loses rich RBAC features (expiration, permissions)
- Frontend expects lawyer/paralegal roles
- Limits future flexibility

**Migration Steps:**
1. Expand `User.role` enum to include all needed types
2. Remove unused tables (roles, user_roles)
3. Remove AuthorizationModule
4. Update frontend to match

### Option C: Hybrid (NOT RECOMMENDED)

Use `User.role` for primary auth and `UserRoleEntity` for additional permissions.

**Cons:**
- Adds complexity
- Still requires migration
- Confusing "two sources of truth"

---

## Conclusion

The codebase has a **sophisticated RBAC system that is 95% implemented but completely bypassed**. The many-to-many role tables exist, are seeded, but the authentication flow never queries them.

**Current Behavior:**
- All users are either 'user' or 'admin' based on `User.role` column
- The rich RBAC system (lawyer, paralegal, client, guest) is ignored
- JWT tokens only contain ['user'] or ['admin']

**Recommended Path:**
- **Option A** - Complete the migration to the many-to-many system
- The infrastructure is already there
- Just need to wire the AuthService to query `user_roles` instead of `User.role`

**Files Requiring Changes for Option A:**
1. `apps/backend/src/modules/auth/auth.service.ts` - Query user_roles
2. `apps/backend/src/modules/auth/enums/user-role.enum.ts` - Expand enum
3. `apps/backend/src/modules/auth/guards/role.guard.ts` - Update hierarchy
4. Database migration to handle existing users

**Estimated Effort:** 4-6 hours for complete migration
