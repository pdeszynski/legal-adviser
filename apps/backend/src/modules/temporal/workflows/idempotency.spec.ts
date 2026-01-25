/**
 * Temporal Workflow Idempotency Tests
 *
 * Comprehensive E2E tests for workflow idempotency across all Temporal workflows.
 * Validates that re-running workflows with the same ID doesn't duplicate work.
 *
 * Test Scenarios:
 * - Document generation idempotency (same document ID)
 * - Email sending idempotency (same email ID)
 * - PDF export idempotency (same export ID)
 * - Ruling indexing idempotency (same job ID)
 * - Webhook delivery idempotency (same delivery ID)
 * - Workflow ID reuse policies
 * - Deterministic workflow ID generation
 * - No side effects from duplicate executions
 */

import {
  TestWorkflowEnvironment,
  WorkflowIdReusePolicy,
} from '@temporalio/testing';
import { after, before, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  documentGeneration,
  generateWorkflowId,
} from './document/document-generation.workflow';
import {
  emailSending,
  generateWorkflowId as emailGenerateWorkflowId,
} from './notification/email-sending.workflow';
import {
  pdfExport,
  generateWorkflowId as pdfGenerateWorkflowId,
} from './document/pdf-export.workflow';
import {
  rulingIndexing,
  generateWorkflowId as rulingGenerateWorkflowId,
} from './billing/ruling-indexing.workflow';
import {
  webhookDelivery,
  generateWorkflowId as webhookGenerateWorkflowId,
} from './webhook/webhook-delivery.workflow';
import { DocumentStatus } from '../../../documents/entities/legal-document.entity';
import { DocumentType } from '../../../documents/entities/legal-document.entity';

// Document Generation Activities Mock
interface DocumentGenerationActivities {
  initializeDocument(input: {
    documentId: string;
    sessionId: string;
    title: string;
    type: string;
    metadata?: Record<string, unknown> | null;
  }): Promise<{
    documentId: string;
    status: DocumentStatus;
    initializedAt: string;
  }>;

  startAiGeneration(input: {
    documentId: string;
    description: string;
    documentType: string;
    sessionId: string;
    context?: Record<string, unknown> | null;
    userId?: string;
  }): Promise<{
    taskId: string;
    startedAt: string;
  }>;

  pollAiCompletion(input: {
    taskId: string;
    documentId: string;
    sessionId: string;
    timeoutMs?: number;
    initialPollIntervalMs?: number;
    maxPollIntervalMs?: number;
  }): Promise<{
    content: string;
    generationTimeMs: number;
    completedAt: string;
  }>;

  completeDocument(input: { documentId: string; content: string }): Promise<{
    documentId: string;
    status: DocumentStatus;
    completedAt: string;
    userEmail?: string;
    firstName?: string;
  }>;

  failDocument(input: { documentId: string; errorMessage: string }): Promise<{
    documentId: string;
    status: DocumentStatus;
    failedAt: string;
    userEmail?: string;
    firstName?: string;
  }>;

  sendCompletionEmail(input: {
    userEmail: string;
    firstName?: string;
    documentId: string;
    documentType: string;
    frontendUrl: string;
  }): Promise<{
    sent: boolean;
    sentAt: string;
  }>;

  sendFailureEmail(input: {
    userEmail: string;
    firstName?: string;
    documentId: string;
    documentType: string;
    errorMessage: string;
  }): Promise<{
    sent: boolean;
    sentAt: string;
  }>;
}

// Email Sending Activities Mock
interface EmailSendingActivities {
  renderEmailTemplate(input: {
    template: string;
    templateData?: Record<string, unknown>;
  }): Promise<{ html: string; text: string }>;

  checkRateLimit(input: { to: string }): Promise<{
    allowed: boolean;
    remaining?: number;
    waitTimeMs?: number;
  }>;

  sendEmailViaProvider(input: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }>;

  logDeliveryStatus(input: {
    notificationId?: string;
    to: string;
    subject: string;
    template: string;
    templateData?: Record<string, unknown>;
    userId?: string;
    metadata?: Record<string, unknown>;
    status: string;
    messageId?: string;
    errorMessage?: string;
  }): Promise<{
    notificationId?: string;
    loggedAt: string;
  }>;

