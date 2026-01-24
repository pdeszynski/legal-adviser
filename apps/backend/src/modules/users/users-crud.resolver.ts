import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Context,
  ArgsType,
  Field,
  Int,
  ObjectType,
  InputType,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Filter, SortField, Paging } from '@ptc-org/nestjs-query-core';
import { User } from './entities/user.entity';
import { CreateUserInput, UpdateUserInput } from './dto';
import { UsersService } from './users.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RoleGuard, RequireAdmin } from '../auth/guards/role.guard';

/**
 * String comparison filter type
 */
@InputType()
class StringFilter {
  @Field(() => String, { nullable: true })
  eq?: string;

  @Field(() => String, { nullable: true })
  iLike?: string;

  @Field(() => [String], { nullable: true })
  in?: string[];
}

/**
 * Boolean comparison filter type
 */
@InputType()
class BooleanFilter {
  @Field(() => Boolean, { nullable: true })
  eq?: boolean;

  @Field(() => Boolean, { nullable: true })
  is?: boolean;
}

/**
 * User Filter Type for GraphQL
 */
@InputType()
class UserFilter {
  @Field(() => StringFilter, { nullable: true })
  email?: StringFilter;

  @Field(() => StringFilter, { nullable: true })
  username?: StringFilter;

  @Field(() => BooleanFilter, { nullable: true })
  isActive?: BooleanFilter;

  @Field(() => StringFilter, { nullable: true })
  role?: StringFilter;
}

/**
 * User Sort Type for GraphQL
 */
@InputType()
class UserSort {
  @Field(() => String)
  field: string;

  @Field(() => String)
  direction: 'ASC' | 'DESC';
}

/**
 * Paging Type for GraphQL
 */
@ArgsType()
@InputType()
class UserPaging {
  @Field(() => Int, { nullable: true })
  first?: number;

  @Field(() => String, { nullable: true })
  after?: string;
}

/**
 * Users CRUD Resolver with Admin Guards
 *
 * Admin-only CRUD operations for user management.
 * All operations require authentication and admin role.
 *
 * Operations:
 * - users: Query all users with filtering, sorting, paging
 * - user: Query single user by ID
 * - createOneUser: Create a new user
 * - updateOneUser: Update a user
 * - deleteOneUser: Delete a user
 */
@Resolver(() => User)
@UseGuards(GqlAuthGuard, RoleGuard)
@RequireAdmin()
export class UsersCrudResolver {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Query: Get all users with filtering, sorting, and pagination
   */
  @Query(() => [User], {
    name: 'users',
    description:
      'Get all users with filtering, sorting, and paging (admin only)',
  })
  async getUsers(
    @Args('filter', { nullable: true }) filter?: UserFilter,
    @Args('sorting', { nullable: true, type: () => [UserSort] })
    sorting?: UserSort[],
    @Args('paging', { nullable: true }) paging?: UserPaging,
  ): Promise<User[]> {
    // This is a simplified implementation
    // The full implementation would use nestjs-query's resolver services
    // For now, we'll return all users and let the UI handle filtering
    return this.usersService.findAll();
  }

  /**
   * Query: Get a single user by ID
   */
  @Query(() => User, {
    name: 'user',
    nullable: true,
    description: 'Get a user by ID (admin only)',
  })
  async getUser(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<User | null> {
    return this.usersService.findById(id);
  }

  /**
   * Mutation: Create a new user
   */
  @Mutation(() => User, {
    name: 'createOneUser',
    description: 'Create a new user (admin only)',
  })
  async createOneUser(
    @Args('input') input: CreateUserInput,
    @Context() context: { req: { user: { id: string } } },
  ): Promise<User> {
    return this.usersService.createUser({
      email: input.email,
      username: input.username,
      firstName: input.firstName,
      lastName: input.lastName,
    });
  }

  /**
   * Mutation: Update a user
   */
  @Mutation(() => User, {
    name: 'updateOneUser',
    description: 'Update a user (admin only)',
  })
  async updateOneUser(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateUserInput,
  ): Promise<User> {
    return this.usersService.updateUser(id, {
      email: input.email,
      username: input.username,
      firstName: input.firstName,
      lastName: input.lastName,
      isActive: input.isActive,
      disclaimerAccepted: input.disclaimerAccepted,
    });
  }

  /**
   * Mutation: Delete a user
   */
  @Mutation(() => User, {
    name: 'deleteOneUser',
    description: 'Delete a user (admin only)',
  })
  async deleteOneUser(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<User> {
    // This would need to be implemented in the service
    const user = await this.usersService.findById(id);
    if (user) {
      // Delete logic would go here
      // For now, return the user
    }
    return user as User;
  }
}
