# RBAC (Role-Based Access Control) Documentation

## Overview

The Legal AI Platform uses a hierarchical Role-Based Access Control (RBAC) system with a single source of truth for user roles. Each user has exactly one role, stored in the User entity.

## Role Hierarchy

```
SUPER_ADMIN (5)
    ↓
ADMIN (4)
    ↓
LAWYER (3)
    ↓
PARALEGAL (2)
    ↓
CLIENT (1)
    ↓
GUEST (0)
```

Higher roles automatically inherit permissions from lower roles. For example, an ADMIN can access any route that requires CLIENT, PARALEGAL, or LAWYER permissions.

## Role Definitions

| Role          | Level | Description               | Permissions                                        |
| ------------- | ----- | ------------------------- | -------------------------------------------------- |
| `GUEST`       | 0     | Demo/unauthenticated user | Read-only public documents                         |
| `CLIENT`      | 1     | Regular user              | Own documents only, basic AI queries               |
| `PARALEGAL`   | 2     | Legal support             | Limited document/analysis access, draft creation   |
| `LAWYER`      | 3     | Legal professional        | Full document/analysis access, AI query generation |
| `ADMIN`       | 4     | Platform administrator    | User management, content moderation, analytics     |
| `SUPER_ADMIN` | 5     | Platform owner            | Full system access including billing               |

## Single Source of Truth

### User Entity

**Location:** `apps/backend/src/modules/users/entities/user.entity.ts`

```typescript
@Entity('users')
export class User {
  // ... other fields

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  @FilterableField(() => String)
  role: UserRole; // ← Single source of truth
}
```

### JWT Token Format

JWT tokens contain the role in an array format for compatibility:

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "roles": ["admin"] // Array with single role
}
```

### Legacy Role Mapping

For backwards compatibility, legacy role names are automatically mapped:

| Legacy Value | Maps To  |
| ------------ | -------- |
| `user`       | `CLIENT` |
| `admin`      | `ADMIN`  |

## Backend Usage

### Role Enum

**Location:** `apps/backend/src/modules/auth/enums/user-role.enum.ts`

```typescript
export enum UserRole {
  GUEST = 'guest',
  CLIENT = 'client',
  PARALEGAL = 'paralegal',
  LAWYER = 'lawyer',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

// Role hierarchy levels
export const ROLE_LEVELS: Record<UserRole, number> = {
  [UserRole.GUEST]: 0,
  [UserRole.CLIENT]: 1,
  [UserRole.PARALEGAL]: 2,
  [UserRole.LAWYER]: 3,
  [UserRole.ADMIN]: 4,
  [UserRole.SUPER_ADMIN]: 5,
};

// Helper function
export function hasRoleLevel(userRole: UserRole, requiredLevel: UserRole): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredLevel];
}
```

### Guards

**Location:** `apps/backend/src/modules/auth/guards/`

#### RoleGuard

Role-based access with hierarchy support:

```typescript
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from './gql-auth.guard';
import { RoleGuard, RequireRole } from './role.guard';
import { UserRole, RoleMatchMode } from '../enums/user-role.enum';

// Single required role (ADMIN or higher)
@UseGuards(GqlAuthGuard, RoleGuard)
@RequireRole(UserRole.ADMIN)
async adminQuery() { ... }

// Multiple roles - user needs at least one (OR logic)
@UseGuards(GqlAuthGuard, RoleGuard)
@RequireRole(UserRole.ADMIN, UserRole.LAWYER)
async flexibleQuery() { ... }

// Multiple roles - user needs all (AND logic)
@UseGuards(GqlAuthGuard, RoleGuard)
@RequireRole(UserRole.ADMIN, UserRole.LAWYER, { mode: RoleMatchMode.ALL })
async requiresAllRoles() { ... }
```

#### AdminGuard

Admin-only access (ADMIN or SUPER_ADMIN):

```typescript
import { AdminGuard } from './admin.guard';

@UseGuards(GqlAuthGuard, AdminGuard)
async adminOnly() { ... }
```

### Guard Behavior

Both guards handle two role formats:

1. **JWT format** (`user.roles` array): Checked first
2. **Entity format** (`user.role` string): Fallback

```typescript
// From RoleGuard.getUserRoles()
private getUserRoles(user: RequestUser): UserRole[] {
  // From JWT (roles array)
  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles
      .map((r) => this.normalizeRole(r))
      .filter((r): r is UserRole => r !== null);
  }

  // From User entity (single role string)
  if (user.role) {
    const normalized = this.normalizeRole(user.role);
    if (normalized) return [normalized];
  }

  return [];
}

