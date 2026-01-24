'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole, type UserRole } from '@/hooks/use-user-role';

/**
 * Props for the ProtectedRoute component
 */
export interface ProtectedRouteProps {
  /** Child components to render if authorized */
  children: ReactNode;
  /** Required role(s) to access the route */
  requiredRole?: UserRole | UserRole[];
  /** If true, user must have ALL specified roles (default: false = any role) */
  requireAll?: boolean;
  /** Minimum role level required (uses role hierarchy) */
  minRoleLevel?: UserRole;
  /** Where to redirect if unauthorized (default: '/403') */
  redirectTo?: string;
  /** Where to redirect if not authenticated (default: '/login') */
  loginRedirectTo?: string;
  /** Fallback component to show while checking auth */
  fallback?: ReactNode;
}

/**
 * ProtectedRoute component that checks user roles before rendering children
 *
 * @example
 * ```tsx
 * // Require admin role
 * <ProtectedRoute requiredRole="admin">
 *   <AdminDashboard />
 * </ProtectedRoute>
 *
 * // Require lawyer or admin
 * <ProtectedRoute requiredRole={['lawyer', 'admin']}>
 *   <LegalDocuments />
 * </ProtectedRoute>
 *
 * // Require minimum lawyer level (lawyer, admin, super_admin)
 * <ProtectedRoute minRoleLevel="lawyer">
 *   <ProfessionalContent />
 * </ProtectedRoute>
 *
 * // With custom redirect
 * <ProtectedRoute requiredRole="admin" redirectTo="/unauthorized">
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 */
export const ProtectedRoute = ({
  children,
  requiredRole,
  requireAll = false,
  minRoleLevel,
  redirectTo = '/403',
  loginRedirectTo = '/login',
  fallback = null,
}: ProtectedRouteProps) => {
  const { role, isAuthenticated, hasRole, hasRoleLevel } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push(loginRedirectTo);
      return;
    }

    let authorized = true;

    // Check specific role requirements
    if (requiredRole) {
      authorized = hasRole(requiredRole, requireAll);
    }

    // Check minimum role level
    if (authorized && minRoleLevel) {
      authorized = hasRoleLevel(minRoleLevel);
    }

    // Redirect if not authorized
    if (!authorized) {
      router.push(redirectTo);
    }
  }, [
    isAuthenticated,
    role,
    requiredRole,
    requireAll,
    minRoleLevel,
    hasRole,
    hasRoleLevel,
    router,
    redirectTo,
    loginRedirectTo,
  ]);

  // Show fallback while checking authentication
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Check authorization before rendering
  let authorized = true;

  if (requiredRole) {
    authorized = hasRole(requiredRole, requireAll);
  }

  if (authorized && minRoleLevel) {
    authorized = hasRoleLevel(minRoleLevel);
  }

  // Don't render children if not authorized (will redirect via useEffect)
  if (!authorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * HOC wrapper for protecting components with role-based access
 *
 * @example
 * ```tsx
 * const AdminOnly = withRoleProtection(AdminPanel, { requiredRole: 'admin' });
 * const LawyerOrAdmin = withRoleProtection(LegalContent, { requiredRole: ['lawyer', 'admin'] });
 * ```
 */
export function withRoleProtection<P extends object>(
  Component: React.ComponentType<P>,
  protectionProps: Omit<ProtectedRouteProps, 'children'>,
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...protectionProps}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
