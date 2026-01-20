'use client';

import React, { Suspense, type PropsWithChildren } from 'react';
import { type I18nProvider, Refine } from '@refinedev/core';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';
import routerProvider from '@refinedev/nextjs-router';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { DevtoolsProvider } from '@providers/devtools';
import { authProviderClient } from '@providers/auth-provider/auth-provider.client';
import { dataProvider } from '@providers/data-provider';
import { auditLogProvider } from '@providers/audit-log-provider';
import { setUserLocale } from '@i18n';

export const RefineContext = ({ children }: PropsWithChildren) => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const handleChangeLocale = async (newLocale: string) => {
    await setUserLocale(newLocale);
    // Refresh the page to apply the new locale
    router.refresh();
  };

  const i18nProvider: I18nProvider = {
    translate: (key: string, options?: Record<string, string>) => t(key, options),
    getLocale: () => locale,
    changeLocale: handleChangeLocale,
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RefineKbarProvider>
        <DevtoolsProvider>
          <Refine
            routerProvider={routerProvider}
            dataProvider={dataProvider}
            authProvider={authProviderClient}
            auditLogProvider={auditLogProvider}
            i18nProvider={i18nProvider}
            resources={[
              {
                name: 'dashboard',
                list: '/dashboard',
                meta: {
                  label: 'Dashboard',
                  icon: <span aria-label="dashboard">📊</span>,
                },
              },
              {
                name: 'blog_posts',
                list: '/blog-posts',
                create: '/blog-posts/create',
                edit: '/blog-posts/edit/:id',
                show: '/blog-posts/show/:id',
                meta: {
                  canDelete: true,
                  label: 'Blog Posts',
                },
              },
              {
                name: 'documents',
                list: '/documents',
                create: '/documents/create',
                edit: '/documents/edit/:id',
                show: '/documents/show/:id',
                meta: {
                  canDelete: true,
                  label: 'Documents',
                },
              },
              {
                name: 'audit_logs',
                list: '/audit-logs',
                meta: {
                  label: 'Audit Logs',
                  canDelete: false,
                },
              },
            ]}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
            }}
          >
            {children}
            <RefineKbar />
          </Refine>
        </DevtoolsProvider>
      </RefineKbarProvider>
    </Suspense>
  );
};
