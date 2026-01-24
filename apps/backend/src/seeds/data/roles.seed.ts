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
      'users.create',
      'users.read',
      'users.update',
      'users.delete',
      // Role management
      'roles.create',
      'roles.read',
      'roles.update',
      'roles.delete',
      'roles.assign',
      // Document management
      'documents.create',
      'documents.read',
      'documents.update',
      'documents.delete',
      // Analysis management
      'analyses.create',
      'analyses.read',
      'analyses.update',
      'analyses.delete',
      // Query management
      'queries.create',
      'queries.read',
      'queries.update',
      'queries.delete',
      // Audit logs
      'audit_logs.read',
      // System settings
      'settings.read',
      'settings.update',
      // Billing
      'billing.read',
      'billing.update',
      // Admin panel access
      'admin.access',
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
      'users.create',
      'users.read',
      'users.update',
      // Document management
      'documents.create',
      'documents.read',
      'documents.update',
      'documents.delete',
      // Analysis management
      'analyses.create',
      'analyses.read',
      'analyses.update',
      'analyses.delete',
      // Query management
      'queries.create',
      'queries.read',
      'queries.update',
      'queries.delete',
      // Audit logs
      'audit_logs.read',
      // Admin panel access
      'admin.access',
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
      'documents.create',
      'documents.read',
      'documents.update',
      'documents.delete',
      // Analysis management
      'analyses.create',
      'analyses.read',
      'analyses.update',
      'analyses.delete',
      // Query management
      'queries.create',
      'queries.read',
      'queries.update',
      'queries.delete',
      // Limited settings
      'settings.read',
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
      // Document management (read-only for others' documents)
      'documents.create',
      'documents.read',
      'documents.update',
      // Analysis management
      'analyses.create',
      'analyses.read',
      'analyses.update',
      // Query management
      'queries.create',
      'queries.read',
      // Limited settings
      'settings.read',
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
      'documents.create',
      'documents.read',
      // Own analysis management
      'analyses.create',
      'analyses.read',
      // Own query management
      'queries.create',
      'queries.read',
      // Limited settings
      'settings.read',
      'settings.update',
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
      // Read-only access
      'documents.read',
      'analyses.read',
      'queries.read',
    ],
    inheritsFrom: 'client',
    isSystemRole: true,
  },
];
