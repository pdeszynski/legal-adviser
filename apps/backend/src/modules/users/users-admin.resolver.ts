import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

/**
 * Input for suspending a user account
 */
class SuspendUserInput {
  userId: string;
  reason: string;
}

/**
 * Input for activating a user account
 */
class ActivateUserInput {
  userId: string;
}

/**
 * Input for changing user role
 */
class ChangeUserRoleInput {
  userId: string;
  role: 'user' | 'admin';
}

/**
 * Input for resetting user password
 */
class ResetUserPasswordInput {
  userId: string;
  newPassword: string;
}

/**
 * Users Admin Resolver
 *
 * Provides admin-only operations for user management:
 * - Suspend/activate user accounts
 * - Change user roles
 * - Reset user passwords
 *
 * All operations require authentication and admin role.
 *
 * Auto-generated operations (via nestjs-query):
 * - users: Query all users with filtering, sorting, paging
 * - user: Query single user by ID
 * - updateOneUser: Update a user
 *
 * Admin-only operations (this resolver):
 * - suspendUser: Suspend a user account
 * - activateUser: Activate a user account
 * - changeUserRole: Change a user's role
 * - resetUserPassword: Reset a user's password
 */
@Resolver(() => User)
export class UsersAdminResolver {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Mutation: Suspend a user account
   *
   * Sets isActive to false and records suspension reason.
   * Requires authentication and admin role.
   */
  @Mutation(() => User, {
    name: 'suspendUser',
    description: 'Suspend a user account (admin only)',
  })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async suspendUser(
    @Args('input') input: SuspendUserInput,
    @Context() context: { req: { user: { id: string; role: string } } },
  ): Promise<User> {
    const adminId = context.req.user.id;
    return this.usersService.suspendUser(input.userId, input.reason, adminId);
  }

  /**
   * Mutation: Activate a user account
   *
   * Sets isActive to true.
   * Requires authentication and admin role.
   */
  @Mutation(() => User, {
    name: 'activateUser',
    description: 'Activate a user account (admin only)',
  })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async activateUser(
    @Args('input') input: ActivateUserInput,
    @Context() context: { req: { user: { id: string; role: string } } },
  ): Promise<User> {
    const adminId = context.req.user.id;
    return this.usersService.activateUser(input.userId, adminId);
  }

  /**
   * Mutation: Change a user's role
   *
   * Updates user role to 'user' or 'admin'.
   * Requires authentication and admin role.
   */
  @Mutation(() => User, {
    name: 'changeUserRole',
    description: 'Change a user role (admin only)',
  })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async changeUserRole(
    @Args('input') input: ChangeUserRoleInput,
    @Context() context: { req: { user: { id: string; role: string } } },
  ): Promise<User> {
    const adminId = context.req.user.id;
    return this.usersService.changeUserRole(input.userId, input.role, adminId);
  }

  /**
   * Mutation: Reset a user's password
   *
   * Resets the password to a new value.
   * Requires authentication and admin role.
   */
  @Mutation(() => User, {
    name: 'resetUserPassword',
    description: 'Reset a user password (admin only)',
  })
  @UseGuards(GqlAuthGuard, AdminGuard)
  async resetUserPassword(
    @Args('input') input: ResetUserPasswordInput,
    @Context() context: { req: { user: { id: string; role: string } } },
  ): Promise<User> {
    const adminId = context.req.user.id;
    return this.usersService.resetUserPassword(
      input.userId,
      input.newPassword,
      adminId,
    );
  }
}
