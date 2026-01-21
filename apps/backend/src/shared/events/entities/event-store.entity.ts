import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Event Store Entity (Outbox Pattern)
 *
 * Stores domain events for reliable, exactly-once delivery.
 * This implements the outbox pattern to ensure events are only
 * published after the database transaction commits.
 *
 * ## Event States
 *
 * 1. **PENDING** - Event created, waiting to be published
 * 2. **PUBLISHED** - Event successfully published to message queue
 * 3. **FAILED** - Event publishing failed, will be retried
 *
 * ## Cleanup
 *
 * Published events should be periodically cleaned up based on age.
 * A typical retention period is 7-30 days depending on audit requirements.
 *
 * ## Monitoring
 *
 * - High PENDING count: Event dispatcher may be down
 * - High FAILED count: Integration issues with message queue
 * - Growing table size: Cleanup job may not be running
 */
@Entity('event_store')
export class EventStore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Unique event ID from the domain event
   * Used for idempotency - prevents duplicate processing
   */
  @Column({ type: 'uuid', unique: true })
  @Index()
  eventId: string;

  /**
   * Event name (e.g., 'user.created', 'document.generation.completed')
   */
  @Column({ type: 'varchar', length: 255 })
  @Index()
  eventName: string;

  /**
   * Aggregate ID (the entity that generated this event)
   */
  @Column({ type: 'uuid', nullable: true })
  @Index()
  aggregateId: string | null;

  /**
   * Aggregate type (e.g., 'User', 'Document', 'LegalQuery')
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  aggregateType: string | null;

  /**
   * Event payload (serialized domain event data)
   * Stored as JSONB for efficient querying in PostgreSQL
   */
  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  /**
   * Event version for schema evolution
   */
  @Column({ type: 'int', default: 1 })
  eventVersion: number;

  /**
   * When the event occurred (domain time, not database time)
   */
  @Column({ type: 'timestamp with time zone' })
  occurredAt: Date;

  /**
   * Current state of the event
   */
  @Column({
    type: 'enum',
    enum: ['PENDING', 'PUBLISHED', 'FAILED'],
    default: 'PENDING',
  })
  @Index()
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';

  /**
   * Number of publish attempts
   */
  @Column({ type: 'int', default: 0 })
  attempts: number;

  /**
   * Last error message (if publishing failed)
   */
  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  /**
   * When the event was stored in the outbox
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * When the event was published (null if not yet published)
   */
  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  publishedAt: Date | null;

  /**
   * Next retry time (null if not failed or no more retries)
   */
  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  nextRetryAt: Date | null;
}
