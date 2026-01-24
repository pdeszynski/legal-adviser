import { Injectable, ExecutionContext, SetMetadata } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalDocument } from '../../documents/entities/legal-document.entity';
import {
  DocumentShare,
  SharePermission,
} from '../../documents/entities/document-share.entity';
import { MissingTokenException, ForbiddenAccessException } from '../exceptions';

/**
 * Permission metadata key for decorator
 */
export const PERMISSION_KEY = 'permission';

/**
 * Permission levels for document access
 */
export enum DocumentPermissionLevel {
  READ = 'read',
  WRITE = 'write',
  SHARE = 'share',
  OWNER = 'owner',
}

/**
 * Document Permission Guard
 *
 * Checks if the authenticated user has the required permission
 * to access a document based on:
 * 1. Document ownership (via UserSession)
 * 2. Document shares (via DocumentShare entity)
 *
 * Returns proper HTTP status codes:
 * - 401 Unauthorized: User not authenticated
 * - 403 Forbidden: User authenticated but lacks permission
 *
 * Usage:
 * @UseGuards(DocumentPermissionGuard)
 * @RequireDocumentPermission(DocumentPermissionLevel.READ)
 *
 * The guard expects the document ID to be provided in one of these ways:
 * 1. Via 'id' argument in the args
 * 2. Via 'input.documentId' or 'input.id' in the args
 * 3. Via 'documentId' argument
 */
@Injectable()
export class DocumentPermissionGuard {
  constructor(
    private reflector: Reflector,
    @InjectRepository(LegalDocument)
    private readonly documentRepository: Repository<LegalDocument>,
    @InjectRepository(DocumentShare)
    private readonly shareRepository: Repository<DocumentShare>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permission from decorator metadata
    const requiredPermission =
      this.reflector.getAllAndOverride<DocumentPermissionLevel>(
        PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!requiredPermission) {
      // No permission requirement - allow access
      return true;
    }

    // Get GraphQL context
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const userId = req.user?.userId;

    if (!userId) {
      throw new MissingTokenException('User not authenticated');
    }

    // Extract document ID from arguments
    const documentId = this.extractDocumentId(ctx.getArgs());

    if (!documentId) {
      // No document ID in arguments - this might be a list query
      // Allow access but let the service layer handle filtering
      return true;
    }

    // Check if user has the required permission
    const hasPermission = await this.checkPermission(
      documentId,
      userId,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new ForbiddenAccessException(
        `You do not have ${requiredPermission} permission for this document`,
      );
    }

    return true;
  }

  /**
   * Extract document ID from resolver arguments
   */
  private extractDocumentId(args: Record<string, unknown>): string | null {
    // Direct 'id' argument
    if (args.id && typeof args.id === 'string') {
      return args.id;
    }

    // Nested in 'input.documentId' or 'input.id'
    if (args.input && typeof args.input === 'object') {
      const input = args.input as Record<string, unknown>;
      if (input.documentId && typeof input.documentId === 'string') {
        return input.documentId;
      }
      if (input.id && typeof input.id === 'string') {
        return input.id;
      }
    }

    // 'documentId' argument
    if (args.documentId && typeof args.documentId === 'string') {
      return args.documentId;
    }

    return null;
  }

  /**
   * Check if user has the required permission for a document
   */
  private async checkPermission(
    documentId: string,
    userId: string,
    requiredPermission: DocumentPermissionLevel,
  ): Promise<boolean> {
    // Load document with session relation
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['session'],
    });

    if (!document) {
      // Document doesn't exist - let the resolver handle the 404
      return true;
    }

    // Check if user owns the document (via session)
    const isOwner = document.session?.userId === userId;

    if (requiredPermission === DocumentPermissionLevel.OWNER) {
      return isOwner;
    }

    if (isOwner) {
      // Owner has all permissions
      return true;
    }

    // Check shares for non-owners
    const share = await this.shareRepository.findOne({
      where: {
        documentId,
        sharedWithUserId: userId,
      },
    });

    if (!share || !share.isActive()) {
      return false;
    }

    // Check permission level based on share
    switch (requiredPermission) {
      case DocumentPermissionLevel.READ:
        return share.canView();

      case DocumentPermissionLevel.WRITE:
        return share.canEdit();

      case DocumentPermissionLevel.SHARE:
        return share.canShare();

      default:
        return false;
    }
  }
}

/**
 * Permission decorator for specifying required permission level
 *
 * @example
 * @RequireDocumentPermission(DocumentPermissionLevel.READ)
 * @Query(() => LegalDocument)
 * async getDocument(@Args('id') id: string) {
 *   return this.documentsService.findOne(id);
 * }
 */
export const RequireDocumentPermission = (
  permission: DocumentPermissionLevel,
): MethodDecorator => SetMetadata(PERMISSION_KEY, permission);

// Re-export enum with a shorter name for convenience
export { DocumentPermissionLevel as DocumentPermission };
