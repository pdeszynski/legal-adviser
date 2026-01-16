import { BaseJobData, JobOptions } from '../../../shared/queues/base';
import { DocumentType } from '../entities/legal-document.entity';

/**
 * PDF Page Format
 *
 * Standard paper sizes for PDF generation
 */
export enum PdfPageFormat {
  A4 = 'A4',
  LETTER = 'Letter',
  LEGAL = 'Legal',
}

/**
 * PDF Export Options
 *
 * Configuration for PDF generation
 */
export interface PdfExportOptions {
  /**
   * Page format (default: A4)
   */
  format?: PdfPageFormat;

  /**
   * Include header with document title and date
   */
  includeHeader?: boolean;

  /**
   * Include footer with page numbers
   */
  includeFooter?: boolean;

  /**
   * Include table of contents
   */
  includeTableOfContents?: boolean;

  /**
   * Enable watermark (e.g., "DRAFT")
   */
  watermark?: string;

  /**
   * Language for formatting (default: 'pl' for Polish)
   */
  language?: 'pl' | 'en';
}

/**
 * PDF Export Job Data
 *
 * Data structure for PDF export queue jobs.
 * Contains all information needed to export a document to PDF.
 */
export interface PdfExportJobData extends BaseJobData {
  /**
   * The ID of the document to export
   */
  documentId: string;

  /**
   * The session ID associated with the document
   */
  sessionId: string;

  /**
   * The type of document being exported
   */
  documentType: DocumentType;

  /**
   * Title of the document
   */
  title: string;

  /**
   * Raw content of the document (Markdown or HTML)
   */
  content: string;

  /**
   * PDF export options
   */
  options?: PdfExportOptions;
}

/**
 * PDF Export Job Result
 *
 * Result returned when a PDF export job completes successfully.
 */
export interface PdfExportJobResult {
  /**
   * The ID of the exported document
   */
  documentId: string;

  /**
   * The generated PDF as a base64-encoded string
   */
  pdfBase64: string;

  /**
   * Filename for the PDF
   */
  filename: string;

  /**
   * Size of the PDF in bytes
   */
  fileSizeBytes: number;

  /**
   * Number of pages in the PDF
   */
  pageCount: number;

  /**
   * Time taken to generate the PDF (ms)
   */
  generationTimeMs: number;
}

/**
 * PDF Export Job Status
 *
 * Possible statuses for a PDF export job.
 */
export enum PdfExportJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Default job options for PDF export
 */
export const DEFAULT_PDF_EXPORT_JOB_OPTIONS: JobOptions = {
  attempts: 3,
  removeOnComplete: 50, // Keep last 50 completed jobs
  removeOnFail: 25, // Keep last 25 failed jobs
  ttl: 5 * 60 * 1000, // 5 minutes timeout
};
