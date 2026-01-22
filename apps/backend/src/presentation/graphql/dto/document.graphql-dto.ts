import {
  Field,
  ObjectType,
  ID,
  InputType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  DocumentTypeEnum,
  DocumentStatusEnum,
} from '../../../domain/legal-documents/value-objects';

// Register enums for GraphQL
registerEnumType(DocumentTypeEnum, {
  name: 'DocumentTypeV2',
  description: 'Type of legal document',
});

registerEnumType(DocumentStatusEnum, {
  name: 'DocumentStatusV2',
  description: 'Status of the document lifecycle',
});

/**
 * GraphQL Output Type for Legal Document
 */
@ObjectType('LegalDocumentV2')
export class LegalDocumentGraphQL {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field()
  content!: string;

  @Field(() => DocumentTypeEnum)
  documentType!: DocumentTypeEnum;

  @Field(() => DocumentStatusEnum)
  status!: DocumentStatusEnum;

  @Field(() => ID)
  ownerId!: string;

  @Field(() => String, {
    nullable: true,
    description: 'JSON metadata as string',
  })
  metadataJson?: string;

  @Field()
  version!: number;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

/**
 * GraphQL Input Type for creating a document
 */
@InputType()
export class CreateLegalDocumentInputV2 {
  @Field()
  title!: string;

  @Field()
  content!: string;

  @Field(() => DocumentTypeEnum)
  documentType!: DocumentTypeEnum;

  @Field(() => ID)
  ownerId!: string;

  @Field(() => String, {
    nullable: true,
    description: 'JSON metadata as string',
  })
  metadataJson?: string;
}

/**
 * GraphQL Input Type for updating document title
 */
@InputType()
export class UpdateDocumentTitleInputV2 {
  @Field(() => ID)
  documentId!: string;

  @Field()
  title!: string;

  @Field(() => ID)
  updatedBy!: string;
}

/**
 * GraphQL Input Type for publishing a document
 */
@InputType()
export class PublishDocumentInputV2 {
  @Field(() => ID)
  documentId!: string;

  @Field(() => ID)
  publishedBy!: string;
}

/**
 * GraphQL Input Type for deleting a document
 */
@InputType()
export class DeleteDocumentInputV2 {
  @Field(() => ID)
  documentId!: string;

  @Field(() => ID)
  deletedBy!: string;

  @Field({ nullable: true })
  reason?: string;
}
