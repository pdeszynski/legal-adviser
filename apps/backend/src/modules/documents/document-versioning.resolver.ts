import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DocumentVersioningService } from './services/document-versioning.service';
import { DocumentVersion } from './entities/document-version.entity';
import { LegalDocument } from './entities/legal-document.entity';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

/**
 * Document Versioning Resolver
 *
 * Provides GraphQL mutations and queries for document versioning operations:
 * - Get version history
 * - Get specific version
 * - Rollback to previous version
 * - Get diff between versions
 *
 * All operations require authentication.
 */
@Resolver(() => DocumentVersion)
@UseGuards(GqlAuthGuard)
export class DocumentVersioningResolver {
  constructor(private readonly versioningService: DocumentVersioningService) {}

  /**
   * Get all versions for a document
   */
  @Query(() => [DocumentVersion], {
    name: 'documentVersionHistory',
    description:
      'Get all versions for a document, ordered by version number descending',
  })
  async getVersionHistory(
    @Args('documentId', { type: () => ID }) documentId: string,
  ): Promise<DocumentVersion[]> {
    return this.versioningService.getVersionHistory(documentId);
  }

  /**
   * Get a specific version
   */
  @Query(() => DocumentVersion, {
    name: 'documentVersionByNumber',
    description: 'Get a specific version of a document',
  })
  async getVersion(
    @Args('documentId', { type: () => ID }) documentId: string,
    @Args('versionNumber', { type: () => Number }) versionNumber: number,
  ): Promise<DocumentVersion> {
    return this.versioningService.getVersion(documentId, versionNumber);
  }

  /**
   * Rollback document to a previous version
   */
  @Mutation(() => LegalDocument, {
    name: 'rollbackDocumentToVersion',
    description:
      'Rollback a document to a previous version. Creates a new version with the old content.',
  })
  async rollbackToVersion(
    @Args('documentId', { type: () => ID }) documentId: string,
    @Args('versionNumber', { type: () => Number }) versionNumber: number,
    @Args('sessionId', { type: () => ID }) sessionId: string,
    @Args('authorUserId', { type: () => ID, nullable: true })
    authorUserId?: string,
  ): Promise<LegalDocument> {
    const result = await this.versioningService.rollbackToVersion(
      documentId,
      versionNumber,
      sessionId,
      authorUserId,
    );
    return result.document;
  }

  /**
   * Get the latest version for a document
   */
  @Query(() => DocumentVersion, {
    name: 'documentLatestVersion',
    description: 'Get the latest version of a document',
    nullable: true,
  })
  async getLatestVersion(
    @Args('documentId', { type: () => ID }) documentId: string,
  ): Promise<DocumentVersion | null> {
    return this.versioningService.getLatestVersion(documentId);
  }

  /**
   * Count versions for a document
   */
  @Query(() => Number, {
    name: 'documentVersionCount',
    description: 'Count total versions for a document',
  })
  async countVersions(
    @Args('documentId', { type: () => ID }) documentId: string,
  ): Promise<number> {
    return this.versioningService.countVersions(documentId);
  }
}
