import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
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
  Int,
  registerEnumType,
} from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { User } from '../../users/entities/user.entity';

/**
 * In-App Notification Type Enum
 *
 * Defines the different types of in-app notifications
 */
export enum InAppNotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SYSTEM = 'system',
}

// Register enum with GraphQL
registerEnumType(InAppNotificationType, {
  name: 'InAppNotificationType',
  description: 'Types of in-app notifications',
});

/**
 * In-App Notification Entity
 *
 * Stores user-facing in-app notifications with read status tracking.
 * Unlike the Notification entity (which tracks email notifications),
 * this entity is for displaying notifications in the web UI.
 *
 * Features:
 * - Type-based categorization (info, success, warning, error, system)
 * - User association with foreign key relation
 * - Read/unread status tracking
 * - Optional action link for navigation
 * - Timestamp for ordering
 * - Metadata for extensibility
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 *
 * Aggregate Root: InAppNotification
 * Invariants:
 *   - A notification must belong to a user
 *   - A notification must have a type and message
 *   - Read status defaults to false (unread)
 */
@Entity('in_app_notifications')
@ObjectType('InAppNotification')
@QueryOptions({ enableTotalCount: true })
@Relation('user', () => User)
@Index(['userId'])
@Index(['read'])
@Index(['createdAt'])
export class InAppNotification {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  /**
   * Reference to the user who owns this notification
   */
  @Column({ type: 'uuid' })
  @FilterableField()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  /**
   * Type of notification for UI styling and filtering
   */
  @Column({
    type: 'enum',
    enum: InAppNotificationType,
    default: InAppNotificationType.INFO,
  })
  @FilterableField(() => InAppNotificationType)
  type: InAppNotificationType;

  /**
   * The notification message content
   */
  @Column({ type: 'text' })
  @FilterableField()
  message: string;

  /**
   * Read status - false by default (unread)
   */
  @Column({ type: 'boolean', default: false })
  @FilterableField()
  read: boolean;

  /**
   * Optional action link for navigation when notification is clicked
   * Can be a relative path like '/documents/123' or external URL
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  @Field(() => String, { nullable: true })
  actionLink?: string | null;

  /**
   * Optional action label for the action link button
   * e.g., 'View Document', 'Go to Settings'
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  @Field(() => String, { nullable: true })
  actionLabel?: string | null;

  /**
   * Additional metadata for extensibility
   * Can store related entity IDs, custom data, etc.
   */
  @Column({ type: 'jsonb', nullable: true, default: {} })
  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: Record<string, unknown> | null;

  /**
   * Timestamp when the notification was created
   */
  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  /**
   * Mark the notification as read
   */
  markAsRead(): void {
    this.read = true;
  }

  /**
   * Mark the notification as unread
   */
  markAsUnread(): void {
    this.read = false;
  }

  /**
   * Toggle read status
   */
  toggleReadStatus(): void {
    this.read = !this.read;
  }

  /**
   * Check if notification is unread
   */
  isUnread(): boolean {
    return !this.read;
  }

  /**
   * Check if notification has an actionable link
   */
  hasAction(): boolean {
    return (
      this.actionLink !== null &&
      this.actionLink !== undefined &&
      this.actionLink.length > 0
    );
  }
}
