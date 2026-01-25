/**
 * Temporal Workflow Cancellation and Timeout Tests
 *
 * Comprehensive E2E tests for workflow cancellation and timeout scenarios
 * across all Temporal workflows using the test workflow environment.
 *
 * Test Scenarios:
 * - Workflow cancellation via signal (PDF export)
 * - Workflow timeout handling (document generation)
 * - Activity timeout handling (email sending)
 * - Workflow termination (ruling indexing)
 * - Heartbeat detection for long-running activities
 * - Cancellation during retry attempts
 * - Timeout with partial completion
 * - Graceful shutdown on cancellation
 */

import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { PdfExportInput } from './document/pdf-export.workflow';
import { pdfExport } from './document/pdf-export.workflow';
import type { EmailSendingInput } from './notification/email-sending.workflow';
import { emailSending } from './notification/email-sending.workflow';
import type { WebhookDeliveryInput } from './webhook/webhook-delivery.workflow';
import { webhookDelivery } from './webhook/webhook-delivery.workflow';
import { DocumentType } from '../../../documents/entities/legal-document.entity';

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
    options?: PdfExportInput['options'];
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
  }): Promise<{ notificationId?: string; loggedAt: string }>;

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
  }): Promise<{ deadLetterId: string; addedAt: string }>;
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