// Handles legacy role mapping
private normalizeRole(role: string): UserRole | null {
  if (Object.values(UserRole).includes(role as UserRole)) {
    return role as UserRole;
  }
  if (role in LEGACY_ROLE_MAP) {
    return LEGACY_ROLE_MAP[role];
  }
  return null;
}
```

## Frontend Usage

### useUserRole Hook

**Location:** `apps/web/src/hooks/use-user-role.tsx`

```typescript
import { useUserRole } from '@/hooks/use-user-role';

const {
  role, // UserRole | null - Single role
  roles, // UserRole[] - Array for backwards compatibility
  hasRole, // (role: UserRole | UserRole[]) => boolean
  hasRoleLevel, // (minRole: UserRole) => boolean
  isAdmin, // boolean - admin or super_admin
  isSuperAdmin, // boolean - super_admin only
  isLegalProfessional, // boolean - paralegal, lawyer, admin, super_admin
  isClient, // boolean - client or guest
  isAuthenticated, // boolean
} = useUserRole();
```

### Examples

```tsx
// Show admin-only content
const { isAdmin } = useUserRole();

{
  isAdmin && <AdminDashboard />;
}

// Check specific role
const { hasRole } = useUserRole();

{
  hasRole('lawyer') && <LawyerPanel />;
}

// Check role level (hierarchy)
const { hasRoleLevel } = useUserRole();

// Shows for lawyer, admin, super_admin
{
  hasRoleLevel('lawyer') && <ProfessionalContent />;
}

// Multiple roles check (any match)
const { hasRole } = useUserRole();

{
  hasRole(['lawyer', 'admin']) && <SharedContent />;
}
```

### Protected Routes

**Admin Layout:** `apps/web/src/app/admin/layout.tsx`

```tsx
import { useUserRole } from '@/hooks/use-user-role';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useUserRole();

  if (isLoading) return <Loading />;
  if (!isAdmin) redirect('/');

  return <AdminPanel>{children}</AdminPanel>;
}
```

**Menu Filtering:** `apps/web/src/config/menu.config.tsx`

```tsx
import { useUserRole } from '@/hooks/use-user-role';

