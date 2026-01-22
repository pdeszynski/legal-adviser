import {
  Field,
  InputType,
  ObjectType,
  Int,
  registerEnumType,
} from '@nestjs/graphql';
import {
  SettingValueType,
  SettingCategory,
} from '../entities/system-setting.entity';

registerEnumType(SettingValueType, {
  name: 'SettingValueType',
  description: 'System setting value types',
});

registerEnumType(SettingCategory, {
  name: 'SettingCategory',
  description: 'System setting categories',
});

/**
 * Input for creating or updating a system setting
 */
@InputType('SystemSettingInput')
export class SystemSettingInput {
  @Field(() => String)
  key: string;

  @Field(() => String, { nullable: true })
  value?: string | null;

  @Field(() => SettingValueType, { nullable: true })
  valueType?: SettingValueType;

  @Field(() => SettingCategory, { nullable: true })
  category?: SettingCategory;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  metadata?: string | null;
}

/**
 * Input for bulk updating settings
 */
@InputType('BulkUpdateSettingsInput')
export class BulkUpdateSettingsInput {
  @Field(() => [SystemSettingInput])
  settings: SystemSettingInput[];
}

/**
 * Response for settings operations
 */
@ObjectType('SystemSettingResponse')
export class SystemSettingResponse {
  @Field(() => String)
  key: string;

  @Field(() => String, { nullable: true })
  value: string | null;

  @Field(() => Boolean)
  success: boolean;

  @Field(() => String, { nullable: true })
  error?: string | null;
}
