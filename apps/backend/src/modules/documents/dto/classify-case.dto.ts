import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsUUID,
  IsOptional,
  MinLength,
  MaxLength,
  IsNotEmpty,
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
 * Input type for classifying a legal case
 *
 * This DTO is used for the classifyCase mutation which:
 * 1. Calls the AI Engine to analyze the case description
 * 2. Stores the classification results in a LegalAnalysis entity
 * 3. Returns the created LegalAnalysis with identified legal grounds
 */
@InputType('ClassifyCaseInput')
export class ClassifyCaseInput {
  @Field(() => String, {
    description: 'User session ID for tracking',
  })
  @IsUUID('4', { message: 'Session ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Session ID is required' })
  sessionId: string;

  @Field(() => String, {
    description: 'Title or brief summary of the analysis',
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(500, { message: 'Title must be at most 500 characters long' })
  @Transform(({ value }) => sanitizeString(value))
  title: string;

  @Field(() => String, {
    description: 'Detailed description of the legal case to analyze',
  })
  @IsString()
  @IsNotEmpty({ message: 'Case description is required' })
  @MinLength(20, {
    message: 'Case description must be at least 20 characters long',
  })
  @MaxLength(50000, {
    message: 'Case description must be at most 50000 characters long',
  })
  @Transform(({ value }) => sanitizeString(value))
  caseDescription: string;

  @Field(() => String, { nullable: true, description: 'Additional context for the analysis' })
  @IsOptional()
  @IsString()
  @MaxLength(5000, {
    message: 'Context must be at most 5000 characters long',
  })
  @Transform(({ value }) => sanitizeString(value))
  context?: string;
}
