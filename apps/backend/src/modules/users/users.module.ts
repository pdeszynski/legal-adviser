import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { CreateUserInput, UpdateUserInput } from './dto';
import { UsersAdminResolver } from './users-admin.resolver';
import { UserRolesResolver } from './user-roles.resolver';
import { UserRoleEntity } from '../authorization/entities/user-role.entity';
import { RoleEntity } from '../authorization/entities/role.entity';

/**
 * Users Module
 *
 * Handles user management and authentication.
 *
 * Primary API: GraphQL (auto-generated CRUD via nestjs-query)
 *
 * Auto-generated CRUD operations with admin guards:
 * - users: Query all users with filtering, sorting, paging (Connection format)
 * - user: Query single user by ID (admin only)
 * - createOneUser: Create a new user (admin only)
 * - updateOneUser: Update a user (admin only)
 * - deleteOneUser: Delete a user (admin only)
 *
 * Admin-only operations (custom resolver):
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
 *
 * This module manages:
 * - User accounts and profiles
 * - User sessions
 * - User preferences
 */
@Module({
  imports: [
    // TypeORM repository for custom service
    TypeOrmModule.forFeature([User, UserSession, UserRoleEntity, RoleEntity]),
    // nestjs-query for User entity - auto-generates CRUD with Connection format
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([User])],
      resolvers: [
        {
          DTOClass: User,
          EntityClass: User,
          CreateDTOClass: CreateUserInput,
          UpdateDTOClass: UpdateUserInput,
          enableTotalCount: true,
          enableAggregate: true,
          read: {
            // Enable standard read operations with Connection format
            many: { name: 'users' },
            one: { name: 'user' },
          },
          create: {
            // Enable create mutation
            one: { name: 'createOneUser' },
            many: { disabled: true },
          },
          update: {
            // Enable update mutation
            one: { name: 'updateOneUser' },
            many: { disabled: true },
          },
          delete: {
            // Enable delete mutation
            one: { name: 'deleteOneUser' },
            many: { disabled: true },
          },
        },
      ],
    }),
    // nestjs-query for UserSession resolvers
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([UserSession])],
      resolvers: [
        {
          DTOClass: UserSession,
          EntityClass: UserSession,
          enableTotalCount: true,
          enableAggregate: true,
          read: {
            // Enable standard read operations
            many: { name: 'userSessions' },
            one: { name: 'userSession' },
          },
          create: {
            // Disable create - sessions created via service
            disabled: true,
          },
          update: {
            // Disable update - sessions updated via service
            disabled: true,
          },
          delete: {
            // Enable delete mutation
            one: { name: 'deleteOneUserSession' },
            many: { disabled: true },
          },
        },
      ],
    }),
  ],
  providers: [UsersService, UsersAdminResolver, UserRolesResolver],
  exports: [UsersService],
})
export class UsersModule {}
