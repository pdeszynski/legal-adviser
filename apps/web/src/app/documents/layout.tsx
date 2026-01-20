import React from 'react';
import { redirect } from 'next/navigation';
import { authProviderServer } from '@providers/auth-provider/auth-provider.server';
import { MainLayout } from '@components/layout/main-layout';

export default async function Layout({ children }: React.PropsWithChildren) {
  const data = await getData();

  if (!data.authenticated) {
    return redirect(data?.redirectTo || '/login');
  }

  return <MainLayout>{children}</MainLayout>;
}

async function getData() {
  const { authenticated, redirectTo } = await authProviderServer.check();

  return {
    authenticated,
    redirectTo,
  };
}
