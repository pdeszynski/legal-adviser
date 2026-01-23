import React from 'react';
import { redirect } from 'next/navigation';
import { authProviderServer } from '@providers/auth-provider/auth-provider.server';
import { MainLayout } from '@components/layout/main-layout';
import { getLocale } from 'next-intl/server';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@i18n/config';

export default async function AuthenticatedLayout({ children }: React.PropsWithChildren) {
  const data = await getData();

  if (!data.authenticated) {
    return redirect(data?.redirectTo || '/login');
  }

  return <MainLayout initialLocale={data.locale}>{children}</MainLayout>;
}

async function getData() {
  const { authenticated, redirectTo } = await authProviderServer.check();
  const locale = await getLocale();

  // Validate locale is supported
  const validLocale: SupportedLocale = SUPPORTED_LOCALES.includes(locale as SupportedLocale)
    ? (locale as SupportedLocale)
    : 'en';

  return {
    authenticated,
    redirectTo,
    locale: validLocale,
  };
}
