import { Resolver, Mutation, Args, ID, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import {
  LegalDocument,
  ModerationStatus,
} from './entities/legal-document.entity';
import {
  FlagDocumentForModerationInput,
  ApproveDocumentInput,
  RejectDocumentInput,
  ModerationActionResult,
} from './dto/document-moderation.dto';
import { DocumentModerationService } from './services/document-moderation.service';
import { GqlAuthGuard, AdminGuard } from '../auth/guards';

/**
 * Document Moderation Resolver
 *
 * Provides GraphQL mutations for document moderation workflow.
 * All moderation operations require admin authentication.
 *
 * Operations:
 * - flagDocumentForModeration: Flag a document for review
 * - approveDocument: Approve a flagged document
 * - rejectDocument: Reject a flagged document
 * - pendingModerationDocuments: Query all pending moderation documents
 */
@Resolver(() => LegalDocument)
@UseGuards(GqlAuthGuard, AdminGuard)
export class DocumentModerationResolver {
  constructor(private readonly moderationService: DocumentModerationService) {}

  /**
   * Get current user ID from request context
   */
  private getCurrentUserId(context: any): string {
    const user = context.req?.user;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.sub || user.id || user.userId;
  }

  /**
   * Mutation: Flag a document for moderation review
   *
   * Marks the document as pending moderation and records the timestamp.
   * Optionally stores a reason for flagging.
   *
   * @param input - Document ID and optional reason
   * @returns Moderation action result
   */
  @Mutation(() => ModerationActionResult, {
    name: 'flagDocumentForModeration',
    description: 'Flag a document for moderation review',
  })
  async flagDocument(
    @Args('input') input: FlagDocumentForModerationInput,
    @Context() context: any,
  ): Promise<ModerationActionResult> {
    const result = await this.moderationService.flagDocument(
      input.documentId,
      input.reason,
    );

    return {
      documentId: result.document.id,
      action: 'FLAGGED',
      reason: result.document.moderationReason,
      userNotified: result.userNotified,
    };
  }

  /**
   * Mutation: Approve a document
   *
   * Marks the document as approved by the current admin user.
   * Optionally stores an approval reason.
   * Notifies the document owner of the approval.
   *
   * @param input - Document ID and optional reason
   * @returns Moderation action result
   */
  @Mutation(() => ModerationActionResult, {
    name: 'approveDocument',
    description: 'Approve a document after moderation review',
  })
  async approveDocument(
    @Args('input') input: ApproveDocumentInput,
    @Context() context: any,
  ): Promise<ModerationActionResult> {
    const moderatorId = this.getCurrentUserId(context);
    const result = await this.moderationService.approveDocument(
      input.documentId,
      moderatorId,
      input.reason,
    );

    return {
      documentId: result.document.id,
      action: 'APPROVED',
      reason: result.document.moderationReason,
      userNotified: result.userNotified,
    };
  }

  /**
   * Mutation: Reject a document
   *
   * Marks the document as rejected by the current admin user.
   * Requires a reason for rejection.
   * Notifies the document owner of the rejection.
   *
   * @param input - Document ID and required reason
   * @returns Moderation action result
   */
  @Mutation(() => ModerationActionResult, {
    name: 'rejectDocument',
    description: 'Reject a document after moderation review',
  })
  async rejectDocument(
    @Args('input') input: RejectDocumentInput,
    @Context() context: any,
  ): Promise<ModerationActionResult> {
    const moderatorId = this.getCurrentUserId(context);
    const result = await this.moderationService.rejectDocument(
      input.documentId,
      moderatorId,
      input.reason,
    );

    return {
      documentId: result.document.id,
      action: 'REJECTED',
      reason: result.document.moderationReason,
      userNotified: result.userNotified,
    };
  }

  /**
   * Query: Get all documents pending moderation
   *
   * Returns documents that are flagged and awaiting admin review.
   * Ordered by flag date (oldest first).
   *
   * @returns List of documents pending moderation
   */
  @Query(() => [LegalDocument], {
    name: 'pendingModerationDocuments',
    description: 'Get all documents pending moderation review',
  })
  async getPendingDocuments(): Promise<LegalDocument[]> {
    return this.moderationService.getPendingDocuments();
  }
}
