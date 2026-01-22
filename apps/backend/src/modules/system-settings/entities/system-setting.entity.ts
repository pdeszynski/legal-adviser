import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import {
  IDField,
  FilterableField,
  QueryOptions,
} from '@ptc-org/nestjs-query-graphql';

/**
 * System Setting Value Types
 */
export enum SettingValueType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
}

/**
 * System Setting Categories
 */
export enum SettingCategory {
  AI = 'ai',
  FEATURE_FLAGS = 'feature_flags',
  MAINTENANCE = 'maintenance',
  GENERAL = 'general',
}

/**
 * System Setting Entity
 *
 * Stores system-wide configuration settings.
 * Only accessible by admin users.
 */
@Entity('system_settings')
@ObjectType('SystemSetting')
@QueryOptions({ enableTotalCount: true })
export class SystemSetting {
  @PrimaryGeneratedColumn('uuid')
  @IDField(() => ID)
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @FilterableField()
  key: string;

  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  value: string | null;

  @Column({
    type: 'enum',
    enum: SettingValueType,
    default: SettingValueType.STRING,
  })
  @FilterableField(() => SettingValueType)
  valueType: SettingValueType;

  @Column({
    type: 'enum',
    enum: SettingCategory,
    default: SettingCategory.GENERAL,
  })
  @FilterableField(() => SettingCategory)
  category: SettingCategory;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  @Field(() => String, { nullable: true })
  metadata: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @FilterableField(() => GraphQLISODateTime)
  updatedAt: Date;

  /**
   * Get typed value
   */
  getTypedValue<T = string>(): T {
    if (this.value === null) return null as T;

    switch (this.valueType) {
      case SettingValueType.BOOLEAN:
        return (this.value === 'true') as T;
      case SettingValueType.NUMBER:
        return parseFloat(this.value) as T;
      case SettingValueType.JSON:
        return JSON.parse(this.value) as T;
      case SettingValueType.STRING:
      default:
        return this.value as T;
    }
  }

  /**
   * Set typed value
   */
  setTypedValue<T>(value: T): void {
    switch (this.valueType) {
      case SettingValueType.BOOLEAN:
        this.value = value ? 'true' : 'false';
        break;
      case SettingValueType.NUMBER:
        this.value = String(value);
        break;
      case SettingValueType.JSON:
        this.value = JSON.stringify(value);
        break;
      case SettingValueType.STRING:
      default:
        this.value = String(value);
        break;
    }
  }
}
