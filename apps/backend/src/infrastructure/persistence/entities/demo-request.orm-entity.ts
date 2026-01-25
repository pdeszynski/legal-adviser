import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  ObjectType,
  Field,
  ID,
  GraphQLISODateTime,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IDField,
  FilterableField,
  QueryOptions,
} from '@ptc-org/nestjs-query-graphql';
import {
  DemoRequestStatusEnum,
  CompanySizeEnum,
} from '../../../domain/demo-request/value-objects';

// Register GraphQL enums for demo request admin
registerEnumType(DemoRequestStatusEnum, {
  name: 'DemoRequestStatus',
  description: 'Demo request status in the sales pipeline',
});

registerEnumType(CompanySizeEnum, {
  name: 'CompanySizeEnum',
  description: 'Company size categories for demo requests',
});

/**
 * DemoRequest ORM Entity
 *
 * Represents the database schema for demo request form submissions in the infrastructure layer.
 * This is separate from the domain DemoRequestAggregate and is used for persistence only.
 *
 * Note: This entity maps to the DDD DemoRequestAggregate through the DemoRequestMapper.
 * Uses nestjs-query decorators for GraphQL type generation and admin queries.
 */
@Entity('demo_requests')
@ObjectType('DemoRequest')
@QueryOptions({ enableTotalCount: true })
export class DemoRequestOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Field(() => String)
  fullName: string;

  @Column({ type: 'varchar', length: 255 })
  @Index('idx_demo_request_email')
  @FilterableField()
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  company: string | null;

  @Column({
    type: 'enum',
    enum: CompanySizeEnum,
    nullable: true,
  })
  @Field(() => CompanySizeEnum, { nullable: true })
  companySize: CompanySizeEnum | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  industry: string | null;

  @Column({ type: 'text' })
  @Field(() => String)
  useCase: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  timeline: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  budget: string | null;

  @Column({ type: 'timestamp', nullable: true })
  @Field(() => GraphQLISODateTime, { nullable: true })
  preferredDemoTime: Date | null;

  @Column({
    type: 'enum',
    enum: DemoRequestStatusEnum,
    default: DemoRequestStatusEnum.NEW,
  })
  @Index('idx_demo_request_status')
  @Field(() => DemoRequestStatusEnum)
  @FilterableField(() => DemoRequestStatusEnum)
  status: DemoRequestStatusEnum;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  hubspotContactId: string | null;

  @Column({ type: 'timestamp', name: 'submitted_at' })
  @Field(() => GraphQLISODateTime)
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  @Field(() => GraphQLISODateTime, { nullable: true })
  contactedAt: Date | null;

  @Column({ type: 'json', nullable: true })
  @Field(() => String, { nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  @Field(() => GraphQLISODateTime)
  updatedAt: Date;
}
