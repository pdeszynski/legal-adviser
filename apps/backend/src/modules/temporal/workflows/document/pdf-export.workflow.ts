/**
 * PDF Export Workflow
 *
 * Temporal workflow for exporting legal documents to PDF format.
 * Replaces the Bull-based PDF export queue.
 *
 * Features:
 * - Asynchronous PDF generation from document content
 * - Template-based PDF rendering
 * - Progress tracking
 * - Retry with exponential backoff
 * - Completion notification
 * - Cancellation support for abandoned exports
 * - Heartbeat for long-running activities
 */

import {
  proxyActivities,
  workflowInfo,
  defineSignal,
  setHandler,
  defineQuery,
} from '@temporalio/workflow';
import { DocumentType } from '../../../documents/entities/legal-document.entity';

/**
 * Cancel signal
 *
 * Signal to cancel an in-progress PDF export.
 */
export const cancelSignal = defineSignal('cancel');

/**
 * Query for current export state
 */
export interface ExportStateQuery {
  /** Current export state */
  state:
    | 'INITIALIZING'
    | 'GENERATING'
    | 'COMPLETING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED';
  /** Current progress percentage */
  progress: number;
  /** Current message */
  message?: string;
}

/**
 * PDF Export Workflow Input
 */
export interface PdfExportInput {
  /** Unique export ID */
  exportId: string;
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
  /** Frontend URL for completion links */
  frontendUrl?: string;
}

/**
 * PDF Export Workflow Output
 */
export interface PdfExportOutput {
  /** Export ID */
  exportId: string;
  /** Document ID */
  documentId: string;
  /** Export status */
  status: 'COMPLETED' | 'FAILED';
  /** Generated PDF URL (if completed) */
  pdfUrl?: string;
  /** Number of pages in PDF */
  pageCount?: number;
  /** File size in bytes */
  fileSize?: number;
  /** Error message (if failed) */
  errorMessage?: string;
  /** Timestamp of completion */
  completedAt: string;
  /** Total time in milliseconds */
  exportTimeMs: number;
}

/**
 * Activities interface for proxy
 */
interface PdfExportActivities {
  initializeExport(input: {
    exportId: string;
    documentId: string;
    userId?: string;
  }): Promise<{ status: string }>;

  generatePdf(input: {
    exportId: string;
    documentId: string;
    title: string;
    documentType: DocumentType;
    content: string;
    options?: PdfExportInput['options'];
  }): Promise<{
    pdfUrl: string;
    pageCount: number;
    fileSize: number;
  }>;

  completeExport(input: {
    exportId: string;
    documentId: string;
    pdfUrl: string;
    pageCount: number;
    fileSize: number;
    userId?: string;
  }): Promise<void>;

  failExport(input: {
    exportId: string;
    documentId: string;
    errorMessage: string;
    userId?: string;
  }): Promise<void>;

  sendCompletionNotification(input: {
    exportId: string;
    documentId: string;
    title: string;
    pdfUrl: string;
    userId?: string;
    frontendUrl?: string;
  }): Promise<void>;
}

/**
 * Generate a unique workflow ID for PDF export
 *
 * @param documentId - Document ID
 * @returns Unique workflow ID
 */
export function generateWorkflowId(documentId: string): string {
  return `pdf-export-${documentId}`;
}

/**
 * Get workflow information
 *
 * @returns Current workflow info
 */
export function workflowInfoGetter() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return workflowInfo;
}

/**
 * PDF Export Workflow
 *
 * Main workflow for exporting documents to PDF.
 * Supports cancellation via signal handlers.
 *
 * @param input - PDF export input parameters
 * @returns PDF export result
 */
