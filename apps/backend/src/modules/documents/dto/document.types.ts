import {
  ObjectType,
  Field,
  ID,
  registerEnumType,
  InputType,
  Float,
} from '@nestjs/graphql';
import { DocumentType, DocumentStatus } from '../entities/legal-document.entity';

// Register enums with GraphQL
registerEnumType(DocumentType, {
  name: 'DocumentType',
  description: 'Type of legal document',
});

registerEnumType(DocumentStatus, {
  name: 'DocumentStatus',
  description: 'Status of document generation',
});

/**
 * GraphQL Object Type for Document Metadata
 */
@ObjectType('DocumentMetadata')
export class DocumentMetadataType {
  @Field(() => String, { nullable: true })
  plaintiffName?: string;

  @Field(() => String, { nullable: true })
  defendantName?: string;

  @Field(() => Float, { nullable: true })
  claimAmount?: number;

  @Field(() => String, { nullable: true })
  claimCurrency?: string;
}

/**
 * GraphQL Object Type for Legal Document
 */
@ObjectType('LegalDocument')
export class LegalDocumentType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  sessionId: string;

  @Field(() => String)
  title: string;

  @Field(() => DocumentType)
  type: DocumentType;

  @Field(() => DocumentStatus)
  status: DocumentStatus;

  @Field(() => String, { nullable: true })
  contentRaw?: string | null;

  @Field(() => DocumentMetadataType, { nullable: true })
  metadata?: DocumentMetadataType | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

/**
 * GraphQL Input Type for Document Metadata
 */
@InputType('DocumentMetadataInput')
export class DocumentMetadataInput {
  @Field(() => String, { nullable: true })
  plaintiffName?: string;

  @Field(() => String, { nullable: true })
  defendantName?: string;

  @Field(() => Float, { nullable: true })
  claimAmount?: number;

  @Field(() => String, { nullable: true })
  claimCurrency?: string;
}

/**
 * GraphQL Input Type for generating a document
 */
@InputType('GenerateDocumentInput')
export class GenerateDocumentInput {
  @Field(() => String)
  sessionId: string;

  @Field(() => String)
  title: string;

  @Field(() => DocumentType, { defaultValue: DocumentType.OTHER })
  type?: DocumentType;

  @Field(() => DocumentMetadataInput, { nullable: true })
  metadata?: DocumentMetadataInput;
}

/**
 * GraphQL Input Type for updating a document
 */
@InputType('UpdateDocumentInput')
export class UpdateDocumentInput {
  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => DocumentMetadataInput, { nullable: true })
  metadata?: DocumentMetadataInput;
}
