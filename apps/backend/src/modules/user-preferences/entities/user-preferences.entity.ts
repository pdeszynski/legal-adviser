import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  FilterableField,
  IDField,
  QueryOptions,
  Relation,
} from '@ptc-org/nestjs-query-graphql';
import {
  ObjectType,
  ID,
  Field,
  GraphQLISODateTime,
  registerEnumType,
} from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

/**
 * Theme Preference
 * Available theme options for the UI
 */
export enum ThemePreference {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  SYSTEM = 'SYSTEM',
}

/**
 * AI Model Type
 * Available AI models for legal operations
 */
export enum AiModelType {
  GPT_4 = 'GPT_4',
  GPT_4_TURBO = 'GPT_4_TURBO',
  GPT_3_5_TURBO = 'GPT_3_5_TURBO',
  CLAUDE_3_OPUS = 'CLAUDE_3_OPUS',
  CLAUDE_3_SONNET = 'CLAUDE_3_SONNET',
}

// Register enums with GraphQL
registerEnumType(ThemePreference, {
  name: 'ThemePreference',
  description: 'Available theme options for the UI',
});

registerEnumType(AiModelType, {
  name: 'AiModelType',
  description: 'Available AI models for legal operations',
});

/**
 * Notification Channel Preferences
 * Controls which notification channels are enabled
 */
@ObjectType('NotificationChannels')
export class NotificationChannels {
  @Field(() => Boolean)
  email: boolean;

  @Field(() => Boolean)
  inApp: boolean;

  @Field(() => Boolean)
  push: boolean;
}

/**
 * Notification Preferences
 * Granular control over notification types
 */
@ObjectType('NotificationPreferences')
export class NotificationPreferences {
  @Field(() => Boolean)
  documentUpdates: boolean;

  @Field(() => Boolean)
  queryResponses: boolean;

  @Field(() => Boolean)
  systemAlerts: boolean;

  @Field(() => Boolean)
  marketingEmails: boolean;

  @Field(() => NotificationChannels)
  channels: NotificationChannels;
}

/**
 * UserPreferences Entity
 *
 * Stores user-specific settings and preferences.
 * One-to-one relationship with User entity.
 *
 * Aggregate Root: UserPreferences
 * Invariants:
 *   - userId must be unique
 *   - locale must be a valid ISO 639-1 code
 *   - theme must be a valid ThemePreference
 *   - aiModel must be a valid AiModelType
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 */
@Entity('user_preferences')
@ObjectType('UserPreferences')
@QueryOptions({ enableTotalCount: true })
@Relation('user', () => User)
@Index(['userId'], { unique: true })
export class UserPreferences {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  /**
   * Reference to the user (one-to-one)
   */
  @Column({ type: 'uuid', unique: true })
  @FilterableField()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Default locale/language for the user (ISO 639-1 code)
   * Default: 'en' (English)
   */
  @Column({ type: 'varchar', length: 5, default: 'en' })
  @FilterableField()
  locale: string;

  /**
   * Theme preference for the UI
   * Default: SYSTEM (follows OS settings)
   */
  @Column({
    type: 'enum',
    enum: ThemePreference,
    default: ThemePreference.SYSTEM,
  })
  @FilterableField(() => ThemePreference)
  theme: ThemePreference;

  /**
   * Default AI model for legal operations
   * Default: GPT_4_TURBO (balanced performance and cost)
   */
  @Column({
    type: 'enum',
    enum: AiModelType,
    default: AiModelType.GPT_4_TURBO,
  })
  @FilterableField(() => AiModelType)
  aiModel: AiModelType;

  /**
   * Notification preferences stored as JSONB
   * Exposed as nested GraphQL object
   */
  @Column({ type: 'jsonb', default: {} })
  notificationPreferences: Record<string, any>;

  @Field(() => NotificationPreferences)
  getNotificationPreferences(): NotificationPreferences {
    const defaults = {
      documentUpdates: true,
      queryResponses: true,
      systemAlerts: true,
      marketingEmails: false,
      channels: {
        email: true,
        inApp: true,
        push: false,
      },
    };
    const stored = this.notificationPreferences || {};
    const channelDefaults = defaults.channels as Record<string, boolean>;
    const storedChannels = (stored.channels || {}) as Record<
      string,
      boolean | null | undefined
    >;

    return {
      documentUpdates: stored.documentUpdates ?? defaults.documentUpdates,
      queryResponses: stored.queryResponses ?? defaults.queryResponses,
      systemAlerts: stored.systemAlerts ?? defaults.systemAlerts,
      marketingEmails: stored.marketingEmails ?? defaults.marketingEmails,
      channels: {
        email: storedChannels.email ?? channelDefaults.email,
        inApp: storedChannels.inApp ?? channelDefaults.inApp,
        push: storedChannels.push ?? channelDefaults.push,
      },
    };
  }

  /**
   * Email notification preference
   * Legacy field for backward compatibility
   */
  @Column({ type: 'boolean', default: true })
  @FilterableField()
  emailNotifications: boolean;

  /**
   * In-app notification preference
   * Legacy field for backward compatibility
   */
  @Column({ type: 'boolean', default: true })
  @FilterableField()
  inAppNotifications: boolean;

  /**
   * Timezone for the user (IANA timezone database)
   * Example: 'Europe/Warsaw', 'America/New_York'
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  @Field(() => String, { nullable: true })
  timezone: string | null;

  /**
   * Date format preference
   * Example: 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  @Field(() => String, { nullable: true })
  dateFormat: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  updatedAt: Date;

  /**
   * Create default preferences for a new user
   */
  static createDefault(userId: string): UserPreferences {
    const prefs = new UserPreferences();
    prefs.userId = userId;
    prefs.locale = 'en';
    prefs.theme = ThemePreference.SYSTEM;
    prefs.aiModel = AiModelType.GPT_4_TURBO;
    prefs.emailNotifications = true;
    prefs.inAppNotifications = true;
    prefs.notificationPreferences = {
      documentUpdates: true,
      queryResponses: true,
      systemAlerts: true,
      marketingEmails: false,
      channels: {
        email: true,
        inApp: true,
        push: false,
      },
    };
    prefs.timezone = 'Europe/Warsaw';
    prefs.dateFormat = 'DD/MM/YYYY';
    return prefs;
  }

  /**
   * Update notification preferences
   */
  updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>,
  ): void {
    const current = this.getNotificationPreferences();
    this.notificationPreferences = {
      ...current,
      ...preferences,
      channels: {
        ...current.channels,
        ...(preferences.channels || {}),
      },
    } as Record<string, unknown>;
  }
}
