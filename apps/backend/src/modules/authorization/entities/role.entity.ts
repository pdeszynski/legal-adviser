import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { IDField, FilterableField } from '@ptc-org/nestjs-query-graphql';

@Entity('roles')
@ObjectType('RoleEntity')
export class RoleEntity {
  @PrimaryColumn('uuid')
  @IDField(() => ID)
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @FilterableField()
  name: string;

  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ['super_admin', 'admin', 'lawyer', 'paralegal', 'client', 'guest'],
  })
  @FilterableField(() => String)
  type: 'super_admin' | 'admin' | 'lawyer' | 'paralegal' | 'client' | 'guest';

  @Column({ type: 'simple-array', default: [] })
  @Field(() => [String], { defaultValue: [] })
  permissions: string[];

  @Column({
    type: 'enum',
    enum: ['super_admin', 'admin', 'lawyer', 'paralegal', 'client', 'guest'],
    nullable: true,
  })
  @Field(() => String, { nullable: true })
  inheritsFrom:
    | 'super_admin'
    | 'admin'
    | 'lawyer'
    | 'paralegal'
    | 'client'
    | 'guest'
    | null;

  @Column({ type: 'boolean', default: false })
  @FilterableField()
  isSystemRole: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => Date)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @FilterableField(() => Date)
  updatedAt: Date;
}
