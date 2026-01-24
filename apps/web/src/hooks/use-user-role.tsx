'use client';

import { useGetIdentity, usePermissions } from '@refinedev/core';
import { useMemo } from 'react';

/**
 * User role types matching the backend RoleTypeEnum
 */
export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'lawyer'
  | 'paralegal'
  | 'client'
  | 'guest'
  | 'user';

/**
 * Role hierarchy levels (higher = more permissions)
 */
const ROLE_LEVELS: Record<UserRole, number> = {
  guest: 0,
  client: 1,
  paralegal: 2,
  lawyer: 3,
  admin: 4,
  super_admin: 5,
  user: 1, // 'user' maps to client level for backwards compatibility
};

/**
 * Result of the useUserRole hook
 */
export interface UseUserRoleReturn {
  /** The user's primary role */
  role: UserRole | null;
  /** All roles assigned to the user */
  roles: UserRole[];
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether the user has any of the specified roles */
  hasRole: (rolesToCheck: UserRole | UserRole[], requireAll?: boolean) => boolean;
  /** Whether the user's role is at least the specified level */
  hasRoleLevel: (minRole: UserRole) => boolean;
  /** Whether the user is an admin (admin or super_admin) */
  isAdmin: boolean;
  /** Whether the user is a legal professional (lawyer or paralegal) */
  isLegalProfessional: boolean;
  /** Whether the user is a client (client or guest) */
  isClient: boolean;
  /** Whether the user is a super admin */
  isSuperAdmin: boolean;
}

/**
 * Hook to access and check user roles
 *
 * @example
 * ```tsx
 * const { role, isAdmin, hasRole } = useUserRole();
 *
 * if (isAdmin) {
 *   // Show admin content
 * }
 *
 * if (hasRole('lawyer')) {
 *   // Show lawyer-specific content
 * }
 *
 * if (hasRole(['lawyer', 'admin'])) {
 *   // Show content for lawyers or admins
 * }
 * ```
 */
export const useUserRole = (): UseUserRoleReturn => {
  const { data: identity, isLoading: identityLoading } = useGetIdentity<{ role?: string }>();
  const { data: permissions, isLoading: permissionsLoading } = usePermissions<string[]>({});

  const isAuthenticated = !identityLoading && !permissionsLoading && !!identity;

  // Get roles from permissions or identity
  const roles: UserRole[] = useMemo(() => {
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      return permissions.filter((r): r is UserRole => isValidRole(r));
    }
    if (identity?.role && isValidRole(identity.role)) {
      return [identity.role as UserRole];
    }
    return [];
  }, [permissions, identity]);

  // Primary role is the first/highest role
  const role: UserRole | null = useMemo(() => {
    if (roles.length === 0) return null;
    // Return the highest role by hierarchy
    return roles.reduce((highest, current) =>
      ROLE_LEVELS[current] > ROLE_LEVELS[highest] ? current : highest,
    );
  }, [roles]);

  /**
   * Check if user has any of the specified roles
   */
  const hasRole = (rolesToCheck: UserRole | UserRole[], requireAll = false): boolean => {
    const rolesArray = Array.isArray(rolesToCheck) ? rolesToCheck : [rolesToCheck];
    const validRolesToCheck = rolesArray.filter(isValidRole);

    if (validRolesToCheck.length === 0) return false;

    if (requireAll) {
      return validRolesToCheck.every((r) => roles.includes(r));
    }
    return validRolesToCheck.some((r) => roles.includes(r));
  };

  /**
   * Check if user's role is at least the specified level
   */
  const hasRoleLevel = (minRole: UserRole): boolean => {
    if (!role) return false;
    return ROLE_LEVELS[role] >= ROLE_LEVELS[minRole];
  };

  // Role type helpers
  const isAdmin = hasRole(['admin', 'super_admin']);
  const isSuperAdmin = hasRole('super_admin');
  const isLegalProfessional = hasRole(['lawyer', 'paralegal']);
  const isClient = hasRole(['client', 'guest', 'user']);

  return {
    role,
    roles,
    isAuthenticated,
    hasRole,
    hasRoleLevel,
    isAdmin,
    isLegalProfessional,
    isClient,
    isSuperAdmin,
  };
};

/**
 * Type guard to check if a string is a valid UserRole
 */
function isValidRole(value: string): value is UserRole {
  return ['super_admin', 'admin', 'lawyer', 'paralegal', 'client', 'guest', 'user'].includes(value);
}
