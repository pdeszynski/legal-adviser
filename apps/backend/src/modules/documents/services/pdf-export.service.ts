import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentStatus } from '../entities/legal-document.entity';
import {
  ExportDocumentToPdfInput,
  PdfExportJobResponse,
  PdfExportResult,
  PdfExportStatusResponse,
} from '../dto/pdf-export.dto';
import { PdfExportStarter } from '../../temporal/workflows/document/pdf-export.starter';

/**
 * PDF Export Service
 *
 * High-level service that coordinates document PDF export workflows.
 * Uses Temporal workflows for async PDF generation.
 */
@Injectable()
export class PdfExportService {
  private readonly logger = new Logger(PdfExportService.name);
  private readonly jobResults = new Map<string, PdfExportResult>();

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly pdfExportStarter: PdfExportStarter,
  ) {}

  /**
   * Export a document to PDF asynchronously
   *
   * Validates document state and starts a PDF generation workflow.
   */
  async exportToPdf(
    input: ExportDocumentToPdfInput,
  ): Promise<PdfExportJobResponse> {
    const document = await this.documentsService.findById(input.documentId);

    if (!document) {
      throw new NotFoundException(
        `Document with ID ${input.documentId} not found`,
      );
    }

    if (document.status !== DocumentStatus.COMPLETED) {
      throw new BadRequestException(
        `Document must be in COMPLETED status to export to PDF. Current status: ${document.status}`,
      );
    }

    if (!document.contentRaw) {
      throw new BadRequestException('Document has no content to export');
    }

    this.logger.log(`Starting PDF export workflow for document ${document.id}`);

    const workflowResult = await this.pdfExportStarter.startPdfExport({
      documentId: document.id,
      sessionId: document.sessionId,
      documentType: document.type,
      title: document.title,
      content: document.contentRaw,
      options: input.options
        ? {
            format: input.options.format,
            includeHeader: input.options.includeHeader,
            includeFooter: input.options.includeFooter,
            includeTableOfContents: input.options.includeTableOfContents,
            watermark: input.options.watermark,
            language: input.options.language,
          }
        : undefined,
      metadata: document.metadata || undefined,
    });

    return {
      jobId: workflowResult.workflowId,
      documentId: document.id,
      status: 'PENDING',
      message: 'PDF export workflow started successfully',
    };
  }

  /**
   * Export a document to PDF synchronously
   *
   * Starts the workflow and waits for the result before returning.
   * Suitable for small documents or direct user actions in the UI.
   */
  async exportToPdfSync(
    input: ExportDocumentToPdfInput,
  ): Promise<PdfExportResult> {
    const jobResponse = await this.exportToPdf(input);

    this.logger.debug(
      `Waiting for PDF export result for workflow ${jobResponse.jobId}`,
    );

    // Poll for workflow completion
    const maxAttempts = 60; // 60 seconds with 1 second intervals
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getExportStatus(jobResponse.jobId);

      if (status.status === 'completed' && status.result) {
        return status.result;
      }

      if (status.status === 'failed') {
        throw new BadRequestException(
          `PDF export failed: ${status.error || 'Unknown error'}`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new BadRequestException('PDF export timed out after 60 seconds');
  }

  /**
   * Get the status of a PDF export job
   *
   * Note: This is a simplified implementation. In production,
   * you would query the Temporal workflow execution status.
   */
  async getExportStatus(jobId: string): Promise<PdfExportStatusResponse> {
    const result = this.jobResults.get(jobId);

    if (result) {
      return {
        jobId,
        status: 'completed',
        result,
      };
    }

    // If no result found, assume job is still pending
    // In production, query Temporal for actual workflow status
    return {
      jobId,
      status: 'waiting',
      progress: 0,
    };
  }

  /**
   * Store a job result (called by Temporal activity/observer)
   */
  storeJobResult(jobId: string, result: PdfExportResult): void {
    this.jobResults.set(jobId, result);
    // Clean up old results after 1 hour
    setTimeout(() => this.jobResults.delete(jobId), 3600000);
  }
}
