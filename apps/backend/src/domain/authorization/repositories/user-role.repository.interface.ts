/**
 * User Role Assignment DTO
 *
 * Data transfer object for user-role assignments.
 */
export interface UserRoleAssignment {
  userId: string;
  roleId: string;
  priority?: number;
  notes?: string | null;
  expiresAt?: Date | null;
  assignedBy?: string | null;
}

/**
 * User Role DTO
 *
 * Data transfer object for user role with role details.
 */
export interface UserRoleDTO {
  id: string;
  userId: string;
  roleId: string;
  priority: number;
  notes: string | null;
  isActive: boolean;
  expiresAt: Date | null;
  assignedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Nested role details
  roleName: string;
  roleType: string;
  roleDescription: string | null;
  rolePermissions: string[];
}

/**
 * User Role Repository Interface
 *
 * Defines the contract for user-role persistence following DDD principles.
 * This is a join table repository, not an aggregate root repository.
 */
export interface IUserRoleRepository {
  /**
   * Find all role assignments for a user
   */
  findByUserId(userId: string): Promise<UserRoleDTO[]>;

  /**
   * Find all users assigned to a specific role
   */
  findByRoleId(roleId: string): Promise<UserRoleDTO[]>;

  /**
   * Find a specific user-role assignment
   */
  findById(id: string): Promise<UserRoleDTO | null>;

  /**
   * Find a specific user-role assignment by user and role
   */
  findByUserAndRole(
    userId: string,
    roleId: string,
  ): Promise<UserRoleDTO | null>;

  /**
   * Check if a user has a specific role
   */
  userHasRole(userId: string, roleId: string): Promise<boolean>;

  /**
   * Assign a role to a user
   */
  assignRole(assignment: UserRoleAssignment): Promise<UserRoleDTO>;

  /**
   * Remove a role from a user
   */
  removeRole(userId: string, roleId: string): Promise<void>;

  /**
   * Remove a role assignment by ID
   */
  removeAssignment(id: string): Promise<void>;

  /**
   * Update role assignment (priority, expiration, etc.)
   */
  updateAssignment(
    id: string,
    updates: Partial<
      Pick<UserRoleAssignment, 'priority' | 'notes' | 'expiresAt'>
    >,
  ): Promise<UserRoleDTO>;

  /**
   * Deactivate a role assignment (soft delete)
   */
  deactivateAssignment(userId: string, roleId: string): Promise<void>;

  /**
   * Activate a role assignment
   */
  activateAssignment(userId: string, roleId: string): Promise<void>;

  /**
   * Get all active role assignments for a user
   */
  findActiveByUserId(userId: string): Promise<UserRoleDTO[]>;

  /**
   * Get all active role assignments for a user, ordered by priority
   */
  findActiveByUserIdOrdered(userId: string): Promise<UserRoleDTO[]>;

  /**
   * Clean up expired role assignments
   */
  cleanupExpiredAssignments(): Promise<number>;

  /**
   * Count role assignments for a user
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * Count users with a specific role
   */
  countByRoleId(roleId: string): Promise<number>;
}
