import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsString, MinLength, MaxLength } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class GenerateFromTemplateInput {
  @Field()
  @IsUUID('4', { message: 'Template ID must be a valid UUID' })
  templateId: string;

  @Field()
  @IsUUID('4', { message: 'Session ID must be a valid UUID' })
  sessionId: string;

  @Field()
  @IsString()
  @MinLength(3, { message: 'Document title must be at least 3 characters' })
  @MaxLength(500, { message: 'Document title must not exceed 500 characters' })
  title: string;

  @Field(() => GraphQLJSON)
  variables: {
    [key: string]: string | number | boolean | Date;
  };
}
