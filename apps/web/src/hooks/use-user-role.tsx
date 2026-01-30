'use client';

import { useGetIdentity } from '@refinedev/core';
import { useMemo } from 'react';

/**
 * User role types matching the backend RoleTypeEnum
 *
 * Single source of truth for user roles - each user has exactly one role.
 *
 * Hierarchy (higher index = more permissions):
 * SUPER_ADMIN(5) > ADMIN(4) > LAWYER(3) > PARALEGAL(2) > CLIENT(1) > GUEST(0)
 */
export type UserRole = 'super_admin' | 'admin' | 'lawyer' | 'paralegal' | 'client' | 'guest';

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
} as const;

/**
 * User identity type returned by the auth provider
 * The auth provider adds a `role` field for compatibility, but the primary
 * source is `user_roles` array from the backend GraphQL API.
 */
interface UserIdentity {
  id?: string;
  email?: string;
  name?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  /** Compatibility field added by auth provider (first element of user_roles) */
  role?: string;
  /** Primary source of roles from backend GraphQL API (AuthUser.user_roles) */
  user_roles?: string[];
  [key: string]: unknown;
}

/**
 * Result of the useUserRole hook
 */
export interface UseUserRoleReturn {
  /** The user's primary role (single source of truth - first role from user_roles) */
  role: UserRole | null;
  /** All user roles from the backend (array, typically contains one role) */
  roles: UserRole[];
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether the user has the specified role(s) (any match) */
  hasRole: (rolesToCheck: UserRole | UserRole[]) => boolean;
  /** Whether the user's role is at least the specified level */
  hasRoleLevel: (minRole: UserRole) => boolean;
  /** Whether the user is an admin (admin or super_admin) */
  isAdmin: boolean;
  /** Whether the user is a legal professional (lawyer, paralegal, admin, or super_admin) */
  isLegalProfessional: boolean;
  /** Whether the user is a client or guest */
  isClient: boolean;
  /** Whether the user is a super admin */
  isSuperAdmin: boolean;
}

/**
 * Hook to access and check user roles
 *
 * Uses the user_roles array from the backend GraphQL API as the primary source.
 * The backend returns user_roles as an array (typically containing one role).
 * The auth providers add a compatibility `role` field (first element of user_roles).
 *
 * @example
 * ```tsx
 * const { role, roles, isAdmin, hasRole } = useUserRole();
 *
 * if (isAdmin) {
 *   // Show admin content
 * }
 *
 * if (hasRole('lawyer')) {
 *   // Show lawyer-specific content
 * }
 *
 * if (hasRoleLevel('lawyer')) {
 *   // Show content for lawyer level and above (lawyer, admin, super_admin)
 * }
 *
 * // Check if user has any of the specified roles
 * if (hasRole(['lawyer', 'admin'])) {
 *   // User has at least one of these roles
 * }
 * ```
 */
export const useUserRole = (): UseUserRoleReturn => {
  const { data: identity, isLoading: identityLoading } = useGetIdentity<UserIdentity>();

  const isAuthenticated = !identityLoading && !!identity;

  // Get roles from user_roles array (primary source from backend)
  // Fallback to role field (compatibility field added by auth providers)
  const rawRoles: string[] = useMemo(() => {
    if (
      identity?.user_roles &&
      Array.isArray(identity.user_roles) &&
      identity.user_roles.length > 0
    ) {
      return identity.user_roles.filter(isValidRole);
    }
    // Fallback to compatibility role field
    if (identity?.role && isValidRole(identity.role)) {
      return [identity.role];
    }
    return [];
  }, [identity]);

  // Primary role is the first (and typically only) role in the array
  const role: UserRole | null = useMemo(() => {
    return rawRoles.length > 0 ? (rawRoles[0] as UserRole) : null;
  }, [rawRoles]);

  // Roles as typed array for external use
  const roles: UserRole[] = useMemo(() => {
    return rawRoles as UserRole[];
  }, [rawRoles]);

  /**
   * Check if user has any of the specified roles
   * Checks if any role in the user's roles array matches any of the specified roles
   */
  const hasRole = (rolesToCheck: UserRole | UserRole[]): boolean => {
    if (roles.length === 0) return false;

    const rolesArray = Array.isArray(rolesToCheck) ? rolesToCheck : [rolesToCheck];
    return roles.some((userRole) => rolesArray.includes(userRole));
  };

  /**
   * Check if user's highest role is at least the specified level
   * Uses the primary role (first in array) for level comparison
   */
  const hasRoleLevel = (minRole: UserRole): boolean => {
    if (!role) return false;
    return ROLE_LEVELS[role] >= ROLE_LEVELS[minRole];
  };

  // Role type helpers (based on the primary role)
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';
  // Legal professionals include paralegal, lawyer, admin, and super_admin
  const isLegalProfessional = role === 'paralegal' || role === 'lawyer' || isAdmin;
  const isClient = role === 'client' || role === 'guest';

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
  return ['super_admin', 'admin', 'lawyer', 'paralegal', 'client', 'guest'].includes(value);
}
