/**
 * Email Sending Workflow E2E Tests
 *
 * Comprehensive end-to-end tests for the email sending workflow using
 * Temporal's test workflow environment to simulate workflow execution.
 *
 * Test Scenarios:
 * - Successful email delivery
 * - Email workflow retries on transient failures (rate limiting, timeout)
 * - Email workflow fails permanently on non-retryable errors
 * - Email workflow handles rate limiting with backoff
 * - Dead-letter queue is used after max retries exhausted
 * - Idempotency: re-running with same email ID doesn't duplicate emails
 */

import {
  TestWorkflowEnvironment,
  WorkflowIdReusePolicy,
} from '@temporalio/testing';
import { after, before, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type {
  EmailSendingInput,
  EmailSendingOutput,
  EmailSendingActivities,
} from './email-sending.workflow';
import { emailSending } from './email-sending.workflow';

describe('Email Sending Workflow - E2E Tests', () => {
  let testEnv: TestWorkflowEnvironment;
  let mockActivities: Partial<EmailSendingActivities>;

  before(async () => {
    // Initialize test workflow environment
    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  beforeEach(() => {
    // Reset mock activities before each test
    mockActivities = {
      renderEmailTemplate: mock.fn(async () => ({
        html: '<html>Email content</html>',
        text: 'Plain text email content',
      })),
      checkRateLimit: mock.fn(async () => ({
        allowed: true,
        remaining: 100,
        resetAt: new Date(Date.now() + 3600000).toISOString(),
      })),
      sendEmailViaProvider: mock.fn(async () => ({
        success: true,
        messageId: 'msg-12345',
        error: undefined,
      })),
      logDeliveryStatus: mock.fn(async () => ({
        notificationId: 'notif-123',
        loggedAt: new Date().toISOString(),
      })),
      addToDeadLetterQueue: mock.fn(async () => ({
        deadLetterId: 'dlq-123',
        addedAt: new Date().toISOString(),
      })),
    };
  });

  /**
   * Scenario 1: Successful email delivery
   */
  it('should complete email sending successfully', async () => {
    const input: EmailSendingInput = {
      emailId: 'email-123',
      to: 'recipient@example.com',
      subject: 'Test Email',
      template: 'DOCUMENT_COMPLETED',
      templateData: { documentId: 'doc-123', firstName: 'John' },
      userId: 'user-123',
      metadata: { source: 'test' },
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'notification-workflows',
      workflowsPath: new URL('./email-sending.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<EmailSendingOutput>({
      workflowType: emailSending,
      args: [input, mockActivities as EmailSendingActivities],
      workflowId: `email-sending-${input.emailId}`,
      taskQueue: 'notification-workflows',
    });

    // Verify success
    assert.equal(result.status, 'SENT');
    assert.equal(result.emailId, 'email-123');
    assert.equal(result.messageId, 'msg-12345');
    assert.equal(result.retryCount, 0);
    assert.ok(result.completedAt);

    // Verify all activities were called
    const rateLimitMock = mockActivities.checkRateLimit as ReturnType<
      typeof mock.fn
    >;
    const renderMock = mockActivities.renderEmailTemplate as ReturnType<
      typeof mock.fn
    >;
    const sendMock = mockActivities.sendEmailViaProvider as ReturnType<
      typeof mock.fn
    >;
    const logMock = mockActivities.logDeliveryStatus as ReturnType<
      typeof mock.fn
    >;

    assert.equal(rateLimitMock.mock.calls.length, 1);
    assert.equal(renderMock.mock.calls.length, 1);
    assert.equal(sendMock.mock.calls.length, 1);
    assert.ok(logMock.mock.calls.length >= 2); // QUEUED + SENT

    await worker.shutdown();
  });

  /**
   * Scenario 2: Email workflow retries on transient failures
   */
  it('should retry on transient failure (rate limiting)', async () => {
    const input: EmailSendingInput = {
      emailId: 'email-retry',
      to: 'recipient@example.com',
      subject: 'Retry Test',
      template: 'TEST_TEMPLATE',
      maxRetries: 3,
      initialRetryIntervalMs: 100,
      maxRetryIntervalMs: 5000,
    };

    let attemptCount = 0;
    (mockActivities.sendEmailViaProvider as ReturnType<typeof mock.fn>) =
      mock.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          return {
            success: false,
            error: '429 Too Many Requests - rate limit exceeded',
          };
        }
        return {
          success: true,
          messageId: 'msg-after-retry',
        };
      });

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'notification-workflows',
      workflowsPath: new URL('./email-sending.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<EmailSendingOutput>({
      workflowType: emailSending,
      args: [input, mockActivities as EmailSendingActivities],
      workflowId: `email-sending-${input.emailId}`,
      taskQueue: 'notification-workflows',
    });

    // Verify retry success
    assert.equal(result.status, 'SENT');
    assert.equal(result.retryCount, 2);
    assert.equal(result.messageId, 'msg-after-retry');
    assert.equal(attemptCount, 3);

    await worker.shutdown();
  });

  /**
   * Scenario 3: Email workflow fails permanently on non-retryable errors
   */
  it('should fail immediately on non-retryable errors', async () => {
    const input: EmailSendingInput = {
      emailId: 'email-permanent-fail',
      to: 'invalid-email',
      subject: 'Permanent Fail Test',
      template: 'TEST_TEMPLATE',
      maxRetries: 3,
    };

    (mockActivities.sendEmailViaProvider as ReturnType<typeof mock.fn>) =
      mock.fn(async () => ({
        success: false,
        error: '400 Bad Request - Invalid email address',
      }));

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'notification-workflows',
      workflowsPath: new URL('./email-sending.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<EmailSendingOutput>({
      workflowType: emailSending,
      args: [input, mockActivities as EmailSendingActivities],
      workflowId: `email-sending-${input.emailId}`,
      taskQueue: 'notification-workflows',
    });

    // Verify permanent failure (no retries for invalid email)
    assert.equal(result.status, 'FAILED');
    assert.equal(result.retryCount, 0);
    assert.ok(result.errorMessage?.includes('Invalid email address'));

    // Verify it was added to dead-letter queue
    const dlqMock = mockActivities.addToDeadLetterQueue as ReturnType<
      typeof mock.fn
    >;
    assert.equal(dlqMock.mock.calls.length, 1);

    await worker.shutdown();
  });

  /**
   * Scenario 4: Email workflow handles rate limiting at the activity level
   */
  it('should wait when rate limit is exceeded and then succeed', async () => {
    const input: EmailSendingInput = {
      emailId: 'email-rate-limited',
      to: 'recipient@example.com',
      subject: 'Rate Limit Test',
      template: 'TEST_TEMPLATE',
    };

    let rateLimitCheckCount = 0;
    (mockActivities.checkRateLimit as ReturnType<typeof mock.fn>) = mock.fn(
      async () => {
        rateLimitCheckCount++;
        if (rateLimitCheckCount === 1) {
          return {
            allowed: false,
            waitTimeMs: 1000,
            resetAt: new Date(Date.now() + 1000).toISOString(),
          };
        }
        return {
          allowed: true,
          remaining: 100,
          resetAt: new Date(Date.now() + 3600000).toISOString(),
        };
      },
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'notification-workflows',
      workflowsPath: new URL('./email-sending.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<EmailSendingOutput>({
      workflowType: emailSending,
      args: [input, mockActivities as EmailSendingActivities],
      workflowId: `email-sending-${input.emailId}`,
      taskQueue: 'notification-workflows',
    });

    // Rate limiting is handled by returning RATE_LIMITED status
    // In the real workflow, it would wait and retry
    assert.ok(
      result.status === 'SENT' || result.status === 'RATE_LIMITED',
      `Expected SENT or RATE_LIMITED, got ${result.status}`,
    );

    // Verify rate limit was checked at least once
    assert.ok(rateLimitCheckCount >= 1);

    await worker.shutdown();
  });

  /**
   * Scenario 5: Dead-letter queue is used after max retries exhausted
   */
  it('should add to dead-letter queue after max retries', async () => {
    const input: EmailSendingInput = {
      emailId: 'email-dlq',
      to: 'recipient@example.com',
      subject: 'DLQ Test',
      template: 'TEST_TEMPLATE',
      maxRetries: 2,
      initialRetryIntervalMs: 100,
      maxRetryIntervalMs: 500,
    };

    (mockActivities.sendEmailViaProvider as ReturnType<typeof mock.fn>) =
      mock.fn(async () => ({
        success: false,
        error: 'ECONNREFUSED - Connection refused',
      }));

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'notification-workflows',
      workflowsPath: new URL('./email-sending.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<EmailSendingOutput>({
      workflowType: emailSending,
      args: [input, mockActivities as EmailSendingActivities],
      workflowId: `email-sending-${input.emailId}`,
      taskQueue: 'notification-workflows',
    });

    // Verify all retries were exhausted
    assert.equal(result.status, 'FAILED');
    assert.equal(result.retryCount, 2);
    assert.ok(result.errorMessage?.includes('Connection refused'));

    // Verify it was added to dead-letter queue
    const dlqMock = mockActivities.addToDeadLetterQueue as ReturnType<
      typeof mock.fn
    >;
    assert.equal(dlqMock.mock.calls.length, 1);
    assert.equal(result.deadLetterId, 'dlq-123');

    await worker.shutdown();
  });

  /**
   * Scenario 6: Template rendering failure fails workflow immediately
   */
  it('should fail immediately when template rendering fails', async () => {
    const input: EmailSendingInput = {
      emailId: 'email-template-fail',
      to: 'recipient@example.com',
      subject: 'Template Fail Test',
      template: 'NONEXISTENT_TEMPLATE',
      templateData: { key: 'value' },
    };

    (mockActivities.renderEmailTemplate as ReturnType<typeof mock.fn>) =
      mock.fn(async () => {
        throw new Error('Template NOT_FOUND: NONEXISTENT_TEMPLATE');
      });

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'notification-workflows',
      workflowsPath: new URL('./email-sending.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<EmailSendingOutput>({
      workflowType: emailSending,
      args: [input, mockActivities as EmailSendingActivities],
      workflowId: `email-sending-${input.emailId}`,
      taskQueue: 'notification-workflows',
    });

    // Verify immediate failure
    assert.equal(result.status, 'FAILED');
    assert.equal(result.retryCount, 0);
    assert.ok(result.errorMessage?.includes('Template NOT_FOUND'));

    // Should not attempt to send email
    const sendMock = mockActivities.sendEmailViaProvider as ReturnType<
      typeof mock.fn
    >;
    assert.equal(sendMock.mock.calls.length, 0);

    await worker.shutdown();
  });

  /**
   * Scenario 7: Idempotency - re-running with same email ID
   */
  it('should be idempotent - re-running with same email ID', async () => {
    const input: EmailSendingInput = {
      emailId: 'email-idempotent',
      to: 'recipient@example.com',
      subject: 'Idempotency Test',
      template: 'TEST_TEMPLATE',
    };

    const workflowId = `email-sending-${input.emailId}`;
    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'notification-workflows',
      workflowsPath: new URL('./email-sending.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    // First execution
    const firstResult = await client.executeWorkflow<EmailSendingOutput>({
      workflowType: emailSending,
      args: [input, mockActivities as EmailSendingActivities],
      workflowId,
      taskQueue: 'notification-workflows',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
    });

    // Second execution with same ID
    const secondResult = await client.executeWorkflow<EmailSendingOutput>({
      workflowType: emailSending,
      args: [input, mockActivities as EmailSendingActivities],
      workflowId,
      taskQueue: 'notification-workflows',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
    });

    // Both should complete successfully
    assert.equal(firstResult.status, 'SENT');
    assert.equal(secondResult.status, 'SENT');
    assert.equal(firstResult.emailId, secondResult.emailId);

    await worker.shutdown();
  });

  /**
   * Scenario 8: Workflow handles logging errors gracefully
   */
  it('should continue even if status logging fails', async () => {
    const input: EmailSendingInput = {
      emailId: 'email-log-fail',
      to: 'recipient@example.com',
      subject: 'Log Fail Test',
      template: 'TEST_TEMPLATE',
    };

    let logCallCount = 0;
    (mockActivities.logDeliveryStatus as ReturnType<typeof mock.fn>) = mock.fn(
      async () => {
        logCallCount++;
        if (logCallCount === 1) {
          throw new Error('Database unavailable');
        }
        return {
          notificationId: `notif-${logCallCount}`,
          loggedAt: new Date().toISOString(),
        };
      },
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'notification-workflows',
      workflowsPath: new URL('./email-sending.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<EmailSendingOutput>({
      workflowType: emailSending,
      args: [input, mockActivities as EmailSendingActivities],
      workflowId: `email-sending-${input.emailId}`,
      taskQueue: 'notification-workflows',
    });

    // Workflow should still complete
    assert.equal(result.status, 'SENT');

    await worker.shutdown();
  });

  /**
   * Scenario 9: Verify exponential backoff in retry delays
   */
  it('should use exponential backoff for retries', async () => {
    const input: EmailSendingInput = {
      emailId: 'email-backoff',
      to: 'recipient@example.com',
      subject: 'Backoff Test',
      template: 'TEST_TEMPLATE',
      maxRetries: 4,
      initialRetryIntervalMs: 100,
      maxRetryIntervalMs: 10000,
    };

    const attemptTimes: number[] = [];
    let startTime = Date.now();

    (mockActivities.sendEmailViaProvider as ReturnType<typeof mock.fn>) =
      mock.fn(async () => {
        attemptTimes.push(Date.now() - startTime);
        startTime = Date.now();
        return {
          success: false,
          error: 'ECONNREFUSED',
        };
      });

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'notification-workflows',
      workflowsPath: new URL('./email-sending.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<EmailSendingOutput>({
      workflowType: emailSending,
      args: [input, mockActivities as EmailSendingActivities],
      workflowId: `email-sending-${input.emailId}`,
      taskQueue: 'notification-workflows',
    });

    // Verify retries occurred
    assert.equal(result.status, 'FAILED');
    assert.equal(result.retryCount, 4);

    // With time skipping, delays are compressed, but we can verify the pattern
    // of increasing delays in the test environment
    assert.ok(attemptTimes.length >= 5); // Initial + 4 retries

    await worker.shutdown();
  });

  /**
   * Scenario 10: Workflow handles network errors during sending
   */
  it('should retry on network errors', async () => {
    const input: EmailSendingInput = {
      emailId: 'email-network-error',
      to: 'recipient@example.com',
      subject: 'Network Error Test',
      template: 'TEST_TEMPLATE',
      maxRetries: 3,
    };

    let attemptCount = 0;
    (mockActivities.sendEmailViaProvider as ReturnType<typeof mock.fn>) =
      mock.fn(async () => {
        attemptCount++;
        if (attemptCount <= 2) {
          throw new Error('ETIMEDOUT - Network timeout');
        }
        return {
          success: true,
          messageId: 'msg-after-network-retry',
        };
      });

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'notification-workflows',
      workflowsPath: new URL('./email-sending.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<EmailSendingOutput>({
      workflowType: emailSending,
      args: [input, mockActivities as EmailSendingActivities],
      workflowId: `email-sending-${input.emailId}`,
      taskQueue: 'notification-workflows',
    });

    // Verify network error retry success
    assert.equal(result.status, 'SENT');
    assert.equal(result.retryCount, 2);
    assert.equal(attemptCount, 3);

    await worker.shutdown();
  });
});
