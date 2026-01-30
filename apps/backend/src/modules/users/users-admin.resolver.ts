import {
  Resolver,
  Mutation,
  Query,
  Args,
  Context,
  InputType,
  ObjectType,
  Field,
  ID,
  registerEnumType,
} from '@nestjs/graphql';
import { UseGuards, ConflictException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RoleGuard, RequireAdmin } from '../auth/guards/role.guard';
import { UserRole } from '../auth/enums/user-role.enum';
import { AdminCreateUserInput } from './dto';

// Register UserRole enum for GraphQL usage
registerEnumType(UserRole, {
  name: 'UserRole',
  description:
    'User role with hierarchy: SUPER_ADMIN(5) > ADMIN(4) > LAWYER(3) > PARALEGAL(2) > CLIENT(1) > GUEST(0)',
});

/**
 * Input for suspending a user account
 */
@InputType()
class SuspendUserInput {
  @Field(() => ID)
  userId: string;

  @Field()
  reason: string;
}

/**
 * Input for activating a user account
 */
@InputType()
class ActivateUserInput {
  @Field(() => ID)
  userId: string;
}

/**
 * Input for changing user role
 */
@InputType()
class ChangeUserRoleInput {
  @Field(() => ID)
  userId: string;

  @Field(() => UserRole)
  role: UserRole;
}

/**
 * Input for resetting user password
 */
@InputType()
class ResetUserPasswordInput {
  @Field(() => ID)
  userId: string;

  @Field()
  newPassword: string;
}

/**
 * Check email exists result
 */
@ObjectType()
class CheckEmailExistsResult {
  @Field()
  exists: boolean;

  @Field(() => String, { nullable: true })
  userId?: string;

  @Field(() => String, { nullable: true })
  username?: string;
}

/**
 * Bulk operation error
 */
@ObjectType()
class BulkOperationError {
  @Field()
  id: string;

  @Field()
  error: string;
}

/**
 * Bulk suspend users input
 */
@InputType()
class BulkSuspendUsersInput {
  @Field(() => [ID])
  userIds: string[];

  @Field()
  reason: string;
}

/**
 * Bulk activate users input
 */
@InputType()
class BulkActivateUsersInput {
  @Field(() => [ID])
  userIds: string[];
}

/**
 * Bulk change user roles input
 */
@InputType()
class BulkChangeUserRolesInput {
  @Field(() => [ID])
  userIds: string[];

  @Field(() => UserRole)
  role: UserRole;
}

/**
 * Bulk delete users input
 */
@InputType()
class BulkDeleteUsersInput {
  @Field(() => [ID])
  userIds: string[];
}

/**
 * Bulk users operation result
 */
@ObjectType()
class BulkUsersResult {
  @Field(() => [User])
  success: User[];

  @Field(() => [BulkOperationError])
  failed: BulkOperationError[];
}

/**
 * Bulk delete users result
 */
@ObjectType()
class BulkDeleteUsersResult {
  @Field(() => [ID])
  success: string[];

  @Field(() => [BulkOperationError])
  failed: BulkOperationError[];
}

/**
 * Users Admin Resolver
 *
 * Provides admin-only operations for user management:
 * - Create users with password and role
 * - Check if email exists
 * - Suspend/activate user accounts
 * - Change user roles
 * - Reset user passwords
 * - Bulk operations (suspend, activate, change roles, delete)
 *
 * All operations require authentication and admin role.
 *
 * Auto-generated operations (via nestjs-query):
 * - users: Query all users with filtering, sorting, paging
 * - user: Query single user by ID
 * - updateOneUser: Update a user
 *
 * Admin-only operations (this resolver):
 * - adminCreateUser: Create a user with password and role
 * - checkEmailExists: Check if email is already registered
 * - suspendUser: Suspend a user account
 * - activateUser: Activate a user account
 * - changeUserRole: Change a user's role
 * - resetUserPassword: Reset a user's password
 * - bulkSuspendUsers: Suspend multiple user accounts
 * - bulkActivateUsers: Activate multiple user accounts
 * - bulkChangeUserRoles: Change roles for multiple users
 * - bulkDeleteUsers: Delete multiple user accounts
 */
@Resolver(() => User)
export class UsersAdminResolver {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Query: Check if email exists
   * Used for real-time email validation in create user form
   */
  @Query(() => CheckEmailExistsResult, {
    name: 'checkEmailExists',
    description: 'Check if email is already registered (admin only)',
    nullable: true,
  })
  @UseGuards(GqlAuthGuard, RoleGuard)
  @RequireAdmin()
  async checkEmailExists(
    @Args('email') email: string,
  ): Promise<CheckEmailExistsResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    if (existingUser) {
      return {
        exists: true,
        userId: existingUser.id,
        username: existingUser.username || undefined,
      };
    }

