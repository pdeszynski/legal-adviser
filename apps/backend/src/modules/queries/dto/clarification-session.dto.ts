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
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ClarificationState } from '../entities/clarification-session.entity';

/**
 * Sanitize string input by trimming whitespace and removing potentially dangerous characters
 */
const sanitizeString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/\s+/g, ' '); // Normalize whitespace
  }
  return '';
};

/**
 * Input type for a single clarification answer
 */
@InputType('ClarificationAnswerInput')
export class ClarificationAnswerInput {
  @Field(() => String, { description: 'The question that was asked' })
  @IsString()
  @IsNotEmpty({ message: 'Question is required' })
  @Transform(({ value }) => sanitizeString(value))
  question: string;

  @Field(() => String, {
    description: 'The type of question (e.g., timeline, documents, parties)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Question type is required' })
  @Transform(({ value }) => sanitizeString(value))
  question_type: string;

  @Field(() => String, { description: "The user's answer to the question" })
  @IsString()
  @IsNotEmpty({ message: 'Answer is required' })
  @MinLength(1, { message: 'Answer must be at least 1 character long' })
  @MaxLength(5000, { message: 'Answer must be at most 5000 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  answer: string;
}

/**
 * DTO for creating a new clarification session
 *
 * This is typically called internally when the AI determines clarification is needed.
 * Can also be called manually for testing purposes.
 */
@InputType('CreateClarificationSessionInput')
export class CreateClarificationSessionInput {
  @Field(() => String, {
    description: 'ID of the legal query that triggered clarification',
  })
  @IsUUID('4', { message: 'Query ID must be a valid UUID v4' })
  queryId: string;

  @Field(() => String, {
    nullable: true,
    description: 'Session ID for the user (optional)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Session ID must be a valid UUID v4' })
  sessionId?: string;

  @Field(() => [String], {
    description: 'Clarification questions to ask the user',
  })
  @IsArray()
  @IsString({ each: true })
  questions: string[];

  @Field(() => [String], {
    nullable: true,
    description: 'Initial context for the clarification session',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  initialContext?: string[];
}

/**
 * DTO for submitting answers to a clarification session
 *
 * Used by the frontend to submit user's answers to clarification questions.
 * Triggers state transition from PENDING to ANSWERED.
 */
@InputType('SubmitClarificationAnswersInput')
export class SubmitClarificationAnswersInput {
  @Field(() => String, {
    description: 'ID of the clarification session',
  })
  @IsUUID('4', { message: 'Session ID must be a valid UUID v4' })
  sessionId: string;

  @Field(() => [ClarificationAnswerInput], {
    description: 'Answers to the clarification questions',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClarificationAnswerInput)
  answers: ClarificationAnswerInput[];

  @Field(() => [String], {
    nullable: true,
    description: 'Additional context to add to the session',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalContext?: string[];
}

/**
 * DTO for updating a clarification session
 *
 * Used for internal state transitions and updates.
 */
@InputType('UpdateClarificationSessionInput')
export class UpdateClarificationSessionInput {
  @Field(() => ClarificationState, {
    nullable: true,
    description: 'New state for the session',
  })
  @IsOptional()
  @IsEnum(ClarificationState, {
    message: 'State must be a valid ClarificationState',
  })
  state?: ClarificationState;

  @Field(() => String, {
    nullable: true,
    description: 'ID of the final query with complete answer',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Final query ID must be a valid UUID v4' })
  finalQueryId?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Error message if the session failed',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Error message must be at most 1000 characters' })
  errorMessage?: string;

  @Field(() => [String], {
    nullable: true,
    description: 'Additional context to add',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalContext?: string[];
}

/**
 * DTO for cancelling a clarification session
 *
 * Allows users to cancel the clarification flow.
 */
@InputType('CancelClarificationSessionInput')
export class CancelClarificationSessionInput {
  @Field(() => String, {
    description: 'ID of the clarification session to cancel',
  })
  @IsUUID('4', { message: 'Session ID must be a valid UUID v4' })
  sessionId: string;
}
