/**
 * Document Generation Activities
 *
 * Individual activities that can be called within workflows
 * for document generation operations. These activities handle
 * the actual I/O operations (database, external API calls).
 *
 * Activities must be deterministic and idempotent where possible.
 * All external service calls should be wrapped in activities.
 */

import { Logger } from '@nestjs/common';
import { DocumentType as AiDocumentType } from '../../../../shared/ai-client/ai-client.types';
import { DocumentStatus } from '../../../../modules/documents/entities/legal-document.entity';

/**
 * Initialize Document Activity Input
 *
 * Input for initializing a document with DRAFT status.
 */
export interface InitializeDocumentInput {
  /** Document ID to initialize */
  documentId: string;
  /** Session ID associated with the document */
  sessionId: string;
  /** Document title */
  title: string;
  /** Document type */
  type: string;
  /** Metadata for document context */
  metadata?: Record<string, unknown> | null;
}

/**
 * Initialize Document Activity Output
 *
 * Output from document initialization.
 */
export interface InitializeDocumentOutput {
  /** Document ID that was initialized */
  documentId: string;
  /** Current status after initialization */
  status: DocumentStatus;
  /** Timestamp of initialization */
  initializedAt: string;
}

/**
 * Start AI Generation Activity Input
 *
 * Input for starting AI document generation.
 */
export interface StartAiGenerationInput {
  /** Document ID */
  documentId: string;
  /** Document description for AI generation */
  description: string;
  /** Document type */
  documentType: string;
  /** Session ID for tracking */
  sessionId: string;
  /** Additional context for generation */
  context?: Record<string, unknown> | null;
  /** User ID for tracking */
  userId?: string;
}

/**
 * Start AI Generation Activity Output
 *
 * Output from starting AI generation.
 */
export interface StartAiGenerationOutput {
  /** Task ID from AI Engine for polling */
  taskId: string;
  /** Timestamp when generation was started */
  startedAt: string;
}

/**
 * Poll AI Completion Activity Input
 *
 * Input for polling AI service for completion.
 */
export interface PollAiCompletionInput {
  /** Task ID from AI Engine */
  taskId: string;
  /** Document ID for tracking */
  documentId: string;
  /** Session ID for SSE events */
  sessionId: string;
  /** Maximum time to wait for completion (ms) */
  timeoutMs?: number;
  /** Initial polling interval (ms) */
  initialPollIntervalMs?: number;
  /** Maximum polling interval (ms) */
  maxPollIntervalMs?: number;
}

/**
 * Poll AI Completion Activity Output
 *
 * Output from polling AI service.
 */
export interface PollAiCompletionOutput {
  /** Generated document content */
  content: string;
  /** Total time taken for generation (ms) */
  generationTimeMs: number;
  /** Timestamp of completion */
  completedAt: string;
}

/**
 * Complete Document Activity Input
 *
 * Input for marking document as completed.
 */
export interface CompleteDocumentInput {
  /** Document ID to complete */
  documentId: string;
  /** Generated content */
  content: string;
}

/**
 * Complete Document Activity Output
 *
 * Output from completing document.
 */
export interface CompleteDocumentOutput {
  /** Document ID that was completed */
  documentId: string;
  /** New status */
  status: DocumentStatus;
  /** Timestamp of completion */
  completedAt: string;
  /** User email for notification */
  userEmail?: string;
  /** User first name for notification */
  firstName?: string;
}

/**
 * Fail Document Activity Input
 *
 * Input for marking document as failed.
 */
export interface FailDocumentInput {
  /** Document ID to fail */
  documentId: string;
  /** Error message */
  errorMessage: string;
}

/**
 * Fail Document Activity Output
 *
 * Output from failing document.
 */
export interface FailDocumentOutput {
  /** Document ID that failed */
  documentId: string;
  /** New status */
  status: DocumentStatus;
  /** Timestamp of failure */
  failedAt: string;
  /** User email for notification */
  userEmail?: string;
  /** User first name for notification */
  firstName?: string;
}

