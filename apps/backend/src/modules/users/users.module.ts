import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { CreateUserInput, UpdateUserInput } from './dto';

/**
 * Users Module
 *
 * Handles user management and authentication.
 *
 * Primary API: GraphQL (auto-generated CRUD) - per constitution
 *
 * Uses nestjs-query for auto-generated CRUD operations:
 * - users: Query all users with filtering, sorting, paging
 * - user: Query single user by ID
 * - createOneUser: Create a new user
 * - updateOneUser: Update a user
 * - deleteOneUser: Delete a user
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
    // nestjs-query auto-generated CRUD resolvers
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([User, UserSession])],
      resolvers: [
        {
          DTOClass: User,
          EntityClass: User,
          CreateDTOClass: CreateUserInput,
          UpdateDTOClass: UpdateUserInput,
          enableTotalCount: true,
          enableAggregate: true,
          read: {
            // Enable standard read operations
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
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
