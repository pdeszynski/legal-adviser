import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import {
  IDField,
  FilterableField,
  QueryOptions,
  Relation,
} from '@ptc-org/nestjs-query-graphql';
import { UserSession } from './user-session.entity';

/**
 * User Entity
 *
 * Represents a user in the system. Managed by Auth/Identity module.
 * Referenced by UUID in other modules.
 *
 * Uses nestjs-query decorators for GraphQL type generation.
 */
@Entity('users')
@ObjectType('User')
@QueryOptions({ enableTotalCount: true })
@Relation('sessions', () => UserSession, { nullable: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @FilterableField()
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  username: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  lastName: string | null;

  @Column({ type: 'boolean', default: true })
  @FilterableField()
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  @Field()
  disclaimerAccepted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  @Field(() => GraphQLISODateTime, { nullable: true })
  disclaimerAcceptedAt: Date | null;

  /**
   * User role for access control
   * Roles: 'user' | 'admin'
   */
  @Column({ type: 'enum', enum: ['user', 'admin'], default: 'user' })
  @FilterableField(() => String)
  role: 'user' | 'admin';

  /**
   * Hashed password using bcrypt
   * This field is not exposed via GraphQL for security reasons
   */
  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  passwordHash: string | null;

  /**
   * Stripe customer ID for payment processing
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  stripeCustomerId: string | null;

  /**
   * Computed name property for convenience
   */
  get name(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.username || this.email;
  }

  @OneToMany(() => UserSession, (session) => session.user, { cascade: true })
  sessions: UserSession[];

  /**
   * User role assignments from the authorization module
   * Using string reference to avoid circular dependency
   */
  @OneToMany('user_roles', 'user')
  roleAssignments: any[];

  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  updatedAt: Date;

  /**
   * Check if the user can create documents or queries
   * Requires disclaimer to be accepted
   */
  canCreateContent(): boolean {
    return this.disclaimerAccepted && this.isActive;
  }
}
