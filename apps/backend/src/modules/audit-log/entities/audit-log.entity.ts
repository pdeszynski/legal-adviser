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
  Int,
} from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { User } from '../../users/entities/user.entity';

/**
 * Audit Action Type Enum
 *
 * Defines the type of action performed by the user:
 * - CREATE: Resource was created
 * - READ: Resource was accessed/viewed
 * - UPDATE: Resource was modified
 * - DELETE: Resource was deleted
 * - EXPORT: Resource was exported
 * - LOGIN: User logged in
 * - LOGOUT: User logged out
 */
export enum AuditActionType {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
}

/**
 * Resource Type Enum
 *
 * Defines the type of resource that was affected:
 * - USER: User entity
 * - DOCUMENT: Legal document entity
 * - SESSION: User session entity
 * - SYSTEM: System-level operations
 */
export enum AuditResourceType {
  USER = 'USER',
  DOCUMENT = 'DOCUMENT',
  SESSION = 'SESSION',
  SYSTEM = 'SYSTEM',
}

// Register enums with GraphQL
registerEnumType(AuditActionType, {
  name: 'AuditActionType',
  description: 'Type of action performed',
});

registerEnumType(AuditResourceType, {
  name: 'AuditResourceType',
  description: 'Type of resource affected',
});

/**
 * Change Details Interface
 *
 * Stores the before/after state of changes
 */
export interface ChangeDetails {
  /** Fields that were changed */
  changedFields?: string[];
  /** Previous values before the change */
  before?: Record<string, unknown>;
  /** New values after the change */
  after?: Record<string, unknown>;
  /** Additional context or metadata */
  context?: Record<string, unknown>;
}

/**
 * AuditLog Entity
 *
 * Tracks all user actions within the system for compliance and security purposes.
 * Each record captures who did what, when, where from, and what changed.
 *
 * Aggregate Root: AuditLog
 * Invariants:
 *   - action and resourceType are required
 *   - timestamp is automatically generated
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 */
@Entity('audit_logs')
@ObjectType('AuditLog')
@QueryOptions({ enableTotalCount: true })
@Relation('user', () => User, { nullable: true })
@Index(['userId'])
@Index(['resourceType', 'resourceId'])
@Index(['action'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  /**
   * The type of action performed
   */
  @Column({
    type: 'enum',
    enum: AuditActionType,
  })
  @FilterableField(() => AuditActionType)
  action: AuditActionType;

  /**
   * The type of resource affected
   */
  @Column({
    type: 'enum',
    enum: AuditResourceType,
  })
  @FilterableField(() => AuditResourceType)
  resourceType: AuditResourceType;

  /**
   * The ID of the affected resource (nullable for system-level operations)
   */
  @Column({ type: 'uuid', nullable: true })
  @FilterableField(() => String, { nullable: true })
  resourceId: string | null;

  /**
   * The ID of the user who performed the action (nullable for anonymous/system actions)
   */
  @Column({ type: 'uuid', nullable: true })
  @FilterableField(() => String, { nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  /**
   * IP address of the client that performed the action
   */
  @Column({ type: 'varchar', length: 45, nullable: true })
  @FilterableField(() => String, { nullable: true })
  ipAddress: string | null;

  /**
   * User agent string of the client
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  @Field(() => String, { nullable: true })
  userAgent: string | null;

  /**
   * HTTP status code of the operation result
   */
  @Column({ type: 'int', nullable: true })
  @Field(() => Int, { nullable: true })
  statusCode: number | null;

  /**
   * Error message if the operation failed
   */
  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  errorMessage: string | null;

  /**
   * Details of what changed (before/after values, changed fields)
   * Stored as JSONB for flexible querying
   */
  @Column({ type: 'jsonb', nullable: true })
  @Field(() => GraphQLJSON, { nullable: true })
  changeDetails: ChangeDetails | null;

  /**
   * Timestamp when the action occurred
   */
  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  /**
   * Timestamp when the record was last updated
   */
  @UpdateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  updatedAt: Date;

  /**
   * Check if this is a successful operation
   */
  isSuccessful(): boolean {
    return (
      this.statusCode !== null &&
      this.statusCode >= 200 &&
      this.statusCode < 400
    );
  }

  /**
   * Check if this is a failed operation
   */
  isFailed(): boolean {
    return this.statusCode !== null && this.statusCode >= 400;
  }

  /**
   * Check if this is a write operation (CREATE, UPDATE, DELETE)
   */
  isWriteOperation(): boolean {
    return [
      AuditActionType.CREATE,
      AuditActionType.UPDATE,
      AuditActionType.DELETE,
    ].includes(this.action);
  }

  /**
   * Get a human-readable description of the action
   */
  getActionDescription(): string {
    const resourceDesc = this.resourceId
      ? `${this.resourceType} (${this.resourceId})`
      : this.resourceType;
    return `${this.action} on ${resourceDesc}`;
  }
}
