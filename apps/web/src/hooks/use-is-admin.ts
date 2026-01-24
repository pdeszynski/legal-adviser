'use client';

import { useUserRole } from './use-user-role';

/**
 * Hook to check if the current user is an admin
 * @returns boolean indicating if user has admin role
 */
export const useIsAdmin = () => {
  const { isAdmin } = useUserRole();
  return isAdmin;
};
