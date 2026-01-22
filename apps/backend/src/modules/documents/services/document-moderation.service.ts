import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LegalDocument,
  ModerationStatus,
} from '../entities/legal-document.entity';

/**
 * Moderation Action Result Interface
 */
interface ModerationResult {
  document: LegalDocument;
  userNotified: boolean;
}

/**
 * Document Moderation Service
 *
 * Handles business logic for document moderation workflow:
 * - Flagging documents for review
 * - Approving/rejecting flagged documents
 * - Notifying document owners of moderation decisions (placeholder for future integration)
 */
@Injectable()
export class DocumentModerationService {
  constructor(
    @InjectRepository(LegalDocument)
    private readonly documentRepository: Repository<LegalDocument>,
  ) {}

  /**
   * Flag a document for moderation review
   *
   * @param documentId - ID of the document to flag
   * @param reason - Optional reason for flagging
   * @returns The updated document and notification status
   */
  async flagDocument(
    documentId: string,
    reason?: string,
  ): Promise<ModerationResult> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // Flag the document
    document.flagForModeration();
    if (reason) {
      document.moderationReason = reason;
    }

    await this.documentRepository.save(document);

    return {
      document,
      userNotified: false, // No notification needed for flagging (internal action)
    };
  }

  /**
   * Approve a document after moderation review
   *
   * @param documentId - ID of the document to approve
   * @param moderatorId - ID of the admin user approving the document
   * @param reason - Optional approval reason
   * @returns The updated document and notification status
   */
  async approveDocument(
    documentId: string,
    moderatorId: string,
    reason?: string,
  ): Promise<ModerationResult> {
    const document = await this.findWithSession(documentId);

    // Approve the document
    document.approve(moderatorId, reason);

    await this.documentRepository.save(document);

    // TODO: Integrate with notification system to alert document owner
    // For now, notification is disabled pending template configuration

    return {
      document,
      userNotified: false,
    };
  }

  /**
   * Reject a document after moderation review
   *
   * @param documentId - ID of the document to reject
   * @param moderatorId - ID of the admin user rejecting the document
   * @param reason - Required rejection reason
   * @returns The updated document and notification status
   */
  async rejectDocument(
    documentId: string,
    moderatorId: string,
    reason: string,
  ): Promise<ModerationResult> {
    const document = await this.findWithSession(documentId);

    // Reject the document
    document.reject(moderatorId, reason);

    await this.documentRepository.save(document);

    // TODO: Integrate with notification system to alert document owner
    // For now, notification is disabled pending template configuration

    return {
      document,
      userNotified: false,
    };
  }

  /**
   * Get all documents pending moderation
   *
   * Returns documents with PENDING moderation status,
   * ordered by flag date (oldest first).
   *
   * @returns List of documents pending moderation
   */
  async getPendingDocuments(): Promise<LegalDocument[]> {
    return this.documentRepository.find({
      where: { moderationStatus: ModerationStatus.PENDING },
      relations: ['session'],
      order: { flaggedAt: 'ASC' },
    });
  }

  /**
   * Find document with session relation loaded
   *
   * @param documentId - ID of the document
   * @returns The document with session relation
   * @throws NotFoundException if document not found
   */
  private async findWithSession(documentId: string): Promise<LegalDocument> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['session'],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    return document;
  }
}
