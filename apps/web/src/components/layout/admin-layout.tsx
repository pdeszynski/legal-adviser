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
import { useGetIdentity, useLogout } from '@refinedev/core';
import { LocaleSwitcher } from '@components/locale-switcher';
import { Button } from '@legal/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@legal/ui';
import { ChevronRight, ShieldAlert, Key, History, Settings, FileText } from 'lucide-react';
import type { SupportedLocale } from '@i18n/config';
import { ADMIN_MENU_ITEMS } from '@config/menu.config';
import { useUserRole, type UserRole } from '@hooks/use-user-role';

interface UserIdentity {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  /** Compatibility field added by auth provider (first element of user_roles) */
  role?: string;
  /** Primary source of roles from backend GraphQL API (AuthUser.user_roles) */
  user_roles?: string[];
  [key: string]: unknown;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();
  const { data: identity } = useGetIdentity<UserIdentity>();
  const { mutate: logout } = useLogout();

  const handleChangeLocale = async (newLocale: string) => {
    await setUserLocale(newLocale);
    router.refresh();
  };

  const i18nProvider: I18nProvider = {
    translate: (key: string, options?: Record<string, string>) => t(key, options),
    getLocale: () => locale,
    changeLocale: handleChangeLocale,
  };

  const { roles } = useUserRole();

  const displayName =
    identity?.name ||
    (identity?.firstName && identity?.lastName
      ? `${identity.firstName} ${identity.lastName}`
      : identity?.email);

  return (
    <Refine
      routerProvider={routerProvider}
      dataProvider={dataProvider}
      authProvider={authProviderClient}
      i18nProvider={i18nProvider}
      resources={[
        {
          name: 'users',
          list: '/admin/users',
          create: '/admin/users/create',
          show: '/admin/users/:id',
          meta: {
            label: 'Users',
            canDelete: true,
            icon: <span aria-label="users">👥</span>,
          },
        },
        {
          name: 'documents',
          list: '/admin/documents',
          meta: {
            label: 'Documents',
            canDelete: true,
            icon: <span aria-label="documents">📄</span>,
          },
        },
        {
          name: 'auditLog',
          identifier: 'audit_logs',
          list: '/admin/audit-logs',
          meta: {
            label: 'Audit Logs',
            canDelete: false,
            icon: <span aria-label="audit-logs">📋</span>,
          },
        },
        {
          name: 'apiKey',
          identifier: 'api_keys',
          list: '/admin/api-keys',
          create: '/admin/api-keys/create',
          meta: {
            label: 'API Keys',
            canDelete: true,
            icon: <span aria-label="api-keys">🔑</span>,
          },
        },
        {
          name: 'systemSettings',
          identifier: 'settings',
          list: '/admin/settings',
          meta: {
            label: 'System Settings',
            canDelete: false,
            icon: <span aria-label="settings">⚙️</span>,
          },
        },
      ]}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
        projectId: 'GCrk8D-oPupRw-ZMrDtj',
      }}
    >
      <div className="flex h-screen w-full flex-col bg-background">
        {/* Admin Header */}
        <header className="border-b bg-card px-6 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-bold">Admin Panel</h1>
              </div>
              <div className="h-6 w-px bg-border" />
              {displayName && (
                <span className="text-sm text-muted-foreground">
                  {displayName} ({identity?.role || identity?.user_roles?.[0] || 'user'})
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <LocaleSwitcher initialLocale={locale as SupportedLocale} />
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to App
              </Link>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Admin Layout with Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-64 border-r bg-muted/30 hidden md:block p-4">
            <nav className="space-y-1">
              {ADMIN_MENU_ITEMS.filter((item) => {
                // Filter menu items based on user's roles
                if (item.allowedRoles) {
                  return (
                    roles.length > 0 &&
                    item.allowedRoles.some((allowedRole) => roles.includes(allowedRole))
                  );
                }
                return true;
              }).map((item) => {
                const isActive =
                  pathname === item.route ||
                  (item.route !== '/admin' && pathname.startsWith(item.route));
                return (
                  <Link
                    key={item.key}
                    href={item.route}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            <div className="mx-auto max-w-7xl w-full">{children}</div>
          </main>
        </div>
      </div>
      <RefineKbar />
    </Refine>
  );
};
