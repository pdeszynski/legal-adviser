import { Module } from '@nestjs/common';
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreferences } from './entities/user-preferences.entity';
import { UserPreferencesService } from './services/user-preferences.service';
import { UserPreferencesResolver } from './user-preferences.resolver';
import {
  CreateUserPreferencesInput,
  UpdateUserPreferencesInput,
} from './dto/user-preferences.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

/**
 * User Preferences Module
 *
 * Handles user-specific settings and preferences.
 * Provides services for managing notification settings, locale, theme, and AI model selection.
 *
 * Uses nestjs-query for auto-generated CRUD operations:
 * - userPreferences: Query all preferences with filtering, sorting, paging
 * - userPreference: Query single preference by ID
 * - createOneUserPreference: Create new preferences
 * - updateOneUserPreference: Update preferences
 * - deleteOneUserPreference: Delete preferences
 *
 * Custom mutations (via UserPreferencesResolver):
 * - myPreferences: Get current user's preferences
 * - updateMyPreferences: Update current user's preferences
 * - resetMyPreferences: Reset to defaults
 *
 * Bounded Context: User Preferences
 * - Aggregates: UserPreferences
 * - Services: UserPreferencesService
 * - Resolvers: UserPreferencesResolver (custom), auto-generated CRUD
 */
@Module({
  imports: [
    // Auto-generated CRUD via nestjs-query
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([UserPreferences])],
      resolvers: [
        {
          DTOClass: UserPreferences,
          EntityClass: UserPreferences,
          CreateDTOClass: CreateUserPreferencesInput,
          UpdateDTOClass: UpdateUserPreferencesInput,
          enableTotalCount: true,
          enableAggregate: true,
          guards: [GqlAuthGuard],
          read: {
            // Enable standard read operations
            many: { name: 'userPreferences' },
            one: { name: 'userPreference' },
          },
          create: {
            // Enable create mutation
            one: { name: 'createOneUserPreference' },
            many: { disabled: true },
          },
          update: {
            // Enable update mutation
            one: { name: 'updateOneUserPreference' },
            many: { disabled: true },
          },
          delete: {
            // Enable delete mutation
            one: { name: 'deleteOneUserPreference' },
            many: { disabled: true },
          },
        },
      ],
    }),
  ],
  providers: [UserPreferencesService, UserPreferencesResolver],
  exports: [UserPreferencesService],
})
export class UserPreferencesModule {}