/**
 * Send Completion Email Activity Input
 *
 * Input for sending completion notification email.
 */
export interface SendCompletionEmailInput {
  /** User email */
  userEmail: string;
  /** User first name */
  firstName?: string;
  /** Document ID */
  documentId: string;
  /** Document type */
  documentType: string;
  /** Frontend URL for document link */
  frontendUrl: string;
}

/**
 * Send Completion Email Activity Output
 *
 * Output from sending completion email.
 */
export interface SendCompletionEmailOutput {
  /** Whether email was sent successfully */
  sent: boolean;
  /** Timestamp of email send */
  sentAt: string;
}

/**
 * Send Failure Email Activity Input
 *
 * Input for sending failure notification email.
 */
export interface SendFailureEmailInput {
  /** User email */
  userEmail: string;
  /** User first name */
  firstName?: string;
  /** Document ID */
  documentId: string;
  /** Document type */
  documentType: string;
  /** Error message */
  errorMessage: string;
}

/**
 * Send Failure Email Activity Output
 *
 * Output from sending failure email.
 */
export interface SendFailureEmailOutput {
  /** Whether email was sent successfully */
  sent: boolean;
  /** Timestamp of email send */
  sentAt: string;
}

/**
 * Map internal document type to AI service document type
 */
export function mapDocumentType(type: string): AiDocumentType {
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
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Activities container class
 *
 * This class contains all activity implementations.
 * Activities are registered with Temporal workers and called from workflows.
 */
export class DocumentGenerationActivities {
  private readonly logger = new Logger(DocumentGenerationActivities.name);

  constructor(
    private readonly dependencies: {
      documentsService: {
        startGeneration: (id: string) => Promise<{ id: string }>;
        completeGeneration: (
          id: string,
          content: string,
        ) => Promise<{
          id: string;
          session: { user?: { email?: string; firstName?: string } };
        }>;
        failGeneration: (
          id: string,
          errorMessage: string,
        ) => Promise<{
          id: string;
          session: { user?: { email?: string; firstName?: string } };
        }>;
      };
      aiClientService: {
        generateDocument: (request: {
          description: string;
          document_type: AiDocumentType;
          context?: Record<string, unknown>;
          session_id: string;
        }) => Promise<{ task_id: string }>;
        getDocumentStatus: (taskId: string) => Promise<{
          status: string;
          content?: string;
          error?: string;
        }>;
      };
      progressPubSub: {
        publish: (event: {
          documentId: string;
          sessionId: string;
          status: string;
          progress: number;
          message?: string;
          partialContent?: string;
          error?: string;
          timestamp: Date;
        }) => void;
      };
      emailProducer?: {
        queueEmail: (data: {
          to: string;
          subject: string;
          template: string;
          templateData: Record<string, unknown>;
        }) => Promise<void>;
      };
      configService: {
        get: (key: string) => string | undefined;
      };
    },
  ) {}

  /**
   * Initialize Document Activity
   *
   * Sets the document status to GENERATING and emits the generation started event.
   * This activity is idempotent - calling it multiple times with the same document ID
   * will result in the same state.
   */
  async initializeDocument(
    input: InitializeDocumentInput,
  ): Promise<InitializeDocumentOutput> {
    this.logger.log(`Initializing document ${input.documentId} for generation`);

    const document = await this.dependencies.documentsService.startGeneration(
      input.documentId,
    );

    return {
      documentId: document.id,
      status: DocumentStatus.GENERATING,
      initializedAt: new Date().toISOString(),
    };
  }

  /**
   * Start AI Generation Activity
   *
   * Calls the AI Engine to start document generation.
   * Returns a task ID that can be used for polling.
   *
   * This activity has a retry policy for transient failures.
   */
  async startAiGeneration(
    input: StartAiGenerationInput,
  ): Promise<StartAiGenerationOutput> {
    this.logger.log(`Starting AI generation for document ${input.documentId}`);

    const response = await this.dependencies.aiClientService.generateDocument({
      description: input.description,
      document_type: mapDocumentType(input.documentType),
      context: input.context ?? undefined,
      session_id: input.sessionId,
    });

    // Publish initial progress
    this.dependencies.progressPubSub.publish({
      documentId: input.documentId,
      sessionId: input.sessionId,
      status: 'GENERATING',
      progress: 10,
      message: 'AI engine processing request...',
      timestamp: new Date(),
    });

    return {
      taskId: response.task_id,
      startedAt: new Date().toISOString(),
    };
  }

  /**
   * Poll AI Completion Activity
   *
   * Polls the AI Engine for document generation completion.
   * Uses exponential backoff to avoid overwhelming the service.
   *
   * This activity should have a long timeout as it can take several minutes.
   */
  async pollAiCompletion(
    input: PollAiCompletionInput,
  ): Promise<PollAiCompletionOutput> {
    const {
      taskId,
      documentId,
      sessionId,
      timeoutMs = 5 * 60 * 1000, // 5 minutes default
      initialPollIntervalMs = 2000, // 2 seconds
      maxPollIntervalMs = 30000, // 30 seconds
    } = input;

    this.logger.log(
      `Polling AI completion for task ${taskId}, document ${documentId}`,
    );

    const startTime = Date.now();
    let pollInterval = initialPollIntervalMs;
    let progressPercent = 30;

    while (Date.now() - startTime < timeoutMs) {
      await sleep(pollInterval);

      try {
        const status =
          await this.dependencies.aiClientService.getDocumentStatus(taskId);

        this.logger.debug(
          `Polling status for task ${taskId}: ${status.status}`,
        );

        if (status.status === 'completed' && status.content) {
          const generationTimeMs = Date.now() - startTime;

          // Publish completion progress
          this.dependencies.progressPubSub.publish({
            documentId,
            sessionId,
            status: 'COMPLETED',
            progress: 100,
            message: 'Document generation completed successfully',
            partialContent: status.content,
            timestamp: new Date(),
          });

          return {
            content: status.content,
            generationTimeMs,
            completedAt: new Date().toISOString(),
          };
        }

        if (status.status === 'failed') {
          throw new Error(
            status.error || 'AI service reported generation failure',
          );
        }

        // Update progress during polling
        progressPercent = Math.min(85, progressPercent + 5);
        this.dependencies.progressPubSub.publish({
          documentId,
          sessionId,
          status: 'GENERATING',
          progress: progressPercent,
          message: `Generating document content... (${progressPercent}%)`,
          timestamp: new Date(),
        });

        // Exponential backoff with max limit
        pollInterval = Math.min(pollInterval * 1.5, maxPollIntervalMs);
      } catch (error) {
        if (error instanceof Error && error.message.includes('failure')) {
          throw error;
        }
        // For network errors, continue polling
        this.logger.warn(
          `Polling error for task ${taskId}, will retry: ${error instanceof Error ? error.message : 'Unknown'}`,
        );
      }
    }

    throw new Error(
      `Document generation timed out after ${timeoutMs}ms for document ${documentId}`,
    );
  }

  /**
   * Complete Document Activity
   *
   * Marks the document as completed with the generated content.
   * Emits completion events for email notifications.
   * This activity is idempotent - completing an already completed document
   * will not cause an error.
   */
  async completeDocument(
    input: CompleteDocumentInput,
  ): Promise<CompleteDocumentOutput> {
    this.logger.log(`Completing document ${input.documentId}`);

    // Publish saving progress
    this.dependencies.progressPubSub.publish({
      documentId: input.documentId,
      sessionId: '', // Not available here
      status: 'GENERATING',
      progress: 90,
      message: 'Saving generated content...',
      timestamp: new Date(),
    });

    const document =
      await this.dependencies.documentsService.completeGeneration(
        input.documentId,
        input.content,
      );

    // Extract user info for email
    const userEmail = document.session?.user?.email;
    const firstName = document.session?.user?.firstName;

    return {
      documentId: document.id,
      status: DocumentStatus.COMPLETED,
      completedAt: new Date().toISOString(),
      userEmail,
      firstName,
    };
  }

  /**
   * Fail Document Activity
   *
   * Marks the document as failed with an error message.
   * Emits failure events for email notifications.
   * This activity is idempotent - failing an already failed document
   * will not cause an error.
   */
  async failDocument(input: FailDocumentInput): Promise<FailDocumentOutput> {
    this.logger.error(
      `Failing document ${input.documentId}: ${input.errorMessage}`,
    );

    const document = await this.dependencies.documentsService.failGeneration(
      input.documentId,
      input.errorMessage,
    );

    // Extract user info for email
    const userEmail = document.session?.user?.email;
    const firstName = document.session?.user?.firstName;

    return {
      documentId: document.id,
      status: DocumentStatus.FAILED,
      failedAt: new Date().toISOString(),
      userEmail,
      firstName,
    };
  }

  /**
   * Send Completion Email Activity
   *
   * Sends a notification email when document generation completes successfully.
   * This activity is idempotent - sending the same email multiple times
   * is acceptable (user receives multiple notifications).
   */
  async sendCompletionEmail(
    input: SendCompletionEmailInput,
  ): Promise<SendCompletionEmailOutput> {
    this.logger.log(
      `Sending completion email for document ${input.documentId} to ${input.userEmail}`,
    );

    if (!this.dependencies.emailProducer) {
      this.logger.warn('Email producer not available, skipping email');
      return { sent: false, sentAt: new Date().toISOString() };
    }

    try {
      await this.dependencies.emailProducer.queueEmail({
        to: input.userEmail,
        subject: 'Your Legal Document is Ready',
        template: 'DOCUMENT_COMPLETED',
        templateData: {
          documentId: input.documentId,
          documentType: input.documentType,
          firstName: input.firstName,
          documentUrl: `${input.frontendUrl}/documents/show/${input.documentId}`,
        },
      });

      return { sent: true, sentAt: new Date().toISOString() };
    } catch (error) {
      this.logger.error(
        `Failed to send completion email for document ${input.documentId}`,
        error,
      );
      // Don't throw - email failure should not fail the workflow
      return { sent: false, sentAt: new Date().toISOString() };
    }
  }

  /**
   * Send Failure Email Activity
   *
   * Sends a notification email when document generation fails.
   * This activity is idempotent - sending the same email multiple times
   * is acceptable (user receives multiple notifications).
   */
  async sendFailureEmail(
    input: SendFailureEmailInput,
  ): Promise<SendFailureEmailOutput> {
    this.logger.log(
      `Sending failure email for document ${input.documentId} to ${input.userEmail}`,
    );

    if (!this.dependencies.emailProducer) {
      this.logger.warn('Email producer not available, skipping email');
      return { sent: false, sentAt: new Date().toISOString() };
    }

    try {
      await this.dependencies.emailProducer.queueEmail({
        to: input.userEmail,
        subject: 'Document Generation Failed',
        template: 'DOCUMENT_FAILED',
        templateData: {
          documentId: input.documentId,
          documentType: input.documentType,
          firstName: input.firstName,
          errorMessage: input.errorMessage,
        },
      });

      return { sent: true, sentAt: new Date().toISOString() };
    } catch (error) {
      this.logger.error(
        `Failed to send failure email for document ${input.documentId}`,
        error,
      );
      // Don't throw - email failure should not fail the workflow
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
export type DocumentGenerationActivitiesImpl = InstanceType<
  typeof DocumentGenerationActivities
>;

export const createDocumentGenerationActivities = (
  dependencies: DocumentGenerationActivities['dependencies'],
): DocumentGenerationActivities => {
  return new DocumentGenerationActivities(dependencies);
};
