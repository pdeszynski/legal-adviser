import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
  IsArray,
  validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import GraphQLJSON from 'graphql-type-json';
import { TemplateCategory } from '../entities/document-template.entity';

/**
 * Template Variable Input
 * Defines a variable schema for template substitution
 */
@InputType('TemplateVariableInput')
export class TemplateVariableInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  label: string;

  @Field()
  @IsEnum(['text', 'number', 'date', 'currency', 'boolean'])
  type: 'text' | 'number' | 'date' | 'currency' | 'boolean';

  @Field()
  @IsBoolean()
  required: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  defaultValue?: string | number | boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

/**
 * Conditional Section Input
 * Defines conditional blocks in templates
 */
@InputType('ConditionalSectionInput')
export class ConditionalSectionInput {
  @Field()
  @IsString()
  id: string;

  @Field()
  @IsString()
  condition: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * Polish Formatting Rules Input
 * Defines Polish-specific formatting preferences
 */
@InputType('PolishFormattingRulesInput')
export class PolishFormattingRulesInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['DD.MM.YYYY', 'D MMMM YYYY'])
  dateFormat?: 'DD.MM.YYYY' | 'D MMMM YYYY';

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['PLN', 'EUR', 'USD'])
  currencyFormat?: 'PLN' | 'EUR' | 'USD';

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['polish', 'standard'])
  addressFormat?: 'polish' | 'standard';

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(['pl', 'en'])
  numberFormat?: 'pl' | 'en';

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  legalCitations?: boolean;
}

/**
 * Create DocumentTemplate Input
 * Used by nestjs-query auto-generated createOneDocumentTemplate mutation
 */
@InputType('CreateDocumentTemplateInput')
export class CreateDocumentTemplateInput {
  @Field()
  @IsString()
  @MinLength(3, { message: 'Template name must be at least 3 characters' })
  @MaxLength(200, { message: 'Template name must not exceed 200 characters' })
  name: string;

  @Field(() => TemplateCategory)
  @IsEnum(TemplateCategory, { message: 'Invalid template category' })
  category: TemplateCategory;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'Description must not exceed 1000 characters',
  })
  description?: string;

  @Field()
  @IsString()
  @MinLength(10, { message: 'Template content must be at least 10 characters' })
  content: string;

  @Field(() => [TemplateVariableInput])
  @IsArray()
  variables: TemplateVariableInput[];

  @Field(() => [ConditionalSectionInput], { nullable: true })
  @IsOptional()
  @IsArray()
  conditionalSections?: ConditionalSectionInput[];

  @Field(() => PolishFormattingRulesInput, { nullable: true })
  @IsOptional()
  polishFormattingRules?: PolishFormattingRulesInput;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Update DocumentTemplate Input
 * Used by nestjs-query auto-generated updateOneDocumentTemplate mutation
 */
@InputType('UpdateDocumentTemplateInput')
export class UpdateDocumentTemplateInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Template name must be at least 3 characters' })
  @MaxLength(200, { message: 'Template name must not exceed 200 characters' })
  name?: string;

  @Field(() => TemplateCategory, { nullable: true })
  @IsOptional()
  @IsEnum(TemplateCategory, { message: 'Invalid template category' })
  category?: TemplateCategory;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'Description must not exceed 1000 characters',
  })
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Template content must be at least 10 characters' })
  content?: string;

  @Field(() => [TemplateVariableInput], { nullable: true })
  @IsOptional()
  @IsArray()
  variables?: TemplateVariableInput[];

  @Field(() => [ConditionalSectionInput], { nullable: true })
  @IsOptional()
  @IsArray()
  conditionalSections?: ConditionalSectionInput[];

  @Field(() => PolishFormattingRulesInput, { nullable: true })
  @IsOptional()
  polishFormattingRules?: PolishFormattingRulesInput;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: string;
}
