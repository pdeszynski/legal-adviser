# Role-Based Access Control (RBAC) Pattern

**Pattern Date:** 2026-01-24
**Status:** Verified
**Applies to:** `apps/backend/src/modules/auth/guards/*`, `apps/web/src/app/admin/*`, `apps/web/src/hooks/use-user-role.tsx`

## Quick Reference

### Role Hierarchy (Highest to Lowest)

```
SUPER_ADMIN (5) > ADMIN (4) > LAWYER (3) > PARALEGAL (2) > CLIENT (1) > GUEST (0)
```

### Seed User Credentials

| Email                | Password      | Role        | Level |
| -------------------- | ------------- | ----------- | ----: |
| `admin@refine.dev`   | `password`    | SUPER_ADMIN |     5 |
| `lawyer@example.com` | `password123` | LAWYER      |     3 |
| `user@example.com`   | `password123` | CLIENT      |     1 |

## Backend Authorization

### RoleGuard Pattern

Location: `apps/backend/src/modules/auth/guards/role.guard.ts`

```typescript
import { RequireRole, RequireAdmin, UserRole } from '@modules/auth/guards';

// Require specific role
@RequireRole(UserRole.ADMIN)
@Query(() => [User])
async adminOnlyQuery(): Promise<User[]> { ... }

// Require any of multiple roles
@RequireRole(UserRole.LAWYER, UserRole.PARALEGAL)
@Query(() => [LegalDocument])
async legalProfessionalsQuery(): Promise<LegalDocument[]> { ... }

// Require admin access (convenience)
@RequireAdmin()
@Mutation(() => User)
async createUser(): Promise<User> { ... }
```

### Role Match Modes

```typescript
// ANY mode (default): User must have at least one of the specified roles
@RequireRole(UserRole.LAWYER, UserRole.ADMIN)

// ALL mode: User must have all specified roles (rarely used)
@RequireRole(UserRole.LAWYER, UserRole.ADMIN, { mode: 'ALL' })
```

### AdminGuard (Simple Admin Check)

Location: `apps/backend/src/modules/auth/guards/admin.guard.ts`

```typescript
import { AdminGuard } from '@modules/auth/guards';

@UseGuards(AdminGuard)
@Query(() => String)
async adminDashboard(): Promise<string> { ... }
```

## Frontend Authorization

### Admin Route Protection

Location: `apps/web/src/app/admin/layout.tsx`

```tsx
import { getPermissions } from '@providers/auth-provider/auth-provider.server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const permissions = await getPermissions();
  const isAdmin = permissions?.some((p) => ['ADMIN', 'SUPER_ADMIN'].includes(p));

  if (!isAdmin) {
    redirect('/dashboard');
  }

  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
```

### Role-Based Menu Items

Location: `apps/web/src/config/menu.config.tsx`

```tsx
import { UserRole } from '@hooks/use-user-role';

const menuItems = [
  {
    name: 'Admin Panel',
    to: '/admin',
    minRole: UserRole.ADMIN, // Only visible to ADMIN and above
  },
  {
    name: 'Documents',
    to: '/documents',
    minRole: UserRole.CLIENT, // Visible to CLIENT and above
  },
];
```

### useUserRole Hook

Location: `apps/web/src/hooks/use-user-role.tsx`

```tsx
import { useUserRole, UserRole } from '@hooks/use-user-role';

function MyComponent() {
  const { hasRole, hasRoleLevel, isAdmin, isLegalProfessional, isClient } = useUserRole();

  // Check specific role
  if (hasRole(UserRole.ADMIN)) {
    return <AdminPanel />;
  }

  // Check minimum role level (hierarchical)
  if (hasRoleLevel(UserRole.LAWYER)) {
    // Returns true for LAWYER, ADMIN, SUPER_ADMIN
    return <LegalProfessionalPanel />;
  }

  // Convenience checks
  if (isAdmin) { ... }           // ADMIN or SUPER_ADMIN
  if (isLegalProfessional) { ... } // LAWYER or PARALEGAL
  if (isClient) { ... }          // CLIENT or higher

  return <UserPanel />;
}
```

