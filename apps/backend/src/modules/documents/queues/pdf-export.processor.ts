import {
  Processor,
  Process,
  OnQueueFailed,
  OnQueueCompleted,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { QUEUE_NAMES } from '../../../shared/queues/base/queue-names';
import {
  PdfGeneratorService,
  PdfTemplateService,
  DocumentTemplateContext,
} from '../services/pdf';
import type {
  PdfExportJobData,
  PdfExportJobResult,
} from './pdf-export.job';

/**
 * PDF Export Queue Processor
 *
 * Handles asynchronous PDF export jobs via the Bull queue system.
 * Converts legal documents to professionally formatted PDF files.
 *
 * Processing Flow:
 * 1. Receive job with document content and export options
 * 2. Generate HTML template from content
 * 3. Use Puppeteer to render PDF
 * 4. Return base64-encoded PDF with metadata
 *
 * Error Recovery:
 * - Jobs are retried up to 3 times by default
 * - Failed jobs are logged for debugging
 */
@Processor(QUEUE_NAMES.DOCUMENT.EXPORT_PDF)
export class PdfExportProcessor {
  private readonly logger = new Logger(PdfExportProcessor.name);

  constructor(
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}

  /**
   * Process a PDF export job
   *
   * Main entry point for processing PDF export jobs.
   * Coordinates the entire PDF generation workflow.
   */
  @Process()
  async process(
    job: Job<PdfExportJobData>,
  ): Promise<PdfExportJobResult> {
    const { documentId, sessionId, documentType, title, content, options } =
      job.data;
    const startTime = Date.now();

    this.logger.log(
      `Processing PDF export job ${job.id} for document ${documentId}`,
    );

    try {
      // Update job progress
      await job.progress(10);

      // Step 1: Prepare document template context
      const templateContext: DocumentTemplateContext = {
        title,
        content,
        documentType,
        createdAt: job.data.createdAt ? new Date(job.data.createdAt) : new Date(),
        metadata: job.data.metadata as DocumentTemplateContext['metadata'],
      };

      await job.progress(30);

      // Step 2: Generate PDF using Puppeteer
      this.logger.debug(`Generating PDF for document ${documentId}`);
      const pdfResult = await this.pdfGeneratorService.generatePdf(
        templateContext,
        options || {},
      );

      await job.progress(80);

      // Step 3: Convert to base64 and prepare result
      const pdfBase64 = pdfResult.buffer.toString('base64');
      const filename = this.pdfGeneratorService.generateFilename(title, documentId);

      const generationTimeMs = Date.now() - startTime;

      this.logger.log(
        `PDF export completed for document ${documentId} in ${generationTimeMs}ms ` +
        `(${pdfResult.pageCount} pages, ${pdfResult.sizeBytes} bytes)`,
      );

      await job.progress(100);

      return {
        documentId,
        pdfBase64,
        filename,
        fileSizeBytes: pdfResult.sizeBytes,
        pageCount: pdfResult.pageCount,
        generationTimeMs,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to export PDF for document ${documentId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  /**
   * Handle job completion event
   */
  @OnQueueCompleted()
  onCompleted(
    job: Job<PdfExportJobData>,
    result: PdfExportJobResult,
  ): void {
    this.logger.log(
      `Job ${job.id} completed for document ${result.documentId} ` +
      `(${result.pageCount} pages, ${result.fileSizeBytes} bytes, ${result.generationTimeMs}ms)`,
    );
  }

  /**
   * Handle job failure event
   */
  @OnQueueFailed()
  onFailed(job: Job<PdfExportJobData>, error: Error): void {
    this.logger.error(
      `Job ${job.id} failed for document ${job.data.documentId}: ${error.message}`,
      error.stack,
    );
  }
}
