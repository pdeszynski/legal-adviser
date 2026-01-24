import { RoleAggregate } from '../aggregates/role.aggregate';
import {
  Permission,
  PermissionTypeEnum,
  ResourceTypeEnum,
} from '../value-objects';

/**
 * Role Hierarchy Service
 *
 * Implements role hierarchy and permission inheritance logic.
 * This domain service handles cross-aggregate operations related to role hierarchy.
 */
export class RoleHierarchyService {
  /**
   * Get all permissions for a role including inherited permissions
   *
   * @param role The role to get permissions for
   * @param allRoles All available roles (to resolve inheritance)
   * @returns All permissions the role has (direct + inherited)
   */
  getAllPermissions(
    role: RoleAggregate,
    allRoles: RoleAggregate[],
  ): Permission[] {
    const permissions = new Set<string>();
    const permissionObjects: Permission[] = [];

    // Add direct permissions
    for (const permission of role.permissions) {
      const key = permission.toString();
      if (!permissions.has(key)) {
        permissions.add(key);
        permissionObjects.push(permission);
      }
    }

    // Add inherited permissions if the role inherits from another
    if (role.inheritsFrom) {
      const parentRole = allRoles.find(
        (r) => r.type.toValue() === role.inheritsFrom?.toValue(),
      );

      if (parentRole) {
        const parentPermissions = this.getAllPermissions(parentRole, allRoles);
        for (const permission of parentPermissions) {
          const key = permission.toString();
          if (!permissions.has(key)) {
            permissions.add(key);
            permissionObjects.push(permission);
          }
        }
      }
    }

    return permissionObjects;
  }

  /**
   * Check if a role can perform an action on a resource
   * Takes into account both direct permissions and inherited permissions
   *
   * @param role The role to check
   * @param permissionType The permission type
   * @param resourceType The resource type
   * @param allRoles All available roles (to resolve inheritance)
   * @returns true if the role can perform the action
   */
  canPerformAction(
    role: RoleAggregate,
    permissionType: PermissionTypeEnum,
    resourceType: ResourceTypeEnum,
    allRoles: RoleAggregate[],
  ): boolean {
    // Check direct permissions first
    if (role.can(permissionType, resourceType)) {
      return true;
    }

    // Check inherited permissions
    if (role.inheritsFrom) {
      const parentRole = allRoles.find(
        (r) => r.type.toValue() === role.inheritsFrom?.toValue(),
      );

      if (parentRole) {
        return this.canPerformAction(
          parentRole,
          permissionType,
          resourceType,
          allRoles,
        );
      }
    }

    return false;
  }

  /**
   * Get the hierarchy level of a role
   * Higher number = higher privilege
   */
  getHierarchyLevel(role: RoleAggregate): number {
    return role.type.getLevel();
  }

  /**
   * Check if one role is higher than another in the hierarchy
   */
  isHigherThan(firstRole: RoleAggregate, secondRole: RoleAggregate): boolean {
    return firstRole.type.higherThan(secondRole.type);
  }

  /**
   * Check if a role can manage another role
   * A role can manage another role if it is higher in the hierarchy
   */
  canManageRole(
    managerRole: RoleAggregate,
    targetRole: RoleAggregate,
  ): boolean {
    return this.isHigherThan(managerRole, targetRole);
  }

  /**
   * Get all roles that a given role can manage
   */
  getManageableRoles(
    role: RoleAggregate,
    allRoles: RoleAggregate[],
  ): RoleAggregate[] {
    return allRoles.filter((r) => this.canManageRole(role, r));
  }

  /**
   * Validate that inheritance is valid
   * A role can only inherit from a higher role
   */
  validateInheritance(
    childRole: RoleAggregate,
    parentRole: RoleAggregate,
  ): boolean {
    if (childRole.id === parentRole.id) {
      return false; // Cannot inherit from self
    }

    return parentRole.type.higherThan(childRole.type);
  }

  /**
   * Check for circular inheritance
   */
  detectCircularInheritance(
    role: RoleAggregate,
    potentialParent: RoleAggregate,
    allRoles: RoleAggregate[],
  ): boolean {
    if (role.id === potentialParent.id) {
      return true; // Direct circular reference
    }

    // Check if potentialParent eventually inherits from role
    let current = potentialParent;
    const visited = new Set<string>();

    while (current.inheritsFrom) {
      if (visited.has(current.id)) {
        return true; // Circular reference detected
      }

      visited.add(current.id);

      const parent = allRoles.find(
        (r) => r.type.toValue() === current.inheritsFrom?.toValue(),
      );

      if (!parent) {
        return false; // No parent found, no circular reference
      }

      if (parent.id === role.id) {
        return true; // Found circular reference
      }

      current = parent;
    }

    return false;
  }

  /**
   * Get the inheritance chain for a role
   * Returns an ordered array from the role itself up to the top-level ancestor
   */
  getInheritanceChain(
    role: RoleAggregate,
    allRoles: RoleAggregate[],
  ): RoleAggregate[] {
    const chain: RoleAggregate[] = [role];
    let current = role;

    while (current.inheritsFrom) {
      const parent = allRoles.find(
        (r) => r.type.toValue() === current.inheritsFrom?.toValue(),
      );

      if (!parent) {
        break;
      }

      chain.push(parent);
      current = parent;
    }

    return chain;
  }

  /**
   * Merge permissions from multiple roles
   * Useful when a user has multiple roles
   */
  mergePermissions(roles: RoleAggregate[]): Permission[] {
    const permissions = new Map<string, Permission>();

    for (const role of roles) {
      for (const permission of role.permissions) {
        const key = permission.toString();
        if (!permissions.has(key)) {
          permissions.set(key, permission);
        }
      }
    }

    return Array.from(permissions.values());
  }

  /**
   * Check if any of the given roles can perform an action
   */
  canAnyRolePerformAction(
    roles: RoleAggregate[],
    permissionType: PermissionTypeEnum,
    resourceType: ResourceTypeEnum,
  ): boolean {
    return roles.some((role) => role.can(permissionType, resourceType));
  }
}
