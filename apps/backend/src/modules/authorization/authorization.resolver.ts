import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthorizationService } from './authorization.service';
import {
  RoleDTO,
  CreateRoleInput,
  UpdateRoleInput,
  AddPermissionInput,
  RemovePermissionInput,
  CheckPermissionInput,
  PermissionCheckResultDTO,
  PermissionTypeEnum,
  ResourceTypeEnum,
  RoleTypeEnum,
} from './dto';

/**
 * GraphQL Resolver for Authorization (Role-Based Access Control)
 *
 * Provides GraphQL endpoints for managing roles and permissions.
 * Most operations require admin access.
 */
@Resolver()
export class AuthorizationResolver {
  constructor(private readonly authorizationService: AuthorizationService) {}

  /**
   * Query: Get all roles
   * Returns all system and custom roles
   */
  @Query(() => [RoleDTO], {
    name: 'roles',
    description: 'Get all roles in the system',
  })
  @UseGuards(GqlAuthGuard)
  async getAllRoles(): Promise<RoleDTO[]> {
    const roles = await this.authorizationService.getAllRoles();
    return roles.map((r) => this.toDTO(r));
  }

  /**
   * Query: Get role by ID
   */
  @Query(() => RoleDTO, {
    name: 'role',
    description: 'Get a role by ID',
    nullable: true,
  })
  @UseGuards(GqlAuthGuard)
  async getRoleById(@Args('id') id: string): Promise<RoleDTO | null> {
    try {
      const role = await this.authorizationService.getRoleById(id);
      return this.toDTO(role);
    } catch {
      return null;
    }
  }

  /**
   * Query: Get role by name
   */
  @Query(() => RoleDTO, {
    name: 'roleByName',
    description: 'Get a role by name',
    nullable: true,
  })
  @UseGuards(GqlAuthGuard)
  async getRoleByName(@Args('name') name: string): Promise<RoleDTO | null> {
    try {
      const role = await this.authorizationService.getRoleByName(name);
      return this.toDTO(role);
    } catch {
      return null;
    }
  }

  /**
   * Query: Check if roles have a specific permission
   */
  @Query(() => PermissionCheckResultDTO, {
    name: 'hasPermission',
    description: 'Check if the given roles have a specific permission',
  })
  @UseGuards(GqlAuthGuard)
  async hasPermission(
    @Args('input') input: CheckPermissionInput,
  ): Promise<PermissionCheckResultDTO> {
    const allowed = await this.authorizationService.canUserPerformAction(
      input.roleNames,
      input.permissionType as PermissionTypeEnum,
      input.resourceType as ResourceTypeEnum,
    );

    const permissions = await this.authorizationService.getUserPermissions(
      input.roleNames,
    );

    return {
      allowed,
      permissions: permissions.map((p) => p.toString()),
    };
  }

  /**
   * Mutation: Create a custom role
   * Requires admin access
   */
  @Mutation(() => RoleDTO, {
    name: 'createRole',
    description: 'Create a new custom role',
  })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async createRole(@Args('input') input: CreateRoleInput): Promise<RoleDTO> {
    const role = await this.authorizationService.createCustomRole({
      name: input.name,
      description: input.description ?? '',
      type: input.type as RoleTypeEnum,
      permissions: input.permissions,
      inheritsFrom: input.inheritsFrom as RoleTypeEnum | undefined,
    });
    return this.toDTO(role);
  }

  /**
   * Mutation: Update role details
   * Requires admin access
   */
  @Mutation(() => RoleDTO, {
    name: 'updateRole',
    description: 'Update role name or description',
  })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async updateRole(
    @Args('id') id: string,
    @Args('input') input: UpdateRoleInput,
  ): Promise<RoleDTO> {
    const role = await this.authorizationService.updateRole(id, input);
    return this.toDTO(role);
  }

  /**
   * Mutation: Add permission to role
   * Requires admin access
   */
  @Mutation(() => RoleDTO, {
    name: 'addPermissionToRole',
    description: 'Add a permission to a role',
  })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async addPermissionToRole(
    @Args('input') input: AddPermissionInput,
  ): Promise<RoleDTO> {
    const role = await this.authorizationService.addPermission(
      input.roleId,
      input.permission,
    );
    return this.toDTO(role);
  }

  /**
   * Mutation: Remove permission from role
   * Requires admin access
   */
  @Mutation(() => RoleDTO, {
    name: 'removePermissionFromRole',
    description: 'Remove a permission from a role',
  })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async removePermissionFromRole(
    @Args('input') input: RemovePermissionInput,
  ): Promise<RoleDTO> {
    const role = await this.authorizationService.removePermission(
      input.roleId,
      input.permission,
    );
    return this.toDTO(role);
  }

  /**
   * Mutation: Delete a custom role
   * Requires admin access
   */
  @Mutation(() => Boolean, {
    name: 'deleteRole',
    description: 'Delete a custom role (system roles cannot be deleted)',
  })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async deleteRole(@Args('id') id: string): Promise<boolean> {
    await this.authorizationService.deleteRole(id);
    return true;
  }

  /**
   * Convert domain aggregate to GraphQL DTO
   */
  private toDTO(
    role: import('../../domain/authorization').RoleAggregate,
  ): RoleDTO {
    return {
      id: role.roleId.toValue(),
      name: role.name,
      description: role.description,
      type: role.type.toValue(),
      permissions: role.permissions.map((p) => ({
        type: p.type.toValue(),
        resource: p.resource.toValue(),
        condition: p.condition,
      })),
      inheritsFrom: role.inheritsFrom?.toValue() || null,
      isSystemRole: role.isSystemRole,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
