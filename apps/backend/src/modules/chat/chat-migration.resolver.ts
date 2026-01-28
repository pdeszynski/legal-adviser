import {
  Resolver,
  Mutation,
  Query,
  Args,
  Context,
  ID,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards';
import { ChatMigrationService } from './services/chat-migration.service';
import { UserPreferencesService } from '../user-preferences/services/user-preferences.service';
import {
  MigrateChatSessionInput,
  MigrateChatBulkInput,
  MigrateChatSessionResult,
  MigrateChatBulkResult,
  LocalStorageMigrationStatus,
} from './dto/chat-migration.dto';

/**
 * Custom preferences keys for chat migration
 */
const MIGRATION_FLAG_KEY = 'chatStorageMigrated';
const MIGRATION_TIMESTAMP_KEY = 'chatMigrationTimestamp';
const MIGRATION_COUNT_KEY = 'chatMigrationSessionsCount';

/**
 * Resolver for localStorage to database chat migration
 *
 * Provides mutations for migrating chat sessions from localStorage
 * to the database with proper validation and duplicate detection.
 */
@Resolver()
@UseGuards(GqlAuthGuard)
export class ChatMigrationResolver {
  constructor(
    private readonly chatMigrationService: ChatMigrationService,
    private readonly userPreferencesService: UserPreferencesService,
  ) {}

  /**
   * Mutation: Migrate a single chat session from localStorage
   *
   * @param input - Session data to migrate
   * @param context - GraphQL context with authenticated user
   * @returns Migration result
   */
  @Mutation(() => MigrateChatSessionResult, {
    name: 'migrateChatSession',
    description: 'Migrate a single chat session from localStorage to the database',
  })
  async migrateChatSession(
    @Args('input') input: MigrateChatSessionInput,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<MigrateChatSessionResult> {
    const userId = context.req?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const result = await this.chatMigrationService.migrateSession(
      userId,
      input,
    );

    // Update migration preference if successful
    if (result.success) {
      await this.updateMigrationPreferences(userId, 1);
    }

    return result;
  }

  /**
   * Mutation: Migrate multiple chat sessions from localStorage
   *
   * @param input - Bulk migration input with multiple sessions
   * @param context - GraphQL context with authenticated user
   * @returns Aggregated migration results
   */
  @Mutation(() => MigrateChatBulkResult, {
    name: 'migrateChatSessionsBulk',
    description: 'Migrate multiple chat sessions from localStorage to the database',
  })
  async migrateChatSessionsBulk(
    @Args('input') input: MigrateChatBulkInput,
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<MigrateChatBulkResult> {
    const userId = context.req?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const result = await this.chatMigrationService.migrateBulk(userId, input);

    // Update migration preference if any sessions were migrated
    if (result.successfulCount > 0) {
      await this.updateMigrationPreferences(
        userId,
        result.successfulCount,
      );
    }

    return result;
  }

  /**
   * Query: Check localStorage migration status for the current user
   *
   * @param context - GraphQL context with authenticated user
   * @returns Migration status
   */
  @Query(() => LocalStorageMigrationStatus, {
    name: 'localStorageMigrationStatus',
    description: 'Check the status of localStorage migration for the current user',
  })
  async getMigrationStatus(
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<LocalStorageMigrationStatus> {
    const userId = context.req?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const preferences =
      await this.userPreferencesService.findByUserId(userId);

    const notificationPrefs = preferences.notificationPreferences || {};
    const hasMigrated = notificationPrefs[MIGRATION_FLAG_KEY] === true;
    const lastMigrationAt =
      (notificationPrefs[MIGRATION_TIMESTAMP_KEY] as string | null) || null;
    const sessionsMigrated =
      (notificationPrefs[MIGRATION_COUNT_KEY] as number) || 0;

    return {
      hasMigrated,
      lastMigrationAt,
      sessionsMigrated,
    };
  }

  /**
   * Mutation: Mark localStorage migration as complete
   *
   * Called by the frontend after a successful migration to prevent
   * prompting the user again.
   *
   * @param context - GraphQL context with authenticated user
   * @returns Updated migration status
   */
  @Mutation(() => LocalStorageMigrationStatus, {
    name: 'markLocalStorageMigrated',
    description: 'Mark localStorage migration as complete for the current user',
  })
  async markLocalStorageMigrated(
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<LocalStorageMigrationStatus> {
    const userId = context.req?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const preferences = await this.userPreferencesService.getOrCreate(userId);

    // Store migration flags in notificationPreferences JSONB field
    const currentNotificationPrefs = preferences.notificationPreferences || {};
    preferences.notificationPreferences = {
      ...currentNotificationPrefs,
      [MIGRATION_FLAG_KEY]: true,
      [MIGRATION_TIMESTAMP_KEY]: new Date().toISOString(),
    };

    await this.userPreferencesService.save(preferences);

    return {
      hasMigrated: true,
      lastMigrationAt: new Date().toISOString(),
      sessionsMigrated:
        (preferences.notificationPreferences?.[MIGRATION_COUNT_KEY] as number) || 0,
    };
  }

  /**
   * Mutation: Reset localStorage migration flag
   *
   * Allows re-running the migration process. Useful for testing
   * or if migration was incomplete.
   *
   * @param context - GraphQL context with authenticated user
   * @returns Updated migration status
   */
  @Mutation(() => LocalStorageMigrationStatus, {
    name: 'resetLocalStorageMigration',
    description: 'Reset the localStorage migration flag to allow re-migration',
  })
  async resetLocalStorageMigration(
    @Context() context: { req: { user?: { id?: string } } },
  ): Promise<LocalStorageMigrationStatus> {
    const userId = context.req?.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const preferences = await this.userPreferencesService.getOrCreate(userId);

    // Clear migration flags from notificationPreferences JSONB field
    const currentNotificationPrefs = preferences.notificationPreferences || {};
    const { [MIGRATION_FLAG_KEY]: _, [MIGRATION_TIMESTAMP_KEY]: __, [MIGRATION_COUNT_KEY]: ___, ...rest } =
      currentNotificationPrefs as Record<string, unknown>;

    preferences.notificationPreferences = rest;

    await this.userPreferencesService.save(preferences);

    return {
      hasMigrated: false,
      lastMigrationAt: null,
      sessionsMigrated: 0,
    };
  }

  /**
   * Update migration-related user preferences
   * Stores flags in the notificationPreferences JSONB field
   */
  private async updateMigrationPreferences(
    userId: string,
    additionalCount: number,
  ): Promise<void> {
    const preferences =
      await this.userPreferencesService.getOrCreate(userId);

    const currentNotificationPrefs =
      preferences.notificationPreferences || {};
    const currentCount =
      (currentNotificationPrefs[MIGRATION_COUNT_KEY] as number) || 0;

    preferences.notificationPreferences = {
      ...currentNotificationPrefs,
      [MIGRATION_FLAG_KEY]: true,
      [MIGRATION_TIMESTAMP_KEY]: new Date().toISOString(),
      [MIGRATION_COUNT_KEY]: currentCount + additionalCount,
    };

    await this.userPreferencesService.save(preferences);
  }
}
