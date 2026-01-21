import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import GraphQLJSON from 'graphql-type-json';
import { TemplateCategory } from '../entities/document-template.entity';

@InputType()
export class UpdateTemplateInput {
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

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  variables?: Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'currency' | 'boolean';
    required: boolean;
    defaultValue?: string | number | boolean;
    description?: string;
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
      minLength?: number;
      maxLength?: number;
    };
  }>;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  conditionalSections?: Array<{
    id: string;
    condition: string;
    description?: string;
  }>;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  polishFormattingRules?: {
    dateFormat?: 'DD.MM.YYYY' | 'D MMMM YYYY';
    currencyFormat?: 'PLN' | 'EUR' | 'USD';
    addressFormat?: 'polish' | 'standard';
    numberFormat?: 'pl' | 'en';
    legalCitations?: boolean;
  };

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
