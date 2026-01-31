/**
 * Document Generation Queue Resolver
 *
 * Custom GraphQL resolver for document generation queue management.
 * This is NOT standard CRUD - it involves complex Temporal workflow orchestration,
 * status tracking across distributed systems, and domain-specific actions.
 *
 * Operations:
 * - retryDocumentGeneration: Retry a failed document generation workflow
 * - cancelDocumentGeneration: Cancel a running document generation workflow
 * - getDocumentWorkflowStatus: Get the status of a document generation workflow
 * - documentGenerationQueueList: List documents in the generation queue with filtering
 *
 * All mutations require admin authentication and are logged to audit logs.
 */

import { UseGuards } from '@nestjs/common';
import {
  Resolver,
  Mutation,
  Query,
  Context,
  Args,
  ID,
  Int,
  Field,
  ObjectType,
  InputType,
  registerEnumType,
} from '@nestjs/graphql';
import { GqlAuthGuard, AdminGuard } from '../auth/guards';
import { DocumentGenerationStarter } from '../temporal/workflows/document/document-generation.starter';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  AuditActionType,
  AuditResourceType,
} from '../audit-log/entities/audit-log.entity';
import { DocumentsService } from './services/documents.service';
import {
  LegalDocument,
  DocumentStatus,
} from './entities/legal-document.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

/**
 * Document Workflow Status
 */
export enum DocumentWorkflowStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  NOT_FOUND = 'NOT_FOUND',
}

registerEnumType(DocumentWorkflowStatus, {
  name: 'DocumentWorkflowStatus',
  description: 'Status of a document generation workflow',
});

/**
 * Document Workflow Status Result
 *
 * Response with workflow status information.
 */
@ObjectType('DocumentWorkflowStatusResult')
export class DocumentWorkflowStatusResult {
  @Field(() => ID, { description: 'Document ID' })
  documentId: string;

  @Field(() => String, {
    nullable: true,
    description: 'Workflow ID (derived from document ID)',
  })
  workflowId?: string;

  @Field(() => DocumentWorkflowStatus, {
    description: 'Current workflow status',
  })
  status: DocumentWorkflowStatus;

  @Field(() => Boolean, {
    description: 'Whether the workflow is currently running',
  })
  isRunning: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'Error message if workflow failed',
  })
  errorMessage?: string;

  @Field(() => String, {
    nullable: true,
    description: 'ISO timestamp of last update',
  })
  lastUpdated?: string;
}

/**
 * Document Queue Entry
 *
 * Represents a document in the generation queue.
 */
@ObjectType('DocumentQueueEntry')
export class DocumentQueueEntry {
  @Field(() => ID, { description: 'Document ID' })
  documentId: string;

  @Field(() => String, { description: 'Document title' })
  title: string;

  @Field(() => String, { description: 'Document type' })
  documentType: string;

  @Field(() => DocumentWorkflowStatus, {
    description: 'Current workflow status',
  })
  workflowStatus: DocumentWorkflowStatus;

  @Field(() => String, {
    nullable: true,
    description: 'Document status from database',
  })
  documentStatus?: string;

  @Field(() => String, {
    nullable: true,
    description: 'User ID who owns the document',
  })
  userId?: string;

  @Field(() => String, {
    nullable: true,
    description: 'User email who owns the document',
  })
  userEmail?: string;

  @Field(() => String, { description: 'ISO timestamp of creation' })
  createdAt: string;

  @Field(() => String, {
    nullable: true,
    description: 'ISO timestamp of last update',
  })
  updatedAt?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Error message if generation failed',
  })
  errorMessage?: string;

  @Field(() => Int, {
    nullable: true,
    description: 'Generation time in milliseconds',
  })
  generationTimeMs?: number;
}

/**
 * Document Queue List Result
 *
 * Response with paginated document queue entries.
 */
@ObjectType('DocumentQueueListResult')
export class DocumentQueueListResult {
  @Field(() => [DocumentQueueEntry], {
    description: 'List of documents in the queue',
  })
  entries: DocumentQueueEntry[];

  @Field(() => Int, { description: 'Total number of entries' })
  totalCount: number;

  @Field(() => Int, { description: 'Number of entries per status' })
  pendingCount: number;

  @Field(() => Int, { description: 'Number of running workflows' })
  runningCount: number;

