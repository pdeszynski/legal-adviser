import {
  InputType,
  Field,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  IsNotEmpty,
  ArrayMinSize,
} from 'class-validator';

/**
 * Clarification Question Type Enum
 *
 * Defines the type of input expected for a clarification question.
 * TEXT: Free-form text input
 * OPTIONS: Selection from predefined options
 * DATE: Date picker input
 */
export enum ClarificationQuestionType {
  /** Free-form text input from user */
  TEXT = 'TEXT',
  /** Selection from predefined options */
  OPTIONS = 'OPTIONS',
  /** Date input */
  DATE = 'DATE',
}

// Register enum for GraphQL use
registerEnumType(ClarificationQuestionType, {
  name: 'ClarificationQuestionType',
  description: 'The type of input expected for a clarification question',
});

/**
 * Leaf type - must be declared before composite types.
 * See CLAUDE.md "TypeScript Input/Output Type Declaration Order" section.
 *
 * Input type for a single clarification question with the new schema.
 * Used when creating or updating clarification questions with questionId,
 * questionText, questionType enum, and required fields.
 *
 * This is the updated ClarificationQuestion input type as specified in the
 * feature requirements. It uses an enum for questionType instead of string,
 * and adds questionId and required fields.
 */
@InputType('ClarificationQuestionInput')
export class ClarificationQuestionInput {
  @Field(() => String, {
    description: 'Unique identifier for the question',
  })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @Field(() => String, {
    description: 'The question text to display to the user',
  })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @Field(() => ClarificationQuestionType, {
    description: 'The type of input expected for this question',
  })
  @IsEnum(ClarificationQuestionType)
  @IsNotEmpty()
  questionType: ClarificationQuestionType;

  @Field(() => String, {
    nullable: true,
    description: 'Optional hint or help text for the user',
  })
  @IsOptional()
  @IsString()
  hint?: string;

  @Field(() => [String], {
    nullable: true,
    description: 'Predefined options (required when questionType is OPTIONS)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @Field(() => Boolean, {
    description: 'Whether this question must be answered',
  })
  @IsBoolean()
  @IsNotEmpty()
  required: boolean;
}

/**
 * Object type for a single clarification question.
 * Used in query responses.
 */
@ObjectType('ClarificationQuestion')
export class ClarificationQuestion {
  @Field(() => String, {
    description: 'Unique identifier for the question',
  })
  questionId: string;

  @Field(() => String, {
    description: 'The question text to display to the user',
  })
  questionText: string;

  @Field(() => ClarificationQuestionType, {
    description: 'The type of input expected for this question',
  })
  questionType: ClarificationQuestionType;

  @Field(() => String, {
    nullable: true,
    description: 'Optional hint or help text for the user',
  })
  hint?: string;

  @Field(() => [String], {
    nullable: true,
    description: 'Predefined options (present when questionType is OPTIONS)',
  })
  options?: string[];

  @Field(() => Boolean, {
    description: 'Whether this question must be answered',
  })
  required: boolean;
}

/**
 * Input type for creating a clarification question message.
 *
 * Contains the context and questions for a clarification flow.
 */
@InputType('ClarificationQuestionMessageInput')
export class ClarificationQuestionMessageInput {
  @Field(() => String, {
    description: 'Summary of the context for the user',
  })
  @IsString()
  @IsNotEmpty()
  contextSummary: string;

  @Field(() => [ClarificationQuestionInput], {
    description: 'Array of clarification questions',
  })
  @IsArray()
  @ArrayMinSize(1)
  questions: ClarificationQuestionInput[];

  @Field(() => String, {
    description: 'Next steps guidance for the user',
  })
  @IsString()
  @IsNotEmpty()
  nextSteps: string;
}

/**
 * Object type for a clarification question message.
 *
 * Used in query responses to represent a complete clarification
 * question message with context, questions, and next steps.
 */
@ObjectType('ClarificationQuestionMessage')
export class ClarificationQuestionMessage {
  @Field(() => String, {
    description: 'Summary of the context for the user',
  })
  contextSummary: string;

  @Field(() => [ClarificationQuestion], {
    description: 'Array of clarification questions',
  })
  questions: ClarificationQuestion[];

  @Field(() => String, {
    description: 'Next steps guidance for the user',
  })
  nextSteps: string;
}