export function MenuConfig() {
  const { isAdmin, hasRoleLevel } = useUserRole();

  const menuItems = [
    // Public items
    { key: 'dashboard', label: 'Dashboard' },

    // Admin only
    ...(isAdmin
      ? [
          { key: 'admin-users', label: 'User Management' },
          { key: 'admin-settings', label: 'Settings' },
        ]
      : []),

    // Legal professional and above
    ...(hasRoleLevel('paralegal') ? [{ key: 'documents', label: 'Documents' }] : []),
  ];

  return menuItems;
}
```

## GraphQL Schema

### User Type

```graphql
type User {
  id: ID!
  email: String!
  username: String
  firstName: String
  lastName: String
  role: String! # Single role as string
  isActive: Boolean!
  disclaimerAccepted: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### Query Examples

```graphql
# Get current user with role
query Me {
  me {
    id
    email
    role # Returns: "admin", "lawyer", "client", etc.
  }
}

# Filter users by role
query GetLawyers {
  users(filter: { role: { eq: "lawyer" } }) {
    edges {
      node {
        id
        email
        role
      }
    }
  }
}
```

## Seed Users

**Location:** `apps/backend/src/seeds/data/users.seed.ts`

### Default Admin Account

| Field    | Value              |
| -------- | ------------------ |
| Email    | `admin@refine.dev` |
| Password | `password`         |
| Role     | `SUPER_ADMIN`      |

### Test Users

| Email                   | Password      | Role        | Purpose                                        |
| ----------------------- | ------------- | ----------- | ---------------------------------------------- |
| `admin@refine.dev`      | `password`    | SUPER_ADMIN | Primary admin account                          |
| `lawyer@example.com`    | `password123` | LAWYER      | Legal professional testing                     |
| `user@example.com`      | `password123` | CLIENT      | Regular user testing                           |
| `paralegal@example.com` | `password123` | PARALEGAL   | Paralegal testing                              |
| `inactive@example.com`  | `password123` | GUEST       | Inactive user testing                          |
| `user2fa@example.com`   | `password123` | CLIENT      | 2FA testing (secret: `JBSWY3DPEHPK3PXP`)       |
| `admin2fa@example.com`  | `password123` | ADMIN       | Admin 2FA testing (secret: `KRSXG5DSQZKYQPZM`) |

## Migration Guide

If upgrading from an old multi-role system:

### Database Migration

1. Ensure `users.role` column exists and is populated
2. Migrate any legacy role values:
   - `user` → `client`
   - `admin` → `admin`

### Code Changes

1. **Backend:** Use `UserRole` enum instead of string arrays
2. **Frontend:** Use `useUserRole()` hook instead of direct role array access
3. **Guards:** Apply `RoleGuard` or `AdminGuard` to protected routes

### Example Migration

**Before (old pattern):**

```typescript
// User entity with multiple roles
@Column('simple-array')
roles: string[];

// Guard checking array
if (user.roles.includes('admin')) { ... }
```

**After (current pattern):**

```typescript
// User entity with single role
@Column({
  type: 'enum',
  enum: UserRole,
  default: UserRole.CLIENT,
})
role: UserRole;

// Guard using RoleGuard
@UseGuards(GqlAuthGuard, RoleGuard)
@RequireRole(UserRole.ADMIN)
async adminMethod() { ... }
```

## Troubleshooting

### Common Issues

#### Issue: Guard always returns 403 Forbidden

**Possible causes:**

1. User's role level is below required level
2. Legacy role name not mapped correctly
3. JWT token expired or invalid

**Solution:**

```typescript
// Debug: Check user role in resolver
@Query(() => User)
@UseGuards(GqlAuthGuard)
async me(@Context() context: GqlContext) {
  const user = context.req.user;
  console.log('User roles from JWT:', user.roles);
  console.log('User role from entity:', user.role);
}
```

#### Issue: Frontend role checks not working

**Possible causes:**

1. `useUserIdentity()` not returning role
2. Role value not matching enum
3. Hook called before auth is ready

**Solution:**

```tsx
const { role, isLoading } = useUserRole();

if (isLoading) return <Loading />;
if (!role) return <NotAuthenticated />;

// Now safe to check role
```

#### Issue: Admin users can't access admin routes

**Possible causes:**

1. User role is `ADMIN` but route requires `SUPER_ADMIN`
2. `AdminGuard` not applied correctly
3. Missing `GqlAuthGuard` before `AdminGuard`

**Solution:**

```typescript
// Correct guard order
@UseGuards(GqlAuthGuard, AdminGuard)  // GqlAuthGuard MUST come first
async adminMethod() { ... }
```

#### Issue: Role hierarchy not working

**Possible causes:**

1. Using exact match instead of hierarchy check
2. `ROLE_LEVELS` not imported correctly

**Solution:**

```typescript
// Use hasRoleLevel for hierarchy
import { hasRoleLevel } from '../enums/user-role.enum';

if (hasRoleLevel(user.role, UserRole.LAWYER)) {
  // Allows: LAWYER, ADMIN, SUPER_ADMIN
}
```

### Debug Mode

Enable role logging for troubleshooting:

```typescript
// In your resolver
@Query(() => String)
@UseGuards(GqlAuthGuard)
async debugMyRole(@Context() context: GqlContext) {
  const user = context.req.user;
  return JSON.stringify({
    roles: user.roles,
    role: user.role,
    roleLevel: user.role ? ROLE_LEVELS[user.role] : null,
  }, null, 2);
}
```

## Best Practices

1. **Always use the enum** - Never use string literals for roles

   ```typescript
   // ✅ Good
   @RequireRole(UserRole.ADMIN)

   // ❌ Bad
   @RequireRole('admin' as any)
   ```

2. **Use hierarchy checks** - Leverage role inheritance

   ```typescript
   // ✅ Good - allows ADMIN and SUPER_ADMIN
   @RequireRole(UserRole.ADMIN)

   // ❌ Bad - only allows ADMIN
   if (user.role === 'admin') { ... }
   ```

3. **Guard order matters** - Always use auth guard first

   ```typescript
   // ✅ Good
   @UseGuards(GqlAuthGuard, RoleGuard)

   // ❌ Bad - RoleGuard runs before auth
   @UseGuards(RoleGuard, GqlAuthGuard)
   ```

4. **Frontend: Use the hook** - Don't access identity directly

   ```typescript
   // ✅ Good
   const { isAdmin } = useUserRole();

   // ❌ Bad
   const { data } = useGetIdentity();
   const isAdmin = data?.role === 'admin';
   ```

5. **Seed data maintenance** - Keep admin@refine.dev as default admin
   - This account is documented throughout the codebase
   - Changing it requires updates to multiple files

## Security Considerations

1. **Role changes require token refresh** - JWT tokens contain role at issuance time
2. **PasswordHash is never exposed** - Using `select: false` on entity
3. **Guards return proper HTTP codes** - 401 for unauthenticated, 403 for unauthorized
4. **Public endpoints are explicit** - Marked with `@Public()` decorator
5. **Legacy mapping is temporary** - Plan to remove old role names in future version

## Related Files

- `apps/backend/src/modules/users/entities/user.entity.ts` - User entity with role field
- `apps/backend/src/modules/auth/enums/user-role.enum.ts` - Role enum and helpers
- `apps/backend/src/modules/auth/guards/role.guard.ts` - RoleGuard implementation
- `apps/backend/src/modules/auth/guards/admin.guard.ts` - AdminGuard implementation
- `apps/web/src/hooks/use-user-role.tsx` - Frontend role checking hook
- `apps/backend/src/seeds/data/users.seed.ts` - Seed users with roles