  @Field(() => Int, { description: 'Number of completed workflows' })
  completedCount: number;

  @Field(() => Int, { description: 'Number of failed workflows' })
  failedCount: number;
}

/**
 * Retry Document Generation Input
 *
 * Input for retrying a failed document generation.
 */
@InputType('RetryDocumentGenerationInput')
export class RetryDocumentGenerationInput {
  @Field(() => ID, { description: 'Document ID to retry' })
  documentId: string;

  @Field(() => String, {
    nullable: true,
    description: 'Optional reason for retry (logged to audit trail)',
  })
  reason?: string;
}

/**
 * Retry Document Generation Result
 *
 * Response after retrying document generation.
 */
@ObjectType('RetryDocumentGenerationResult')
export class RetryDocumentGenerationResult {
  @Field(() => ID, { description: 'Document ID' })
  documentId: string;

  @Field(() => Boolean, { description: 'Whether the retry was initiated' })
  success: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'Message describing the retry result',
  })
  message?: string;

  @Field(() => String, {
    nullable: true,
    description: 'New workflow ID for the retry attempt',
  })
  workflowId?: string;
}

/**
 * Cancel Document Generation Input
 *
 * Input for canceling a running document generation.
 */
@InputType('CancelDocumentGenerationInput')
export class CancelDocumentGenerationInput {
  @Field(() => ID, { description: 'Document ID to cancel' })
  documentId: string;

  @Field(() => String, {
    nullable: true,
    description: 'Optional reason for cancellation (logged to audit trail)',
  })
  reason?: string;
}

/**
 * Cancel Document Generation Result
 *
 * Response after canceling document generation.
 */
@ObjectType('CancelDocumentGenerationResult')
export class CancelDocumentGenerationResult {
  @Field(() => ID, { description: 'Document ID' })
  documentId: string;

  @Field(() => Boolean, {
    description: 'Whether the cancellation was successful',
  })
  success: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'Message describing the cancellation result',
  })
  message?: string;
}

/**
 * Document Queue List Input
 *
 * Input for listing documents in the queue with filtering.
 */
@InputType('DocumentQueueListInput')
export class DocumentQueueListInput {
  @Field(() => DocumentWorkflowStatus, {
    nullable: true,
    description: 'Filter by workflow status',
  })
  status?: DocumentWorkflowStatus;

  @Field(() => String, {
    nullable: true,
    description: 'Filter by document type',
  })
  documentType?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Filter by user ID',
  })
  userId?: string;

  @Field(() => Int, {
    nullable: true,
    description: 'Maximum number of results to return',
    defaultValue: 50,
  })
  limit?: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Number of results to skip',
    defaultValue: 0,
  })
  offset?: number;
}

/**
 * Document Generation Queue Resolver
 *
 * Handles GraphQL queries and mutations for document generation queue management.
 * All operations require admin authentication.
 */
@Resolver()
@UseGuards(GqlAuthGuard, AdminGuard)
export class DocumentQueueResolver {
  constructor(
    private readonly documentGenerationStarter: DocumentGenerationStarter,
    private readonly auditLogService: AuditLogService,
    private readonly documentsService: DocumentsService,
    @InjectRepository(LegalDocument)
    private readonly legalDocumentRepository: Repository<LegalDocument>,
  ) {}

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
   * Extract IP address from GraphQL context
   */
  private extractIpAddress(context: any): string | undefined {
    const headers = context.req?.headers || {};
    const forwarded = headers['x-forwarded-for'];
    if (forwarded) {
      const ips = forwarded.split(',');
      return ips[0].trim();
    }
    const realIp = headers['x-real-ip'];
    if (realIp) {
      return realIp;
    }
    return context.req?.ip;
  }

  /**
   * Extract user agent from GraphQL context
   */
  private extractUserAgent(context: any): string | undefined {
    const headers = context.req?.headers || {};
    return headers['user-agent'];
  }