export async function pdfExport(
  input: PdfExportInput,
): Promise<PdfExportOutput> {
  const startTime = Date.now();
  const {
    exportId,
    documentId,
    title,
    documentType,
    content,
    options,
    userId,
    frontendUrl,
  } = input;

  // Export state for query handler
  const exportState: ExportStateQuery = {
    state: 'INITIALIZING',
    progress: 0,
    message: 'Initializing PDF export...',
  };

  // Cancellation flag
  let cancelled = false;

  // Set up signal handler for cancellation
  setHandler(cancelSignal, () => {
    cancelled = true;
    exportState.state = 'CANCELLED';
    exportState.message = 'Export cancelled by user';
  });

  // Set up query handler for export state
  const getStateQuery = defineQuery<ExportStateQuery>('getState');
  setHandler(getStateQuery, (): ExportStateQuery => {
    return { ...exportState };
  });

  // Create activity proxies with retry policy and heartbeat
  const activities = proxyActivities<PdfExportActivities>({
    startToCloseTimeout: '30m',
    heartbeatTimeout: '60s', // Detect stalled activities
    retry: {
      initialInterval: 1000,
      backoffCoefficient: 2.0,
      maximumInterval: 30000,
      maximumAttempts: 3,
      nonRetryableErrorTypes: [
        'ValidationError',
        'AuthenticationError',
        'CancelledError',
      ],
    },
  });

  try {
    // Check for cancellation before starting
    if (cancelled) {
      throw new Error('Export cancelled before starting');
    }

    // Step 1: Initialize the export
    exportState.state = 'INITIALIZING';
    exportState.progress = 10;
    exportState.message = 'Initializing PDF export...';
    await activities.initializeExport({
      exportId,
      documentId,
      userId,
    });

    // Check for cancellation after initialization
    if (cancelled) {
      throw new Error('Export cancelled during initialization');
    }

    // Step 2: Generate the PDF (long-running operation)
    exportState.state = 'GENERATING';
    exportState.progress = 30;
    exportState.message = 'Generating PDF...';

    // Generate PDF with cancellation support
    // The activity itself will handle heartbeats for cancellation detection
    const pdfResult = await activities.generatePdf({
      exportId,
      documentId,
      title,
      documentType,
      content,
      options,
    });

    // Check for cancellation after PDF generation
    if (cancelled) {
      throw new Error('Export cancelled after PDF generation');
    }

    // Step 3: Complete the export
    exportState.state = 'COMPLETING';
    exportState.progress = 80;
    exportState.message = 'Completing export...';
    await activities.completeExport({
      exportId,
      documentId,
      pdfUrl: pdfResult.pdfUrl,
      pageCount: pdfResult.pageCount,
      fileSize: pdfResult.fileSize,
      userId,
    });

    // Step 4: Send completion notification (non-blocking)
    try {
      exportState.progress = 90;
      exportState.message = 'Sending notification...';
      await activities.sendCompletionNotification({
        exportId,
        documentId,
        title,
        pdfUrl: pdfResult.pdfUrl,
        userId,
        frontendUrl,
      });
    } catch (notificationError) {
      // Don't fail the workflow if notification fails
      // eslint-disable-next-line no-console
      console.error(
        'Failed to send completion notification:',
        notificationError,
      );
    }

    exportState.state = 'COMPLETED';
    exportState.progress = 100;
    exportState.message = 'PDF export completed successfully';

    return {
      exportId,
      documentId,
      status: 'COMPLETED',
      pdfUrl: pdfResult.pdfUrl,
      pageCount: pdfResult.pageCount,
      fileSize: pdfResult.fileSize,
      completedAt: new Date().toISOString(),
      exportTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Check if cancelled
    if (cancelled || errorMessage.includes('cancelled')) {
      exportState.state = 'CANCELLED';
      exportState.message = 'Export cancelled by user';

      // Try to mark as failed for cleanup
      try {
        await activities.failExport({
          exportId,
          documentId,
          errorMessage: 'Export was cancelled',
          userId,
        });
      } catch {
        // Ignore cleanup errors
      }

      return {
        exportId,
        documentId,
        status: 'FAILED',
        errorMessage: 'Export was cancelled',
        completedAt: new Date().toISOString(),
        exportTimeMs: Date.now() - startTime,
      };
    }

    // Mark the export as failed
    exportState.state = 'FAILED';
    exportState.message = `Export failed: ${errorMessage}`;

    try {
      await activities.failExport({
        exportId,
        documentId,
        errorMessage,
        userId,
      });
    } catch (failError) {
      // eslint-disable-next-line no-console
      console.error('Failed to mark export as failed:', failError);
    }

    return {
      exportId,
      documentId,
      status: 'FAILED',
      errorMessage,
      completedAt: new Date().toISOString(),
      exportTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Query handler type for export state
 */
export interface PdfExportQueryHandlers {
  /** Get current export state */
  getState(): ExportStateQuery;
}
