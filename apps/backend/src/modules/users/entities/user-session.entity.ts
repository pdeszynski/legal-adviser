import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  FilterableField,
  IDField,
  QueryOptions,
} from '@ptc-org/nestjs-query-graphql';
import {
  ObjectType,
  ID,
  Field,
  GraphQLISODateTime,
  registerEnumType,
} from '@nestjs/graphql';
import { User } from './user.entity';

/**
 * Session Mode Enum
 *
 * Defines the mode of operation for a user session:
 * - LAWYER: Professional mode with advanced features
 * - SIMPLE: Simplified mode for regular users
 */
export enum SessionMode {
  LAWYER = 'LAWYER',
  SIMPLE = 'SIMPLE',
}

// Register enum with GraphQL
registerEnumType(SessionMode, {
  name: 'SessionMode',
  description: 'Mode of operation for a user session',
});

/**
 * UserSession Entity
 *
 * Tracks user sessions with context (Lawyer vs Simple mode)
 * and legal disclaimer acceptance status.
 *
 * Aggregate Root: UserSession
 * Invariants: A valid UserSession requires disclaimer_accepted = true
 * before allowing creation of LegalDocument or LegalQuery.
 *
 * Uses nestjs-query decorators for GraphQL type generation.
 */
@Entity('user_sessions')
@ObjectType('UserSession')
@QueryOptions({ enableTotalCount: true })
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  @Column({ type: 'uuid' })
  @FilterableField()
  userId: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: SessionMode,
    default: SessionMode.SIMPLE,
  })
  @FilterableField(() => SessionMode)
  mode: SessionMode;

  @Column({ type: 'timestamp', nullable: true })
  @Field(() => GraphQLISODateTime, { nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  @Field(() => GraphQLISODateTime, { nullable: true })
  endedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  updatedAt: Date;

  /**
   * Check if the session is currently active
   */
  isActive(): boolean {
    return this.startedAt !== null && this.endedAt === null;
  }

  /**
   * Start the session
   */
  start(): void {
    this.startedAt = new Date();
    this.endedAt = null;
  }

  /**
   * End the session
   */
  end(): void {
    this.endedAt = new Date();
  }
}
