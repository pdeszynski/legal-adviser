import { RoleAggregate } from '../aggregates/role.aggregate';
import { RoleId } from '../value-objects';

/**
 * Role Repository Interface
 * Defines the contract for role persistence following DDD principles
 */
export interface IRoleRepository {
  /**
   * Find a role by its ID
   */
  findById(id: string | RoleId): Promise<RoleAggregate | null>;

  /**
   * Find a role by its name
   */
  findByName(name: string): Promise<RoleAggregate | null>;

  /**
   * Find all roles
   */
  findAll(): Promise<RoleAggregate[]>;

  /**
   * Find all custom roles (non-system roles)
   */
  findCustomRoles(): Promise<RoleAggregate[]>;

  /**
   * Find all system roles
   */
  findSystemRoles(): Promise<RoleAggregate[]>;

  /**
   * Find roles by type
   */
  findByType(type: string): Promise<RoleAggregate[]>;

  /**
   * Check if a role name already exists
   */
  existsByName(name: string): Promise<boolean>;

  /**
   * Save a role
   */
  save(role: RoleAggregate): Promise<void>;

  /**
   * Delete a role
   */
  delete(role: RoleAggregate): Promise<void>;

  /**
   * Get all predefined system roles
   */
  getSystemRoles(): Promise<RoleAggregate[]>;

  /**
   * Initialize system roles in the database
   */
  initializeSystemRoles(): Promise<void>;
}
