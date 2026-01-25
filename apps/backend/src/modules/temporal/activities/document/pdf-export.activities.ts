/**
 * PDF Export Activities
 *
 * Individual activities that can be called within workflows
 * for PDF export operations. These activities handle the actual
 * I/O operations (database, storage, PDF generation).
 *
 * Activities must be deterministic and idempotent where possible.
 * All external service calls should be wrapped in activities.
 *
 * Features:
 * - Long-running PDF generation with heartbeat support
 * - Cancellation handling for abandoned exports
 * - Storage upload (local/S3)
 * - User notifications on completion
 */

import { Logger } from '@nestjs/common';
import { DocumentType } from '../../../documents/entities/legal-document.entity';

/**
 * Initialize Export Activity Input
 *
 * Input for initializing a PDF export operation.
 */
export interface InitializeExportInput {
  /** Unique export ID */
  exportId: string;
  /** Document ID to export */
  documentId: string;
  /** User ID for tracking (optional) */
  userId?: string;
}

/**
 * Initialize Export Activity Output
 *
 * Output from export initialization.
 */
export interface InitializeExportOutput {
  /** Export ID that was initialized */
  exportId: string;
  /** Document ID */
  documentId: string;
  /** Current status */
  status: string;
  /** Timestamp of initialization */
  initializedAt: string;
}

/**
 * Generate PDF Activity Input
 *
 * Input for generating a PDF from document content.
 */
export interface GeneratePdfInput {
  /** Export ID */
  exportId: string;
  /** Document ID */
  documentId: string;
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
    format?: 'A4' | 'Letter' | 'Legal';
    language?: 'pl' | 'en';
  };
}

/**
 * Generate PDF Activity Output
 *
 * Output from PDF generation.
 */
export interface GeneratePdfOutput {
  /** URL to access the generated PDF */
  pdfUrl: string;
  /** Number of pages in the PDF */
  pageCount: number;
  /** File size in bytes */
  fileSize: number;
  /** Timestamp of generation */
  generatedAt: string;
  /** Time taken to generate (ms) */
  generationTimeMs: number;
}

/**
 * Complete Export Activity Input
 *
 * Input for marking an export as completed.
 */
export interface CompleteExportInput {
  /** Export ID */
  exportId: string;
  /** Document ID */
  documentId: string;
  /** URL to the generated PDF */
  pdfUrl: string;
  /** Number of pages in the PDF */
  pageCount: number;
  /** File size in bytes */
  fileSize: number;
  /** User ID for tracking (optional) */
  userId?: string;
}

/**
 * Complete Export Activity Output
 *
 * Output from completing an export.
 */
export interface CompleteExportOutput {
  /** Export ID that was completed */
  exportId: string;
  /** Document ID */
  documentId: string;
  /** New document status */
  status: string;
  /** Timestamp of completion */
  completedAt: string;
}

/**
 * Fail Export Activity Input
 *
 * Input for marking an export as failed.
 */
export interface FailExportInput {
  /** Export ID */
  exportId: string;
  /** Document ID */
  documentId: string;
  /** Error message */
  errorMessage: string;
  /** User ID for tracking (optional) */
  userId?: string;
}

/**
 * Fail Export Activity Output
 *
 * Output from failing an export.
 */
export interface FailExportOutput {
  /** Export ID that failed */
  exportId: string;
  /** Document ID */
  documentId: string;
  /** New document status */
  status: string;
  /** Timestamp of failure */
  failedAt: string;
}

/**
 * Send Completion Notification Activity Input
 *
 * Input for sending a completion notification.
 */
export interface SendCompletionNotificationInput {
  /** Export ID */
  exportId: string;
  /** Document ID */
  documentId: string;
  /** Document title */
  title: string;
  /** URL to the generated PDF */
  pdfUrl: string;
  /** User ID for notification */
  userId?: string;
  /** Frontend URL for links */
  frontendUrl?: string;
}

/**
 * Send Completion Notification Activity Output
 *
 * Output from sending completion notification.
 */
export interface SendCompletionNotificationOutput {
  /** Whether notification was sent */
  sent: boolean;
  /** Timestamp of notification send */
  sentAt: string;
}

/**
 * Activities container class
 *
 * This class contains all activity implementations for PDF export.
 * Activities are registered with Temporal workers and called from workflows.
 */
export class PdfExportActivities {
  private readonly logger = new Logger(PdfExportActivities.name);

