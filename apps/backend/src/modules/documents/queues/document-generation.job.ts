import { BaseJobData, JobOptions } from '../../../shared/queues/base';
import { DocumentType } from '../entities/legal-document.entity';

/**
 * Document Generation Job Data
 *
 * Data structure for document generation queue jobs.
 * Contains all information needed to generate a document via the AI service.
 */
export interface DocumentGenerationJobData extends BaseJobData {
  /**
   * The ID of the document to generate content for
   */
  documentId: string;

  /**
   * The session ID associated with the document
   */
  sessionId: string;

  /**
   * The type of document to generate
   */
  documentType: DocumentType;

  /**
   * Natural language description of the document to generate
   */
  description: string;

  /**
   * Additional context variables for generation
   * (e.g., defendant name, claim amount)
   */
  context?: Record<string, unknown>;
}

/**
 * Document Generation Job Result
 *
 * Result returned when a document generation job completes successfully.
 */
export interface DocumentGenerationJobResult {
  /**
   * The ID of the generated document
   */
  documentId: string;

  /**
   * The task ID from the AI service
   */
  taskId: string;

  /**
   * The generated content
   */
  content: string;

  /**
   * Time taken to generate the document (ms)
   */
  generationTimeMs: number;
}

/**
 * Document Generation Job Status
 *
 * Possible statuses for a document generation job.
 */
export enum DocumentGenerationJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  POLLING = 'POLLING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Default job options for document generation
 */
export const DEFAULT_DOCUMENT_GENERATION_JOB_OPTIONS: JobOptions = {
  attempts: 3,
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 50, // Keep last 50 failed jobs
};
