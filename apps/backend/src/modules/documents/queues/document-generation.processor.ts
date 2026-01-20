import { OnQueueFailed, OnQueueCompleted, InjectQueue } from '@nestjs/bull';
import { Logger, Injectable, OnModuleInit } from '@nestjs/common';
import type { Job, Queue } from 'bull';
import { QUEUE_NAMES } from '../../../shared/queues/base/queue-names';
import { AiClientService } from '../../../shared/ai-client/ai-client.service';
import { DocumentType as AiDocumentType } from '../../../shared/ai-client/ai-client.types';
import { DocumentProgressPubSubService } from '../../../shared/streaming';
import { DocumentsService } from '../services/documents.service';
import type {
  DocumentGenerationJobData,
  DocumentGenerationJobResult,
} from './document-generation.job';

/**
 * Document Generation Queue Processor
 *
 * Handles asynchronous document generation jobs via the Bull queue system.
 * Communicates with the AI service to generate document content and updates
 * the document status in the database.
 *
 * Processing Flow:
 * 1. Receive job with document ID and generation parameters
 * 2. Call AI service to start document generation
 * 3. Poll AI service for completion (with exponential backoff)
 * 4. Update document with generated content or error
 *
 * Error Recovery:
 * - Jobs are retried up to 3 times by default
 * - Failed jobs are logged and document status is updated to FAILED
 * - Polling timeout prevents indefinite waiting for AI service
 */
@Injectable()
export class DocumentGenerationProcessor implements OnModuleInit {
  private readonly logger = new Logger(DocumentGenerationProcessor.name);

  /**
   * Maximum time to wait for AI service to complete generation (5 minutes)
   */
  private readonly POLLING_TIMEOUT_MS = 5 * 60 * 1000;

  /**
   * Initial polling interval (2 seconds)
   */
  private readonly INITIAL_POLL_INTERVAL_MS = 2000;

  /**
   * Maximum polling interval (30 seconds)
   */
  private readonly MAX_POLL_INTERVAL_MS = 30000;

  constructor(
    @InjectQueue(QUEUE_NAMES.DOCUMENT.GENERATION)
    private readonly documentGenerationQueue: Queue<DocumentGenerationJobData>,
    private readonly aiClientService: AiClientService,
    private readonly documentsService: DocumentsService,
    private readonly progressPubSub: DocumentProgressPubSubService,
  ) {}

