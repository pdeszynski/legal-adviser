import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsString, IsNotEmpty } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

/**
 * Render Template Input
 * Custom mutation for rendering a template with variable substitution
 * Returns the processed content without creating a document
 */
@InputType('RenderTemplateInput')
export class RenderTemplateInput {
  @Field()
  @IsUUID('4', { message: 'Template ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Template ID is required' })
  templateId: string;

  @Field(() => GraphQLJSON)
  @IsNotEmpty({ message: 'Variables are required' })
  variables: {
    [key: string]: string | number | boolean | Date;
  };
}
