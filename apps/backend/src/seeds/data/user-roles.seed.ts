/**
 * User-Role relationship seed data
 * Maps users to their assigned roles
 */
export interface UserRoleSeedData {
  userEmail: string;
  roleType:
    | 'super_admin'
    | 'admin'
    | 'lawyer'
    | 'paralegal'
    | 'client'
    | 'guest';
  priority?: number;
  notes?: string | null;
  expiresAt?: Date | null;
}

export const userRolesSeedData: UserRoleSeedData[] = [
  // Admin user gets super_admin role
  {
    userEmail: 'admin@refine.dev',
    roleType: 'super_admin',
    priority: 1,
    notes: 'Primary system administrator',
    expiresAt: null,
  },
  // Lawyer user gets lawyer role
  {
    userEmail: 'lawyer@example.com',
    roleType: 'lawyer',
    priority: 100,
    notes: 'Legal professional account',
    expiresAt: null,
  },
  // Regular user gets client role
  {
    userEmail: 'user@example.com',
    roleType: 'client',
    priority: 100,
    notes: 'Regular client account',
    expiresAt: null,
  },
  // Inactive user - no role assigned (will not be able to access)
  // {
  //   userEmail: 'inactive@example.com',
  //   roleType: 'guest',
  //   priority: 100,
  //   notes: 'Inactive user - guest access only',
  //   expiresAt: null,
  // },
  // Minimal user gets client role
  {
    userEmail: 'minimal@example.com',
    roleType: 'client',
    priority: 100,
    notes: 'Minimal client account',
    expiresAt: null,
  },
];
