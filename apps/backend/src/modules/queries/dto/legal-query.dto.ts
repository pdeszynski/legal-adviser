import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  MinLength,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  IsUrl,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Sanitize string input by trimming whitespace and removing potentially dangerous characters
 */
const sanitizeString = (value: unknown): string | unknown => {
  if (typeof value === 'string') {
    return value
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/\s+/g, ' '); // Normalize whitespace
  }
  return value;
};

/**
 * Input type for creating a citation
 */
@InputType('CreateCitationInput')
export class CreateCitationInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: 'Citation source is required' })
  @MaxLength(500, { message: 'Source must be at most 500 characters' })
  @Transform(({ value }) => sanitizeString(value))
  source: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200, {
    message: 'Article reference must be at most 200 characters',
  })
  @Transform(({ value }) => sanitizeString(value))
  article?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'URL must be a valid URL' })
  @MaxLength(2000, { message: 'URL must be at most 2000 characters' })
  url?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Excerpt must be at most 1000 characters' })
  @Transform(({ value }) => sanitizeString(value))
  excerpt?: string;
}

/**
 * DTO for creating a new LegalQuery
 * Used by nestjs-query auto-generated createOne mutation
 *
 * Note: sessionId is optional - if not provided, a new session will be
 * automatically created for the authenticated user.
 */
@InputType('CreateLegalQueryInput')
export class CreateLegalQueryInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID('4', { message: 'Session ID must be a valid UUID v4' })
  @Transform(({ value }) =>
    value && typeof value === 'string' && value.trim()
      ? value.trim()
      : undefined,
  )
  sessionId?: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: 'Question is required' })
  @MinLength(5, { message: 'Question must be at least 5 characters long' })
  @MaxLength(10000, {
    message: 'Question must be at most 10000 characters long',
  })
  @Transform(({ value }) => sanitizeString(value))
  question: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  answerMarkdown?: string;

  @Field(() => [CreateCitationInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCitationInput)
  citations?: CreateCitationInput[];
}

/**
 * DTO for updating a LegalQuery
 * Used by nestjs-query auto-generated updateOne mutation
 */
@InputType('UpdateLegalQueryInput')
export class UpdateLegalQueryInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'Question must be at least 5 characters long' })
  @MaxLength(10000, {
    message: 'Question must be at most 10000 characters long',
  })
  @Transform(({ value }) => sanitizeString(value))
  question?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  answerMarkdown?: string;

  @Field(() => [CreateCitationInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCitationInput)
  citations?: CreateCitationInput[];
}

/**
 * DTO for submitting a new legal query
 *
 * This is the primary input for the custom submitLegalQuery mutation.
 * Creates a new query in pending state for AI processing.
 *
 * Use cases:
 * - User submits a legal question through the chat interface
 * - Frontend initiates AI Q&A interaction
 *
 * Note: For simple CRUD operations, use CreateLegalQueryInput with
 * the auto-generated createOneLegalQuery mutation instead.
 *
 * Note: sessionId is optional - if not provided, a new session will be
 * automatically created for the authenticated user.
 */
@InputType('SubmitLegalQueryInput')
export class SubmitLegalQueryInput {
  @Field(() => String, {
    description:
      'Session ID for the user submitting the query (optional - will be auto-created if not provided)',
    nullable: true,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Session ID must be a valid UUID v4' })
  @Transform(({ value }) =>
    value && typeof value === 'string' && value.trim()
      ? value.trim()
      : undefined,
  )
  sessionId?: string;

  @Field(() => String, {
    description: 'The legal question to be answered by the AI',
  })
  @IsString()
  @IsNotEmpty({ message: 'Question is required' })
  @MinLength(5, { message: 'Question must be at least 5 characters long' })
  @MaxLength(10000, {
    message: 'Question must be at most 10000 characters long',
  })
  @Transform(({ value }) => sanitizeString(value))
  question: string;
}

/**
 * DTO for answering a legal query
 *
 * Used by the answerLegalQuery mutation to add AI-generated
 * responses and citations to an existing query.
 */
@InputType('AnswerLegalQueryInput')
export class AnswerLegalQueryInput {
  @Field(() => String, {
    description: 'The AI-generated answer in Markdown format',
  })
  @IsString()
  @IsNotEmpty({ message: 'Answer is required' })
  answerMarkdown: string;

  @Field(() => [CreateCitationInput], {
    nullable: true,
    description: 'Citations and references for the answer',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCitationInput)
  citations?: CreateCitationInput[];
}

/**
 * DTO for asking a legal question with AI
 *
 * Used by the askLegalQuestion mutation to synchronously query the AI
 * and store the result. This is a blocking operation that calls the AI engine
 * and returns the complete answer.
 *
 * Use cases:
 * - Direct Q&A interaction where immediate response is needed
 * - Simple question-answer flow without background processing
 *
 * For async processing with event-driven architecture, use submitLegalQuery instead.
 *
 * Note: sessionId is optional - if not provided, a new session will be
 * automatically created for the authenticated user.
 */
@InputType('AskLegalQuestionInput')
export class AskLegalQuestionInput {
  @Field(() => String, {
    description:
      'Session ID for the user asking the question (optional - will be auto-created if not provided)',
    nullable: true,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Session ID must be a valid UUID v4' })
  @Transform(({ value }) =>
    value && typeof value === 'string' && value.trim()
      ? value.trim()
      : undefined,
  )
  sessionId?: string;

  @Field(() => String, {
    description: 'The legal question to ask the AI',
  })
  @IsString()
  @IsNotEmpty({ message: 'Question is required' })
  @MinLength(5, { message: 'Question must be at least 5 characters long' })
  @MaxLength(10000, {
    message: 'Question must be at most 10000 characters long',
  })
  @Transform(({ value }) => sanitizeString(value))
  question: string;

  @Field(() => String, {
    nullable: true,
    description:
      'Response mode: LAWYER (detailed legal analysis) or SIMPLE (layperson-friendly)',
  })
  @IsOptional()
  @IsString()
  @IsIn(['LAWYER', 'SIMPLE'], {
    message: 'Mode must be either LAWYER or SIMPLE',
  })
  mode?: string;
}
