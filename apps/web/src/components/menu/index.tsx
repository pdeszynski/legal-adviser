'use client';

import { useMenu } from '@refinedev/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@legal/ui';
import { useUserRole } from '@hooks/use-user-role';
import { getMenuItemsForRoles, getMenuIcon } from '@config/menu.config';
import { ThemeToggle } from '../theme-toggle';

/**
 * Dynamic menu component that renders different navigation options
 * based on the user's role.
 *
 * - Admin users see: Full menu including Admin Panel, Audit Logs at the top
 * - Legal professionals (paralegal, lawyer, admin): Legal Work section with dedicated tools
 * - Regular users see: Simplified menu (Documents, Chat, Settings)
 *
 * Menu items are defined in @config/menu.config.ts
 */
export const Menu = () => {
  const { selectedKey } = useMenu();
  const pathname = usePathname();
  const { roles, isAdmin, isLegalProfessional } = useUserRole();

  // Get menu items filtered by user role
  const roleBasedMenuItems = getMenuItemsForRoles(roles);

  // Separate admin, legal, regular, and account items for sectioning
  const adminItems = roleBasedMenuItems.filter((item) => item.isAdmin);
  const legalItems = roleBasedMenuItems.filter((item) => item.isLegal);
  const regularItems = roleBasedMenuItems.filter(
    (item) => !item.isAdmin && !item.isLegal && !item.isAccount,
  );
  const accountItems = roleBasedMenuItems.filter((item) => item.isAccount);

  return (
    <div className="flex h-full flex-col justify-between p-2">
      <nav className="flex flex-col space-y-1">
        {/* Administration Section */}
        {adminItems.length > 0 && (
          <>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Administration
            </div>
            {adminItems.map((item) => {
              const isRouteActive = pathname.startsWith(item.route);

              return (
                <Link
                  key={item.key}
                  href={item.route}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    // Admin items get special red styling
                    pathname === item.route || isRouteActive
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                      : 'text-red-600/80 hover:bg-red-50 hover:text-red-700 dark:text-red-400/80 dark:hover:bg-red-950/20',
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Separator between admin and next section */}
            {(legalItems.length > 0 || regularItems.length > 0) && (
              <div className="my-2 border-t border-border" />
            )}
          </>
        )}

        {/* Legal Work Section - for legal professionals */}
        {isLegalProfessional && legalItems.length > 0 && (
          <>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Legal Work
            </div>
            {legalItems.map((item) => {
              const isRouteActive = pathname.startsWith(item.route);

              return (
                <Link
                  key={item.key}
                  href={item.route}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    // Legal items get blue/indigo styling to distinguish from admin
                    pathname === item.route || isRouteActive
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400'
                      : 'text-indigo-600/80 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400/80 dark:hover:bg-indigo-950/20',
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Separator between legal and next section */}
            {(regularItems.length > 0 || accountItems.length > 0) && (
              <div className="my-2 border-t border-border" />
            )}
          </>
        )}

        {/* Regular Menu Items */}
        {regularItems.map((item) => {
          const isSelected = selectedKey === item.key || pathname === item.route;
          const isRouteActive = pathname.startsWith(item.route);

          return (
            <Link
              key={item.key}
              href={item.route}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isSelected || isRouteActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Account Settings Section */}
        {accountItems.length > 0 && (
          <>
            {/* Separator before account section */}
            <div className="my-2 border-t border-border" />
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Account
            </div>
            {accountItems.map((item) => {
              const isSelected = selectedKey === item.key || pathname === item.route;
              const isRouteActive = pathname.startsWith(item.route);

              return (
                <Link
                  key={item.key}
                  href={item.route}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isSelected || isRouteActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}

        {/* Show admin link at bottom if user is admin (fallback for Refine-based routes) */}
        {isAdmin && !roleBasedMenuItems.some((item) => item.key === 'admin_panel') && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === '/admin' || pathname.startsWith('/admin/')
                ? 'bg-red-50 text-red-600 dark:bg-red-950/20'
                : 'text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20',
            )}
          >
            {getMenuIcon('admin_panel')}
            <span>Admin Panel</span>
          </Link>
        )}
      </nav>

      <div className="pt-4 border-t border-border mt-auto">
        <ThemeToggle />
      </div>
    </div>
  );
};
