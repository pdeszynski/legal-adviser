/**
 * Document Generation Workflow
 *
 * Orchestrates the generation of legal documents using AI.
 * Handles document initialization, AI content generation, polling,
 * completion/failure handling, and email notifications.
 *
 * Workflow Steps:
 * 1. Initialize document with DRAFT -> GENERATING status
 * 2. Call AI Engine to start content generation
 * 3. Poll AI Engine for completion (with exponential backoff)
 * 4. Update document to COMPLETED status with content
 * 5. Send completion notification email
 *
 * Error Handling:
 * - If AI generation fails: mark document as FAILED, send failure email
 * - Retry policy for transient AI failures (exponential backoff)
 * - Email failures don't fail the workflow (best-effort delivery)
 *
 * Idempotency:
 * - Workflow ID is based on document ID for idempotency
 * - Re-running the workflow with the same document ID will not duplicate work
 */

import type {
  InitializeDocumentInput,
  InitializeDocumentOutput,
  StartAiGenerationInput,
  StartAiGenerationOutput,
  PollAiCompletionInput,
  PollAiCompletionOutput,
  CompleteDocumentInput,
  CompleteDocumentOutput,
  FailDocumentInput,
  FailDocumentOutput,
  SendCompletionEmailInput,
  SendCompletionEmailOutput,
  SendFailureEmailInput,
  SendFailureEmailOutput,
} from '../../activities/document/document-generation.activities';

/**
 * Document Generation Workflow Input
 *
 * Input parameters for the document generation workflow.
 */
export interface DocumentGenerationInput {
  /** Document ID to generate content for */
  documentId: string;
  /** Session ID associated with the document */
  sessionId: string;
  /** Document title */
  title: string;
  /** Document type (LAWSUIT, COMPLAINT, CONTRACT, OTHER) */
  documentType: string;
  /** Description of the document content to generate */
  description: string;
  /** Additional context for document generation */
  context?: Record<string, unknown> | null;
  /** User ID for tracking */
  userId?: string;
  /** Frontend URL for document links in emails */
  frontendUrl?: string;
}

/**
 * Document Generation Workflow Output
 *
 * Output returned after workflow completion.
 */
export interface DocumentGenerationOutput {
  /** Document ID that was generated */
  documentId: string;
  /** Final document status */
  status: 'COMPLETED' | 'FAILED';
  /** Generated content (if successful) */
  content?: string;
  /** Time taken for generation (ms) */
  generationTimeMs: number;
  /** Timestamp of completion */
  completedAt: string;
  /** Error message (if failed) */
  errorMessage?: string;
}

/**
 * Activity interfaces for type safety
 *
 * These interfaces define the activity signatures that the workflow calls.
 * The actual activity implementations are in the activities directory.
 */

export interface DocumentGenerationActivities {
  initializeDocument(
    input: InitializeDocumentInput,
  ): Promise<InitializeDocumentOutput>;
  startAiGeneration(
    input: StartAiGenerationInput,
  ): Promise<StartAiGenerationOutput>;
  pollAiCompletion(
    input: PollAiCompletionInput,
  ): Promise<PollAiCompletionOutput>;
  completeDocument(
    input: CompleteDocumentInput,
  ): Promise<CompleteDocumentOutput>;
  failDocument(input: FailDocumentInput): Promise<FailDocumentOutput>;
  sendCompletionEmail(
    input: SendCompletionEmailInput,
  ): Promise<SendCompletionEmailOutput>;
  sendFailureEmail(
    input: SendFailureEmailInput,
  ): Promise<SendFailureEmailOutput>;
}

/**
 * Generate workflow ID from document ID
 *
 * This ensures idempotency - re-running the workflow with the same
 * document ID will not create duplicate work.
 *
 * @param documentId - The document ID
 * @returns A deterministic workflow ID
 */
export function generateWorkflowId(documentId: string): string {
  return `document-generation-${documentId}`;
}

