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
  Scale,
  Search,
  Gavel,
  Phone,
  Clock,
  Network,
  Zap,
  Key,
  Layers,
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
  /** Whether this is a legal professional-only item (lawyer, paralegal, admin, super_admin) */
  isLegal?: boolean;
  /** Whether this is an account settings item (Settings, Billing, Usage, Notifications, API Keys) */
  isAccount?: boolean;
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
  admin_api_keys: <Key className="h-4 w-4" />,
  admin_documents: <FileText className="h-4 w-4" />,
  admin_templates: <FileStack className="h-4 w-4" />,
  admin_moderation: <ShieldAlert className="h-4 w-4" />,
  admin_audit_logs: <History className="h-4 w-4" />,
  admin_settings: <Settings className="h-4 w-4" />,
  admin_system_health: <Activity className="h-4 w-4" />,
  admin_token_analytics: <Coins className="h-4 w-4" />,
  admin_demo_requests: <Phone className="h-4 w-4" />,
  admin_schedules: <Clock className="h-4 w-4" />,
  admin_ai_traces: <Network className="h-4 w-4" />,
  admin_document_queue: <Layers className="h-4 w-4" />,
  case_analysis: <Gavel className="h-4 w-4" />,
  case_law_search: <Scale className="h-4 w-4" />,
  advanced_search: <Search className="h-4 w-4" />,
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
    isLegal: true,
  },
  documents: {
    key: 'documents',
    label: 'Documents',
    route: '/documents',
    iconKey: 'documents',
    minRole: 'guest',
    isLegal: true,
  },
  case_analysis: {
    key: 'case_analysis',
    label: 'Case Analysis',
    route: '/case-analysis',
    iconKey: 'case_analysis',
    minRole: 'paralegal',
    isLegal: true,
  },
  case_law_search: {
    key: 'case_law_search',
    label: 'Case Law Search',
    route: '/case-law',
    iconKey: 'case_law_search',
    minRole: 'paralegal',
    isLegal: true,
  },
  advanced_search: {
    key: 'advanced_search',
    label: 'Advanced Search',
    route: '/advanced-search',
    iconKey: 'advanced_search',
    minRole: 'paralegal',
    isLegal: true,
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
    isAccount: true,
  },
  settings: {
    key: 'settings',
    label: 'Settings',
    route: '/settings',
    iconKey: 'settings',
    minRole: 'guest',
    isAccount: true,
  },
  billing: {
    key: 'billing',
    label: 'Billing',
    route: '/billing',
    iconKey: 'billing',
    minRole: 'client',
    isAccount: true,
  },
  usage: {
    key: 'usage',
    label: 'Usage',
    route: '/usage',
    iconKey: 'usage',
    minRole: 'client',
    isAccount: true,
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
 * Ordered by user workflow priority from most to least frequent:
 * 1) Dashboard (landing page after login)
 * 2) Legal Q&A Chat (most frequent daily use)
 * 3) Documents (high frequency)
 * 4) Case Analysis (regular use)
 * 5) Case Law Search (regular use)
 * 6) Advanced Search (regular use)
 * 7) Templates
 * 8) Admin/Analytics (lower frequency)
 * 9) Account Settings (infrequent access - Settings, Billing, Usage, Notifications)
 */
export const MENU_ORDER: (keyof typeof MENU_CONFIG)[] = [
  // Primary workflow - daily tasks
  'dashboard',
  'chat',
  'documents',
  // Legal research tools
  'case_analysis',
  'case_law_search',
  'advanced_search',
  // Secondary tools
  'templates',
  // Admin (lower frequency)
  'admin_panel',
  'audit_logs',
  // Account Settings (infrequent access - grouped at bottom)
  'notifications',
  'settings',
  'billing',
  'usage',
];

/**
 * Get icon for a menu item
 */
export const getMenuIcon = (iconKey?: string): MenuItemIcon | undefined => {
  return iconKey ? MENU_ICONS[iconKey] : undefined;
};

/**
 * Get menu items filtered by user roles
 * @param userRoles - The user's roles array from the backend (typically contains one role)
 * @returns Filtered menu items ordered by MENU_ORDER
 */
export const getMenuItemsForRoles = (userRoles: UserRole[] | null): MenuItem[] => {
  if (!userRoles || userRoles.length === 0) {
    // Unauthenticated users see minimal menu
    return [];
  }

  // Get the primary role (first in array) for level-based comparisons
  // The backend typically returns a single role in the array
  const primaryRole = userRoles[0];

  // Get the role level for comparison
  const getRoleLevel = (role: UserRole): number => {
    const levels: Record<UserRole, number> = {
      guest: 0,
      client: 1,
      paralegal: 2,
      lawyer: 3,
      admin: 4,
      super_admin: 5,
    };
    return levels[role] ?? 0;
  };

  return MENU_ORDER.filter((menuKey) => {
    const item = MENU_CONFIG[menuKey];

    // Check if item has specific allowed roles
    // User needs at least one of the allowed roles
    if (item.allowedRoles) {
      return item.allowedRoles.some((allowedRole) => userRoles.includes(allowedRole));
    }

    // Check if user meets minimum role requirement (using primary role)
    if (item.minRole) {
      return getRoleLevel(primaryRole) >= getRoleLevel(item.minRole);
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
    key: 'admin_documents',
    label: 'Documents',
    route: '/admin/documents',
    icon: MENU_ICONS.admin_documents,
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
    key: 'admin_api_keys',
    label: 'API Keys',
    route: '/admin/api-keys',
    icon: MENU_ICONS.admin_api_keys,
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
  {
    key: 'admin_demo_requests',
    label: 'Demo Requests',
    route: '/admin/demo-requests',
    icon: MENU_ICONS.admin_demo_requests,
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'admin_schedules',
    label: 'Schedules',
    route: '/admin/schedules',
    icon: MENU_ICONS.admin_schedules,
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'admin_ai_traces',
    label: 'AI Traces',
    route: '/admin/ai/traces',
    icon: MENU_ICONS.admin_ai_traces,
    allowedRoles: ['admin', 'super_admin'],
  },
  {
    key: 'admin_document_queue',
    label: 'Document Queue',
    route: '/admin/document-queue',
    icon: MENU_ICONS.admin_document_queue,
    allowedRoles: ['admin', 'super_admin'],
  },
];
