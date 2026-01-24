import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RoleAggregate } from '../../domain/authorization/aggregates/role.aggregate';
import {
  Permission,
  PermissionTypeEnum,
  ResourceTypeEnum,
  RoleTypeEnum,
} from '../../domain/authorization/value-objects';
import { RoleHierarchyService } from '../../domain/authorization/services/role-hierarchy.service';
import { RoleRepository } from './repositories';

/**
 * Authorization Application Service
 *
 * Application service for the Authorization bounded context.
 * Orchestrates domain operations and handles use cases.
 */
@Injectable()
export class AuthorizationService {
  private cachedSystemRoles: RoleAggregate[] = [];

  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly hierarchyService: RoleHierarchyService,
  ) {}

  /**
   * Initialize system roles on application startup
   */
  async initializeSystemRoles(): Promise<void> {
    await this.roleRepository.initializeSystemRoles();
    await this.refreshCache();
  }

  /**
   * Refresh cached system roles
   */
  private async refreshCache(): Promise<void> {
    this.cachedSystemRoles = await this.roleRepository.getSystemRoles();
  }

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<RoleAggregate[]> {
    const customRoles = await this.roleRepository.findCustomRoles();
    return [...this.cachedSystemRoles, ...customRoles];
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<RoleAggregate> {
    const role = await this.roleRepository.findById(id);

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: string): Promise<RoleAggregate> {
    const role = await this.roleRepository.findByName(name);

    if (!role) {
      throw new NotFoundException(`Role with name ${name} not found`);
    }

    return role;
  }

  /**
   * Create a custom role
   */
  async createCustomRole(input: {
    name: string;
    description: string;
    type: RoleTypeEnum;
    permissions: string[];
    inheritsFrom?: RoleTypeEnum;
  }): Promise<RoleAggregate> {
    // Check if role name already exists
    if (await this.roleRepository.existsByName(input.name)) {
      throw new BadRequestException(
        `Role with name ${input.name} already exists`,
      );
    }

    // Convert permission strings to Permission objects
    const permissions = input.permissions.map((p) => Permission.fromString(p));

    // Create the role
    const role = RoleAggregate.createCustom(
      input.name,
      input.description,
      input.type,
      permissions,
      input.inheritsFrom,
    );

    await this.roleRepository.save(role);
    await this.refreshCache();

    return role;
  }

  /**
   * Update role details
   */
  async updateRole(
    id: string,
    input: {
      name?: string;
      description?: string;
    },
  ): Promise<RoleAggregate> {
    const role = await this.getRoleById(id);

    if (input.name) {
      // Check if new name is taken by another role
      const existing = await this.roleRepository.findByName(input.name);
      if (existing && existing.id !== id) {
        throw new BadRequestException(
          `Role with name ${input.name} already exists`,
        );
      }
    }

    role.updateDetails(
      input.name ?? role.name,
      input.description ?? role.description,
    );

    await this.roleRepository.save(role);
    await this.refreshCache();

    return role;
  }

  /**
   * Add permission to role
   */
  async addPermission(
    roleId: string,
    permissionStr: string,
  ): Promise<RoleAggregate> {
    const role = await this.getRoleById(roleId);
    const permission = Permission.fromString(permissionStr);

    role.addPermission(permission);

    await this.roleRepository.save(role);
    await this.refreshCache();

    return role;
  }

  /**
   * Remove permission from role
   */
  async removePermission(
    roleId: string,
    permissionStr: string,
  ): Promise<RoleAggregate> {
    const role = await this.getRoleById(roleId);
    const permission = Permission.fromString(permissionStr);

    role.removePermission(permission);

    await this.roleRepository.save(role);
    await this.refreshCache();

    return role;
  }

  /**
   * Delete a custom role
   */
  async deleteRole(id: string): Promise<void> {
    const role = await this.getRoleById(id);

    if (!role.canBeDeleted()) {
      throw new BadRequestException('Cannot delete system roles');
    }

    await this.roleRepository.delete(role);
    await this.refreshCache();
  }

  /**
   * Check if a user has a specific permission
   */
  async canUserPerformAction(
    userRoleNames: string[],
    permissionType: PermissionTypeEnum,
    resourceType: ResourceTypeEnum,
  ): Promise<boolean> {
    const allRoles = await this.getAllRoles();
    const userRoles = allRoles.filter((r) => userRoleNames.includes(r.name));

    return this.hierarchyService.canAnyRolePerformAction(
      userRoles,
      permissionType,
      resourceType,
    );
  }

  /**
   * Get all permissions for a user (from all their roles)
   */
  async getUserPermissions(userRoleNames: string[]): Promise<Permission[]> {
    const allRoles = await this.getAllRoles();
    const userRoles = allRoles.filter((r) => userRoleNames.includes(r.name));

    return this.hierarchyService.mergePermissions(userRoles);
  }

  /**
   * Get system role by type
   */
  async getSystemRoleByType(type: RoleTypeEnum): Promise<RoleAggregate> {
    const role = this.cachedSystemRoles.find((r) => r.type.toValue() === type);

    if (!role) {
      throw new NotFoundException(`System role with type ${type} not found`);
    }

    return role;
  }

  /**
   * Get all roles by type
   */
  async getRolesByType(type: RoleTypeEnum): Promise<RoleAggregate[]> {
    return this.roleRepository.findByType(type);
  }
}
