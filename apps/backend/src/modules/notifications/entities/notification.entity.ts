import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  FilterableField,
  IDField,
  QueryOptions,
} from '@ptc-org/nestjs-query-graphql';
import { EmailTemplateType } from '../dto/send-email.input';

/**
 * Notification status enum
 */
export enum NotificationStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENT = 'sent',
  FAILED = 'failed',
  BOUNCED = 'bounced',
}

// Register enum with GraphQL
registerEnumType(NotificationStatus, {
  name: 'NotificationStatus',
  description: 'Status of email notifications',
});

/**
 * Notification entity for tracking sent notifications
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 * This entity tracks email notifications sent through the system.
 */
@ObjectType('Notification')
@QueryOptions({ enableTotalCount: true })
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  @Column()
  @FilterableField()
  recipientEmail: string;

  @Column({ nullable: true })
  @FilterableField({ nullable: true })
  userId?: string;

  @Column()
  @FilterableField()
  subject: string;

  @Column({
    type: 'enum',
    enum: EmailTemplateType,
  })
  @FilterableField(() => EmailTemplateType)
  template: EmailTemplateType;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  @FilterableField(() => NotificationStatus)
  status: NotificationStatus;

  @Column({ type: 'jsonb', nullable: true })
  @Field(() => String, { nullable: true })
  templateData?: string;

  @Column({ nullable: true })
  @FilterableField({ nullable: true })
  messageId?: string;

  @Column({ type: 'text', nullable: true })
  @FilterableField({ nullable: true })
  errorMessage?: string;

  @Column({ type: 'jsonb', nullable: true })
  @Field(() => String, { nullable: true })
  metadata?: string;

  @Column({ type: 'timestamp', nullable: true })
  @FilterableField({ nullable: true })
  sentAt?: Date;

  @CreateDateColumn()
  @FilterableField()
  createdAt: Date;

  @UpdateDateColumn()
  @FilterableField()
  updatedAt: Date;
}
