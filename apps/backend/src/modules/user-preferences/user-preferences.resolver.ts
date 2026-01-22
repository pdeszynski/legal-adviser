import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserPreferences } from './entities/user-preferences.entity';
import { UserPreferencesService } from './services/user-preferences.service';
import { UpdateUserPreferencesInput } from './dto/user-preferences.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

/**
 * UserPreferences Resolver
 *
 * Custom GraphQL resolver for managing user preferences.
 * Provides endpoints for reading and updating user settings.
 *
 * Auto-generated operations (via nestjs-query):
 * - userPreferences: Query all preferences with filtering, sorting, paging
 * - userPreference: Query single preference by ID
 * - createOneUserPreference: Create new preferences
 * - updateOneUserPreference: Update preferences
 * - deleteOneUserPreference: Delete preferences
 *
 * Custom operations (this resolver):
 * - myPreferences: Get current user's preferences (convenience query)
 * - updateMyPreferences: Update current user's preferences (with business logic)
 * - resetMyPreferences: Reset to defaults (with business logic)
 *
 * Authentication: All operations require authentication.
 * Users can only access their own preferences via custom mutations.
 */
@Resolver(() => UserPreferences)
export class UserPreferencesResolver {
  constructor(private readonly preferencesService: UserPreferencesService) {}

  /**
   * Query: Get preferences for the current user
   *
   * Convenience query that filters by the authenticated user's ID.
   * Also available via: userPreferences(filter: { userId: "..." })
   *
   * Requires authentication
   */
  @Query(() => UserPreferences, { name: 'myPreferences' })
  @UseGuards(GqlAuthGuard)
  async getMyPreferences(
    @Context() context: { req: { user: { id: string } } },
  ): Promise<UserPreferences> {
    const userId = context.req.user.id;
    return this.preferencesService.getOrCreate(userId);
  }

  /**
   * Mutation: Update preferences for the current user
   *
   * Updates preferences for the authenticated user.
   * Also available via: updateOneUserPreference(id: "...", update: {...})
   *
   * Note: This mutation includes business logic for updating
   * nested notification preferences. For simple updates,
   * use updateOneUserPreference from nestjs-query.
   *
   * Requires authentication
   */
  @Mutation(() => UserPreferences, { name: 'updateMyPreferences' })
  @UseGuards(GqlAuthGuard)
  async updateMyPreferences(
    @Context() context: { req: { user: { id: string } } },
    @Args('input') input: UpdateUserPreferencesInput,
  ): Promise<UserPreferences> {
    const userId = context.req.user.id;
    return this.preferencesService.update(userId, input);
  }

  /**
   * Mutation: Reset preferences to defaults for the current user
   *
   * Resets all preferences to system defaults.
   * This is a custom operation with specific business logic.
   *
   * Requires authentication
   */
  @Mutation(() => UserPreferences, { name: 'resetMyPreferences' })
  @UseGuards(GqlAuthGuard)
  async resetMyPreferences(
    @Context() context: { req: { user: { id: string } } },
  ): Promise<UserPreferences> {
    const userId = context.req.user.id;
    return this.preferencesService.resetToDefaults(userId);
  }
}
