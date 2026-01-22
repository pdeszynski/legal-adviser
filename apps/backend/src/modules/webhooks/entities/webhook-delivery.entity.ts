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
  GraphQLISODateTime,
  Int,
  registerEnumType,
} from '@nestjs/graphql';
import { Webhook } from './webhook.entity';

/**
 * Webhook Delivery Status
 */
export enum DeliveryStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

registerEnumType(DeliveryStatus, {
  name: 'DeliveryStatus',
  description: 'Webhook delivery status',
});

/**
 * WebhookDelivery Entity
 *
 * Represents a single webhook delivery attempt.
 * Tracks the request payload, response, and delivery status.
 *
 * Aggregate Root: WebhookDelivery
 * Invariants:
 *   - status must be one of the defined DeliveryStatus values
 *   - attemptCount must be positive
 *   - httpResponseCode must be positive if set
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 */
@Entity('webhook_deliveries')
@ObjectType('WebhookDelivery')
@QueryOptions({ enableTotalCount: true })
@Relation('webhook', () => Webhook)
@Index(['webhookId'])
@Index(['status'])
@Index(['event'])
@Index(['createdAt'])
export class WebhookDelivery {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  /**
   * Reference to the webhook that triggered this delivery
   */
  @Column({ type: 'uuid' })
  @FilterableField()
  webhookId: string;

  @ManyToOne(() => Webhook, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'webhookId' })
  webhook: Webhook;

  /**
   * Event type that triggered this delivery
   */
  @Column({ type: 'varchar', length: 255 })
  @FilterableField()
  event: string;

  /**
   * Event payload data
   * Stored as JSONB in PostgreSQL
   */
  @Column({ type: 'jsonb' })
  @FilterableField(() => String)
  payload: Record<string, unknown>;

  /**
   * Delivery status
   */
  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  @FilterableField(() => DeliveryStatus)
  status: DeliveryStatus;

  /**
   * HTTP response code from webhook endpoint
   */
  @Column({ type: 'int', nullable: true })
  @FilterableField(() => Int, { nullable: true })
  httpResponseCode: number | null;

  /**
   * Response body from webhook endpoint
   */
  @Column({ type: 'text', nullable: true })
  @FilterableField(() => String, { nullable: true })
  responseBody: string | null;

  /**
   * Error message if delivery failed
   */
  @Column({ type: 'text', nullable: true })
  @FilterableField(() => String, { nullable: true })
  errorMessage: string | null;

  /**
   * Number of delivery attempts
   */
  @Column({ type: 'int', default: 1 })
  @FilterableField(() => Int)
  attemptCount: number;

  /**
   * Timestamp when the delivery will be retried (for failed deliveries)
   */
  @Column({ type: 'timestamp', nullable: true })
  @FilterableField(() => GraphQLISODateTime, { nullable: true })
  nextRetryAt: Date | null;

  /**
   * Duration of the HTTP request in milliseconds
   */
  @Column({ type: 'int', nullable: true })
  @FilterableField(() => Int, { nullable: true })
  durationMs: number | null;

  /**
   * ID of the Bull queue job processing this delivery
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  @FilterableField(() => String, { nullable: true })
  jobId: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  /**
   * Mark the delivery as successful
   */
  markAsSuccess(
    responseCode: number,
    responseBody: string,
    durationMs: number,
  ): void {
    this.status = DeliveryStatus.SUCCESS;
    this.httpResponseCode = responseCode;
    this.responseBody = responseBody;
    this.errorMessage = null;
    this.durationMs = durationMs;
    this.nextRetryAt = null;
  }

  /**
   * Mark the delivery as failed
   */
  markAsFailed(error: string, responseCode?: number): void {
    this.status = DeliveryStatus.FAILED;
    this.errorMessage = error;
    this.httpResponseCode = responseCode ?? null;
    this.nextRetryAt = null;
  }

  /**
   * Mark the delivery as retrying
   */
  markForRetry(nextRetryAt: Date): void {
    this.status = DeliveryStatus.RETRYING;
    this.nextRetryAt = nextRetryAt;
  }

  /**
   * Increment the attempt counter
   */
  incrementAttempts(): void {
    this.attemptCount += 1;
  }

  /**
   * Check if the delivery can be retried
   */
  canRetry(maxRetries: number): boolean {
    return (
      this.attemptCount < maxRetries && this.status !== DeliveryStatus.SUCCESS
    );
  }

  /**
   * Create a new webhook delivery log entry
   */
  static create(
    webhookId: string,
    event: string,
    payload: Record<string, unknown>,
  ): WebhookDelivery {
    const entity = new WebhookDelivery();
    entity.webhookId = webhookId;
    entity.event = event;
    entity.payload = payload;
    entity.status = DeliveryStatus.PENDING;
    entity.attemptCount = 0;

    return entity;
  }
}