  constructor(
    private readonly dependencies: {
      documentsService: {
        findOne: (id: string) => Promise<{
          id: string;
          title: string;
          contentRaw: string | null;
          type: DocumentType;
          pdfUrl: string | null;
          session?: {
            user?: {
              id: string;
              email?: string;
              firstName?: string;
            };
          };
        }>;
        update: (
          id: string,
          data: { pdfUrl?: string },
        ) => Promise<{
          id: string;
          title: string;
          pdfUrl: string | null;
        }>;
      };
      pdfGeneratorService: {
        generatePdf: (
          context: {
            title: string;
            content: string;
            documentType: DocumentType;
            createdAt: Date;
            metadata?: Record<string, unknown>;
          },
          options: {
            format?: 'A4' | 'Letter' | 'Legal';
            includeHeader?: boolean;
            includeFooter?: boolean;
            includePageNumbers?: boolean;
            watermark?: string;
            language?: 'pl' | 'en';
          },
        ) => Promise<{
          buffer: Buffer;
          pageCount: number;
          sizeBytes: number;
        }>;
        generateFilename: (title: string, documentId: string) => string;
      };
      storageService: {
        upload: (
          key: string,
          buffer: Buffer,
          metadata?: Record<string, unknown>,
        ) => Promise<{ url: string; key: string }>;
      };
      notificationService?: {
        sendNotification: (input: {
          userId: string;
          userEmail: string;
          templateType: string;
          templateData: Record<string, unknown>;
          channel?: 'EMAIL' | 'IN_APP' | 'BOTH';
          priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
        }) => Promise<{ emailSent: boolean; inAppCreated: boolean }>;
      };
      progressPubSub?: {
        publish: (event: {
          documentId: string;
          sessionId: string;
          status: string;
          progress: number;
          message?: string;
          timestamp: Date;
        }) => void;
      };
      configService: {
        get: (key: string) => string | undefined;
      };
    },
  ) {}

