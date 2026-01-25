/**
 * PDF Export Starter Service
 *
 * Service for starting the PdfExport Temporal workflow.
 * This replaces the Bull-based PdfExportProducer.
 *
 * Usage:
 * - Inject PdfExportStarter into your service
 * - Call startPdfExport() to queue a document for PDF export
 * - The workflow runs asynchronously in Temporal
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TemporalService } from '../../temporal.service';
import { TEMPORAL_TASK_QUEUES } from '../../temporal.constants';
import { generateWorkflowId, type PdfExportInput } from './pdf-export.workflow';
import type { DocumentType } from '../../../documents/entities/legal-document.entity';

/**
 * Start PDF Export Request
 *
 * Input parameters for starting a PDF export workflow.
 */
export interface StartPdfExportRequest {
  /** Document ID to export */
  documentId: string;
  /** Session ID associated with the document */
  sessionId: string;
  /** Document title */
  title: string;
  /** Document type */
  documentType: DocumentType;
  /** Document content to export */
  content: string;
  /** Export options */
  options?: {
    includeHeader?: boolean;
    includeFooter?: boolean;
    includePageNumbers?: boolean;
    watermark?: string;
  };
  /** User ID for tracking */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * PDF Export Workflow Start Result
 *
 * Result returned after starting a PDF export workflow.
 */
export interface PdfExportWorkflowStartResult {
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
 * PDF Export Starter Service
 *
 * Provides methods to start PDF export workflows in Temporal.
 * Replaces the Bull-based PdfExportProducer.
 *
 * Key Features:
 * - Idempotent workflow execution based on document ID
 * - Asynchronous workflow execution (returns immediately)
 * - Retry policy with exponential backoff for transient failures
 * - Progress tracking via workflow queries
 * - Completion notifications
 */
@Injectable()
export class PdfExportStarter {
  private readonly logger = new Logger(PdfExportStarter.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly temporalService: TemporalService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  /**
   * Start a PDF export workflow
   *
   * This method starts a new Temporal workflow for PDF export.
   * The workflow runs asynchronously and returns immediately with a workflow ID.
   *
   * Idempotency:
   * - The workflow ID is derived from the document ID
   * - Starting a workflow for the same document ID will not create duplicate work
   * - Use getWorkflowStatus() to check the status of an existing workflow
   *
   * @param request - PDF export request parameters
   * @returns Workflow start result with workflow ID and run ID
   */
  async startPdfExport(
    request: StartPdfExportRequest,
  ): Promise<PdfExportWorkflowStartResult> {
    const {
      documentId,
      sessionId,
      title,
      documentType,
      content,
      options,
      userId,
      // Metadata is currently unused but kept for future use
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      metadata,
    } = request;

    // Generate a deterministic workflow ID based on document ID
    // This ensures idempotency - re-running with same document ID won't duplicate work
    const workflowId = generateWorkflowId(documentId);

    this.logger.log(
      `Starting PDF export workflow ${workflowId} for document ${documentId}`,
    );

    // Prepare workflow input
    const workflowInput: PdfExportInput = {
      exportId: this.generateExportId(documentId),
      documentId,
      sessionId,
      title,
      documentType,
      content,
      options,
      userId,
      frontendUrl: this.frontendUrl,
    };

    try {
      // Start the workflow in Temporal
      const result = await this.temporalService.startWorkflow(
        'pdfExport',
        [workflowInput],
        {
          workflowId,
          taskQueue: TEMPORAL_TASK_QUEUES.DOCUMENT_PROCESSING,
          workflowExecutionTimeout: '30m', // 30 minutes max
          workflowTaskTimeout: '10s',
          // Retry policy for the entire workflow
          retryInitialInterval: 1000, // 1 second
          retryMaximumInterval: 60000, // 60 seconds
          retryMaximumAttempts: 3,
        },
      );

      this.logger.log(
        `PDF export workflow ${workflowId} started (run ID: ${result.runId})`,
      );

      return {
        workflowId: result.workflowId,
        runId: result.runId,
        taskQueue: result.taskQueue,
        workflowType: result.workflowType,
      };
    } catch (error) {
      this.logger.error(
        `Failed to start PDF export workflow for document ${documentId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get the status of a PDF export workflow
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
   * Cancel a running PDF export workflow
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
      this.logger.log(`Cancelled PDF export workflow ${workflowId}`);
      return true;
    } catch (error) {
      this.logger.debug(
        `Could not cancel workflow ${workflowId}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return false;
    }
  }

  /**
   * Get the current state of a PDF export workflow
   *
   * Queries the workflow for its current state and progress.
   *
   * @param documentId - Document ID to query
   * @returns Export state or null if not found
   */
  async getExportState(documentId: string): Promise<{
    state: string;
    progress: number;
    message?: string;
  } | null> {
    const workflowId = generateWorkflowId(documentId);

    try {
      const result = await this.temporalService.queryWorkflow<{
        state: string;
        progress: number;
        message?: string;
      }>(workflowId, 'getState');

      return {
        state: result.result.state,
        progress: result.result.progress,
        message: result.result.message,
      };
    } catch {
      this.logger.debug(`Workflow ${workflowId} not found or not yet started`);
      return null;
    }
  }

  /**
   * Get the result of a completed PDF export workflow
   *
   * Returns the workflow output if the workflow completed successfully.
   * Returns null if the workflow is still running or doesn't exist.
   *
   * @param documentId - Document ID to get result for
   * @returns Workflow result or null if not completed
   */
  async getWorkflowResult(documentId: string): Promise<{
    exportId: string;
    documentId: string;
    status: 'COMPLETED' | 'FAILED';
    pdfUrl?: string;
    pageCount?: number;
    fileSize?: number;
    errorMessage?: string;
    exportTimeMs: number;
    completedAt: string;
  } | null> {
    const workflowId = generateWorkflowId(documentId);

    try {
      const result = await this.temporalService.getWorkflowResult(workflowId);

      return result as {
        exportId: string;
        documentId: string;
        status: 'COMPLETED' | 'FAILED';
        pdfUrl?: string;
        pageCount?: number;
        fileSize?: number;
        errorMessage?: string;
        exportTimeMs: number;
        completedAt: string;
      };
    } catch (error) {
      this.logger.debug(
        `Could not get result for workflow ${workflowId}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return null;
    }
  }

  /**
   * Generate a unique export ID
   *
   * @param documentId - Document ID
   * @returns Unique export ID
   */
  private generateExportId(documentId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `pdf-export-${documentId}-${timestamp}-${random}`;
  }
}
