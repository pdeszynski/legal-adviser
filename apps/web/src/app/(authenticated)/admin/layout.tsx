import React from 'react';
import { redirect } from 'next/navigation';
import { authProviderServer } from '@providers/auth-provider/auth-provider.server';
import { AdminMainLayout } from '@components/layout/admin-main-layout';

export default async function AdminLayout({ children }: React.PropsWithChildren) {
  const data = await getData();

  if (!data.authenticated) {
    return redirect(data?.redirectTo || '/login');
  }

  if (!data.isAdmin) {
    return redirect('/dashboard');
  }

  return <AdminMainLayout>{children}</AdminMainLayout>;
}

async function getData() {
  const { authenticated, redirectTo } = await authProviderServer.check();
  const permissions = await authProviderServer.getPermissions?.();

  // Check if user has admin role (admin or super_admin)
  // permissions is an array with a single role from the backend
  const isAdmin =
    Array.isArray(permissions) &&
    (permissions.includes('admin') || permissions.includes('super_admin'));

  return {
    authenticated,
    redirectTo,
    isAdmin,
  };
}
