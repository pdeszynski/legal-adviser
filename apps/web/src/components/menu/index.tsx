'use client';

import { useMenu } from '@refinedev/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@legal/ui';
import { useIsAdmin } from '@hooks/use-is-admin';

export const Menu = () => {
  const { menuItems, selectedKey } = useMenu();
  const pathname = usePathname();
  const isAdmin = useIsAdmin();

  return (
    <nav className="flex flex-col space-y-1 p-2">
      {menuItems.map((item) => {
        const isSelected = selectedKey === item.key || pathname === item.route;
        return (
          <Link
            key={item.key}
            href={item.route ?? '/'}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground',
              isSelected ? 'bg-muted text-foreground font-semibold' : 'text-muted-foreground',
            )}
          >
            {item.icon}
            <span>{item.label ?? item.name}</span>
          </Link>
        );
      })}

      {/* Admin link - only shown to admin users */}
      {isAdmin && (
        <Link
          href="/admin"
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-red-100 hover:text-red-900',
            pathname === '/admin' || pathname.startsWith('/admin/')
              ? 'bg-red-100 text-red-900 font-semibold'
              : 'text-red-700',
          )}
        >
          <span aria-label="admin">⚙️</span>
          <span>Admin Panel</span>
        </Link>
      )}
    </nav>
  );
};
