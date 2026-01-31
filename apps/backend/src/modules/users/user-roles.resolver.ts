import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRoleEntity } from '../authorization/entities/user-role.entity';
import { RoleEntity } from '../authorization/entities/role.entity';

/**
 * User Roles Field Resolver
 *
 * Adds role-related computed fields to the User type.
 * This resolves the 'role' and 'roles' fields on User by querying
 * the user_roles relationship table and returning the highest priority role.
 *
 * The 'role' field returns a single string (the highest priority role type)
 * The 'roles' field returns an array of all role type strings for the user
 */
@Resolver(() => User)
export class UserRolesResolver {
  constructor(
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
  ) {}

  /**
   * Resolve the primary role for a user
   * Returns the highest priority (lowest priority number) active role
   *
   * @param user - The parent User object
   * @returns The user's primary role type as a string, or 'client' as default
   */
  @ResolveField('role', () => String, { nullable: true })
  async getRole(@Parent() user: User): Promise<string | null> {
    // Get user's roles from the database
    const userRoles = await this.userRoleRepository.find({
      where: {
        userId: user.id,
        isActive: true,
      },
      relations: ['role'],
      order: {
        priority: 'ASC',
      },
    });

    if (userRoles.length === 0) {
      // Default role if no roles assigned
      return 'client';
    }

    // Find the first valid role (highest priority = lowest priority number)
    const now = new Date();
    const validRole = userRoles.find(
      (ur) => !ur.expiresAt || ur.expiresAt > now,
    );

    if (!validRole || !validRole.role) {
      return 'client';
    }

    // Return the role type (e.g., 'admin', 'client', etc.)
    return validRole.role.type || 'client';
  }

  /**
   * Resolve all roles for a user
   * Returns an array of all active role type strings
   *
   * @param user - The parent User object
   * @returns Array of role type strings for the user
   */
  @ResolveField('roles', () => [String], { nullable: true })
  async getRoles(@Parent() user: User): Promise<string[]> {
    // Get user's roles from the database
    const userRoles = await this.userRoleRepository.find({
      where: {
        userId: user.id,
        isActive: true,
      },
      relations: ['role'],
      order: {
        priority: 'ASC',
      },
    });

    if (userRoles.length === 0) {
      return ['client'];
    }

    // Filter valid roles and return their types
    const now = new Date();
    const validRoles = userRoles.filter(
      (ur) => !ur.expiresAt || ur.expiresAt > now,
    );

    return validRoles
      .map((ur) => ur.role?.type || 'client')
      .filter((role, index, self) => self.indexOf(role) === index); // Remove duplicates
  }
}
