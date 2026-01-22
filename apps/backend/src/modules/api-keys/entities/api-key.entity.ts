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
  Int,
} from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

/**
 * API Key Scopes
 * Defines the permissions/grants for an API key
 */
export enum ApiKeyScope {
  // Document operations
  DOCUMENTS_READ = 'documents:read',
  DOCUMENTS_WRITE = 'documents:write',
  DOCUMENTS_DELETE = 'documents:delete',

  // Query operations
  QUERIES_READ = 'queries:read',
  QUERIES_WRITE = 'queries:write',
  QUERIES_DELETE = 'queries:delete',

  // Template operations
  TEMPLATES_READ = 'templates:read',
  TEMPLATES_WRITE = 'templates:write',

  // Ruling search
  RULINGS_READ = 'rulings:read',
  RULINGS_SEARCH = 'rulings:search',

  // AI operations
  AI_GENERATE = 'ai:generate',
  AI_ANALYZE = 'ai:analyze',

  // User profile
  PROFILE_READ = 'profile:read',
  PROFILE_WRITE = 'profile:write',
}

/**
 * ApiKey Status
 */
export enum ApiKeyStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

/**
 * ApiKey Entity
 *
 * Represents an API key for programmatic access to the platform.
 * Stores hashed keys, scopes, rate limits, and expiration dates.
 *
 * Security:
 * - The actual key is hashed using bcrypt before storage
 * - Only the key hash is persisted, never the raw key
 * - A key prefix is stored for identification (e.g., "pk_...")
 *
 * Aggregate Root: ApiKey
 * Invariants:
 *   - keyHash must be a valid bcrypt hash
 *   - scopes must be non-empty
 *   - rateLimitPerMinute must be positive
 *   - expiresAt must be in the future when created
 *   - lastUsedAt cannot be before createdAt
 *
 * Uses nestjs-query decorators for auto-generated CRUD resolvers.
 */
@Entity('api_keys')
@ObjectType('ApiKey')
@QueryOptions({ enableTotalCount: true })
@Relation('user', () => User)
@Index(['userId'])
@Index(['status'])
@Index(['expiresAt'])
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  /**
   * Reference to the user who owns this API key
   */
  @Column({ type: 'uuid' })
  @FilterableField()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Human-readable name for the API key
   * e.g., "Production App", "Testing Script"
   */
  @Column({ type: 'varchar', length: 255 })
  @FilterableField()
  name: string;

  /**
   * Hashed API key using bcrypt
   * This field is not exposed via GraphQL for security reasons
   * Raw key format: pk_<UUID> (32 chars prefix)
   */
  @Column({ type: 'varchar', length: 255, select: false })
  keyHash: string;

  /**
   * Key prefix for identification (e.g., "pk_abc123...")
   * Shown to user so they can identify the key in the UI
   */
  @Column({ type: 'varchar', length: 20 })
  @FilterableField()
  keyPrefix: string;

  /**
   * Scopes/permissions granted to this API key
   * Stored as array in PostgreSQL, exposed as JSON string in GraphQL
   */
  @Column({ type: 'enum', enum: ApiKeyScope, array: true })
  @FilterableField(() => [ApiKeyScope])
  scopes: ApiKeyScope[];

  /**
   * Maximum number of requests allowed per minute
   * null = no limit (use with caution)
   */
  @Column({ type: 'int', nullable: true, default: 60 })
  @FilterableField(() => Int, { nullable: true })
  rateLimitPerMinute: number | null;

  /**
   * Status of the API key
   */
  @Column({
    type: 'enum',
    enum: ApiKeyStatus,
    default: ApiKeyStatus.ACTIVE,
  })
  @FilterableField(() => ApiKeyStatus)
  status: ApiKeyStatus;

  /**
   * Expiration date for the API key
   * null = never expires
   */
  @Column({ type: 'timestamp', nullable: true })
  @FilterableField(() => GraphQLISODateTime, { nullable: true })
  expiresAt: Date | null;

  /**
   * Timestamp when the key was last used
   */
  @Column({ type: 'timestamp', nullable: true })
  @Field(() => GraphQLISODateTime, { nullable: true })
  lastUsedAt: Date | null;

  /**
   * IP address from which the key was last used
   */
  @Column({ type: 'varchar', length: 45, nullable: true })
  @Field(() => String, { nullable: true })
  lastUsedIp: string | null;

  /**
   * Number of times this key has been used
   */
  @Column({ type: 'int', default: 0 })
  @FilterableField()
  usageCount: number;

  /**
   * Optional description or notes about the key's purpose
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
   * Check if the API key is currently valid
   * Must be active and not expired
   */
  isValid(): boolean {
    if (this.status !== ApiKeyStatus.ACTIVE) {
      return false;
    }

    if (this.expiresAt && this.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Check if the API key has a specific scope
   */
  hasScope(scope: ApiKeyScope): boolean {
    return this.scopes.includes(scope);
  }

  /**
   * Check if the API key has all the specified scopes
   */
  hasAllScopes(requiredScopes: ApiKeyScope[]): boolean {
    return requiredScopes.every((scope) => this.hasScope(scope));
  }

  /**
   * Check if the API key has at least one of the specified scopes
   */
  hasAnyScope(requiredScopes: ApiKeyScope[]): boolean {
    return requiredScopes.some((scope) => this.hasScope(scope));
  }

  /**
   * Revoke the API key
   */
  revoke(): void {
    this.status = ApiKeyStatus.REVOKED;
  }

  /**
   * Record usage of the API key
   */
  recordUsage(ipAddress: string): void {
    this.lastUsedAt = new Date();
    this.lastUsedIp = ipAddress;
    this.usageCount += 1;

    // Auto-expire if past expiration date
    if (this.expiresAt && this.expiresAt < new Date()) {
      this.status = ApiKeyStatus.EXPIRED;
    }
  }

  /**
   * Generate a new API key (not stored, only returned on creation)
   * Format: pk_<UUID> (32 characters)
   */
  static generateKey(): string {
    const uuid = crypto.randomUUID();
    return `pk_${uuid.replace(/-/g, '')}`;
  }

  /**
   * Get key prefix for identification
   * Returns first 12 characters of the key
   */
  static getKeyPrefix(key: string): string {
    return key.substring(0, 12);
  }

  /**
   * Create a new API key entity
   */
  static create(
    userId: string,
    name: string,
    scopes: ApiKeyScope[],
    options?: {
      rateLimitPerMinute?: number | null;
      expiresAt?: Date | null;
      description?: string | null;
    },
  ): { entity: ApiKey; rawKey: string } {
    const rawKey = this.generateKey();
    const keyPrefix = this.getKeyPrefix(rawKey);

    const entity = new ApiKey();
    entity.userId = userId;
    entity.name = name;
    entity.scopes = scopes;
    entity.keyPrefix = keyPrefix;
    entity.rateLimitPerMinute = options?.rateLimitPerMinute ?? 60;
    entity.expiresAt = options?.expiresAt ?? null;
    entity.description = options?.description ?? null;
    entity.status = ApiKeyStatus.ACTIVE;
    entity.usageCount = 0;

    // Note: The keyHash will be set by the service layer using bcrypt
    // This is a separation of concerns - the entity doesn't know about hashing

    return { entity, rawKey };
  }
}
