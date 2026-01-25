import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Email template types available in the system
 */
export enum EmailTemplateType {
  WELCOME = 'welcome',
  DOCUMENT_COMPLETED = 'document_completed',
  DOCUMENT_FAILED = 'document_failed',
  SYSTEM_NOTIFICATION = 'system_notification',
  DEMO_REQUEST_CONFIRMATION = 'demo_request_confirmation',
}

// Register enum with GraphQL
registerEnumType(EmailTemplateType, {
  name: 'EmailTemplateType',
  description: 'Email template types available in the system',
});

/**
 * Input for sending an email notification
 */
@InputType()
export class SendEmailInput {
  @Field(() => String)
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  subject: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  template: EmailTemplateType;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  templateData?: string; // JSON string with template variables
}

/**
 * Email job data for queue processing
 */
export interface EmailJobData {
  to: string;
  subject: string;
  template: EmailTemplateType;
  templateData?: Record<string, any>;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Response after sending email
 */
@ObjectType()
export class SendEmailResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String, { nullable: true })
  messageId?: string;

  @Field(() => String, { nullable: true })
  error?: string;
}
