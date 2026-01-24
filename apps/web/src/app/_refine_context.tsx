'use client';

import React, { type PropsWithChildren } from 'react';
import { type I18nProvider, Refine } from '@refinedev/core';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';
import routerProvider from '@refinedev/nextjs-router';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { DevtoolsProvider } from '@providers/devtools';
import { CsrfProvider } from '@providers/csrf-provider';
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
    <Refine
      routerProvider={routerProvider}
      dataProvider={dataProvider}
      authProvider={authProviderClient}
      auditLogProvider={auditLogProvider}
      i18nProvider={i18nProvider}
      resources={[
        {
          name: 'chat',
          list: '/chat',
          meta: {
            label: 'Legal Q&A Chat',
            canDelete: false,
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
          name: 'templates',
          list: '/templates',
          meta: {
            label: 'Templates',
            canDelete: false,
          },
        },
        {
          name: 'dashboard',
          list: '/dashboard',
          meta: {
            label: 'Dashboard',
            icon: <span aria-label="dashboard">📊</span>,
          },
        },
        {
          name: 'notifications',
          list: '/notifications',
          meta: {
            label: 'Notifications',
            canDelete: false,
          },
        },
        {
          name: 'settings',
          list: '/settings',
          meta: {
            label: 'Settings',
            icon: <span aria-label="settings">⚙️</span>,
            canDelete: false,
          },
        },
        {
          name: 'billing',
          list: '/billing',
          meta: {
            label: 'Billing',
            icon: <span aria-label="billing">💳</span>,
            canDelete: false,
          },
        },
        {
          name: 'usage',
          list: '/usage',
          meta: {
            label: 'Usage',
            icon: <span aria-label="usage">📈</span>,
            canDelete: false,
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
        projectId: "GCrk8D-oPupRw-ZMrDtj"
      }}
    >
      <RefineKbarProvider>
        <CsrfProvider>
          <DevtoolsProvider>
            <RefineKbar />
            {children}
          </DevtoolsProvider>
        </CsrfProvider>
      </RefineKbarProvider>
    </Refine>
  );
};
