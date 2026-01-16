import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import {
  CreateDocumentUseCase,
  GetDocumentUseCase,
  ListDocumentsByOwnerUseCase,
  UpdateDocumentTitleUseCase,
  PublishDocumentUseCase,
  DeleteDocumentUseCase,
} from '../../../application/documents';
import {
  LegalDocumentGraphQL,
  CreateLegalDocumentInputV2,
  UpdateDocumentTitleInputV2,
  PublishDocumentInputV2,
  DeleteDocumentInputV2,
} from '../dto';
import { DocumentStatusEnum } from '../../../domain/legal-documents/value-objects';

/**
 * GraphQL Resolver for Legal Documents
 *
 * Presentation Layer component that handles GraphQL requests
 * and delegates to Application layer use cases.
 *
 * Dependency Rules:
 * - CAN depend on: Application layer (use cases, DTOs)
 * - CANNOT depend on: Infrastructure layer, Domain layer directly
 */
@Resolver(() => LegalDocumentGraphQL)
export class DocumentsResolverV2 {
  constructor(
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly getDocumentUseCase: GetDocumentUseCase,
    private readonly listDocumentsUseCase: ListDocumentsByOwnerUseCase,
    private readonly updateTitleUseCase: UpdateDocumentTitleUseCase,
    private readonly publishDocumentUseCase: PublishDocumentUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
  ) {}

  /**
   * Query: Get a document by ID
   */
  @Query(() => LegalDocumentGraphQL, { name: 'documentV2', nullable: true })
  async getDocument(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<LegalDocumentGraphQL | null> {
    try {
      const result = await this.getDocumentUseCase.execute({ documentId: id });
      return this.mapToGraphQL(result);
    } catch {
      return null;
    }
  }

  /**
   * Query: List documents by owner
   */
  @Query(() => [LegalDocumentGraphQL], { name: 'documentsByOwnerV2' })
  async listByOwner(
    @Args('ownerId', { type: () => ID }) ownerId: string,
    @Args('status', { type: () => DocumentStatusEnum, nullable: true })
    status?: DocumentStatusEnum,
  ): Promise<LegalDocumentGraphQL[]> {
    const results = await this.listDocumentsUseCase.execute({ ownerId, status });
    return results.map((doc) => ({
      id: doc.id,
      title: doc.title,
      content: '', // Summary doesn't include content
      documentType: doc.documentType,
      status: doc.status,
      ownerId: doc.ownerId,
      version: 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }

  /**
   * Mutation: Create a new document
   */
  @Mutation(() => LegalDocumentGraphQL, { name: 'createDocumentV2' })
  async createDocument(
    @Args('input') input: CreateLegalDocumentInputV2,
  ): Promise<LegalDocumentGraphQL> {
    const metadata = input.metadataJson ? JSON.parse(input.metadataJson) : undefined;
    const result = await this.createDocumentUseCase.execute({
      title: input.title,
      content: input.content,
      documentType: input.documentType,
      ownerId: input.ownerId,
      metadata,
    });

    // Fetch the full document to return
    const document = await this.getDocumentUseCase.execute({
      documentId: result.id,
    });

    return this.mapToGraphQL(document);
  }

  /**
   * Mutation: Update document title
   */
  @Mutation(() => LegalDocumentGraphQL, { name: 'updateDocumentTitleV2' })
  async updateTitle(
    @Args('input') input: UpdateDocumentTitleInputV2,
  ): Promise<LegalDocumentGraphQL> {
    const result = await this.updateTitleUseCase.execute({
      documentId: input.documentId,
      title: input.title,
      updatedBy: input.updatedBy,
    });

    return this.mapToGraphQL(result);
  }

  /**
   * Mutation: Publish a document
   */
  @Mutation(() => LegalDocumentGraphQL, { name: 'publishDocumentV2' })
  async publishDocument(
    @Args('input') input: PublishDocumentInputV2,
  ): Promise<LegalDocumentGraphQL> {
    const result = await this.publishDocumentUseCase.execute({
      documentId: input.documentId,
      publishedBy: input.publishedBy,
    });

    return this.mapToGraphQL(result);
  }

  /**
   * Mutation: Delete a document
   */
  @Mutation(() => Boolean, { name: 'deleteDocumentV2' })
  async deleteDocument(
    @Args('input') input: DeleteDocumentInputV2,
  ): Promise<boolean> {
    await this.deleteDocumentUseCase.execute({
      documentId: input.documentId,
      deletedBy: input.deletedBy,
      reason: input.reason,
    });
    return true;
  }

  /**
   * Map Application DTO to GraphQL type
   */
  private mapToGraphQL(dto: {
    id: string;
    title: string;
    content: string;
    documentType: string;
    status: string;
    ownerId: string;
    metadata: Record<string, unknown>;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): LegalDocumentGraphQL {
    return {
      id: dto.id,
      title: dto.title,
      content: dto.content,
      documentType: dto.documentType as any,
      status: dto.status as any,
      ownerId: dto.ownerId,
      metadataJson: dto.metadata ? JSON.stringify(dto.metadata) : undefined,
      version: dto.version,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }
}