  onModuleInit() {
    // Manually register the process function to avoid double-registration errors
    // if the module is instantiated multiple times.
    try {
      this.documentGenerationQueue.process(async (job) => {
        return this.process(job);
      });

      // Register event listeners
      this.documentGenerationQueue.on('completed', (job, result) => {
        this.onCompleted(
          job as Job<DocumentGenerationJobData>,
          result as DocumentGenerationJobResult,
        );
      });

      this.documentGenerationQueue.on('failed', (job, err) => {
        this.onFailed(job as Job<DocumentGenerationJobData>, err);
      });
    } catch (error) {
      // If handler is already set, we can ignore this error for the duplicate instance
      if (
        error instanceof Error &&
        error.message.includes('Cannot define the same handler twice')
      ) {
        this.logger.warn(
          'Queue handler already registered (duplicate module instantiation detected). Skipping registration.',
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Process a document generation job
   *
   * Main entry point for processing document generation jobs.
   * Coordinates the entire generation workflow.
   */
  async process(
    job: Job<DocumentGenerationJobData>,
  ): Promise<DocumentGenerationJobResult> {
    const { documentId, sessionId, documentType, description, context } =
      job.data;
    const startTime = Date.now();

    this.logger.log(
      `Processing document generation job ${job.id} for document ${documentId}`,
    );

    try {
      // Update job progress and emit SSE event
      await job.progress(10);
      this.publishProgress(
        documentId,
        sessionId,
        10,
        'Starting document generation...',
      );

      // Step 1: Initiate document generation with AI service
      this.logger.debug(`Initiating AI generation for document ${documentId}`);
      const initiateResponse = await this.aiClientService.generateDocument({
        description,
        document_type: this.mapDocumentType(documentType),
        context,
        session_id: sessionId,
      });

      const taskId = initiateResponse.task_id;
      this.logger.debug(
        `AI generation initiated with task ID: ${taskId} for document ${documentId}`,
      );

      await job.progress(30);
      this.publishProgress(
        documentId,
        sessionId,
        30,
        'AI engine processing request...',
      );

      // Step 2: Poll for completion (with progress streaming)
      const content = await this.pollForCompletion(
        job,
        taskId,
        documentId,
        sessionId,
      );

      await job.progress(90);
      this.publishProgress(
        documentId,
        sessionId,
        90,
        'Saving generated content...',
      );

      // Step 3: Complete document generation
      await this.documentsService.completeGeneration(documentId, content);

      const generationTimeMs = Date.now() - startTime;
      this.logger.log(
        `Document ${documentId} generated successfully in ${generationTimeMs}ms`,
      );

      await job.progress(100);

      // Emit completion event with final content
      this.progressPubSub.publish({
        documentId,
        sessionId,
        status: 'COMPLETED',
        progress: 100,
        message: 'Document generation completed successfully',
        partialContent: content,
        timestamp: new Date(),
      });

      return {
        documentId,
        taskId,
        content,
        generationTimeMs,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to generate document ${documentId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Emit failure event
      this.progressPubSub.publish({
        documentId,
        sessionId,
        status: 'FAILED',
        progress: 0,
        message: 'Document generation failed',
        error: errorMessage,
        timestamp: new Date(),
      });

      // Mark document as failed in the database
      try {
        await this.documentsService.failGeneration(documentId, errorMessage);
      } catch (failError) {
        this.logger.error(
          `Failed to mark document ${documentId} as failed`,
          failError instanceof Error ? failError.stack : undefined,
        );
      }

      throw error;
    }
  }

  /**
   * Poll the AI service for document generation completion
   *
   * Uses exponential backoff to avoid overwhelming the AI service.
   * Throws an error if polling times out.
   * Emits progress events via SSE for real-time frontend updates.
   */
  private async pollForCompletion(
    job: Job<DocumentGenerationJobData>,
    taskId: string,
    documentId: string,
    sessionId: string,
  ): Promise<string> {
    const startTime = Date.now();
    let pollInterval = this.INITIAL_POLL_INTERVAL_MS;
    let progressPercent = 30;

    while (Date.now() - startTime < this.POLLING_TIMEOUT_MS) {
      await this.sleep(pollInterval);

      try {
        const status = await this.aiClientService.getDocumentStatus(taskId);

        this.logger.debug(
          `Polling status for task ${taskId}: ${status.status}`,
        );

        if (status.status === 'completed' && status.content) {
          return status.content;
        }

        if (status.status === 'failed') {
          throw new Error(
            status.error || 'AI service reported generation failure',
          );
        }

        // Update progress during polling
        progressPercent = Math.min(85, progressPercent + 5);
        await job.progress(progressPercent);

        // Emit progress event via SSE for real-time frontend updates
        this.publishProgress(
          documentId,
          sessionId,
          progressPercent,
          `Generating document content... (${progressPercent}%)`,
        );

        // Exponential backoff with max limit
        pollInterval = Math.min(pollInterval * 1.5, this.MAX_POLL_INTERVAL_MS);
      } catch (error) {
        if (error instanceof Error && error.message.includes('failure')) {
          throw error;
        }
        // For network errors, continue polling (AI service might be temporarily unavailable)
        this.logger.warn(
          `Polling error for task ${taskId}, will retry: ${error instanceof Error ? error.message : 'Unknown'}`,
        );
      }
    }

    throw new Error(
      `Document generation timed out after ${this.POLLING_TIMEOUT_MS}ms for document ${documentId}`,
    );
  }

  /**
   * Map internal document type to AI service document type
   */
  private mapDocumentType(type: string): AiDocumentType {
    const typeMap: Record<string, AiDocumentType> = {
      LAWSUIT: AiDocumentType.LAWSUIT,
      COMPLAINT: AiDocumentType.COMPLAINT,
      CONTRACT: AiDocumentType.CONTRACT,
      OTHER: AiDocumentType.OTHER,
    };
    return typeMap[type] || AiDocumentType.OTHER;
  }

  /**
   * Sleep utility for polling intervals
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Publish progress event via SSE
   */
  private publishProgress(
    documentId: string,
    sessionId: string,
    progress: number,
    message: string,
  ): void {
    this.progressPubSub.publish({
      documentId,
      sessionId,
      status: 'GENERATING',
      progress,
      message,
      timestamp: new Date(),
    });
  }

  /**
   * Handle job completion event
   */
  onCompleted(
    job: Job<DocumentGenerationJobData>,
    result: DocumentGenerationJobResult,
  ): void {
    this.logger.log(
      `Job ${job.id} completed for document ${result.documentId} in ${result.generationTimeMs}ms`,
    );
  }

  /**
   * Handle job failure event
   */
  onFailed(job: Job<DocumentGenerationJobData>, error: Error): void {
    this.logger.error(
      `Job ${job.id} failed for document ${job.data.documentId}: ${error.message}`,
      error.stack,
    );
  }
}
