import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PdfExportProducer } from '../queues/pdf-export.producer';
import { DocumentStatus } from '../entities/legal-document.entity';
import {
  ExportDocumentToPdfInput,
  PdfExportJobResponse,
  PdfExportResult,
  PdfExportStatusResponse,
} from '../dto/pdf-export.dto';

/**
 * PDF Export Service
 *
 * High-level service that coordinates document PDF export workflows.
 * Bridges the gap between the Document entity and the PDF Generation queue.
 */
@Injectable()
export class PdfExportService {
  private readonly logger = new Logger(PdfExportService.name);

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly pdfExportProducer: PdfExportProducer,
  ) {}

  /**
   * Export a document to PDF asynchronously
   *
   * Validates document state and queues a PDF generation job.
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

    this.logger.log(`Queueing PDF export for document ${document.id}`);

    const job = await this.pdfExportProducer.queuePdfExport({
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
      jobId: job.id?.toString() || '',
      documentId: document.id,
      status: 'PENDING',
      message: 'PDF export job queued successfully',
    };
  }

  /**
   * Export a document to PDF synchronously
   *
   * Queues the job and waits for the result before returning.
   * Suitable for small documents or direct user actions in the UI.
   */
  async exportToPdfSync(
    input: ExportDocumentToPdfInput,
  ): Promise<PdfExportResult> {
    const jobResponse = await this.exportToPdf(input);

    this.logger.debug(
      `Waiting for PDF export result for job ${jobResponse.jobId}`,
    );

    try {
      const result = await this.pdfExportProducer.waitForResult(
        jobResponse.jobId,
        60000, // 60 second timeout
      );

      return {
        documentId: result.documentId,
        filename: result.filename,
        pdfBase64: result.pdfBase64,
        fileSizeBytes: result.fileSizeBytes,
        pageCount: result.pageCount,
        generationTimeMs: result.generationTimeMs,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `PDF export failed for job ${jobResponse.jobId}: ${message}`,
      );
      throw new BadRequestException(`PDF export failed: ${message}`);
    }
  }

  /**
   * Get the status of a PDF export job
   */
  async getExportStatus(jobId: string): Promise<PdfExportStatusResponse> {
    const job = await this.pdfExportProducer.getJobStatus(jobId);

    if (!job) {
      return {
        jobId,
        status: 'unknown',
        error: `Job with ID ${jobId} not found`,
      };
    }

    const state = await job.getState();
    const progress = (await job.progress()) as number;

    const response: PdfExportStatusResponse = {
      jobId,
      status: state as PdfExportStatusResponse['status'],
      progress: typeof progress === 'number' ? progress : undefined,
    };

    if (state === 'completed') {
      const result = await this.pdfExportProducer.getJobResult(jobId);
      if (result) {
        response.result = {
          documentId: result.documentId,
          filename: result.filename,
          pdfBase64: result.pdfBase64,
          fileSizeBytes: result.fileSizeBytes,
          pageCount: result.pageCount,
          generationTimeMs: result.generationTimeMs,
        };
      }
    }

    if (state === 'failed') {
      response.error = job.failedReason || 'PDF export failed';
    }

    return response;
  }
}
