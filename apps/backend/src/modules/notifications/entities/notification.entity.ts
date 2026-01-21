import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
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

/**
 * Notification entity for tracking sent notifications
 */
@ObjectType()
@Entity('notifications')
export class Notification {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String)
  @Column()
  recipientEmail: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  userId?: string;

  @Field(() => String)
  @Column()
  subject: string;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: EmailTemplateType,
  })
  template: EmailTemplateType;

  @Field(() => String)
  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  templateData?: Record<string, any>;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  messageId?: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
