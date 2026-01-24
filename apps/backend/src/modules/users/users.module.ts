import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { CreateUserInput, UpdateUserInput } from './dto';
import { UsersAdminResolver } from './users-admin.resolver';
import { UsersCrudResolver } from './users-crud.resolver';

/**
 * Users Module
 *
 * Handles user management and authentication.
 *
 * Primary API: GraphQL (auto-generated CRUD) - per constitution
 *
 * Uses nestjs-query for auto-generated CRUD operations with admin guards:
 * - users: Query all users with filtering, sorting, paging (admin only)
 * - user: Query single user by ID (admin only)
 * - createOneUser: Create a new user (admin only)
 * - updateOneUser: Update a user (admin only)
 * - deleteOneUser: Delete a user (admin only)
 *
 * Admin-only operations:
 * - suspendUser: Suspend a user account
 * - activateUser: Activate a user account
 * - changeUserRole: Change a user's role
 * - resetUserPassword: Reset a user's password
 *
 * This module manages:
 * - User accounts and profiles
 * - User sessions
 * - User preferences
 */
@Module({
  imports: [
    // TypeORM repository for custom service
    TypeOrmModule.forFeature([User, UserSession]),
    // nestjs-query for UserSession resolvers (not user, which uses custom resolver)
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
  providers: [UsersService, UsersAdminResolver, UsersCrudResolver],
  exports: [UsersService],
})
export class UsersModule {}
