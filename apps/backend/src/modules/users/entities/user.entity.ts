import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { IDField, FilterableField, QueryOptions, Relation } from '@ptc-org/nestjs-query-graphql';
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
   * Hashed password using bcrypt
   * This field is not exposed via GraphQL for security reasons
   */
  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  passwordHash: string | null;

  @OneToMany(() => UserSession, (session) => session.user, { cascade: true })
  sessions: UserSession[];

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
