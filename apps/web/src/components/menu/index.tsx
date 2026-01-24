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
 * - Admin users see: Full menu including Audit Logs, Admin Panel
 * - Regular users see: Simplified menu (Documents, Chat, Settings)
 * - Legal professionals see: Additional items (Templates, Dashboard)
 *
 * Menu items are defined in @config/menu.config.ts
 */
export const Menu = () => {
  const { selectedKey } = useMenu();
  const pathname = usePathname();
  const { roles, isAdmin } = useUserRole();

  // Get menu items filtered by user role
  const roleBasedMenuItems = getMenuItemsForRoles(roles);

  return (
    <div className="flex h-full flex-col justify-between p-2">
      <nav className="flex flex-col space-y-1">
        {roleBasedMenuItems.map((item) => {
          const isSelected = selectedKey === item.key || pathname === item.route;
          const isRouteActive = pathname.startsWith(item.route);

          return (
            <Link
              key={item.key}
              href={item.route}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                // Admin items get special styling
                item.isAdmin
                  ? pathname === item.route || isRouteActive
                    ? 'bg-red-50 text-red-600 dark:bg-red-950/20'
                    : 'text-red-600/70 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20'
                  : isSelected || isRouteActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}

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