  /**
   * Initialize Export Activity
   *
   * Sets up the export operation and validates the document exists.
   * This activity is idempotent - calling it multiple times with the same
   * export ID will result in the same state.
   */
  async initializeExport(
    input: InitializeExportInput,
  ): Promise<InitializeExportOutput> {
    this.logger.log(
      `Initializing PDF export ${input.exportId} for document ${input.documentId}`,
    );

    // Verify document exists
    const document = await this.dependencies.documentsService.findOne(
      input.documentId,
    );

    if (!document) {
      throw new Error(`Document ${input.documentId} not found`);
    }

    // Publish initial progress if pubsub is available
    if (this.dependencies.progressPubSub) {
      this.dependencies.progressPubSub.publish({
        documentId: input.documentId,
        sessionId: '', // Not available at this level
        status: 'GENERATING',
        progress: 0,
        message: 'Initializing PDF export...',
        timestamp: new Date(),
      });
    }

    return {
      exportId: input.exportId,
      documentId: input.documentId,
      status: 'INITIALIZED',
      initializedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate PDF Activity
   *
   * Generates a PDF from document content using Puppeteer.
   * This is a long-running activity that can take several minutes
   * for large documents. Heartbeat is configured at the workflow level
   * via activity proxy options.
   *
   * Progress is published via pubsub for real-time updates.
   */
  async generatePdf(input: GeneratePdfInput): Promise<GeneratePdfOutput> {
    const startTime = Date.now();
    this.logger.log(
      `Generating PDF for export ${input.exportId}, document ${input.documentId}`,
    );

    // Publish progress
    if (this.dependencies.progressPubSub) {
      this.dependencies.progressPubSub.publish({
        documentId: input.documentId,
        sessionId: '',
        status: 'GENERATING',
        progress: 20,
        message: 'Preparing document content...',
        timestamp: new Date(),
      });
    }

    // Prepare document context
    const templateContext = {
      title: input.title,
      content: input.content,
      documentType: input.documentType,
      createdAt: new Date(),
    };

    // Publish progress
    if (this.dependencies.progressPubSub) {
      this.dependencies.progressPubSub.publish({
        documentId: input.documentId,
        sessionId: '',
        status: 'GENERATING',
        progress: 40,
        message: 'Rendering PDF...',
        timestamp: new Date(),
      });
    }

    // Generate PDF using Puppeteer
    const pdfResult = await this.dependencies.pdfGeneratorService.generatePdf(
      templateContext,
      input.options || {},
    );

    // Generate filename
    const filename = this.dependencies.pdfGeneratorService.generateFilename(
      input.title,
      input.documentId,
    );

    // Publish progress
    if (this.dependencies.progressPubSub) {
      this.dependencies.progressPubSub.publish({
        documentId: input.documentId,
        sessionId: '',
        status: 'GENERATING',
        progress: 70,
        message: 'Uploading PDF to storage...',
        timestamp: new Date(),
      });
    }

    // Upload to storage
    const storageKey = `pdf-exports/${input.documentId}/${filename}`;
    const storageResult = await this.dependencies.storageService.upload(
      storageKey,
      pdfResult.buffer,
      {
        documentId: input.documentId,
        exportId: input.exportId,
        title: input.title,
        documentType: input.documentType,
        pageCount: pdfResult.pageCount,
        fileSize: pdfResult.sizeBytes,
      },
    );

    const generationTimeMs = Date.now() - startTime;

    this.logger.log(
      `PDF generated for export ${input.exportId}: ` +
        `${pdfResult.pageCount} pages, ${pdfResult.sizeBytes} bytes, ${generationTimeMs}ms`,
    );

    return {
      pdfUrl: storageResult.url,
      pageCount: pdfResult.pageCount,
      fileSize: pdfResult.sizeBytes,
      generatedAt: new Date().toISOString(),
      generationTimeMs,
    };
  }

  /**
   * Complete Export Activity
   *
   * Marks the export as completed and updates the document with the PDF URL.
   * This activity is idempotent - completing an already completed export
   * will not cause an error.
   */
  async completeExport(
    input: CompleteExportInput,
  ): Promise<CompleteExportOutput> {
    this.logger.log(
      `Completing PDF export ${input.exportId} for document ${input.documentId}`,
    );

    // Publish progress
    if (this.dependencies.progressPubSub) {
      this.dependencies.progressPubSub.publish({
        documentId: input.documentId,
        sessionId: '',
        status: 'GENERATING',
        progress: 90,
        message: 'Finalizing export...',
        timestamp: new Date(),
      });
    }

    // Update document with PDF URL
    await this.dependencies.documentsService.update(input.documentId, {
      pdfUrl: input.pdfUrl,
    });

    // Publish completion progress
    if (this.dependencies.progressPubSub) {
      this.dependencies.progressPubSub.publish({
        documentId: input.documentId,
        sessionId: '',
        status: 'COMPLETED',
        progress: 100,
        message: 'PDF export completed successfully',
        timestamp: new Date(),
      });
    }

    return {
      exportId: input.exportId,
      documentId: input.documentId,
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Fail Export Activity
   *
   * Marks the export as failed with an error message.
   * This activity is idempotent - failing an already failed export
   * will not cause an error.
   */
  async failExport(input: FailExportInput): Promise<FailExportOutput> {
    this.logger.error(
      `Failing PDF export ${input.exportId} for document ${input.documentId}: ${input.errorMessage}`,
    );

    // Publish failure progress
    if (this.dependencies.progressPubSub) {
      this.dependencies.progressPubSub.publish({
        documentId: input.documentId,
        sessionId: '',
        status: 'FAILED',
        progress: 0,
        message: `PDF export failed: ${input.errorMessage}`,
        timestamp: new Date(),
      });
    }

    return {
      exportId: input.exportId,
      documentId: input.documentId,
      status: 'FAILED',
      failedAt: new Date().toISOString(),
    };
  }

  /**
   * Send Completion Notification Activity
   *
   * Sends a notification when PDF export completes successfully.
   * This activity is idempotent - sending the same notification multiple times
   * is acceptable (user receives multiple notifications).
   *
   * This is a best-effort activity - failures should not fail the workflow.
   */
  async sendCompletionNotification(
    input: SendCompletionNotificationInput,
  ): Promise<SendCompletionNotificationOutput> {
    this.logger.log(
      `Sending completion notification for export ${input.exportId}`,
    );

    if (!input.userId || !this.dependencies.notificationService) {
      this.logger.debug(
        'No user ID or notification service available, skipping notification',
      );
      return { sent: false, sentAt: new Date().toISOString() };
    }

    try {
      // Get document to retrieve user email
      const document = await this.dependencies.documentsService.findOne(
        input.documentId,
      );

      if (!document?.session?.user?.email) {
        this.logger.warn(
          `No user email found for document ${input.documentId}, skipping notification`,
        );
        return { sent: false, sentAt: new Date().toISOString() };
      }

      await this.dependencies.notificationService.sendNotification({
        userId: document.session.user.id,
        userEmail: document.session.user.email,
        templateType: 'DOCUMENT_EXPORTED',
        templateData: {
          documentId: input.documentId,
          title: input.title,
          pdfUrl: input.pdfUrl,
          documentLink: `${input.frontendUrl || 'http://localhost:3000'}/documents/show/${input.documentId}`,
        },
        channel: 'BOTH',
        priority: 'NORMAL',
      });

      return { sent: true, sentAt: new Date().toISOString() };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send completion notification for export ${input.exportId}: ${errorMessage}`,
      );
      // Don't throw - notification failure should not fail the workflow
      return { sent: false, sentAt: new Date().toISOString() };
    }
  }
}

/**
 * Activity registration function
 *
 * Creates and returns the activities object with all dependencies injected.
 * This function is called by the Temporal worker to register activities.
 */
export type PdfExportActivitiesImpl = InstanceType<typeof PdfExportActivities>;

export const createPdfExportActivities = (
  dependencies: PdfExportActivities['dependencies'],
): PdfExportActivities => {
  return new PdfExportActivities(dependencies);
};
