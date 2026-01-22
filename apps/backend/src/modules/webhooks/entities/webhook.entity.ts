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
 * Webhook Events that can be subscribed to
 */
export enum WebhookEvent {
  // Document events
  DOCUMENT_CREATED = 'document.created',
  DOCUMENT_UPDATED = 'document.updated',
  DOCUMENT_DELETED = 'document.deleted',
  DOCUMENT_GENERATION_COMPLETED = 'document.generation.completed',
  DOCUMENT_EXPORTED = 'document.exported',

  // Query events
  QUERY_ASKED = 'query.asked',
  QUERY_ANSWERED = 'query.answered',

  // User events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',

  // Subscription events
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPGRADED = 'subscription.upgraded',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
}

/**
 * Webhook Status
 */
export enum WebhookStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISABLED = 'disabled',
}

registerEnumType(WebhookEvent, {
  name: 'WebhookEvent',
  description: 'Events that can be subscribed to',
});

registerEnumType(WebhookStatus, {
  name: 'WebhookStatus',
  description: 'Webhook status',
});

/**
 * Webhook Entity
 *
 * Represents a webhook subscription for external integrations.
 * Stores endpoint URL, events to listen to, and secret for signature verification.
 *
 * Aggregate Root: Webhook
 * Invariants:
 *   - url must be a valid HTTPS URL
 *   - events must be non-empty
 *   - secret must be at least 20 characters
 *   - isActive returns true only for ACTIVE status webhooks
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 */
@Entity('webhooks')
@ObjectType('Webhook')
@QueryOptions({ enableTotalCount: true })
@Relation('user', () => User)
@Index(['userId'])
@Index(['status'])
@Index(['events'])
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  /**
   * Reference to the user who owns this webhook
   */
  @Column({ type: 'uuid' })
  @FilterableField()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Human-readable name for the webhook
   * e.g., "Slack Integration", "Custom CRM"
   */
  @Column({ type: 'varchar', length: 255 })
  @FilterableField()
  name: string;

  /**
   * Webhook endpoint URL (must be HTTPS)
   */
  @Column({ type: 'varchar', length: 2048 })
  @FilterableField()
  url: string;

  /**
   * Events to subscribe to
   * Stored as array in PostgreSQL
   */
  @Column({ type: 'enum', enum: WebhookEvent, array: true })
  @FilterableField(() => [WebhookEvent])
  events: WebhookEvent[];

  /**
   * Secret key for HMAC signature verification
   * Used to verify webhook authenticity
   */
  @Column({ type: 'varchar', length: 255, select: false })
  secret: string;

  /**
   * Status of the webhook
   */
  @Column({
    type: 'enum',
    enum: WebhookStatus,
    default: WebhookStatus.ACTIVE,
  })
  @FilterableField(() => WebhookStatus)
  status: WebhookStatus;

  /**
   * Optional HTTP headers to include in webhook requests
   * Stored as JSONB in PostgreSQL
   */
  @Column({ type: 'jsonb', nullable: true })
  @FilterableField(() => String, { nullable: true })
  headers: Record<string, string> | null;

  /**
   * Maximum number of retry attempts for failed deliveries
   */
  @Column({ type: 'int', default: 3 })
  @FilterableField()
  maxRetries: number;

  /**
   * Timeout in milliseconds for webhook delivery
   */
  @Column({ type: 'int', default: 30000 })
  @FilterableField()
  timeoutMs: number;

  /**
   * Number of successful deliveries
   */
  @Column({ type: 'int', default: 0 })
  @FilterableField()
  successCount: number;

  /**
   * Number of failed deliveries
   */
  @Column({ type: 'int', default: 0 })
  @FilterableField()
  failureCount: number;

  /**
   * Timestamp of last successful delivery
   */
  @Column({ type: 'timestamp', nullable: true })
  @Field(() => GraphQLISODateTime, { nullable: true })
  lastSuccessAt: Date | null;

  /**
   * Timestamp of last delivery attempt (success or failure)
   */
  @Column({ type: 'timestamp', nullable: true })
  @Field(() => GraphQLISODateTime, { nullable: true })
  lastDeliveryAt: Date | null;

  /**
   * Optional description or notes about the webhook's purpose
   */
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  updatedAt: Date;

  /**
   * Check if the webhook is currently active
   */
  isActive(): boolean {
    return this.status === WebhookStatus.ACTIVE;
  }

  /**
   * Check if the webhook is subscribed to a specific event
   */
  isSubscribedTo(event: WebhookEvent): boolean {
    return this.events.includes(event);
  }

  /**
   * Check if the webhook is subscribed to any of the specified events
   */
  isSubscribedToAny(events: WebhookEvent[]): boolean {
    return events.some((event) => this.isSubscribedTo(event));
  }

  /**
   * Disable the webhook
   */
  disable(): void {
    this.status = WebhookStatus.DISABLED;
  }

  /**
   * Activate the webhook
   */
  activate(): void {
    this.status = WebhookStatus.ACTIVE;
  }

  /**
   * Deactivate the webhook (temporary pause)
   */
  deactivate(): void {
    this.status = WebhookStatus.INACTIVE;
  }

  /**
   * Record a successful delivery
   */
  recordSuccess(): void {
    this.successCount += 1;
    this.lastSuccessAt = new Date();
    this.lastDeliveryAt = new Date();
  }

  /**
   * Record a failed delivery
   */
  recordFailure(): void {
    this.failureCount += 1;
    this.lastDeliveryAt = new Date();
  }

  /**
   * Generate a new secret key
   * Returns a 64-character hex string
   */
  static generateSecret(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Create a new webhook entity
   */
  static create(
    userId: string,
    name: string,
    url: string,
    events: WebhookEvent[],
    options?: {
      description?: string | null;
      headers?: Record<string, string> | null;
      maxRetries?: number;
      timeoutMs?: number;
    },
  ): { entity: Webhook; secret: string } {
    const secret = this.generateSecret();

    const entity = new Webhook();
    entity.userId = userId;
    entity.name = name;
    entity.url = url;
    entity.events = events;
    entity.secret = secret;
    entity.status = WebhookStatus.ACTIVE;
    entity.description = options?.description ?? null;
    entity.headers = options?.headers ?? null;
    entity.maxRetries = options?.maxRetries ?? 3;
    entity.timeoutMs = options?.timeoutMs ?? 30000;
    entity.successCount = 0;
    entity.failureCount = 0;

    return { entity, secret };
  }
}
