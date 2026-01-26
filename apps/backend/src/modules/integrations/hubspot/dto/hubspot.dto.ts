import {
  Field,
  ObjectType,
  InputType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, IsEnum } from 'class-validator';
import { LeadTimeline } from './hubspot.types';

registerEnumType(LeadTimeline, {
  name: 'LeadTimeline',
  description: 'Timeline for lead implementation',
});

export { LeadTimeline };

/**
 * GraphQL DTO for creating a HubSpot contact from form submission
 */
@InputType('CreateHubSpotContactInput')
export class CreateHubSpotContactDto {
  @Field(() => String, { description: 'Contact email address (required)' })
  @IsEmail()
  email: string;

  @Field(() => String, { nullable: true, description: 'First name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @Field(() => String, { nullable: true, description: 'Last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @Field(() => String, { nullable: true, description: 'Company name' })
  @IsOptional()
  @IsString()
  company?: string;

  @Field(() => String, { nullable: true, description: 'Company website' })
  @IsOptional()
  @IsString()
  website?: string;

  @Field(() => String, { nullable: true, description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field(() => String, { nullable: true, description: 'Job title' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @Field(() => String, { nullable: true, description: 'Use case description' })
  @IsOptional()
  @IsString()
  useCase?: string;

  @Field(() => LeadTimeline, {
    nullable: true,
    description: 'Implementation timeline',
  })
  @IsOptional()
  @IsEnum(LeadTimeline)
  timeline?: LeadTimeline;

  @Field(() => String, { nullable: true, description: 'Company size' })
  @IsOptional()
  @IsString()
  companySize?: string;

  @Field(() => String, { nullable: true, description: 'Additional message' })
  @IsOptional()
  @IsString()
  message?: string;

  @Field(() => String, { nullable: true, description: 'Lead source' })
  @IsOptional()
  @IsString()
  source?: string;

  @Field(() => Boolean, {
    nullable: true,
    description: 'GDPR consent for data processing',
  })
  @IsOptional()
  gdprConsent?: boolean;
}

/**
 * GraphQL response for contact creation
 */
@ObjectType('HubSpotContactResponse')
export class HubSpotContactResponse {
  @Field(() => String, { description: 'HubSpot contact ID' })
  id: string;

  @Field(() => String, { description: 'Contact email' })
  email: string;

  @Field(() => String, { description: 'When the contact was created' })
  createdAt: string;
}

/**
 * GraphQL response for deal creation
 */
@ObjectType('HubSpotDealResponse')
export class HubSpotDealResponse {
  @Field(() => String, { description: 'HubSpot deal ID' })
  id: string;

  @Field(() => String, { description: 'Deal name' })
  dealId: string;

  @Field(() => String, { description: 'When the deal was created' })
  createdAt: string;
}

/**
 * GraphQL response for lead qualification check
 */
@ObjectType('LeadQualificationResponse')
export class LeadQualificationResponse {
  @Field(() => Boolean, { description: 'Whether the lead is qualified' })
  qualified: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'Reason for qualification status',
  })
  reason?: string;

  @Field(() => Number, { description: 'Lead qualification score' })
  score: number;
}
