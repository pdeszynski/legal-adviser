import { Resolver, Mutation, Query, Args, ID, Context } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import {
  GqlAuthGuard,
  DocumentPermissionGuard,
  DocumentPermission,
} from '../auth/guards';
import { DocumentSharingService } from './services/document-sharing.service';
import {
  DocumentShare,
  SharePermission,
} from './entities/document-share.entity';
import { ShareDocumentInput } from './dto/share-document.input';
import { UpdateSharePermissionInput } from './dto/update-share-permission.input';

/**
 * Resolver for document sharing operations
 *
 * All mutations require JWT authentication and validate user permissions.
 * Sharing operations are tracked via domain events for audit logging.
 */
@Resolver(() => DocumentShare)
@UseGuards(GqlAuthGuard)
export class DocumentSharingResolver {
  constructor(private readonly sharingService: DocumentSharingService) {}

  /**
   * Share a document with a user
   *
   * Requires:
   * - User must be document owner OR have ADMIN permission
   * - Shared user must exist
   * - Document cannot already be shared with the user
   */
  @Mutation(() => DocumentShare, {
    description: 'Share a document with a user',
  })
  @UseGuards(GqlAuthGuard)
  async shareDocument(
    @Args('input') input: ShareDocumentInput,
    @Context() context: { req: { user: { userId: string } } },
  ): Promise<DocumentShare> {
    const userId = context.req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.sharingService.shareDocument(input, userId);
  }

  /**
   * Revoke a document share
   *
   * Requires:
   * - User must be document owner, share creator, OR have ADMIN permission
   */
  @Mutation(() => Boolean, {
    description: 'Revoke a document share',
  })
  @UseGuards(GqlAuthGuard)
  async revokeDocumentShare(
    @Args('shareId', { type: () => ID }) shareId: string,
    @Context() context: { req: { user: { userId: string } } },
  ): Promise<boolean> {
    const userId = context.req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    await this.sharingService.revokeShare(shareId, userId);
    return true;
  }

  /**
   * Update share permission level
   *
   * Requires:
   * - User must be document owner OR have ADMIN permission
   */
  @Mutation(() => DocumentShare, {
    description: 'Update the permission level of a document share',
  })
  @UseGuards(GqlAuthGuard)
  async updateDocumentSharePermission(
    @Args('input') input: UpdateSharePermissionInput,
    @Context() context: { req: { user: { userId: string } } },
  ): Promise<DocumentShare> {
    const userId = context.req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.sharingService.updateSharePermission(input, userId);
  }

  /**
   * Get all shares for a document
   *
   * Returns users who have access to the document and their permission levels.
   * Only accessible by document owner or users with ADMIN permission.
   */
  @Query(() => [DocumentShare], {
    description: 'Get all shares for a document',
  })
  @UseGuards(GqlAuthGuard)
  async documentShares(
    @Args('documentId', { type: () => ID }) documentId: string,
    @Context() context: { req: { user: { userId: string } } },
  ): Promise<DocumentShare[]> {
    const userId = context.req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Verify user has access to view shares
    const canAccess = await this.sharingService.canUserAccessDocument(
      documentId,
      userId,
    );
    if (!canAccess) {
      throw new UnauthorizedException(
        'You do not have access to this document',
      );
    }

    return this.sharingService.getDocumentShares(documentId);
  }

  /**
   * Get all documents shared with the current user
   *
   * Optionally filter by permission level.
   */
  @Query(() => [DocumentShare], {
    description: 'Get all documents shared with the current user',
  })
  @UseGuards(GqlAuthGuard)
  async documentsSharedWithMe(
    @Args('permission', { type: () => SharePermission, nullable: true })
    permission: SharePermission | undefined,
    @Context() context: { req: { user: { userId: string } } },
  ): Promise<DocumentShare[]> {
    const userId = context.req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.sharingService.getDocumentsSharedWithUser(userId, permission);
  }
}
