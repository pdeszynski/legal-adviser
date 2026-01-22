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
import { ObjectType, ID, Field, GraphQLISODateTime } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { UserSubscription } from './user-subscription.entity';

/**
 * Payment Status
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

/**
 * Payment Method
 */
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  OTHER = 'OTHER',
}

/**
 * Payment Entity
 *
 * Represents a payment transaction for a subscription.
 * Tracks payment status, amount, method, and Stripe integration.
 *
 * Aggregate Root: Payment
 * Invariants:
 *   - amount must be positive
 *   - status must be valid
 *   - subscription must exist
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 */
@Entity('payments')
@ObjectType('Payment')
@QueryOptions({ enableTotalCount: true })
@Relation('user', () => User)
@Relation('subscription', () => UserSubscription)
@Index(['userId'])
@Index(['subscriptionId'])
@Index(['status'])
@Index(['createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  /**
   * Reference to the user who made the payment
   */
  @Column({ type: 'uuid' })
  @FilterableField()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Reference to the subscription
   */
  @Column({ type: 'uuid' })
  @FilterableField()
  subscriptionId: string;

  @ManyToOne(() => UserSubscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: UserSubscription;

  /**
   * Payment amount in USD
   */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @FilterableField()
  amount: number;

  /**
   * Currency code (default: USD)
   */
  @Column({ type: 'varchar', length: 3, default: 'USD' })
  @FilterableField()
  currency: string;

  /**
   * Current payment status
   */
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @FilterableField(() => PaymentStatus)
  status: PaymentStatus;

  /**
   * Payment method used
   */
  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CREDIT_CARD,
  })
  @FilterableField(() => PaymentMethod)
  method: PaymentMethod;

  /**
   * Stripe payment intent ID
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  stripePaymentIntentId: string | null;

  /**
   * Stripe invoice ID
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  stripeInvoiceId: string | null;

  /**
   * Description of the payment
   */
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  description: string | null;

  /**
   * Failure reason if payment failed
   */
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  failureReason: string | null;

  /**
   * Refund amount if applicable
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @Field(() => String, { nullable: true })
  refundAmount: number | null;

  /**
   * Date when the refund was processed
   */
  @Column({ type: 'timestamp', nullable: true })
  @Field(() => GraphQLISODateTime, { nullable: true })
  refundedAt: Date | null;

  /**
   * Metadata related to the payment (JSON string)
   */
  @Column({ type: 'jsonb', default: '{}' })
  @Field(() => String)
  metadata: string;

  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  /**
   * Check if the payment is successful
   */
  isSuccessful(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }

  /**
   * Check if the payment is pending
   */
  isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  /**
   * Check if the payment failed
   */
  isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }

  /**
   * Check if the payment was refunded
   */
  isRefunded(): boolean {
    return (
      this.status === PaymentStatus.REFUNDED ||
      this.status === PaymentStatus.PARTIALLY_REFUNDED
    );
  }

  /**
   * Mark the payment as completed
   */
  markAsCompleted(): void {
    this.status = PaymentStatus.COMPLETED;
  }

  /**
   * Mark the payment as failed
   */
  markAsFailed(reason: string): void {
    this.status = PaymentStatus.FAILED;
    this.failureReason = reason;
  }

  /**
   * Process a refund
   */
  processRefund(amount: number): void {
    if (amount > Number(this.amount)) {
      throw new Error('Refund amount cannot exceed payment amount');
    }

    if (amount === Number(this.amount)) {
      this.status = PaymentStatus.REFUNDED;
      this.refundAmount = amount;
    } else {
      this.status = PaymentStatus.PARTIALLY_REFUNDED;
      this.refundAmount = amount;
    }

    this.refundedAt = new Date();
  }

  /**
   * Create a new payment
   */
  static create(
    userId: string,
    subscriptionId: string,
    amount: number,
    options?: {
      currency?: string;
      method?: PaymentMethod;
      stripePaymentIntentId?: string | null;
      stripeInvoiceId?: string | null;
      description?: string | null;
    },
  ): Payment {
    const payment = new Payment();
    payment.userId = userId;
    payment.subscriptionId = subscriptionId;
    payment.amount = amount;
    payment.currency = options?.currency ?? 'USD';
    payment.method = options?.method ?? PaymentMethod.CREDIT_CARD;
    payment.status = PaymentStatus.PENDING;
    payment.stripePaymentIntentId = options?.stripePaymentIntentId ?? null;
    payment.stripeInvoiceId = options?.stripeInvoiceId ?? null;
    payment.description = options?.description ?? null;
    payment.metadata = '{}';

    return payment;
  }
}
