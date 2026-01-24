import { type UserRole } from '@hooks/use-user-role';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  FileStack,
  ShieldAlert,
  History,
  CreditCard,
  TrendingUp,
  Bell,
  UserCog,
  Activity,
  Coins,
} from 'lucide-react';

/**
 * Icon type for menu items - use ReactNode to support both components and rendered elements
 */
export type MenuItemIcon = React.ReactNode;

/**
 * Menu item definition
 */
export interface MenuItem {
  /** Unique key for the menu item */
  key: string;
  /** Display label (can be a translation key) */
  label: string;
  /** Route path */
  route: string;
  /** Icon component or element */
  icon?: MenuItemIcon;
  /** Minimum role required to see this item */
  minRole?: UserRole;
  /** Roles that can see this item (if set, minRole is ignored) */
  allowedRoles?: UserRole[];
  /** Whether this is an admin-only item */
  isAdmin?: boolean;
}

/**
 * Icon components for menu items (stored separately to avoid JSX in const definitions)
 */
const MENU_ICONS: Record<string, MenuItemIcon> = {
  chat: <MessageSquare className="h-4 w-4" />,
  documents: <FileText className="h-4 w-4" />,
  templates: <FileStack className="h-4 w-4" />,
  dashboard: <LayoutDashboard className="h-4 w-4" />,
  notifications: <Bell className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  billing: <CreditCard className="h-4 w-4" />,
  usage: <TrendingUp className="h-4 w-4" />,
  audit_logs: <History className="h-4 w-4" />,
  admin_panel: <ShieldAlert className="h-4 w-4" />,
  admin_dashboard: <LayoutDashboard className="h-4 w-4" />,
  admin_users: <UserCog className="h-4 w-4" />,
  admin_templates: <FileStack className="h-4 w-4" />,
  admin_moderation: <ShieldAlert className="h-4 w-4" />,
  admin_audit_logs: <History className="h-4 w-4" />,
  admin_settings: <Settings className="h-4 w-4" />,
  admin_system_health: <Activity className="h-4 w-4" />,
  admin_token_analytics: <Coins className="h-4 w-4" />,
};

/**
 * Menu configuration registry
 * Maps menu items to roles and defines visibility rules
 */
export const MENU_CONFIG: Record<string, Omit<MenuItem, 'icon'> & { iconKey?: string }> = {
  chat: {
    key: 'chat',
    label: 'Legal Q&A Chat',
    route: '/chat',
    iconKey: 'chat',
    minRole: 'guest',
  },
  documents: {
    key: 'documents',
    label: 'Documents',
    route: '/documents',
    iconKey: 'documents',
    minRole: 'guest',
  },
  templates: {
    key: 'templates',
    label: 'Templates',
    route: '/templates',
    iconKey: 'templates',
    minRole: 'client',
  },
  dashboard: {
    key: 'dashboard',
    label: 'Dashboard',
    route: '/dashboard',
    iconKey: 'dashboard',
    minRole: 'client',
  },
  notifications: {
    key: 'notifications',
    label: 'Notifications',
    route: '/notifications',
    iconKey: 'notifications',
    minRole: 'client',
  },
  settings: {
    key: 'settings',
    label: 'Settings',
    route: '/settings',
    iconKey: 'settings',
    minRole: 'guest',
  },
  billing: {
    key: 'billing',
    label: 'Billing',
    route: '/billing',
    iconKey: 'billing',
    minRole: 'client',
  },
  usage: {
    key: 'usage',
    label: 'Usage',
    route: '/usage',
    iconKey: 'usage',
    minRole: 'client',
  },
  audit_logs: {
    key: 'audit_logs',
    label: 'Audit Logs',
    route: '/audit-logs',
    iconKey: 'audit_logs',
    allowedRoles: ['admin', 'super_admin'],
    isAdmin: true,
  },
  admin_panel: {
    key: 'admin_panel',
    label: 'Admin Panel',
    route: '/admin',
    iconKey: 'admin_panel',
    allowedRoles: ['admin', 'super_admin'],
    isAdmin: true,
  },
};

/**
 * Default menu item order for display
 */
export const MENU_ORDER: (keyof typeof MENU_CONFIG)[] = [
  'chat',
  'documents',
  'templates',
  'dashboard',
  'notifications',
  'settings',
  'billing',
  'usage',
  'audit_logs',
  'admin_panel',
];

/**
 * Get icon for a menu item
 */
export const getMenuIcon = (iconKey?: string): MenuItemIcon | undefined => {
  return iconKey ? MENU_ICONS[iconKey] : undefined;
};

/**
 * Get menu items filtered by user role
 * @param userRoles - The user's roles
 * @returns Filtered menu items ordered by MENU_ORDER
 */
export const getMenuItemsForRoles = (userRoles: UserRole[]): MenuItem[] => {
  if (userRoles.length === 0) {
    // Unauthenticated users see minimal menu
    return [];
  }

  // Get the highest role for comparison
  const getRoleLevel = (role: UserRole): number => {
    const levels: Record<UserRole, number> = {
      guest: 0,
      client: 1,
      paralegal: 2,
      lawyer: 3,
      admin: 4,
      super_admin: 5,
      user: 1,
    };
    return levels[role] ?? 0;
  };

  const highestRole = userRoles.reduce((highest, current) =>
    getRoleLevel(current) > getRoleLevel(highest) ? current : highest,
  );

  return MENU_ORDER.filter((menuKey) => {
    const item = MENU_CONFIG[menuKey];

    // Check if item has specific allowed roles
    if (item.allowedRoles) {
      return item.allowedRoles.some((allowed) => userRoles.includes(allowed));
    }

    // Check if user meets minimum role requirement
    if (item.minRole) {
      return getRoleLevel(highestRole) >= getRoleLevel(item.minRole);
    }

    return true;
  }).map((key) => {
    const config = MENU_CONFIG[key];
    return {
      ...config,
      icon: getMenuIcon(config.iconKey),
    } as MenuItem;
  });
};

/**
 * Get admin menu items for the admin layout
 * These are separate from the main app menu
 */
export const ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    key: 'admin_dashboard',
    label: 'Dashboard',
    route: '/admin',
    icon: MENU_ICONS.admin_dashboard,
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'admin_users',
    label: 'Users',
    route: '/admin/users',
    icon: MENU_ICONS.admin_users,
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'admin_templates',
    label: 'Templates',
    route: '/admin/templates',
    icon: MENU_ICONS.admin_templates,
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'admin_moderation',
    label: 'Moderation',
    route: '/admin/moderation',
    icon: MENU_ICONS.admin_moderation,
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'admin_audit_logs',
    label: 'Audit Logs',
    route: '/admin/audit-logs',
    icon: MENU_ICONS.admin_audit_logs,
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'admin_settings',
    label: 'Settings',
    route: '/admin/settings',
    icon: MENU_ICONS.admin_settings,
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'admin_system_health',
    label: 'System Health',
    route: '/admin/system-health',
    icon: MENU_ICONS.admin_system_health,
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'admin_token_analytics',
    label: 'Token Analytics',
    route: '/admin/analytics/tokens',
    icon: MENU_ICONS.admin_token_analytics,
    allowedRoles: ['admin', 'super_admin'],
  },
];