/**
 * Document Generation Workflow
 *
 * Main workflow function that orchestrates document generation.
 *
 * This workflow is designed to be:
 * - Deterministic: Same inputs produce same outputs (no random values)
 * - Idempotent: Can be safely re-run with the same document ID
 * - Durable: Survives worker restarts and server failures
 * - Observable: Emits progress events via SSE
 *
 * Activities are called with retry policies:
 * - initializeDocument: No retry (idempotent but fast fail)
 * - startAiGeneration: Retry with exponential backoff (3 attempts)
 * - pollAiCompletion: No retry (long-running activity)
 * - completeDocument: No retry (idempotent, fast fail)
 * - failDocument: No retry (idempotent, fast fail)
 * - sendCompletionEmail: No retry (best-effort, failure is acceptable)
 * - sendFailureEmail: No retry (best-effort, failure is acceptable)
 *
 * @param input - Workflow input parameters
 * @param activities - Activity implementations (injected by Temporal)
 * @returns Workflow output with generation result
 */
export async function documentGeneration(
  input: DocumentGenerationInput,
  activities: DocumentGenerationActivities,
): Promise<DocumentGenerationOutput> {
  const {
    documentId,
    sessionId,
    title,
    documentType,
    description,
    context,
    userId,
    frontendUrl = 'http://localhost:3000',
  } = input;

  // Step 1: Initialize document status to GENERATING
  // This activity sets the document status and emits the generation started event
  await activities.initializeDocument({
    documentId,
    sessionId,
    title,
    type: documentType,
    metadata: context ?? undefined,
  });

  // Step 2: Start AI generation
  // This activity calls the AI Engine and returns a task ID for polling
  const { taskId } = await activities.startAiGeneration({
    documentId,
    description,
    documentType,
    sessionId,
    context: context ?? undefined,
    userId,
  });

  // Step 3: Poll for AI completion
  // This activity polls the AI Engine with exponential backoff
  // It has a long timeout (5 minutes) as AI generation can take time
  let content: string;
  let generationTimeMs: number;
  let userEmail: string | undefined;
  let firstName: string | undefined;

  try {
    const pollResult = await activities.pollAiCompletion({
      taskId,
      documentId,
      sessionId,
    });

    content = pollResult.content;
    generationTimeMs = pollResult.generationTimeMs;
  } catch (error) {
    // AI generation failed - mark document as failed and send notification
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    const failResult = await activities.failDocument({
      documentId,
      errorMessage,
    });

    userEmail = failResult.userEmail;
    firstName = failResult.firstName;

    // Send failure email (best-effort, don't fail workflow on error)
    if (userEmail) {
      try {
        await activities.sendFailureEmail({
          userEmail,
          firstName,
          documentId,
          documentType,
          errorMessage,
        });
      } catch {
        // Email failure is logged but doesn't fail the workflow
      }
    }

    return {
      documentId,
      status: 'FAILED',
      generationTimeMs: 0,
      completedAt: new Date().toISOString(),
      errorMessage,
    };
  }

  // Step 4: Complete document with generated content
  // This activity saves the content and emits completion events
  const completeResult = await activities.completeDocument({
    documentId,
    content,
  });

  userEmail = completeResult.userEmail;
  firstName = completeResult.firstName;

  // Step 5: Send completion notification email (best-effort)
  if (userEmail) {
    try {
      await activities.sendCompletionEmail({
        userEmail,
        firstName,
        documentId,
        documentType,
        frontendUrl,
      });
    } catch {
      // Email failure is logged but doesn't fail the workflow
    }
  }

  return {
    documentId,
    status: 'COMPLETED',
    content,
    generationTimeMs,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Workflow export for Temporal registration
 *
 * The workflow function and its metadata for registration with Temporal.
 */
export const workflowInfo = {
  name: 'documentGeneration',
  taskQueue: 'document-processing',
} as const;