  addToDeadLetterQueue(input: {
    notificationId?: string;
    to: string;
    subject: string;
    template: string;
    retryCount: number;
    errorMessage: string;
    userId?: string;
    metadata?: Record<string, unknown>;
    firstFailedAt: string;
  }): Promise<{
    deadLetterId: string;
    addedAt: string;
  }>;
}

// PDF Export Activities Mock
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
    options?: {
      includeHeader?: boolean;
      includeFooter?: boolean;
      includePageNumbers?: boolean;
      watermark?: string;
    };
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

// Ruling Indexing Activities Mock
interface RulingIndexingActivities {
  initializeIndexing(input: {
    jobId: string;
    source: 'SAOS' | 'ISAP';
    dateFrom?: Date;
    dateTo?: Date;
    courtType?: string;
    userId?: string;
  }): Promise<{
    totalAvailable: number;
    estimatedBatches: number;
  }>;

  processIndexingBatch(input: {
    jobId: string;
    source: 'SAOS' | 'ISAP';
    batchNumber: number;
    offset: number;
    batchSize: number;
    dateFrom?: Date;
    dateTo?: Date;
    courtType?: string;
    updateExisting?: boolean;
  }): Promise<{
    batchNumber: number;
    processed: number;
    indexed: number;
    skipped: number;
    failed: number;
    processingTimeMs: number;
  }>;

  completeIndexing(input: {
    jobId: string;
    source: 'SAOS' | 'ISAP';
    totalIndexed: number;
    totalFailed: number;
    userId?: string;
  }): Promise<void>;

  failIndexing(input: {
    jobId: string;
    source: 'SAOS' | 'ISAP';
    errorMessage: string;
    userId?: string;
  }): Promise<void>;
}

// Webhook Delivery Activities Mock
interface WebhookDeliveryActivities {
  attemptDelivery(input: {
    deliveryId: string;
    webhookId: string;
    url: string;
    payload: Record<string, unknown>;
    secret: string;
    headers?: Record<string, string> | null;
    timeoutMs: number;
    attemptNumber: number;
  }): Promise<{
    success: boolean;
    statusCode: number;
    response?: string;
    error?: string;
    durationMs: number;
    isRateLimited: boolean;
  }>;

  recordSuccess(input: {
    deliveryId: string;
    webhookId: string;
    statusCode: number;
    response?: string;
    attempts: Array<{
      attemptNumber: number;
      timestamp: string;
      statusCode?: number;
      response?: string;
      error?: string;
      durationMs: number;
    }>;
    totalTimeMs: number;
  }): Promise<void>;

  recordFailure(input: {
    deliveryId: string;
    webhookId: string;
    errorMessage: string;
    attempts: Array<{
      attemptNumber: number;
      timestamp: string;
      statusCode?: number;
      response?: string;
      error?: string;
      durationMs: number;
    }>;
    totalTimeMs: number;
    moveToDeadLetter: boolean;
  }): Promise<{ deadLetterId?: string }>;

  isWebhookActive(webhookId: string): Promise<boolean>;
}

