'use client';

import { useRouter } from 'next/navigation';
import { Refine } from '@refinedev/core';
import { RefineKbar } from '@refinedev/kbar';
import routerProvider from '@refinedev/nextjs-router';
import { dataProvider } from '@providers/data-provider';
import { authProviderClient } from '@providers/auth-provider/auth-provider.client';
import { useLocale, useTranslations } from 'next-intl';
import type { I18nProvider } from '@refinedev/core';
import { setUserLocale } from '@i18n';
import { useGetIdentity } from '@refinedev/core';

interface UserIdentity {
  id: string;
  email: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}

export const AdminMainLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const { data: identity } = useGetIdentity<UserIdentity>();

  const handleChangeLocale = async (newLocale: string) => {
    await setUserLocale(newLocale);
    router.refresh();
  };

  const i18nProvider: I18nProvider = {
    translate: (key: string, options?: Record<string, string>) => t(key, options),
    getLocale: () => locale,
    changeLocale: handleChangeLocale,
  };

  // Admin-specific resources
  const adminResources = [
    {
      name: 'admin-dashboard',
      list: '/admin',
      meta: {
        label: 'Admin Dashboard',
        icon: <span aria-label="admin-dashboard">⚙️</span>,
      },
    },
    {
      name: 'users',
      list: '/admin/users',
      meta: {
        label: 'Users',
        canDelete: false,
      },
    },
    {
      name: 'settings',
      list: '/admin/settings',
      meta: {
        label: 'System Settings',
        canDelete: false,
      },
    },
    {
      name: 'moderation',
      list: '/admin/moderation',
      meta: {
        label: 'Document Moderation',
        canDelete: false,
      },
    },
    {
      name: 'audit_logs',
      list: '/admin/audit-logs',
      meta: {
        label: 'Audit Logs',
        canDelete: false,
      },
    },
  ];

  return (
    <Refine
      routerProvider={routerProvider}
      dataProvider={dataProvider}
      authProvider={authProviderClient}
      i18nProvider={i18nProvider}
      resources={adminResources}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
      }}
    >
      <div className="flex h-screen w-full flex-col">
        {/* Admin Header */}
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Admin Panel</h1>
              {identity?.name && (
                <span className="text-sm text-muted-foreground">
                  Logged in as: {identity.name} ({identity?.role || 'user'})
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Back to App
              </a>
            </div>
          </div>
        </header>

        {/* Admin Layout with Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-64 border-r bg-muted/40 hidden md:block p-4">
            <nav className="space-y-2">
              <a
                href="/admin"
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Dashboard
              </a>
              <a
                href="/admin/users"
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Users
              </a>
              <a
                href="/admin/settings"
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                System Settings
              </a>
              <a
                href="/admin/moderation"
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Document Moderation
              </a>
              <a
                href="/admin/audit-logs"
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Audit Logs
              </a>
            </nav>
          </aside>
          <main className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto max-w-7xl w-full">{children}</div>
          </main>
        </div>
      </div>
      <RefineKbar />
    </Refine>
  );
};
