/**
 * Document Generation Starter Service
 *
 * Service for starting the DocumentGeneration Temporal workflow.
 * This replaces the Bull-based DocumentGenerationProducer.
 *
 * Usage:
 * - Inject DocumentGenerationStarter into your service
 * - Call startDocumentGeneration() to queue a document for generation
 * - The workflow runs asynchronously in Temporal
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TemporalService } from '../../temporal.service';
import { TEMPORAL_TASK_QUEUES } from '../../temporal.constants';
import { generateWorkflowId } from './document-generation.workflow';
import type { DocumentType } from '../../../documents/entities/legal-document.entity';

/**
 * Start Document Generation Request
 *
 * Input parameters for starting a document generation workflow.
 */
export interface StartDocumentGenerationRequest {
  /** Document ID to generate content for */
  documentId: string;
  /** Session ID associated with the document */
  sessionId: string;
  /** Document title */
  title: string;
  /** Document type */
  documentType: DocumentType;
  /** Description of the document content to generate */
  description: string;
  /** Additional context for document generation */
  context?: Record<string, unknown> | null;
  /** User ID for tracking */
  userId?: string;
}

/**
 * Document Generation Workflow Start Result
 *
 * Result returned after starting a document generation workflow.
 */
export interface DocumentGenerationWorkflowStartResult {
  /** Unique workflow ID */
  workflowId: string;
  /** First execution ID (run ID) */
  runId: string;
  /** Task queue the workflow was dispatched to */
  taskQueue: string;
  /** Workflow type/name */
  workflowType: string;
}

/**
 * Document Generation Starter Service
 *
 * Provides methods to start document generation workflows in Temporal.
 * Replaces the Bull-based DocumentGenerationProducer.
 *
 * Key Features:
 * - Idempotent workflow execution based on document ID
 * - Asynchronous workflow execution (returns immediately)
 * - Retry policy with exponential backoff for AI failures
 * - Progress tracking via SSE
 * - Completion email notifications
 */
@Injectable()
export class DocumentGenerationStarter {
  private readonly logger = new Logger(DocumentGenerationStarter.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly temporalService: TemporalService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  /**
   * Start a document generation workflow
   *
   * This method starts a new Temporal workflow for document generation.
   * The workflow runs asynchronously and returns immediately with a workflow ID.
   *
   * Idempotency:
   * - The workflow ID is derived from the document ID
   * - Starting a workflow for the same document ID will not create duplicate work
   * - Use getWorkflowStatus() to check the status of an existing workflow
   *
   * @param request - Document generation request parameters
   * @returns Workflow start result with workflow ID and run ID
   */
  async startDocumentGeneration(
    request: StartDocumentGenerationRequest,
  ): Promise<DocumentGenerationWorkflowStartResult> {
    const {
      documentId,
      sessionId,
      title,
      documentType,
      description,
      context,
      userId,
    } = request;

    // Generate a deterministic workflow ID based on document ID
    // This ensures idempotency - re-running with same document ID won't duplicate work
    const workflowId = generateWorkflowId(documentId);

    this.logger.log(
      `Starting document generation workflow ${workflowId} for document ${documentId}`,
    );

    // Prepare workflow input
    const workflowInput = {
      documentId,
      sessionId,
      title,
      documentType,
      description,
      context,
      userId,
      frontendUrl: this.frontendUrl,
    };

    try {
      // Start the workflow in Temporal
      const result = await this.temporalService.startWorkflow(
        'documentGeneration',
        [workflowInput],
        {
          workflowId,
          taskQueue: TEMPORAL_TASK_QUEUES.DOCUMENT_PROCESSING,
          workflowExecutionTimeout: '60m', // 60 minutes max
          workflowTaskTimeout: '10s',
          // Retry policy for the entire workflow
          retryInitialInterval: 1000, // 1 second
          retryMaximumInterval: 60000, // 60 seconds
          retryMaximumAttempts: 3,
        },
      );

      this.logger.log(
        `Document generation workflow ${workflowId} started (run ID: ${result.runId})`,
      );

      return {
        workflowId: result.workflowId,
        runId: result.runId,
        taskQueue: result.taskQueue,
        workflowType: result.workflowType,
      };
    } catch (error) {
      this.logger.error(
        `Failed to start document generation workflow for document ${documentId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get the status of a document generation workflow
   *
   * Queries the Temporal workflow for its current status.
   * Returns null if the workflow doesn't exist.
   *
   * @param documentId - Document ID to query
   * @returns Workflow status or null if not found
   */
  async getWorkflowStatus(documentId: string): Promise<{
    workflowId: string;
    status: string;
    isRunning: boolean;
  } | null> {
    const workflowId = generateWorkflowId(documentId);

    try {
      const result = await this.temporalService.describeWorkflow(workflowId);

      const status = (result as { status?: { name: string } }).status?.name;

      return {
        workflowId,
        status: status ?? 'UNKNOWN',
        isRunning: status === 'RUNNING',
      };
    } catch {
      this.logger.debug(`Workflow ${workflowId} not found or not yet started`);
      return null;
    }
  }

  /**
   * Cancel a running document generation workflow
   *
   * Cancels the workflow if it's currently running.
   * Does nothing if the workflow is not running or doesn't exist.
   *
   * @param documentId - Document ID to cancel
   * @returns True if cancelled, false otherwise
   */
  async cancelWorkflow(documentId: string): Promise<boolean> {
    const workflowId = generateWorkflowId(documentId);

    try {
      await this.temporalService.cancelWorkflow(workflowId);
      this.logger.log(`Cancelled document generation workflow ${workflowId}`);
      return true;
    } catch (error) {
      this.logger.debug(
        `Could not cancel workflow ${workflowId}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return false;
    }
  }

  /**
   * Get the result of a completed document generation workflow
   *
   * Returns the workflow output if the workflow completed successfully.
   * Returns null if the workflow is still running or doesn't exist.
   *
   * @param documentId - Document ID to get result for
   * @returns Workflow result or null if not completed
   */
  async getWorkflowResult(documentId: string): Promise<{
    documentId: string;
    status: 'COMPLETED' | 'FAILED';
    content?: string;
    generationTimeMs: number;
    completedAt: string;
    errorMessage?: string;
  } | null> {
    const workflowId = generateWorkflowId(documentId);

    try {
      const result = await this.temporalService.getWorkflowResult(workflowId);

      return result as {
        documentId: string;
        status: 'COMPLETED' | 'FAILED';
        content?: string;
        generationTimeMs: number;
        completedAt: string;
        errorMessage?: string;
      };
    } catch (error) {
      this.logger.debug(
        `Could not get result for workflow ${workflowId}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return null;
    }
  }
}