    return { exists: false };
  }

  /**
   * Mutation: Create a new user with password and role (admin only)
   *
   * Creates a user with a pre-set password and role.
   * Checks for duplicate email and username before creation.
   */
  @Mutation(() => User, {
    name: 'adminCreateUser',
    description: 'Create a new user with password and role (admin only)',
  })
  @UseGuards(GqlAuthGuard, RoleGuard)
  @RequireAdmin()
  async adminCreateUser(
    @Args('input') input: AdminCreateUserInput,
    @Context() context: { req: { user: { id: string } } },
  ): Promise<User> {
    // Check if email already exists
    const existingEmail = await this.usersService.findByEmail(input.email);
    if (existingEmail) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if username is taken
    if (input.username) {
      const existingUsername = await this.usersService.findByUsername(
        input.username,
      );
      if (existingUsername) {
        throw new ConflictException('Username is already taken');
      }
    }

    // Create user with password
    const user = await this.usersService.createUser({
      email: input.email,
      username: input.username,
      firstName: input.firstName,
      lastName: input.lastName,
      password: input.password,
    });

    // Set role if different from default (CLIENT)
    if (input.role && input.role !== UserRole.CLIENT) {
      await this.usersService.changeUserRole(
        user.id,
        input.role,
        context.req.user.id,
      );
      // Refresh user to get updated role
      const updatedUser = await this.usersService.findById(user.id);
      if (updatedUser) {
        return updatedUser;
      }
    }

    // Set active status if different from default
    if (input.isActive !== undefined && input.isActive !== true) {
      await this.usersService.updateUser(user.id, { isActive: input.isActive });
      const updatedUser = await this.usersService.findById(user.id);
      if (updatedUser) {
        return updatedUser;
      }
    }

    return user;
  }

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
  @UseGuards(GqlAuthGuard, RoleGuard)
  @RequireAdmin()
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
  @UseGuards(GqlAuthGuard, RoleGuard)
  @RequireAdmin()
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
  @UseGuards(GqlAuthGuard, RoleGuard)
  @RequireAdmin()
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
  @UseGuards(GqlAuthGuard, RoleGuard)
  @RequireAdmin()
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

  /**
   * Mutation: Bulk suspend users
   *
   * Suspends multiple user accounts with a reason.
   * Requires authentication and admin role.
   */
  @Mutation(() => BulkUsersResult, {
    name: 'bulkSuspendUsers',
    description: 'Suspend multiple user accounts (admin only)',
  })
  @UseGuards(GqlAuthGuard, RoleGuard)
  @RequireAdmin()
  async bulkSuspendUsers(
    @Args('input') input: BulkSuspendUsersInput,
    @Context() context: { req: { user: { id: string; role: string } } },
  ): Promise<BulkUsersResult> {
    const adminId = context.req.user.id;
    const result = await this.usersService.bulkSuspendUsers(
      input.userIds,
      input.reason,
      adminId,
    );

    return {
      success: result.success,
      failed: result.failed,
    };
  }

  /**
   * Mutation: Bulk activate users
   *
   * Activates multiple user accounts.
   * Requires authentication and admin role.
   */
  @Mutation(() => BulkUsersResult, {
    name: 'bulkActivateUsers',
    description: 'Activate multiple user accounts (admin only)',
  })
  @UseGuards(GqlAuthGuard, RoleGuard)
  @RequireAdmin()
  async bulkActivateUsers(
    @Args('input') input: BulkActivateUsersInput,
    @Context() context: { req: { user: { id: string; role: string } } },
  ): Promise<BulkUsersResult> {
    const adminId = context.req.user.id;
    const result = await this.usersService.bulkActivateUsers(
      input.userIds,
      adminId,
    );

    return {
      success: result.success,
      failed: result.failed,
    };
  }

  /**
   * Mutation: Bulk change user roles
   *
   * Changes roles for multiple users.
   * Requires authentication and admin role.
   */
  @Mutation(() => BulkUsersResult, {
    name: 'bulkChangeUserRoles',
    description: 'Change roles for multiple users (admin only)',
  })
  @UseGuards(GqlAuthGuard, RoleGuard)
  @RequireAdmin()
  async bulkChangeUserRoles(
    @Args('input') input: BulkChangeUserRolesInput,
    @Context() context: { req: { user: { id: string; role: string } } },
  ): Promise<BulkUsersResult> {
    const adminId = context.req.user.id;
    const result = await this.usersService.bulkChangeUserRoles(
      input.userIds,
      input.role,
      adminId,
    );

    return {
      success: result.success,
      failed: result.failed,
    };
  }

  /**
   * Mutation: Bulk delete users
   *
   * Deletes multiple user accounts.
   * Requires authentication and admin role.
   */
  @Mutation(() => BulkDeleteUsersResult, {
    name: 'bulkDeleteUsers',
    description: 'Delete multiple user accounts (admin only)',
  })
  @UseGuards(GqlAuthGuard, RoleGuard)
  @RequireAdmin()
  async bulkDeleteUsers(
    @Args('input') input: BulkDeleteUsersInput,
    @Context() context: { req: { user: { id: string; role: string } } },
  ): Promise<BulkDeleteUsersResult> {
    const adminId = context.req.user.id;
    const result = await this.usersService.bulkDeleteUsers(
      input.userIds,
      adminId,
    );

    return {
      success: result.success,
      failed: result.failed,
    };
  }
}
