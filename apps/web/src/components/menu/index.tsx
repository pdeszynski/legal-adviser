'use client';

import { useMenu } from '@refinedev/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@legal/ui';
import { useIsAdmin } from '@hooks/use-is-admin';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  FileStack,
  ShieldAlert,
  History,
  Scale,
} from 'lucide-react';
import { ThemeToggle } from '../theme-toggle';

// Map resource/route names to icons
const getIcon = (key: string, name: string) => {
  const lowerKey = (key || name || '').toLowerCase();

  if (lowerKey.includes('dashboard')) return <LayoutDashboard className="h-4 w-4" />;
  if (lowerKey.includes('document')) return <FileText className="h-4 w-4" />;
  if (lowerKey.includes('chat') || lowerKey.includes('qa'))
    return <MessageSquare className="h-4 w-4" />;
  if (lowerKey.includes('template')) return <FileStack className="h-4 w-4" />;
  if (lowerKey.includes('audit')) return <History className="h-4 w-4" />;
  if (lowerKey.includes('admin')) return <ShieldAlert className="h-4 w-4" />;
  if (lowerKey.includes('settings')) return <Settings className="h-4 w-4" />;

  return <Scale className="h-4 w-4" />; // Default legal scale icon
};

export const Menu = () => {
  const { menuItems, selectedKey } = useMenu();
  const pathname = usePathname();
  const isAdmin = useIsAdmin();

  return (
    <div className="flex h-full flex-col justify-between p-2">
      <nav className="flex flex-col space-y-1">
        {menuItems.map((item) => {
          const isSelected = selectedKey === item.key || pathname === item.route;
          return (
            <Link
              key={item.key}
              href={item.route ?? '/'}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isSelected
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {item.icon ?? getIcon(item.key, item.name)}
              <span>{item.label ?? item.name}</span>
            </Link>
          );
        })}

        {/* Admin link - only shown to admin users */}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === '/admin' || pathname.startsWith('/admin/')
                ? 'bg-red-50 text-red-600 dark:bg-red-950/20'
                : 'text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20',
            )}
          >
            <ShieldAlert className="h-4 w-4" />
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
