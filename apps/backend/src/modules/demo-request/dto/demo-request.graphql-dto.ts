import {
  Field,
  ObjectType,
  InputType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MaxLength,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Sanitize string input by trimming whitespace
 */
const sanitizeString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    return value.trim();
  }
  return undefined;
};

/**
 * Company size categories for demo requests
 */
export enum CompanySize {
  SOLO = '1',
  SMALL_2_10 = '2-10',
  SMALL_11_50 = '11-50',
  MEDIUM_51_200 = '51-200',
  LARGE_201_500 = '201-500',
  ENTERPRISE_500_PLUS = '500+',
}

registerEnumType(CompanySize, {
  name: 'CompanySize',
  description: 'Company size categories',
});

/**
 * Industry categories for demo requests
 */
export enum Industry {
  LAW_FIRM = 'law_firm',
  LEGAL_DEPARTMENT = 'legal_department',
  GOVERNMENT = 'government',
  FINANCE = 'finance',
  HEALTHCARE = 'healthcare',
  TECHNOLOGY = 'technology',
  REAL_ESTATE = 'real_estate',
  CONSULTING = 'consulting',
  OTHER = 'other',
}

registerEnumType(Industry, {
  name: 'Industry',
  description: 'Industry categories',
});

/**
 * Timeline preferences for demo requests
 */
export enum DemoTimeline {
  ASAP = 'asap',
  WITHIN_WEEK = 'within_week',
  WITHIN_MONTH = 'within_month',
  WITHIN_QUARTER = 'within_quarter',
  EXPLORING = 'exploring',
}

registerEnumType(DemoTimeline, {
  name: 'DemoTimeline',
  description: 'Timeline preferences for demo',
});

/**
 * Budget ranges for demo requests
 */
export enum BudgetRange {
  UNDER_5K = 'under_5k',
  RANGE_5K_10K = '5k_10k',
  RANGE_10K_25K = '10k_25k',
  RANGE_25K_50K = '25k_50k',
  RANGE_50K_100K = '50k_100k',
  OVER_100K = 'over_100k',
  NOT_SPECIFIED = 'not_specified',
}

registerEnumType(BudgetRange, {
  name: 'BudgetRange',
  description: 'Budget ranges for implementation',
});

/**
 * Preferred demo time slots
 */
export enum PreferredTimeSlot {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
}

registerEnumType(PreferredTimeSlot, {
  name: 'PreferredTimeSlot',
  description: 'Preferred time of day for demo',
});

/**
 * GraphQL Input Type for demo request submission
 */
@InputType('DemoRequestInput')
export class DemoRequestInput {
  @Field(() => String, { description: 'Full name of the requester' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Full name must be at most 255 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  fullName!: string;

  @Field(() => String, { description: 'Email address' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255, { message: 'Email must be at most 255 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  email!: string;

  @Field(() => String, { description: 'Company name' })
  @IsString()
  @IsNotEmpty({ message: 'Company name is required' })
  @MinLength(2, { message: 'Company name must be at least 2 characters long' })
  @MaxLength(255, {
    message: 'Company name must be at most 255 characters long',
  })
  @Transform(({ value }) => sanitizeString(value))
  company!: string;

  @Field(() => CompanySize, {
    description: 'Company size (number of employees)',
  })
  @IsEnum(CompanySize, { message: 'Invalid company size' })
  @IsNotEmpty({ message: 'Company size is required' })
  companySize!: CompanySize;

  @Field(() => Industry, { description: 'Industry category' })
  @IsEnum(Industry, { message: 'Invalid industry' })
  @IsNotEmpty({ message: 'Industry is required' })
  industry!: Industry;

  @Field(() => String, { description: 'Specific use case or requirements' })
  @IsString()
  @IsNotEmpty({ message: 'Use case is required' })
  @MinLength(10, { message: 'Use case must be at least 10 characters long' })
  @MaxLength(2000, { message: 'Use case must be at most 2000 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  useCase!: string;

  @Field(() => DemoTimeline, {
    description: 'Timeline for implementation',
  })
  @IsEnum(DemoTimeline, { message: 'Invalid timeline' })
  @IsNotEmpty({ message: 'Timeline is required' })
  timeline!: DemoTimeline;

  @Field(() => BudgetRange, {
    nullable: true,
    description: 'Budget range for implementation',
  })
  @IsOptional()
  @IsEnum(BudgetRange, { message: 'Invalid budget range' })
  budget?: BudgetRange;

  @Field(() => PreferredTimeSlot, {
    nullable: true,
    description: 'Preferred time of day for demo',
  })
  @IsOptional()
  @IsEnum(PreferredTimeSlot, { message: 'Invalid time slot' })
  preferredDemoTime?: PreferredTimeSlot;

  @Field(() => String, {
    nullable: true,
    description: 'UTM source parameter for tracking',
  })
  @IsOptional()
  @IsString()
  utmSource?: string;

  @Field(() => String, {
    nullable: true,
    description: 'UTM medium parameter for tracking',
  })
  @IsOptional()
  @IsString()
  utmMedium?: string;

  @Field(() => String, {
    nullable: true,
    description: 'UTM campaign parameter for tracking',
  })
  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @Field(() => String, {
    nullable: true,
    description: 'UTM term parameter for tracking',
  })
  @IsOptional()
  @IsString()
  utmTerm?: string;

  @Field(() => String, {
    nullable: true,
    description: 'UTM content parameter for tracking',
  })
  @IsOptional()
  @IsString()
  utmContent?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Referrer URL for tracking',
  })
  @IsOptional()
  @IsString()
  referrer?: string;
}

/**
 * GraphQL Response Type for demo request submission
 */
@ObjectType('DemoRequestResponse')
export class DemoRequestResponse {
  @Field(() => Boolean, {
    description: 'Whether the request was submitted successfully',
  })
  success!: boolean;

  @Field(() => String, {
    description: 'Confirmation message with next steps',
  })
  message!: string;

  @Field(() => String, {
    nullable: true,
    description: 'Unique reference ID for the request',
  })
  referenceId?: string;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether the lead was qualified for immediate follow-up',
  })
  qualified?: boolean;
}
