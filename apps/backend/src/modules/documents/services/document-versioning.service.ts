import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentVersion } from '../entities/document-version.entity';
import { LegalDocument } from '../entities/legal-document.entity';
import * as diff from 'diff';

/**
 * Document Versioning Service
 *
 * Handles version creation, history tracking, and rollback functionality
 * for legal documents. Implements automatic version creation on content updates
 * and provides diff calculation between versions.
 *
 * Features:
 * - Automatic version creation on document updates
 * - Sequential version numbering
 * - Content diff calculation between versions
 * - Rollback to previous versions
 * - Version history retrieval
 */
@Injectable()
export class DocumentVersioningService {
  constructor(
    @InjectRepository(DocumentVersion)
    private readonly versionRepository: Repository<DocumentVersion>,
    @InjectRepository(LegalDocument)
    private readonly documentRepository: Repository<LegalDocument>,
  ) {}

  /**
   * Create a new version for a document
   * Automatically calculates the next version number
   *
   * @param documentId - The document to version
   * @param sessionId - The session creating the version
   * @param contentSnapshot - The content to snapshot
   * @param changeDescription - Optional description of changes
   * @param authorUserId - Optional user ID who made the change
   * @returns The created DocumentVersion
   */
  async createVersion(
    documentId: string,
    sessionId: string,
    contentSnapshot: string,
    changeDescription?: string,
    authorUserId?: string,
  ): Promise<DocumentVersion> {
    // Verify document exists
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // Get the latest version number for this document
    const latestVersion = await this.versionRepository.findOne({
      where: { documentId },
      order: { versionNumber: 'DESC' },
    });

    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Create the new version
    const version = this.versionRepository.create({
      documentId,
      sessionId,
      versionNumber: nextVersionNumber,
      contentSnapshot,
      changeDescription: changeDescription || null,
      authorUserId: authorUserId || null,
    });

    // Validate before saving
    version.validate();

    return this.versionRepository.save(version);
  }

  /**
   * Create a version automatically when document content is updated
   * Only creates a version if the content has actually changed
   *
   * @param documentId - The document that was updated
   * @param sessionId - The session that updated the document
   * @param newContent - The new content
   * @param authorUserId - Optional user ID who made the change
   * @returns The created DocumentVersion or null if no change detected
   */
  async createVersionOnUpdate(
    documentId: string,
    sessionId: string,
    newContent: string,
    authorUserId?: string,
  ): Promise<DocumentVersion | null> {
    // Get the latest version to compare content
    const latestVersion = await this.versionRepository.findOne({
      where: { documentId },
      order: { versionNumber: 'DESC' },
    });

    // If there's no previous version, create the first one
    if (!latestVersion) {
      return this.createVersion(
        documentId,
        sessionId,
        newContent,
        'Initial version',
        authorUserId,
      );
    }

    // Check if content has changed
    if (latestVersion.contentSnapshot === newContent) {
      // No change, don't create a version
      return null;
    }

    // Calculate diff for change description
    const changeDescription = this.calculateChangeDescription(
      latestVersion.contentSnapshot,
      newContent,
    );

    // Create new version with diff-based description
    return this.createVersion(
      documentId,
      sessionId,
      newContent,
      changeDescription,
      authorUserId,
    );
  }

  /**
   * Get all versions for a document, ordered by version number descending
   *
   * @param documentId - The document to get versions for
   * @returns Array of DocumentVersion entities
   */
  async getVersionHistory(documentId: string): Promise<DocumentVersion[]> {
    return this.versionRepository.find({
      where: { documentId },
      order: { versionNumber: 'DESC' },
    });
  }

  /**
   * Get a specific version of a document
   *
   * @param documentId - The document ID
   * @param versionNumber - The version number to retrieve
   * @returns The DocumentVersion
   * @throws NotFoundException if version not found
   */
  async getVersion(
    documentId: string,
    versionNumber: number,
  ): Promise<DocumentVersion> {
    const version = await this.versionRepository.findOne({
      where: { documentId, versionNumber },
    });

    if (!version) {
      throw new NotFoundException(
        `Version ${versionNumber} not found for document ${documentId}`,
      );
    }

    return version;
  }

  /**
   * Rollback a document to a previous version
   * Creates a new version with the old content
   *
   * @param documentId - The document to rollback
   * @param versionNumber - The version number to rollback to
   * @param sessionId - The session performing the rollback
   * @param authorUserId - Optional user ID performing the rollback
   * @returns The updated LegalDocument and the new DocumentVersion
   */
  async rollbackToVersion(
    documentId: string,
    versionNumber: number,
    sessionId: string,
    authorUserId?: string,
  ): Promise<{ document: LegalDocument; version: DocumentVersion }> {
    // Get the target version
    const targetVersion = await this.getVersion(documentId, versionNumber);

    // Get the document
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // Update document content
    document.contentRaw = targetVersion.contentSnapshot;
    const savedDocument = await this.documentRepository.save(document);

    // Create a new version for the rollback
    const newVersion = await this.createVersion(
      documentId,
      sessionId,
      targetVersion.contentSnapshot,
      `Rolled back to version ${versionNumber}`,
      authorUserId,
    );

    return {
      document: savedDocument,
      version: newVersion,
    };
  }

  /**
   * Calculate diff between two content strings
   * Returns a human-readable description of changes
   *
   * @param oldContent - The old content
   * @param newContent - The new content
   * @returns A description of the changes
   */
  private calculateChangeDescription(
    oldContent: string,
    newContent: string,
  ): string {
    const changes = diff.diffLines(oldContent || '', newContent || '');

    let additions = 0;
    let deletions = 0;
    let modifications = 0;

    changes.forEach((change) => {
      if (change.added) {
        additions += change.count || 0;
      } else if (change.removed) {
        deletions += change.count || 0;
      }
    });

    // Simple heuristic: if both additions and deletions, it's a modification
    if (additions > 0 && deletions > 0) {
      modifications = Math.min(additions, deletions);
      additions -= modifications;
      deletions -= modifications;
    }

    const parts: string[] = [];
    if (additions > 0) {
      parts.push(`+${additions} line${additions !== 1 ? 's' : ''}`);
    }
    if (deletions > 0) {
      parts.push(`-${deletions} line${deletions !== 1 ? 's' : ''}`);
    }
    if (modifications > 0) {
      parts.push(`~${modifications} line${modifications !== 1 ? 's' : ''}`);
    }

    return parts.length > 0 ? parts.join(', ') : 'Content updated';
  }

  /**
   * Get the detailed diff between two versions
   *
   * @param documentId - The document ID
   * @param fromVersion - The starting version number
   * @param toVersion - The ending version number
   * @returns The diff result
   */
  async getDiff(
    documentId: string,
    fromVersion: number,
    toVersion: number,
  ): Promise<diff.Change[]> {
    const from = await this.getVersion(documentId, fromVersion);
    const to = await this.getVersion(documentId, toVersion);

    return diff.diffLines(from.contentSnapshot, to.contentSnapshot);
  }

  /**
   * Get the latest version for a document
   *
   * @param documentId - The document ID
   * @returns The latest DocumentVersion or null if none exist
   */
  async getLatestVersion(documentId: string): Promise<DocumentVersion | null> {
    return this.versionRepository.findOne({
      where: { documentId },
      order: { versionNumber: 'DESC' },
    });
  }

  /**
   * Count total versions for a document
   *
   * @param documentId - The document ID
   * @returns The total number of versions
   */
  async countVersions(documentId: string): Promise<number> {
    return this.versionRepository.count({
      where: { documentId },
    });
  }
}
