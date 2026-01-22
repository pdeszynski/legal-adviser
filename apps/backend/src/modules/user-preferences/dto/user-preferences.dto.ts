import { Field, ObjectType, ID, InputType } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  MinLength,
  IsNotEmpty,
  ValidateNested,
  IsEnum,
  IsBoolean,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ThemePreference,
  AiModelType,
  NotificationPreferences,
} from '../entities/user-preferences.entity';

/**
 * Notification Channels Input
 * Input for updating notification channel preferences
 */
@InputType()
export class NotificationChannelsInput {
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  inApp?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  push?: boolean;
}

/**
 * Notification Preferences Input
 * Input for updating granular notification preferences
 */
@InputType()
export class NotificationPreferencesInput {
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  documentUpdates?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  queryResponses?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  systemAlerts?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;

  @Field(() => NotificationChannelsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationChannelsInput)
  channels?: NotificationChannelsInput;
}

/**
 * Create UserPreferences Input
 * DTO for creating new user preferences
 * Used by nestjs-query auto-generated createOne mutation
 */
@InputType('CreateUserPreferencesInput')
export class CreateUserPreferencesInput {
  @Field(() => String)
  @IsUUID('4', { message: 'User ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @Field(() => String, { nullable: true, defaultValue: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(5, { message: 'Locale must be at most 5 characters' })
  @Matches(/^[a-z]{2}(-[A-Z]{2})?$/, {
    message: 'Locale must be a valid ISO 639-1 code (e.g., en, pl, de)',
  })
  locale?: string;

  @Field(() => ThemePreference, {
    nullable: true,
    defaultValue: ThemePreference.SYSTEM,
  })
  @IsOptional()
  @IsEnum(ThemePreference, {
    message: `Theme must be one of: ${Object.values(ThemePreference).join(', ')}`,
  })
  theme?: ThemePreference;

  @Field(() => AiModelType, {
    nullable: true,
    defaultValue: AiModelType.GPT_4_TURBO,
  })
  @IsOptional()
  @IsEnum(AiModelType, {
    message: `AI model must be one of: ${Object.values(AiModelType).join(', ')}`,
  })
  aiModel?: AiModelType;

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @Field(() => Boolean, { nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  inAppNotifications?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Timezone must be at most 50 characters' })
  timezone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Date format must be at most 20 characters' })
  dateFormat?: string;

  @Field(() => NotificationPreferencesInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationPreferencesInput)
  notificationPreferences?: NotificationPreferencesInput;
}

/**
 * Update UserPreferences Input
 * DTO for updating user preferences (all fields optional)
 * Used by nestjs-query auto-generated updateOne mutation
 */
@InputType('UpdateUserPreferencesInput')
export class UpdateUserPreferencesInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5, { message: 'Locale must be at most 5 characters' })
  @Matches(/^[a-z]{2}(-[A-Z]{2})?$/, {
    message: 'Locale must be a valid ISO 639-1 code (e.g., en, pl, de)',
  })
  locale?: string;

  @Field(() => ThemePreference, { nullable: true })
  @IsOptional()
  @IsEnum(ThemePreference, {
    message: `Theme must be one of: ${Object.values(ThemePreference).join(', ')}`,
  })
  theme?: ThemePreference;

  @Field(() => AiModelType, { nullable: true })
  @IsOptional()
  @IsEnum(AiModelType, {
    message: `AI model must be one of: ${Object.values(AiModelType).join(', ')}`,
  })
  aiModel?: AiModelType;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  inAppNotifications?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Timezone must be at most 50 characters' })
  timezone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Date format must be at most 20 characters' })
  dateFormat?: string;

  @Field(() => NotificationPreferencesInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationPreferencesInput)
  notificationPreferences?: NotificationPreferencesInput;
}

/**
 * UserPreferences Response DTO
 * Output type for user preferences with computed fields
 */
@ObjectType('UserPreferencesDTO')
export class UserPreferencesDTO {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => String)
  locale: string;

  @Field(() => ThemePreference)
  theme: ThemePreference;

  @Field(() => AiModelType)
  aiModel: AiModelType;

  @Field(() => NotificationPreferences)
  notificationPreferences: NotificationPreferences;

  @Field(() => Boolean)
  emailNotifications: boolean;

  @Field(() => Boolean)
  inAppNotifications: boolean;

  @Field(() => String, { nullable: true })
  timezone: string | null;

  @Field(() => String, { nullable: true })
  dateFormat: string | null;
}
