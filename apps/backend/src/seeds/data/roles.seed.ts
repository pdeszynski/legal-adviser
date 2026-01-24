/**
 * Role seed data for RBAC system
 * Defines all available roles in the system with their permissions
 *
 * Uses deterministic UUIDs for reproducible test data.
 */

/**
 * Generate deterministic UUID v4 for seed data
 * Uses namespace-based approach for consistent IDs
 */
function seedUuid(namespace: string, index: number): string {
  // Standard UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars total)
  // Groups: 8-4-4-4-12 characters (32 hex digits + 4 hyphens)
  // For seed data, we use: 00000000-0000-4000-8000-0000000000XX
  const hexIndex = String(index).padStart(2, '0');
  return `00000000-0000-4000-8000-0000000000${hexIndex}`;
}
export interface RoleSeedData {
  id: string;
  name: string;
  description: string | null;
  type: 'super_admin' | 'admin' | 'lawyer' | 'paralegal' | 'client' | 'guest';
  permissions: string[];
  inheritsFrom:
    | 'super_admin'
    | 'admin'
    | 'lawyer'
    | 'paralegal'
    | 'client'
    | 'guest'
    | null;
  isSystemRole: boolean;
}

export const rolesSeedData: RoleSeedData[] = [
  {
    id: seedUuid('roles', 1),
    name: 'Super Administrator',
    description: 'Full system access with all permissions',
    type: 'super_admin',
    permissions: [
      // User management
      'write:users',
      'read:users',
      'delete:users',
      'manage:users',
      // Role management
      'write:roles',
      'read:roles',
      'delete:roles',
      'manage:roles',
      // Document management
      'write:documents',
      'read:documents',
      'delete:documents',
      'manage:documents',
      // Query management
      'execute:queries',
      'read:queries',
      'write:queries',
      'delete:queries',
      'manage:queries',
      // Rulings
      'read:rulings',
      'write:rulings',
      'delete:rulings',
      'manage:rulings',
      // Audit logs
      'read:audit_logs',
      // System settings
      'read:system_settings',
      'manage:system_settings',
      // Billing
      'read:subscriptions',
      'write:subscriptions',
      'read:payments',
      'write:payments',
      'read:invoices',
      'write:invoices',
      // Notifications
      'read:notifications',
      'manage:notifications',
      // Analytics
      'read:analytics',
      // API keys
      'manage:api_keys',
      // Collaboration
      'read:collaboration',
      'write:collaboration',
      'manage:collaboration',
      // Document templates
      'read:document_templates',
      'write:document_templates',
      'delete:document_templates',
      'manage:document_templates',
      // User sessions
      'manage:user_sessions',
    ],
    inheritsFrom: null,
    isSystemRole: true,
  },
  {
    id: seedUuid('roles', 2),
    name: 'Administrator',
    description: 'Administrative access for platform management',
    type: 'admin',
    permissions: [
      // User management
      'write:users',
      'read:users',
      // Role management
      'read:roles',
      // Document management
      'write:documents',
      'read:documents',
      'delete:documents',
      'manage:documents',
      // Query management
      'read:queries',
      'write:queries',
      'delete:queries',
      'manage:queries',
      // Rulings
      'read:rulings',
      // Document templates
      'read:document_templates',
      'write:document_templates',
      // Audit logs
      'read:audit_logs',
      // Billing
      'read:subscriptions',
      'read:payments',
      // Notifications
      'manage:notifications',
      // Analytics
      'read:analytics',
      // API keys
      'manage:api_keys',
      // Collaboration
      'manage:collaboration',
      // System settings
      'read:system_settings',
    ],
    inheritsFrom: 'super_admin',
    isSystemRole: true,
  },
  {
    id: seedUuid('roles', 3),
    name: 'Lawyer',
    description: 'Legal professional with full document and analysis access',
    type: 'lawyer',
    permissions: [
      // Document management
      'read:documents',
      'write:documents',
      'delete:documents',
      // Document templates
      'read:document_templates',
      'write:document_templates',
      // Query management
      'execute:queries',
      'read:queries',
      // Rulings
      'read:rulings',
      // Notifications
      'read:notifications',
      // Analytics
      'read:analytics',
      // Collaboration
      'read:collaboration',
      'write:collaboration',
    ],
    inheritsFrom: 'admin',
    isSystemRole: true,
  },
  {
    id: seedUuid('roles', 4),
    name: 'Paralegal',
    description: 'Support staff with limited document and analysis access',
    type: 'paralegal',
    permissions: [
      // Document management (read and write only, no delete)
      'read:documents',
      'write:documents',
      // Document templates (read only)
      'read:document_templates',
      // Query management (execute and read own)
      'execute:queries',
      // Rulings (read only)
      'read:rulings',
      // Notifications
      'read:notifications',
      // Collaboration
      'read:collaboration',
      'write:collaboration',
    ],
    inheritsFrom: 'lawyer',
    isSystemRole: true,
  },
  {
    id: seedUuid('roles', 5),
    name: 'Client',
    description: 'Regular user with basic access to own documents and queries',
    type: 'client',
    permissions: [
      // Own document management
      'read:documents',
      'write:documents',
      // Query management
      'execute:queries',
      'read:queries',
      // Notifications
      'read:notifications',
      // Collaboration
      'read:collaboration',
    ],
    inheritsFrom: 'paralegal',
    isSystemRole: true,
  },
  {
    id: seedUuid('roles', 6),
    name: 'Guest',
    description: 'Limited access for demonstration purposes',
    type: 'guest',
    permissions: [
      // Read-only access to public documents
      'read:documents',
    ],
    inheritsFrom: 'client',
    isSystemRole: true,
  },
];