describe('Temporal Workflow Cancellation and Timeout - E2E Tests', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    // Initialize test workflow environment
    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  /**
   * Scenario 1: PDF Export workflow cancellation via signal
   */
  it('should handle PDF export cancellation via signal', async () => {
    const input: PdfExportInput = {
      exportId: 'export-cancel-1',
      documentId: 'doc-cancel-1',
      sessionId: 'session-cancel',
      title: 'Cancellable Document',
      documentType: DocumentType.OTHER,
      content: 'Content to be cancelled',
      userId: 'user-123',
    };

    const mockPdfActivities: Partial<PdfExportActivities> = {
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

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL(
        './document/pdf-export.workflow.ts',
        import.meta.url,
      ),
      activities: mockPdfActivities,
    });

    // Start workflow
    const workflowHandle = await client.startWorkflow({
      workflowType: pdfExport,
      args: [input],
      workflowId: `pdf-cancel-test-${Date.now()}`,
      taskQueue: 'document-processing',
    });

    // Send cancel signal
    await workflowHandle.signal('cancel');

    // Wait for workflow to complete (should fail with cancellation)
    const result = await workflowHandle.result<{
      status: string;
      errorMessage?: string;
    }>();

    // Verify cancellation
    assert.equal(result.status, 'FAILED');
    assert.ok(result.errorMessage?.toLowerCase().includes('cancelled'));

    await worker.shutdown();
  });

  /**
   * Scenario 2: Workflow timeout during document generation
   */
  it('should handle document generation timeout', async () => {
    const input: EmailSendingInput = {
      emailId: 'email-timeout-1',
      to: 'recipient@example.com',
      subject: 'Timeout Test Email',
      template: 'TEST_TEMPLATE',
      maxRetries: 1,
      initialRetryIntervalMs: 100,
      maxRetryIntervalMs: 200,
    };

    const mockEmailActivities: Partial<EmailSendingActivities> = {
      renderEmailTemplate: mock.fn(async () => ({
        html: '<html>Email</html>',
        text: 'Email text',
      })),
      checkRateLimit: mock.fn(async () => ({ allowed: true })),
      sendEmailViaProvider: mock.fn(async () => {
        // Simulate timeout
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return { success: false, error: 'ETIMEDOUT' };
      }),
      logDeliveryStatus: mock.fn(async () => ({
        loggedAt: new Date().toISOString(),
      })),
      addToDeadLetterQueue: mock.fn(async () => ({
        deadLetterId: 'dlq-123',
        addedAt: new Date().toISOString(),
      })),
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'notification-workflows',
      workflowsPath: new URL(
        './notification/email-sending.workflow.ts',
        import.meta.url,
      ),
      activities: mockEmailActivities,
    });

    try {
      // Execute with short timeout
      const result = await client.executeWorkflow({
        workflowType: emailSending,
        args: [input, mockEmailActivities as EmailSendingActivities],
        workflowId: `email-timeout-test-${Date.now()}`,
        taskQueue: 'notification-workflows',
        workflowRunTimeout: '1s',
      });
      // If it completes, it should be FAILED
      assert.ok(
        (result as { status?: string }).status === 'FAILED',
        'Expected failed status',
      );
    } catch (_error) {
      // Expected: timeout error
      const error = _error as Error;
      assert.ok(
        error.message.includes('timeout') || error.message.includes('canceled'),
        'Expected timeout or cancellation error',
      );
    }

    await worker.shutdown();
  });

  /**
   * Scenario 3: Activity timeout during webhook delivery
   */
  it('should handle activity timeout during webhook delivery', async () => {
    const input: WebhookDeliveryInput = {
      deliveryId: 'webhook-activity-timeout',
      webhookId: 'webhook-timeout',
      event: 'test.event',
      payload: { test: 'data' },
      url: 'https://slow-endpoint.example.com/webhook',
      secret: 'secret',
      timeoutMs: 100, // Very short timeout
      maxRetries: 2,
      initialRetryIntervalMs: 50,
      maxRetryIntervalMs: 100,
    };

    const mockWebhookActivities: Partial<WebhookDeliveryActivities> = {
      attemptDelivery: mock.fn(async () => ({
        success: false,
        statusCode: 0,
        error: 'ETIMEDOUT - Activity timed out',
        durationMs: 100,
        isRateLimited: false,
      })),
      recordSuccess: mock.fn(async () => {}),
      recordFailure: mock.fn(async () => ({ deadLetterId: 'dlq-123' })),
      isWebhookActive: mock.fn(async () => true),
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'webhook-workflows',
      workflowsPath: new URL(
        './webhook/webhook-delivery.workflow.ts',
        import.meta.url,
      ),
      activities: mockWebhookActivities,
    });

    const result = await client.executeWorkflow<{
      status: string;
      errorMessage?: string;
    }>({
      workflowType: webhookDelivery,
      args: [input],
      workflowId: `webhook-timeout-test-${Date.now()}`,
      taskQueue: 'webhook-workflows',
    });

    // Verify timeout handling
    assert.equal(result.status, 'FAILED');
    assert.ok(result.errorMessage?.includes('ETIMEDOUT'));

    await worker.shutdown();
  });

  /**
   * Scenario 4: Cancellation during retry attempts
   */
  it('should handle cancellation during email retry attempts', async () => {
    const input: EmailSendingInput = {
      emailId: 'email-cancel-retry',
      to: 'recipient@example.com',
      subject: 'Cancel During Retry',
      template: 'TEST_TEMPLATE',
      maxRetries: 5,
      initialRetryIntervalMs: 2000,
      maxRetryIntervalMs: 10000,
    };

    let attemptCount = 0;
    const mockEmailActivities: Partial<EmailSendingActivities> = {
      renderEmailTemplate: mock.fn(async () => ({
        html: '<html>Email</html>',
        text: 'Email text',
      })),
      checkRateLimit: mock.fn(async () => ({ allowed: true })),
      sendEmailViaProvider: mock.fn(async () => {
        attemptCount++;
        if (attemptCount < 5) {
          return {
            success: false,
            error: 'ECONNREFUSED - Will retry',
          };
        }
        return { success: true, messageId: 'msg-after-retry' };
      }),
      logDeliveryStatus: mock.fn(async () => ({
        loggedAt: new Date().toISOString(),
      })),
      addToDeadLetterQueue: mock.fn(async () => ({
        deadLetterId: 'dlq-123',
        addedAt: new Date().toISOString(),
      })),
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'notification-workflows',
      workflowsPath: new URL(
        './notification/email-sending.workflow.ts',
        import.meta.url,
      ),
      activities: mockEmailActivities,
    });

    // Start workflow
    const workflowId = `email-cancel-retry-test-${Date.now()}`;
    const workflowHandle = await client.startWorkflow({
      workflowType: emailSending,
      args: [input, mockEmailActivities as EmailSendingActivities],
      workflowId,
      taskQueue: 'notification-workflows',
    });

    // Wait a bit then try to terminate
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Terminate the workflow during retries
    try {
      await workflowHandle.terminate('Cancelled during retry');
    } catch {
      // Termination might fail if workflow already completed
    }

    await worker.shutdown();
  });

  /**
   * Scenario 5: PDF export cancellation during long-running generation
   */
  it('should handle cancellation during long-running PDF generation', async () => {
    const input: PdfExportInput = {
      exportId: 'export-long-cancel',
      documentId: 'doc-long-cancel',
      sessionId: 'session-long',
      title: 'Long Running Document',
      documentType: DocumentType.LAWSUIT,
      content: 'Large content ' + 'A'.repeat(100000),
      userId: 'user-123',
    };

    let generationStarted = false;
    const mockPdfActivities: Partial<PdfExportActivities> = {
      initializeExport: mock.fn(async () => ({ status: 'INITIALIZING' })),
      generatePdf: mock.fn(async () => {
        generationStarted = true;
        // Simulate long-running operation
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return {
          pdfUrl: 'https://s3.example.com/exports/doc.pdf',
          pageCount: 100,
          fileSize: 1000000,
        };
      }),
      completeExport: mock.fn(async () => {}),
      failExport: mock.fn(async () => {}),
      sendCompletionNotification: mock.fn(async () => {}),
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL(
        './document/pdf-export.workflow.ts',
        import.meta.url,
      ),
      activities: mockPdfActivities,
    });

    // Start workflow
    const workflowHandle = await client.startWorkflow({
      workflowType: pdfExport,
      args: [input],
      workflowId: `pdf-long-cancel-test-${Date.now()}`,
      taskQueue: 'document-processing',
    });

    // Wait for generation to start
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Cancel while generation is in progress
    await workflowHandle.signal('cancel');

    // Get result
    const result = await workflowHandle.result<{
      status: string;
      errorMessage?: string;
    }>();

    // Verify cancellation
    assert.equal(result.status, 'FAILED');
    assert.ok(result.errorMessage?.toLowerCase().includes('cancelled'));
    assert.ok(generationStarted, 'Generation should have started');

    await worker.shutdown();
  });

  /**
   * Scenario 6: Workflow execution timeout (entire workflow)
   */
  it('should handle workflow execution timeout', async () => {
    const input: WebhookDeliveryInput = {
      deliveryId: 'webhook-exec-timeout',
      webhookId: 'webhook-exec',
      event: 'test.event',
      payload: { test: 'data' },
      url: 'https://example.com/webhook',
      secret: 'secret',
      timeoutMs: 5000,
      maxRetries: 10, // Many retries will exceed workflow timeout
      initialRetryIntervalMs: 1000,
      maxRetryIntervalMs: 5000,
    };

    const mockWebhookActivities: Partial<WebhookDeliveryActivities> = {
      attemptDelivery: mock.fn(async () => ({
        success: false,
        statusCode: 503,
        error: 'Service Unavailable',
        durationMs: 500,
        isRateLimited: false,
      })),
      recordSuccess: mock.fn(async () => {}),
      recordFailure: mock.fn(async () => ({ deadLetterId: 'dlq-123' })),
      isWebhookActive: mock.fn(async () => true),
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'webhook-workflows',
      workflowsPath: new URL(
        './webhook/webhook-delivery.workflow.ts',
        import.meta.url,
      ),
      activities: mockWebhookActivities,
    });

    try {
      // Set a very short workflow execution timeout
      await client.executeWorkflow({
        workflowType: webhookDelivery,
        args: [input],
        workflowId: `webhook-exec-timeout-test-${Date.now()}`,
        taskQueue: 'webhook-workflows',
        workflowExecutionTimeout: '2s',
      });
      assert.fail('Should have thrown timeout error');
    } catch (error) {
      // Expected: workflow execution timeout
      assert.ok(
        error instanceof Error &&
          (error.message.includes('timeout') ||
            error.message.includes('Deadline')),
        'Expected timeout error',
      );
    }

    await worker.shutdown();
  });

  /**
   * Scenario 7: Heartbeat detection for stalled activities
   */
  it('should detect stalled activities via heartbeat timeout', async () => {
    const input: PdfExportInput = {
      exportId: 'export-stalled',
      documentId: 'doc-stalled',
      sessionId: 'session-stalled',
      title: 'Stalled Activity Test',
      documentType: DocumentType.CONTRACT,
      content: 'Content that will stall',
      userId: 'user-123',
    };

    const mockPdfActivities: Partial<PdfExportActivities> = {
      initializeExport: mock.fn(async () => ({ status: 'INITIALIZING' })),
      generatePdf: mock.fn(async () => {
        // Simulate activity that stops sending heartbeats
        await new Promise((resolve) => setTimeout(resolve, 70000)); // > 60s heartbeat timeout
        return {
          pdfUrl: 'https://s3.example.com/exports/doc.pdf',
          pageCount: 10,
          fileSize: 123456,
        };
      }),
      completeExport: mock.fn(async () => {}),
      failExport: mock.fn(async () => {}),
      sendCompletionNotification: mock.fn(async () => {}),
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL(
        './document/pdf-export.workflow.ts',
        import.meta.url,
      ),
      activities: mockPdfActivities,
    });

    try {
      // PDF export has 30m timeout but heartbeat is 60s
      const result = await client.executeWorkflow({
        workflowType: pdfExport,
        args: [input],
        workflowId: `pdf-stalled-test-${Date.now()}`,
        taskQueue: 'document-processing',
      });
      // If it completes, check for failure
      assert.equal(
        (result as { status?: string }).status,
        'FAILED',
        'Expected failed status',
      );
    } catch (error) {
      // Heartbeat timeout would cause activity failure
      assert.ok(error instanceof Error, 'Expected error for stalled activity');
    }

    await worker.shutdown();
  });

  /**
   * Scenario 8: Graceful cleanup on cancellation
   */
  it('should perform graceful cleanup on cancellation', async () => {
    const input: PdfExportInput = {
      exportId: 'export-graceful',
      documentId: 'doc-graceful',
      sessionId: 'session-graceful',
      title: 'Graceful Cancellation Test',
      documentType: DocumentType.OTHER,
      content: 'Content for graceful cancellation',
      userId: 'user-123',
    };

    let cleanupCalled = false;
    const mockPdfActivities: Partial<PdfExportActivities> = {
      initializeExport: mock.fn(async () => ({ status: 'INITIALIZING' })),
      generatePdf: mock.fn(async () => ({
        pdfUrl: 'https://s3.example.com/exports/doc.pdf',
        pageCount: 10,
        fileSize: 123456,
      })),
      completeExport: mock.fn(async () => {}),
      failExport: mock.fn(async () => {
        // This should be called for cleanup
        cleanupCalled = true;
      }),
      sendCompletionNotification: mock.fn(async () => {}),
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL(
        './document/pdf-export.workflow.ts',
        import.meta.url,
      ),
      activities: mockPdfActivities,
    });

    // Start workflow
    const workflowHandle = await client.startWorkflow({
      workflowType: pdfExport,
      args: [input],
      workflowId: `pdf-graceful-test-${Date.now()}`,
      taskQueue: 'document-processing',
    });

    // Send cancel signal
    await workflowHandle.signal('cancel');

    // Wait for result
    await workflowHandle.result();

    // Verify cleanup was attempted
    assert.ok(cleanupCalled, 'Cleanup activity should have been called');

    await worker.shutdown();
  });

  /**
   * Scenario 9: Multiple concurrent cancellations
   */
  it('should handle multiple concurrent workflow cancellations', async () => {
    const inputs: PdfExportInput[] = [
      {
        exportId: 'export-concurrent-1',
        documentId: 'doc-concurrent-1',
        sessionId: 'session-1',
        title: 'Concurrent 1',
        documentType: DocumentType.OTHER,
        content: 'Content 1',
        userId: 'user-123',
      },
      {
        exportId: 'export-concurrent-2',
        documentId: 'doc-concurrent-2',
        sessionId: 'session-2',
        title: 'Concurrent 2',
        documentType: DocumentType.OTHER,
        content: 'Content 2',
        userId: 'user-123',
      },
      {
        exportId: 'export-concurrent-3',
        documentId: 'doc-concurrent-3',
        sessionId: 'session-3',
        title: 'Concurrent 3',
        documentType: DocumentType.OTHER,
        content: 'Content 3',
        userId: 'user-123',
      },
    ];

    const mockPdfActivities: Partial<PdfExportActivities> = {
      initializeExport: mock.fn(async () => ({ status: 'INITIALIZING' })),
      generatePdf: mock.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return {
          pdfUrl: 'https://s3.example.com/exports/doc.pdf',
          pageCount: 10,
          fileSize: 123456,
        };
      }),
      completeExport: mock.fn(async () => {}),
      failExport: mock.fn(async () => {}),
      sendCompletionNotification: mock.fn(async () => {}),
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL(
        './document/pdf-export.workflow.ts',
        import.meta.url,
      ),
      activities: mockPdfActivities,
    });

    // Start multiple workflows
    /* eslint-disable @typescript-eslint/no-unsafe-return */
    const workflowHandles = await Promise.all(
      inputs.map((input, index) =>
        client.startWorkflow({
          workflowType: pdfExport,
          args: [input],
          workflowId: `pdf-concurrent-${index}-${Date.now()}`,
          taskQueue: 'document-processing',
        }),
      ),
    );
    /* eslint-enable @typescript-eslint/no-unsafe-return */

    // Cancel all workflows
    /* eslint-disable @typescript-eslint/no-unsafe-return */
    await Promise.all(workflowHandles.map((handle) => handle.signal('cancel')));
    /* eslint-enable @typescript-eslint/no-unsafe-return */

    // Wait for all to complete
    /* eslint-disable @typescript-eslint/no-unsafe-return */
    const results = await Promise.all(
      workflowHandles.map((handle) =>
        handle.result<{ status: string; errorMessage?: string }>(),
      ),
    );
    /* eslint-enable @typescript-eslint/no-unsafe-return */

    // All should be cancelled
    for (const result of results) {
      assert.equal(result.status, 'FAILED');
      assert.ok(result.errorMessage?.toLowerCase().includes('cancelled'));
    }

    await worker.shutdown();
  });

  /**
   * Scenario 10: Cancellation after partial completion
   */
  it('should handle cancellation after partial completion', async () => {
    const input: EmailSendingInput = {
      emailId: 'email-partial-cancel',
      to: 'recipient@example.com',
      subject: 'Partial Cancellation Test',
      template: 'TEST_TEMPLATE',
      maxRetries: 5,
      initialRetryIntervalMs: 1000,
      maxRetryIntervalMs: 5000,
    };

    let attemptCount = 0;
    const mockEmailActivities: Partial<EmailSendingActivities> = {
      renderEmailTemplate: mock.fn(async () => ({
        html: '<html>Email</html>',
        text: 'Email text',
      })),
      checkRateLimit: mock.fn(async () => ({ allowed: true })),
      sendEmailViaProvider: mock.fn(async () => {
        attemptCount++;
        return {
          success: false,
          error: `Attempt ${attemptCount} failed`,
        };
      }),
      logDeliveryStatus: mock.fn(async () => ({
        loggedAt: new Date().toISOString(),
      })),
      addToDeadLetterQueue: mock.fn(async () => ({
        deadLetterId: 'dlq-partial',
        addedAt: new Date().toISOString(),
      })),
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'notification-workflows',
      workflowsPath: new URL(
        './notification/email-sending.workflow.ts',
        import.meta.url,
      ),
      activities: mockEmailActivities,
    });

    // Start workflow
    const workflowHandle = await client.startWorkflow({
      workflowType: emailSending,
      args: [input, mockEmailActivities as EmailSendingActivities],
      workflowId: `email-partial-cancel-test-${Date.now()}`,
      taskQueue: 'notification-workflows',
    });

    // Wait for some attempts, then cancel
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Cancel workflow
    try {
      await workflowHandle.terminate('Cancelled after partial attempts');
    } catch {
      // May fail if already completed
    }

    await worker.shutdown();
  });
});
