import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DocumentShare, SharePermission } from '../entities/document-share.entity';
import { LegalDocument } from '../entities/legal-document.entity';
import { UserSession } from '../../users/entities/user-session.entity';
import { ShareDocumentInput } from '../dto/share-document.input';
import { UpdateSharePermissionInput } from '../dto/update-share-permission.input';

/**
 * Service for managing document sharing and permissions
 *
 * Responsibilities:
 * - Create and revoke document shares
 * - Update share permissions
 * - Validate access rights
 * - Emit domain events for sharing activities
 */
@Injectable()
export class DocumentSharingService {
  constructor(
    @InjectRepository(DocumentShare)
    private readonly shareRepository: Repository<DocumentShare>,
    @InjectRepository(LegalDocument)
    private readonly documentRepository: Repository<LegalDocument>,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Share a document with a user
   *
   * @param input - Share configuration
   * @param sharedByUserId - ID of the user sharing the document
   * @throws NotFoundException if document doesn't exist
   * @throws ForbiddenException if user doesn't have permission to share
   * @throws ConflictException if share already exists
   */
  async shareDocument(
    input: ShareDocumentInput,
    sharedByUserId: string,
  ): Promise<DocumentShare> {
    // 1. Validate document exists
    const document = await this.documentRepository.findOne({
      where: { id: input.documentId },
      relations: ['session'],
    });

    if (!document) {
      throw new NotFoundException(
        `Document with ID ${input.documentId} not found`,
      );
    }

    // 2. Check if user has permission to share (must be owner or have ADMIN permission)
    const canShare = await this.canUserShareDocument(
      input.documentId,
      sharedByUserId,
    );
    if (!canShare) {
      throw new ForbiddenException(
        'You do not have permission to share this document',
      );
    }

    // 3. Check if share already exists
    const existingShare = await this.shareRepository.findOne({
      where: {
        documentId: input.documentId,
        sharedWithUserId: input.sharedWithUserId,
      },
    });

    if (existingShare) {
      throw new ConflictException(
        'Document is already shared with this user. Use update permission instead.',
      );
    }

    // 4. Create the share
    const share = this.shareRepository.create({
      documentId: input.documentId,
      sharedWithUserId: input.sharedWithUserId,
      sharedByUserId,
      permission: input.permission,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    });

    const savedShare = await this.shareRepository.save(share);

    // 5. Emit domain event
    this.eventEmitter.emit('document.shared', {
      shareId: savedShare.id,
      documentId: input.documentId,
      sharedWithUserId: input.sharedWithUserId,
      sharedByUserId,
      permission: input.permission,
    });

    return savedShare;
  }

  /**
   * Revoke a document share
   *
   * @param shareId - ID of the share to revoke
   * @param userId - ID of the user revoking the share
   * @throws NotFoundException if share doesn't exist
   * @throws ForbiddenException if user doesn't have permission to revoke
   */
  async revokeShare(shareId: string, userId: string): Promise<void> {
    const share = await this.shareRepository.findOne({
      where: { id: shareId },
      relations: ['document', 'document.session'],
    });

    if (!share) {
      throw new NotFoundException(`Share with ID ${shareId} not found`);
    }

    // Check if user has permission to revoke (must be owner or share creator)
    const canRevoke = await this.canUserShareDocument(share.documentId, userId);
    if (!canRevoke && share.sharedByUserId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to revoke this share',
      );
    }

    await this.shareRepository.remove(share);

    // Emit domain event
    this.eventEmitter.emit('document.share_revoked', {
      shareId,
      documentId: share.documentId,
      sharedWithUserId: share.sharedWithUserId,
      revokedByUserId: userId,
    });
  }

  /**
   * Update share permission level
   *
   * @param input - Update configuration
   * @param userId - ID of the user updating the permission
   * @throws NotFoundException if share doesn't exist
   * @throws ForbiddenException if user doesn't have permission to update
   */
  async updateSharePermission(
    input: UpdateSharePermissionInput,
    userId: string,
  ): Promise<DocumentShare> {
    const share = await this.shareRepository.findOne({
      where: { id: input.shareId },
      relations: ['document', 'document.session'],
    });

    if (!share) {
      throw new NotFoundException(`Share with ID ${input.shareId} not found`);
    }

    // Check if user has permission to update
    const canUpdate = await this.canUserShareDocument(share.documentId, userId);
    if (!canUpdate) {
      throw new ForbiddenException(
        'You do not have permission to update this share',
      );
    }

    share.permission = input.permission;
    const updatedShare = await this.shareRepository.save(share);

    // Emit domain event
    this.eventEmitter.emit('document.share_permission_updated', {
      shareId: share.id,
      documentId: share.documentId,
      newPermission: input.permission,
      updatedByUserId: userId,
    });

    return updatedShare;
  }

  /**
   * Get all shares for a document
   */
  async getDocumentShares(documentId: string): Promise<DocumentShare[]> {
    return this.shareRepository.find({
      where: { documentId },
      relations: ['sharedWithUser', 'sharedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all documents shared with a user
   */
  async getDocumentsSharedWithUser(
    userId: string,
    permission?: SharePermission,
  ): Promise<DocumentShare[]> {
    const where: any = { sharedWithUserId: userId };
    if (permission) {
      where.permission = permission;
    }

    return this.shareRepository.find({
      where,
      relations: ['document', 'sharedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Check if a user can access a document (either as owner or via share)
   *
   * @param documentId - ID of the document
   * @param userId - ID of the user
   * @param requiredPermission - Optional minimum permission level required
   * @returns true if user can access the document
   */
  async canUserAccessDocument(
    documentId: string,
    userId: string,
    requiredPermission?: SharePermission,
  ): Promise<boolean> {
    // 1. Check if user is the owner
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['session'],
    });

    if (!document) {
      return false;
    }

    // Check if user owns the document via session
    if (document.session && document.session.userId === userId) {
      return true; // Owner has full access
    }

    // 2. Check if document is shared with the user
    const share = await this.shareRepository.findOne({
      where: {
        documentId,
        sharedWithUserId: userId,
      },
    });

    if (!share || !share.isActive()) {
      return false;
    }

    // 3. Check permission level if required
    if (requiredPermission) {
      return this.hasRequiredPermission(share.permission, requiredPermission);
    }

    return true;
  }

  /**
   * Check if a user can share a document (must be owner or have ADMIN permission)
   */
  private async canUserShareDocument(
    documentId: string,
    userId: string,
  ): Promise<boolean> {
    // Check if user is the owner
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['session'],
    });

    if (!document) {
      return false;
    }

    if (document.session && document.session.userId === userId) {
      return true; // Owner can share
    }

    // Check if user has ADMIN permission via share
    const share = await this.shareRepository.findOne({
      where: {
        documentId,
        sharedWithUserId: userId,
        permission: SharePermission.ADMIN,
      },
    });

    return share !== null && share.isActive();
  }

  /**
   * Check if a permission level meets the required permission
   */
  private hasRequiredPermission(
    userPermission: SharePermission,
    requiredPermission: SharePermission,
  ): boolean {
    const permissionHierarchy = {
      [SharePermission.VIEW]: 1,
      [SharePermission.COMMENT]: 2,
      [SharePermission.EDIT]: 3,
      [SharePermission.ADMIN]: 4,
    };

    return (
      permissionHierarchy[userPermission] >=
      permissionHierarchy[requiredPermission]
    );
  }
}
