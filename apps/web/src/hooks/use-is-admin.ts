'use client';

import { useGetIdentity, usePermissions } from '@refinedev/core';

/**
 * Hook to check if the current user is an admin
 * @returns boolean indicating if user has admin role
 */
export const useIsAdmin = () => {
  const { data: identity } = useGetIdentity<{ role?: string }>();
  const { data: permissions } = usePermissions<string[]>();

  const isAdmin = identity?.role === 'admin' || permissions?.includes('admin') || false;

  return isAdmin;
};
