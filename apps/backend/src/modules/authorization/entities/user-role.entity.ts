import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { IDField, FilterableField } from '@ptc-org/nestjs-query-graphql';
import { RoleEntity } from './role.entity';
import { User } from '../../../modules/users/entities/user.entity';

@Entity('user_roles')
@ObjectType('UserRoleEntity')
export class UserRoleEntity {
  @PrimaryColumn('uuid')
  @IDField(() => ID)
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Field(() => ID)
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'role_id', type: 'uuid' })
  @Field(() => ID)
  roleId: string;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({ name: 'role_id' })
  role?: RoleEntity;

  @Column({ type: 'int', default: 100 })
  @FilterableField()
  priority: number;

  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  notes: string | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  @Field(() => Date, { nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'boolean', default: true })
  @FilterableField()
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  @FilterableField(() => Date)
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  @FilterableField(() => Date)
  updatedAt: Date;
}