## Permission Matrix

| Resource            | SUPER_ADMIN | ADMIN | LAWYER | PARALEGAL | CLIENT | GUEST |
| ------------------- | :---------: | :---: | :----: | :-------: | :----: | :---: |
| Admin Panel         |      ✓      |   ✓   |        |           |        |       |
| User Management     |      ✓      |   ✓   |        |           |        |       |
| Create Documents    |      ✓      |   ✓   |   ✓    |     ✓     |   ✓    |       |
| Edit Any Document   |      ✓      |   ✓   |   ✓    |     ✓     |        |       |
| Edit Own Documents  |      ✓      |   ✓   |   ✓    |     ✓     |   ✓    |       |
| Delete Documents    |      ✓      |   ✓   |   ✓    |           |        |       |
| AI Query Generation |      ✓      |   ✓   |   ✓    |     ✓     |   ✓    |       |
| View Analytics      |      ✓      |   ✓   |        |           |        |       |
| System Settings     |      ✓      |       |        |           |        |       |

## Testing RBAC

### Backend Guard Tests

```bash
cd apps/backend && jest role.guard.spec.ts
```

### Frontend E2E Tests

```bash
cd apps/web && playwright test rbac-e2e.spec.ts
```

### Test Patterns

```typescript
// Backend: Test role guard
describe('RoleGuard', () => {
  it('should allow access to ADMIN for SUPER_ADMIN', () => {
    const context = { user: { role: UserRole.SUPER_ADMIN } };
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access to ADMIN for CLIENT', () => {
    const context = { user: { role: UserRole.CLIENT } };
    expect(guard.canActivate(context)).toBe(false);
  });
});

// Frontend: Playwright E2E
test('admin can access admin panel', async ({ page }) => {
  await loginAs(page, 'admin@refine.dev', 'password');
  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/admin\/users/);
});

test('lawyer cannot access admin panel', async ({ page }) => {
  await loginAs(page, 'lawyer@example.com', 'password123');
  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/dashboard/); // Redirected
});
```

## DDD Authorization Structure

The authorization module follows Domain-Driven Design:

```
apps/backend/src/domain/authorization/
  aggregates/
    RoleAggregate.ts
  value-objects/
    RoleType.ts
    Permission.ts
  events/
    RoleAssignedEvent.ts
    RoleCreatedEvent.ts
  repositories/
    IRoleRepository.ts
```

## Common Pitfalls

| Error                          | Cause                                        | Solution                                                |
| ------------------------------ | -------------------------------------------- | ------------------------------------------------------- |
| `403 Forbidden` on admin route | User role below required level               | Check user role in database, ensure role seeding worked |
| Menu item not showing          | `minRole` not set correctly                  | Verify role level values match hierarchy                |
| Guard not working              | Missing `@UseGuards()` decorator             | Apply guard to resolver or controller method            |
| Role hierarchy not working     | Using `mode: 'ALL'` instead of default `ANY` | Use default mode for hierarchical access                |

## Related Files

- Backend Guards: `apps/backend/src/modules/auth/guards/role.guard.ts`, `apps/backend/src/modules/auth/guards/admin.guard.ts`
- Frontend Hook: `apps/web/src/hooks/use-user-role.tsx`
- Admin Layout: `apps/web/src/app/admin/layout.tsx`
- Menu Config: `apps/web/src/config/menu.config.tsx`
- E2E Tests: `apps/web/tests/rbac-e2e.spec.ts`
- Role Entity: `apps/backend/src/modules/authorization/entities/role.entity.ts`
- User Role Entity: `apps/backend/src/modules/authorization/entities/user-role.entity.ts`
- Seed Data: `apps/backend/src/seeds/data/roles.seed.ts`, `apps/backend/src/seeds/data/user-roles.seed.ts`
