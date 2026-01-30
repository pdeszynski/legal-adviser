/**
 * User Roles Enumeration
 *
 * Defines the available roles in the system.
 * Used for role-based access control (RBAC).
 *
 * Hierarchy (higher index = more permissions):
 * SUPER_ADMIN(5) > ADMIN(4) > LAWYER(3) > PARALEGAL(2) > CLIENT(1) > GUEST(0)
 */
export enum UserRole {
  GUEST = 'guest',
  CLIENT = 'client',
  PARALEGAL = 'paralegal',
  LAWYER = 'lawyer',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

/**
 * Legacy role aliases for backwards compatibility
 * Maps old role names to new enum values
 */
export const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  user: UserRole.CLIENT,
  admin: UserRole.ADMIN,
} as const;

/**
 * Role hierarchy levels - higher number = more permissions
 */
export const ROLE_LEVELS: Record<UserRole, number> = {
  [UserRole.GUEST]: 0,
  [UserRole.CLIENT]: 1,
  [UserRole.PARALEGAL]: 2,
  [UserRole.LAWYER]: 3,
  [UserRole.ADMIN]: 4,
  [UserRole.SUPER_ADMIN]: 5,
} as const;

/**
 * Check if a role has at least the specified level
 */
export function hasRoleLevel(
  userRole: UserRole,
  requiredLevel: UserRole,
): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredLevel];
}

/**
 * Get all roles that are at or above the given level
 */
export function getRolesAtOrAbove(level: UserRole): UserRole[] {
  const requiredLevel = ROLE_LEVELS[level];
  return Object.entries(ROLE_LEVELS)
    .filter(([_, lvl]) => lvl >= requiredLevel)
    .map(([role]) => role as UserRole);
}