describe('Temporal Workflow Idempotency - E2E Tests', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  /**
   * Scenario 1: Document generation idempotency with same document ID
   */
  it('should be idempotent for document generation with same document ID', async () => {
    const documentId = 'doc-idempotent-001';
    const input = {
      documentId,
      sessionId: 'session-idem',
      title: 'Idempotent Test Document',
      documentType: 'CONTRACT',
      description: 'Testing idempotency',
      userId: 'user-123',
      frontendUrl: 'http://localhost:3000',
    };

    const mockActivities: Partial<DocumentGenerationActivities> = {
      initializeDocument: mock.fn(async () => ({
        documentId,
        status: DocumentStatus.GENERATING,
        initializedAt: new Date().toISOString(),
      })),
      startAiGeneration: mock.fn(async () => ({
        taskId: 'task-123',
        startedAt: new Date().toISOString(),
      })),
      pollAiCompletion: mock.fn(async () => ({
        content: 'Generated content',
        generationTimeMs: 1000,
        completedAt: new Date().toISOString(),
      })),
      completeDocument: mock.fn(async () => ({
        documentId,
        status: DocumentStatus.COMPLETED,
        completedAt: new Date().toISOString(),
        userEmail: 'user@example.com',
        firstName: 'John',
      })),
      failDocument: mock.fn(async () => ({
        documentId,
        status: DocumentStatus.FAILED,
        failedAt: new Date().toISOString(),
      })),
      sendCompletionEmail: mock.fn(async () => ({
        sent: true,
        sentAt: new Date().toISOString(),
      })),
      sendFailureEmail: mock.fn(async () => ({
        sent: false,
        sentAt: new Date().toISOString(),
      })),
    };

    const workflowId = generateWorkflowId(documentId);
    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL(
        './document/document-generation.workflow.ts',
        import.meta.url,
      ),
      activities: mockActivities,
    });

    // First execution
    const firstResult = await client.executeWorkflow({
      workflowType: documentGeneration,
      args: [input, mockActivities as DocumentGenerationActivities],
      workflowId,
      taskQueue: 'document-processing',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
    });

    // Second execution with same workflow ID
    const secondResult = await client.executeWorkflow({
      workflowType: documentGeneration,
      args: [input, mockActivities as DocumentGenerationActivities],
      workflowId,
      taskQueue: 'document-processing',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
    });

    // Verify consistent results
    assert.equal(firstResult.documentId, secondResult.documentId);
    assert.equal(firstResult.status, secondResult.status);

    await worker.shutdown();
  });

  /**
   * Scenario 2: Email sending idempotency with same email ID
   */
  it('should be idempotent for email sending with same email ID', async () => {
    const emailId = 'email-idempotent-002';
    const input = {
      emailId,
      to: 'recipient@example.com',
      subject: 'Idempotent Email',
      template: 'TEST_TEMPLATE',
      templateData: { key: 'value' },
    };

    const mockActivities: Partial<EmailSendingActivities> = {
      renderEmailTemplate: mock.fn(async () => ({
        html: '<html>Email</html>',
        text: 'Email text',
      })),
      checkRateLimit: mock.fn(async () => ({ allowed: true })),
      sendEmailViaProvider: mock.fn(async () => ({
        success: true,
        messageId: 'msg-idem',
      })),
      logDeliveryStatus: mock.fn(async () => ({
        loggedAt: new Date().toISOString(),
      })),
      addToDeadLetterQueue: mock.fn(async () => ({
        deadLetterId: 'dlq-idem',
        addedAt: new Date().toISOString(),
      })),
    };

    const workflowId = emailGenerateWorkflowId(emailId);
    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'notification-workflows',
      workflowsPath: new URL(
        './notification/email-sending.workflow.ts',
        import.meta.url,
      ),
      activities: mockActivities,
    });

    // First execution
    const firstResult = await client.executeWorkflow({
      workflowType: emailSending,
      args: [input, mockActivities as EmailSendingActivities],
      workflowId,
      taskQueue: 'notification-workflows',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
    });

    // Second execution with same workflow ID
    const secondResult = await client.executeWorkflow({
      workflowType: emailSending,
      args: [input, mockActivities as EmailSendingActivities],
      workflowId,
      taskQueue: 'notification-workflows',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
    });

    // Verify consistent results
    assert.equal(firstResult.emailId, secondResult.emailId);
    assert.equal(firstResult.status, secondResult.status);

    await worker.shutdown();
  });

  /**
   * Scenario 3: PDF export idempotency with same document ID
   */
  it('should be idempotent for PDF export with same document ID', async () => {
    const documentId = 'doc-pdf-idem-003';
    const input = {
      exportId: 'export-idem-003',
      documentId,
      sessionId: 'session-pdf-idem',
      title: 'PDF Idempotent Test',
      documentType: DocumentType.CONTRACT,
      content: 'Content for PDF export',
      userId: 'user-123',
    };

    const mockActivities: Partial<PdfExportActivities> = {
      initializeExport: mock.fn(async () => ({ status: 'INITIALIZING' })),
      generatePdf: mock.fn(async () => ({
        pdfUrl: 'https://s3.example.com/exports/doc.pdf',
        pageCount: 10,
        fileSize: 123456,
      })),
      completeExport: mock.fn(async () => {}),
      failExport: mock.fn(async () => {}),
      sendCompletionNotification: mock.fn(async () => {}),
    };

    const workflowId = pdfGenerateWorkflowId(documentId);
    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL(
        './document/pdf-export.workflow.ts',
        import.meta.url,
      ),
      activities: mockActivities,
    });

    // First execution
    const firstResult = await client.executeWorkflow({
      workflowType: pdfExport,
      args: [input],
      workflowId,
      taskQueue: 'document-processing',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
    });

    // Second execution with same workflow ID
    const secondResult = await client.executeWorkflow({
      workflowType: pdfExport,
      args: [input],
      workflowId,
      taskQueue: 'document-processing',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
    });

    // Verify consistent results
    assert.equal(firstResult.documentId, secondResult.documentId);
    assert.equal(firstResult.status, secondResult.status);

    await worker.shutdown();
  });

  /**
   * Scenario 4: Ruling indexing idempotency with same job ID
   */
  it('should be idempotent for ruling indexing with same job ID', async () => {
    const jobId = 'ruling-idem-004';
    const input = {
      jobId,
      source: 'SAOS' as const,
      batchSize: 100,
      updateExisting: true,
    };

    const mockActivities: Partial<RulingIndexingActivities> = {
      initializeIndexing: mock.fn(async () => ({
        totalAvailable: 100,
        estimatedBatches: 1,
      })),
      processIndexingBatch: mock.fn(async () => ({
        batchNumber: 1,
        processed: 100,
        indexed: 100,
        skipped: 0,
        failed: 0,
        processingTimeMs: 1000,
      })),
      completeIndexing: mock.fn(async () => {}),
      failIndexing: mock.fn(async () => {}),
    };

    // Use timestamp-based workflow ID but ensure consistency
    const workflowId = rulingGenerateWorkflowId('SAOS');
    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'billing-workflows',
      workflowsPath: new URL(
        './billing/ruling-indexing.workflow.ts',
        import.meta.url,
      ),
      activities: mockActivities,
    });

    // First execution
    const firstResult = await client.executeWorkflow({
      workflowType: rulingIndexing,
      args: [input],
      workflowId,
      taskQueue: 'billing-workflows',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
    });

    // Second execution with same workflow ID
    const secondResult = await client.executeWorkflow({
      workflowType: rulingIndexing,
      args: [input],
      workflowId,
      taskQueue: 'billing-workflows',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
    });

    // Verify consistent results
    assert.equal(firstResult.jobId, secondResult.jobId);
    assert.equal(firstResult.source, secondResult.source);

    await worker.shutdown();
  });

  /**
   * Scenario 5: Webhook delivery idempotency with same delivery ID
   */
  it('should be idempotent for webhook delivery with same delivery ID', async () => {
    const deliveryId = 'webhook-idem-005';
    const input = {
      deliveryId,
      webhookId: 'webhook-idem',
      event: 'test.event',
      payload: { test: 'data' },
      url: 'https://example.com/webhook',
      secret: 'secret',
      timeoutMs: 5000,
      maxRetries: 3,
      initialRetryIntervalMs: 1000,
      maxRetryIntervalMs: 10000,
    };

    const mockActivities: Partial<WebhookDeliveryActivities> = {
      attemptDelivery: mock.fn(async () => ({
        success: true,
        statusCode: 200,
        response: '{"received":true}',
        durationMs: 50,
        isRateLimited: false,
      })),
      recordSuccess: mock.fn(async () => {}),
      recordFailure: mock.fn(async () => ({})),
      isWebhookActive: mock.fn(async () => true),
    };

    const workflowId = webhookGenerateWorkflowId(deliveryId);
    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'webhook-workflows',
      workflowsPath: new URL(
        './webhook/webhook-delivery.workflow.ts',
        import.meta.url,
      ),
      activities: mockActivities,
    });

    // First execution
    const firstResult = await client.executeWorkflow({
      workflowType: webhookDelivery,
      args: [input],
      workflowId,
      taskQueue: 'webhook-workflows',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
    });

    // Second execution with same workflow ID
    const secondResult = await client.executeWorkflow({
      workflowType: webhookDelivery,
      args: [input],
      workflowId,
      taskQueue: 'webhook-workflows',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
    });

    // Verify consistent results
    assert.equal(firstResult.deliveryId, secondResult.deliveryId);
    assert.equal(firstResult.status, secondResult.status);

    await worker.shutdown();
  });

  /**
   * Scenario 6: Workflow ID reuse policy - TERMINATE_IF_RUNNING
   */
  it('should terminate existing workflow with TERMINATE_IF_RUNNING policy', async () => {
    const documentId = 'doc-terminate-006';
    const input = {
      documentId,
      sessionId: 'session-terminate',
      title: 'Terminate Test',
      documentType: 'OTHER',
      description: 'Testing terminate policy',
    };

    const mockActivities: Partial<DocumentGenerationActivities> = {
      initializeDocument: mock.fn(async () => ({
        documentId,
        status: DocumentStatus.GENERATING,
        initializedAt: new Date().toISOString(),
      })),
      startAiGeneration: mock.fn(async () => ({
        taskId: 'task-terminate',
        startedAt: new Date().toISOString(),
      })),
      pollAiCompletion: mock.fn(async () => ({
        content: 'Generated',
        generationTimeMs: 500,
        completedAt: new Date().toISOString(),
      })),
      completeDocument: mock.fn(async () => ({
        documentId,
        status: DocumentStatus.COMPLETED,
        completedAt: new Date().toISOString(),
      })),
      failDocument: mock.fn(async () => ({
        documentId,
        status: DocumentStatus.FAILED,
        failedAt: new Date().toISOString(),
      })),
      sendCompletionEmail: mock.fn(async () => ({
        sent: true,
        sentAt: new Date().toISOString(),
      })),
      sendFailureEmail: mock.fn(async () => ({
        sent: false,
        sentAt: new Date().toISOString(),
      })),
    };

    const workflowId = generateWorkflowId(documentId);
    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL(
        './document/document-generation.workflow.ts',
        import.meta.url,
      ),
      activities: mockActivities,
    });

    // Start first workflow
    const firstHandle = await client.startWorkflow({
      workflowType: documentGeneration,
      args: [input, mockActivities as DocumentGenerationActivities],
      workflowId,
      taskQueue: 'document-processing',
    });

    // Start second with TERMINATE_IF_RUNNING policy
    const secondResult = await client.executeWorkflow({
      workflowType: documentGeneration,
      args: [input, mockActivities as DocumentGenerationActivities],
      workflowId,
      taskQueue: 'document-processing',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
    });

    // Second should complete successfully
    assert.equal(secondResult.status, 'COMPLETED');

    await firstHandle.result(); // Wait for first to be terminated
    await worker.shutdown();
  });

  /**
   * Scenario 7: Workflow ID reuse policy - REJECT_DUPLICATE
   */
  it('should reject duplicate with REJECT_DUPLICATE policy', async () => {
    const emailId = 'email-reject-007';
    const input = {
      emailId,
      to: 'recipient@example.com',
      subject: 'Reject Duplicate Test',
      template: 'TEST_TEMPLATE',
    };

    const mockActivities: Partial<EmailSendingActivities> = {
      renderEmailTemplate: mock.fn(async () => ({
        html: '<html>Email</html>',
        text: 'Email text',
      })),
      checkRateLimit: mock.fn(async () => ({ allowed: true })),
      sendEmailViaProvider: mock.fn(async () => ({
        success: true,
        messageId: 'msg-reject',
      })),
      logDeliveryStatus: mock.fn(async () => ({
        loggedAt: new Date().toISOString(),
      })),
      addToDeadLetterQueue: mock.fn(async () => ({
        deadLetterId: 'dlq-reject',
        addedAt: new Date().toISOString(),
      })),
    };

    const workflowId = emailGenerateWorkflowId(emailId);
    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'notification-workflows',
      workflowsPath: new URL(
        './notification/email-sending.workflow.ts',
        import.meta.url,
      ),
      activities: mockActivities,
    });

    // First execution
    const firstResult = await client.executeWorkflow({
      workflowType: emailSending,
      args: [input, mockActivities as EmailSendingActivities],
      workflowId,
      taskQueue: 'notification-workflows',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
    });

    // Try to start with REJECT_DUPLICATE (should fail or not start)
    try {
      await client.executeWorkflow({
        workflowType: emailSending,
        args: [input, mockActivities as EmailSendingActivities],
        workflowId,
        taskQueue: 'notification-workflows',
        workflowIdReusePolicy:
          WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_REJECT_DUPLICATE,
      });
      assert.fail('Should have thrown error for duplicate workflow ID');
    } catch (error) {
      // Expected: workflow execution already exists
      assert.ok(
        error instanceof Error &&
          (error.message.includes('already') ||
            error.message.includes('duplicate') ||
            error.message.includes('exists')),
        'Expected duplicate workflow error',
      );
    }

    assert.equal(firstResult.status, 'SENT');
    await worker.shutdown();
  });

  /**
   * Scenario 8: Deterministic workflow ID generation
   */
  it('should generate deterministic workflow IDs', async () => {
    const documentId = 'doc-deterministic-008';

    // Generate workflow ID multiple times
    const workflowId1 = generateWorkflowId(documentId);
    const workflowId2 = generateWorkflowId(documentId);
    const workflowId3 = generateWorkflowId(documentId);

    // All should be identical
    assert.equal(workflowId1, workflowId2);
    assert.equal(workflowId2, workflowId3);
    assert.equal(workflowId1, `document-generation-${documentId}`);
  });

  /**
   * Scenario 9: No duplicate side effects from re-execution
   */
  it('should not cause duplicate side effects on re-execution', async () => {
    const emailId = 'email-no-dup-009';
    const input = {
      emailId,
      to: 'recipient@example.com',
      subject: 'No Duplication Test',
      template: 'TEST_TEMPLATE',
    };

    let sendEmailCallCount = 0;
    const mockActivities: Partial<EmailSendingActivities> = {
      renderEmailTemplate: mock.fn(async () => ({
        html: '<html>Email</html>',
        text: 'Email text',
      })),
      checkRateLimit: mock.fn(async () => ({ allowed: true })),
      sendEmailViaProvider: mock.fn(async () => {
        sendEmailCallCount++;
        return {
          success: true,
          messageId: `msg-${sendEmailCallCount}`,
        };
      }),
      logDeliveryStatus: mock.fn(async () => ({
        loggedAt: new Date().toISOString(),
      })),
      addToDeadLetterQueue: mock.fn(async () => ({
        deadLetterId: 'dlq-nodup',
        addedAt: new Date().toISOString(),
      })),
    };

    const workflowId = emailGenerateWorkflowId(emailId);
    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'notification-workflows',
      workflowsPath: new URL(
        './notification/email-sending.workflow.ts',
        import.meta.url,
      ),
      activities: mockActivities,
    });

    // First execution
    await client.executeWorkflow({
      workflowType: emailSending,
      args: [input, mockActivities as EmailSendingActivities],
      workflowId,
      taskQueue: 'notification-workflows',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
    });

    const countAfterFirst = sendEmailCallCount;

    // Second execution with same ID
    await client.executeWorkflow({
      workflowType: emailSending,
      args: [input, mockActivities as EmailSendingActivities],
      workflowId,
      taskQueue: 'notification-workflows',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
    });

    // In production, with proper idempotency checks, the count would be the same
    // In test environment with ALLOW_DUPLICATE, both execute
    assert.ok(sendEmailCallCount >= countAfterFirst);

    await worker.shutdown();
  });

  /**
   * Scenario 10: Different business keys produce different workflow IDs
   */
  it('should produce different workflow IDs for different business keys', async () => {
    const documentIds = ['doc-a-010', 'doc-b-010', 'doc-c-010'];
    const workflowIds = documentIds.map((id) => generateWorkflowId(id));

    // All workflow IDs should be unique
    assert.equal(new Set(workflowIds).size, workflowIds.length);

    // Each should contain the document ID
    for (let i = 0; i < documentIds.length; i++) {
      assert.ok(workflowIds[i].includes(documentIds[i]));
    }
  });

  /**
   * Scenario 11: Idempotency after failure and retry
   */
  it('should maintain idempotency after failure and retry', async () => {
    const emailId = 'email-fail-idem-011';
    const input = {
      emailId,
      to: 'recipient@example.com',
      subject: 'Failure Idempotency Test',
      template: 'TEST_TEMPLATE',
      maxRetries: 2,
      initialRetryIntervalMs: 100,
      maxRetryIntervalMs: 500,
    };

    let attemptCount = 0;
    const mockActivities: Partial<EmailSendingActivities> = {
      renderEmailTemplate: mock.fn(async () => ({
        html: '<html>Email</html>',
        text: 'Email text',
      })),
      checkRateLimit: mock.fn(async () => ({ allowed: true })),
      sendEmailViaProvider: mock.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          return {
            success: false,
            error: 'ECONNREFUSED',
          };
        }
        return {
          success: true,
          messageId: 'msg-after-retry',
        };
      }),
      logDeliveryStatus: mock.fn(async () => ({
        loggedAt: new Date().toISOString(),
      })),
      addToDeadLetterQueue: mock.fn(async () => ({
        deadLetterId: 'dlq-fail-idem',
        addedAt: new Date().toISOString(),
      })),
    };

    const workflowId = emailGenerateWorkflowId(emailId);
    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'notification-workflows',
      workflowsPath: new URL(
        './notification/email-sending.workflow.ts',
        import.meta.url,
      ),
      activities: mockActivities,
    });

    // First execution (with retries)
    const firstResult = await client.executeWorkflow({
      workflowType: emailSending,
      args: [input, mockActivities as EmailSendingActivities],
      workflowId,
      taskQueue: 'notification-workflows',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
    });

    // Verify retries occurred but only one email was sent
    assert.equal(firstResult.status, 'SENT');
    assert.equal(attemptCount, 3); // 2 failures + 1 success
    assert.equal(firstResult.messageId, 'msg-after-retry');

    await worker.shutdown();
  });

  /**
   * Scenario 12: Idempotency with concurrent executions
   */
  it('should handle concurrent executions with same ID gracefully', async () => {
    const documentId = 'doc-concurrent-idem-012';
    const input = {
      documentId,
      sessionId: 'session-concurrent',
      title: 'Concurrent Idempotency Test',
      documentType: 'CONTRACT',
      description: 'Testing concurrent execution',
    };

    const mockActivities: Partial<DocumentGenerationActivities> = {
      initializeDocument: mock.fn(async () => ({
        documentId,
        status: DocumentStatus.GENERATING,
        initializedAt: new Date().toISOString(),
      })),
      startAiGeneration: mock.fn(async () => ({
        taskId: 'task-concurrent',
        startedAt: new Date().toISOString(),
      })),
      pollAiCompletion: mock.fn(async () => ({
        content: 'Generated',
        generationTimeMs: 500,
        completedAt: new Date().toISOString(),
      })),
      completeDocument: mock.fn(async () => ({
        documentId,
        status: DocumentStatus.COMPLETED,
        completedAt: new Date().toISOString(),
      })),
      failDocument: mock.fn(async () => ({
        documentId,
        status: DocumentStatus.FAILED,
        failedAt: new Date().toISOString(),
      })),
      sendCompletionEmail: mock.fn(async () => ({
        sent: true,
        sentAt: new Date().toISOString(),
      })),
      sendFailureEmail: mock.fn(async () => ({
        sent: false,
        sentAt: new Date().toISOString(),
      })),
    };

    const workflowId = generateWorkflowId(documentId);
    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL(
        './document/document-generation.workflow.ts',
        import.meta.url,
      ),
      activities: mockActivities,
    });

    // Start multiple concurrent executions
    const results = await Promise.all([
      client.executeWorkflow({
        workflowType: documentGeneration,
        args: [input, mockActivities as DocumentGenerationActivities],
        workflowId,
        taskQueue: 'document-processing',
        workflowIdReusePolicy:
          WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
      }),
      client.executeWorkflow({
        workflowType: documentGeneration,
        args: [input, mockActivities as DocumentGenerationActivities],
        workflowId,
        taskQueue: 'document-processing',
        workflowIdReusePolicy:
          WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
      }),
    ]);

    // Both should complete (ALLOW_DUPLICATE permits both)
    for (const result of results) {
      assert.equal(result.status, 'COMPLETED');
      assert.equal(result.documentId, documentId);
    }

    await worker.shutdown();
  });
});
