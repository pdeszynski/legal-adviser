import { InputType, Field, ID } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';

/**
 * Input DTO for creating a new document version
 * Used when manually creating a version snapshot
 */
@InputType()
export class CreateDocumentVersionInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  documentId: string;

  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  contentSnapshot: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  changeDescription?: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  authorUserId?: string;
}

/**
 * Input DTO for updating a document version
 * Note: Versions should be immutable, but we allow updating the change description
 */
@InputType()
export class UpdateDocumentVersionInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  changeDescription?: string;
}