  /**
   * Query: Get Document Workflow Status
   *
   * Returns the current status of a document generation workflow.
   *
   * @param documentId - The document ID to check
   * @returns Workflow status information
   */
  @Query(() => DocumentWorkflowStatusResult, {
    name: 'getDocumentWorkflowStatus',
    description: 'Get the status of a document generation workflow',
  })
  async getDocumentWorkflowStatus(
    @Args('documentId', { type: () => String }) documentId: string,
    @Context() context: any,
  ): Promise<DocumentWorkflowStatusResult> {
    const userId = this.getCurrentUserId(context);

    // Log the access
    await this.auditLogService.logAction(
      AuditActionType.READ,
      AuditResourceType.DOCUMENT,
      {
        resourceId: documentId,
        userId,
        changeDetails: {
          context: { action: 'get_workflow_status' },
        },
      },
    );

    // Get document from database
    const document = await this.legalDocumentRepository.findOne({
      where: { id: documentId },
      relations: ['session', 'session.user'],
    });

    if (!document) {
      return {
        documentId,
        status: DocumentWorkflowStatus.NOT_FOUND,
        isRunning: false,
        lastUpdated: new Date().toISOString(),
      };
    }

    // Get workflow status from Temporal
    const workflowStatus =
      await this.documentGenerationStarter.getWorkflowStatus(documentId);

    // Determine final status
    let status: DocumentWorkflowStatus;
    if (workflowStatus) {
      if (workflowStatus.isRunning) {
        status = DocumentWorkflowStatus.RUNNING;
      } else {
        // Workflow exists but not running - check document status
        if (document.status === 'COMPLETED') {
          status = DocumentWorkflowStatus.COMPLETED;
        } else if (document.status === 'FAILED') {
          status = DocumentWorkflowStatus.FAILED;
        } else {
          status = DocumentWorkflowStatus.PENDING;
        }
      }
    } else {
      // No workflow - use document status
      if (document.status === 'GENERATING') {
        status = DocumentWorkflowStatus.RUNNING;
      } else if (document.status === 'COMPLETED') {
        status = DocumentWorkflowStatus.COMPLETED;
      } else if (document.status === 'FAILED') {
        status = DocumentWorkflowStatus.FAILED;
      } else {
        status = DocumentWorkflowStatus.PENDING;
      }
    }

    return {
      documentId,
      workflowId: workflowStatus?.workflowId,
      status,
      isRunning: status === DocumentWorkflowStatus.RUNNING,
      errorMessage: undefined,
      lastUpdated:
        document.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * Query: List Document Generation Queue
   *
   * Returns a paginated list of documents in the generation queue
   * with optional filtering by status, document type, or user.
   *
   * @param input - List options with filters
   * @returns List of document queue entries with counts
   */
  @Query(() => DocumentQueueListResult, {
    name: 'documentGenerationQueueList',
    description: 'List documents in the generation queue',
  })
  async documentGenerationQueueList(
    @Args('input', { nullable: true }) input?: DocumentQueueListInput,
    @Context() context?: any,
  ): Promise<DocumentQueueListResult> {
    const userId = context ? this.getCurrentUserId(context) : 'system';
    const limit = input?.limit ?? 50;
    const offset = input?.offset ?? 0;

    // Build query with filters
    const queryBuilder = this.legalDocumentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.session', 'session')
      .leftJoinAndSelect('session.user', 'user')
      .orderBy('document.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    // Filter by document type
    if (input?.documentType) {
      queryBuilder.andWhere('document.type = :documentType', {
        documentType: input.documentType,
      });
    }

    // Filter by user
    if (input?.userId) {
      queryBuilder.andWhere('session.userId = :userId', {
        userId: input.userId,
      });
    }

    // Get filtered documents
    let documents = await queryBuilder.getMany();

    // Enrich with workflow status and filter by status if requested
    const entries: DocumentQueueEntry[] = [];
    const statusCounts = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
    };

    for (const document of documents) {
      const workflowStatus =
        await this.documentGenerationStarter.getWorkflowStatus(document.id);

      let status: DocumentWorkflowStatus;
      if (workflowStatus) {
        if (workflowStatus.isRunning) {
          status = DocumentWorkflowStatus.RUNNING;
        } else {
          status =
            document.status === 'COMPLETED'
              ? DocumentWorkflowStatus.COMPLETED
              : document.status === 'FAILED'
                ? DocumentWorkflowStatus.FAILED
                : DocumentWorkflowStatus.PENDING;
        }
      } else {
        status =
          document.status === 'GENERATING'
            ? DocumentWorkflowStatus.RUNNING
            : document.status === 'COMPLETED'
              ? DocumentWorkflowStatus.COMPLETED
              : document.status === 'FAILED'
                ? DocumentWorkflowStatus.FAILED
                : DocumentWorkflowStatus.PENDING;
      }

      // Count by status
      switch (status) {
        case DocumentWorkflowStatus.PENDING:
          statusCounts.pending++;
          break;
        case DocumentWorkflowStatus.RUNNING:
          statusCounts.running++;
          break;
        case DocumentWorkflowStatus.COMPLETED:
          statusCounts.completed++;
          break;
        case DocumentWorkflowStatus.FAILED:
          statusCounts.failed++;
          break;
      }

      // Filter by status if requested
      if (input?.status && status !== input.status) {
        continue;
      }

      entries.push({
        documentId: document.id,
        title: document.title,
        documentType: document.type,
        workflowStatus: status,
        documentStatus: document.status,
        userId: document.session?.userId,
        userEmail: document.session?.user?.email,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt?.toISOString(),
        errorMessage: undefined,
        generationTimeMs: undefined,
      });
    }

    // Get total count
    const totalCount = await queryBuilder.getCount();

    // Log the access
    if (this.auditLogService) {
      await this.auditLogService.logAction(
        AuditActionType.READ,
        AuditResourceType.DOCUMENT,
        {
          resourceId: 'queue',
          userId,
          changeDetails: {
            context: { action: 'list_queue', filters: input },
          },
        },
      );
    }

    return {
      entries,
      totalCount,
      pendingCount: statusCounts.pending,
      runningCount: statusCounts.running,
      completedCount: statusCounts.completed,
      failedCount: statusCounts.failed,
    };
  }

  /**
   * Mutation: Retry Document Generation
   *
   * Retries a failed document generation workflow.
   * Creates a new workflow execution for the same document.
   *
   * @param input - Document ID and optional reason
   * @returns Retry result with success status
   */
  @Mutation(() => RetryDocumentGenerationResult, {
    name: 'retryDocumentGeneration',
    description: 'Retry a failed document generation workflow',
  })
  async retryDocumentGeneration(
    @Args('input') input: RetryDocumentGenerationInput,
    @Context() context: any,
  ): Promise<RetryDocumentGenerationResult> {
    const userId = this.getCurrentUserId(context);
    const ipAddress = this.extractIpAddress(context) || undefined;
    const userAgent = this.extractUserAgent(context) || undefined;

    try {
      // Get document from database
      const document = await this.legalDocumentRepository.findOne({
        where: { id: input.documentId },
        relations: ['session', 'session.user'],
      });

      if (!document) {
        const message = `Document ${input.documentId} not found`;

        await this.auditLogService.logAction(
          AuditActionType.UPDATE,
          AuditResourceType.DOCUMENT,
          {
            resourceId: input.documentId,
            userId,
            ipAddress,
            userAgent,
            statusCode: 404,
            errorMessage: message,
          },
        );

        return {
          documentId: input.documentId,
          success: false,
          message,
        };
      }

      // Check if document can be retried
      const workflowStatus =
        await this.documentGenerationStarter.getWorkflowStatus(
          input.documentId,
        );

      if (workflowStatus?.isRunning) {
        const message = 'Cannot retry: workflow is currently running';

        await this.auditLogService.logAction(
          AuditActionType.UPDATE,
          AuditResourceType.DOCUMENT,
          {
            resourceId: input.documentId,
            userId,
            ipAddress,
            userAgent,
            statusCode: 400,
            errorMessage: message,
          },
        );

        return {
          documentId: input.documentId,
          success: false,
          message,
        };
      }

      // Reset document status to trigger regeneration
      document.status = DocumentStatus.DRAFT;
      await this.legalDocumentRepository.save(document);

      // Start new workflow
      const result =
        await this.documentGenerationStarter.startDocumentGeneration({
          documentId: document.id,
          sessionId: document.sessionId || '',
          title: document.title,
          documentType: document.type,
          description: '',
          context: document.metadata as Record<string, unknown> | null,
          userId: document.session?.userId || '',
        });

      // Log successful retry
      await this.auditLogService.logAction(
        AuditActionType.UPDATE,
        AuditResourceType.DOCUMENT,
        {
          resourceId: input.documentId,
          userId,
          ipAddress,
          userAgent,
          statusCode: 200,
          changeDetails: {
            changedFields: ['status', 'workflowId'],
            before: { status: 'FAILED' },
            after: { status: 'GENERATING', workflowId: result.workflowId },
            context: input.reason ? { reason: input.reason } : undefined,
          },
        },
      );

      return {
        documentId: input.documentId,
        success: true,
        message: 'Document generation retry initiated',
        workflowId: result.workflowId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Log failed retry
      await this.auditLogService.logAction(
        AuditActionType.UPDATE,
        AuditResourceType.DOCUMENT,
        {
          resourceId: input.documentId,
          userId,
          ipAddress,
          userAgent,
          statusCode: 500,
          errorMessage,
        },
      );

      return {
        documentId: input.documentId,
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Mutation: Cancel Document Generation
   *
   * Cancels a running document generation workflow.
   *
   * @param input - Document ID and optional reason
   * @returns Cancellation result with success status
   */
  @Mutation(() => CancelDocumentGenerationResult, {
    name: 'cancelDocumentGeneration',
    description: 'Cancel a running document generation workflow',
  })
  async cancelDocumentGeneration(
    @Args('input') input: CancelDocumentGenerationInput,
    @Context() context: any,
  ): Promise<CancelDocumentGenerationResult> {
    const userId = this.getCurrentUserId(context);
    const ipAddress = this.extractIpAddress(context) || undefined;
    const userAgent = this.extractUserAgent(context) || undefined;

    try {
      // Get document from database
      const document = await this.legalDocumentRepository.findOne({
        where: { id: input.documentId },
      });

      if (!document) {
        const message = `Document ${input.documentId} not found`;

        await this.auditLogService.logAction(
          AuditActionType.DELETE,
          AuditResourceType.DOCUMENT,
          {
            resourceId: input.documentId,
            userId,
            ipAddress,
            userAgent,
            statusCode: 404,
            errorMessage: message,
          },
        );

        return {
          documentId: input.documentId,
          success: false,
          message,
        };
      }

      // Check workflow status
      const workflowStatus =
        await this.documentGenerationStarter.getWorkflowStatus(
          input.documentId,
        );

      if (!workflowStatus || !workflowStatus.isRunning) {
        const message = 'Cannot cancel: workflow is not running';

        await this.auditLogService.logAction(
          AuditActionType.DELETE,
          AuditResourceType.DOCUMENT,
          {
            resourceId: input.documentId,
            userId,
            ipAddress,
            userAgent,
            statusCode: 400,
            errorMessage: message,
          },
        );

        return {
          documentId: input.documentId,
          success: false,
          message,
        };
      }

      // Cancel the workflow
      const cancelled = await this.documentGenerationStarter.cancelWorkflow(
        input.documentId,
      );

      if (!cancelled) {
        const message = 'Failed to cancel workflow';

        await this.auditLogService.logAction(
          AuditActionType.DELETE,
          AuditResourceType.DOCUMENT,
          {
            resourceId: input.documentId,
            userId,
            ipAddress,
            userAgent,
            statusCode: 500,
            errorMessage: message,
          },
        );

        return {
          documentId: input.documentId,
          success: false,
          message,
        };
      }

      // Update document status
      document.status = DocumentStatus.FAILED;
      await this.legalDocumentRepository.save(document);

      // Log successful cancellation
      await this.auditLogService.logAction(
        AuditActionType.DELETE,
        AuditResourceType.DOCUMENT,
        {
          resourceId: input.documentId,
          userId,
          ipAddress,
          userAgent,
          statusCode: 200,
          changeDetails: {
            changedFields: ['status'],
            before: { status: 'GENERATING' },
            after: { status: 'CANCELLED' },
            context: input.reason ? { reason: input.reason } : undefined,
          },
        },
      );

      return {
        documentId: input.documentId,
        success: true,
        message: 'Document generation cancelled successfully',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Log failed cancellation
      await this.auditLogService.logAction(
        AuditActionType.DELETE,
        AuditResourceType.DOCUMENT,
        {
          resourceId: input.documentId,
          userId,
          ipAddress,
          userAgent,
          statusCode: 500,
          errorMessage,
        },
      );

      return {
        documentId: input.documentId,
        success: false,
        message: errorMessage,
      };
    }
  }
}
