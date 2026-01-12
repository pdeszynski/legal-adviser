import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { DocumentsService } from './services/documents.service';
import {
  LegalDocumentType,
  GenerateDocumentInput,
  UpdateDocumentInput,
} from './dto/document.types';
import { LegalDocument } from './entities/legal-document.entity';

/**
 * GraphQL Resolver for Legal Documents
 *
 * Provides GraphQL API for document operations following nestjs-query patterns.
 * This is the primary API for frontend data operations per constitution.
 */
@Resolver(() => LegalDocumentType)
export class DocumentsResolver {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * Query: Get all documents
   */
  @Query(() => [LegalDocumentType], { name: 'documents' })
  async findAll(): Promise<LegalDocument[]> {
    return this.documentsService.findAll();
  }

  /**
   * Query: Get a single document by ID
   */
  @Query(() => LegalDocumentType, { name: 'document' })
  async findOne(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<LegalDocument> {
    return this.documentsService.findByIdOrFail(id);
  }

  /**
   * Query: Get documents by session ID
   */
  @Query(() => [LegalDocumentType], { name: 'documentsBySession' })
  async findBySession(
    @Args('sessionId', { type: () => String }) sessionId: string,
  ): Promise<LegalDocument[]> {
    return this.documentsService.findBySessionId(sessionId);
  }

  /**
   * Mutation: Generate a new document
   *
   * Creates a document and starts the AI generation process.
   * Returns the document with status GENERATING.
   */
  @Mutation(() => LegalDocumentType, { name: 'generateDocument' })
  async generateDocument(
    @Args('input') input: GenerateDocumentInput,
  ): Promise<LegalDocument> {
    const document = await this.documentsService.create({
      sessionId: input.sessionId,
      title: input.title,
      type: input.type,
      metadata: input.metadata ? { ...input.metadata } : undefined,
    });
    return this.documentsService.startGeneration(document.id);
  }

  /**
   * Mutation: Update an existing document
   */
  @Mutation(() => LegalDocumentType, { name: 'updateDocument' })
  async updateDocument(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateDocumentInput,
  ): Promise<LegalDocument> {
    return this.documentsService.update(id, {
      ...input,
      metadata: input.metadata ? { ...input.metadata } : undefined,
    });
  }

  /**
   * Mutation: Delete a document
   */
  @Mutation(() => Boolean, { name: 'deleteDocument' })
  async deleteDocument(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.documentsService.delete(id);
    return true;
  }
}
