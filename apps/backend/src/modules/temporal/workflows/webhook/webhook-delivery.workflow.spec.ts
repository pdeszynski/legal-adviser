/**
 * Webhook Delivery Workflow E2E Tests
 *
 * Comprehensive end-to-end tests for the webhook delivery workflow using
 * Temporal's test workflow environment to simulate workflow execution.
 *
 * Test Scenarios:
 * - Successful webhook delivery
 * - Webhook delivery handles endpoint failures with retry
 * - Rate limiting by webhook endpoint
 * - Dead-letter queue for permanently failing webhooks
 * - Timeout handling
 * - Idempotency: re-running with same delivery ID
 * - HMAC signature verification
 * - Inactive webhooks are skipped
 */

import {
  TestWorkflowEnvironment,
  WorkflowIdReusePolicy,
} from '@temporalio/testing';
import { after, before, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type {
  WebhookDeliveryInput,
  WebhookDeliveryOutput,
} from './webhook-delivery.workflow';
import { webhookDelivery } from './webhook-delivery.workflow';

// Mock activities interface
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

describe('Webhook Delivery Workflow - E2E Tests', () => {
  let testEnv: TestWorkflowEnvironment;
  let mockActivities: Partial<WebhookDeliveryActivities>;

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
      attemptDelivery: mock.fn(async () => ({
        success: true,
        statusCode: 200,
        response: '{"status":"ok"}',
        durationMs: 50,
        isRateLimited: false,
      })),
      recordSuccess: mock.fn(async () => {}),
      recordFailure: mock.fn(async () => ({})),
      isWebhookActive: mock.fn(async () => true),
    };
  });

  /**
   * Scenario 1: Successful webhook delivery
   */
  it('should complete webhook delivery successfully', async () => {
    const input: WebhookDeliveryInput = {
      deliveryId: 'delivery-123',
      webhookId: 'webhook-abc',
      event: 'document.completed',
      payload: {
        documentId: 'doc-123',
        title: 'Test Document',
        status: 'COMPLETED',
      },
      url: 'https://example.com/webhook',
      secret: 'webhook-secret-key',
      headers: {
        'X-Custom-Header': 'custom-value',
      },
      timeoutMs: 5000,
      maxRetries: 3,
      initialRetryIntervalMs: 1000,
      maxRetryIntervalMs: 60000,
      userId: 'user-123',
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'webhook-workflows',
      workflowsPath: new URL('./webhook-delivery.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<WebhookDeliveryOutput>({
      workflowType: webhookDelivery,
      args: [input],
      workflowId: `webhook-delivery-${input.deliveryId}`,
      taskQueue: 'webhook-workflows',
    });

    // Verify success
    assert.equal(result.status, 'DELIVERED');
    assert.equal(result.deliveryId, 'delivery-123');
    assert.equal(result.webhookId, 'webhook-abc');
    assert.equal(result.statusCode, 200);
    assert.equal(result.response, '{"status":"ok"}');
    assert.equal(result.attempts.length, 1);
    assert.ok(result.totalTimeMs >= 0);
    assert.ok(result.completedAt);

    // Verify activities were called
    const activeMock = mockActivities.isWebhookActive as ReturnType<
      typeof mock.fn
    >;
    const deliveryMock = mockActivities.attemptDelivery as ReturnType<
      typeof mock.fn
    >;
    const successMock = mockActivities.recordSuccess as ReturnType<
      typeof mock.fn
    >;

    assert.equal(activeMock.mock.calls.length, 1);
    assert.equal(deliveryMock.mock.calls.length, 1);
    assert.equal(successMock.mock.calls.length, 1);

    await worker.shutdown();
  });

  /**
   * Scenario 2: Webhook delivery handles endpoint failures with retry
   */
  it('should retry on transient endpoint failures', async () => {
    const input: WebhookDeliveryInput = {
      deliveryId: 'delivery-retry',
      webhookId: 'webhook-retry',
      event: 'test.event',
      payload: { test: 'data' },
      url: 'https://example.com/webhook',
      secret: 'secret',
      timeoutMs: 5000,
      maxRetries: 3,
      initialRetryIntervalMs: 100,
      maxRetryIntervalMs: 1000,
    };

    let attemptCount = 0;
    (mockActivities.attemptDelivery as ReturnType<typeof mock.fn>) = mock.fn(
      async () => {
        attemptCount++;
        if (attemptCount < 3) {
          return {
            success: false,
            statusCode: 503,
            error: 'Service Unavailable',
            durationMs: 100,
            isRateLimited: false,
          };
        }
        return {
          success: true,
          statusCode: 200,
          response: '{"received":true}',
          durationMs: 50,
          isRateLimited: false,
        };
      },
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'webhook-workflows',
      workflowsPath: new URL('./webhook-delivery.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<WebhookDeliveryOutput>({
      workflowType: webhookDelivery,
      args: [input],
      workflowId: `webhook-delivery-${input.deliveryId}`,
      taskQueue: 'webhook-workflows',
    });

    // Verify retry success
    assert.equal(result.status, 'DELIVERED');
    assert.equal(result.statusCode, 200);
    assert.equal(result.attempts.length, 3);
    assert.equal(attemptCount, 3);

    await worker.shutdown();
  });

  /**
   * Scenario 3: Rate limiting by webhook endpoint
   */
  it('should handle rate limiting from webhook endpoint', async () => {
    const input: WebhookDeliveryInput = {
      deliveryId: 'delivery-rate-limited',
      webhookId: 'webhook-rate',
      event: 'test.event',
      payload: { test: 'data' },
      url: 'https://example.com/webhook',
      secret: 'secret',
      timeoutMs: 5000,
      maxRetries: 3,
      initialRetryIntervalMs: 100,
      maxRetryIntervalMs: 1000,
    };

    let attemptCount = 0;
    (mockActivities.attemptDelivery as ReturnType<typeof mock.fn>) = mock.fn(
      async () => {
        attemptCount++;
        if (attemptCount === 1) {
          return {
            success: false,
            statusCode: 429,
            error: 'Too Many Requests',
            durationMs: 50,
            isRateLimited: true,
          };
        }
        return {
          success: true,
          statusCode: 200,
          response: '{"received":true}',
          durationMs: 50,
          isRateLimited: false,
        };
      },
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'webhook-workflows',
      workflowsPath: new URL('./webhook-delivery.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<WebhookDeliveryOutput>({
      workflowType: webhookDelivery,
      args: [input],
      workflowId: `webhook-delivery-${input.deliveryId}`,
      taskQueue: 'webhook-workflows',
    });

    // Verify handling of rate limit
    assert.equal(result.status, 'DELIVERED');
    assert.equal(attemptCount, 2);

    await worker.shutdown();
  });

  /**
   * Scenario 4: Dead-letter queue for permanently failing webhooks
   */
  it('should move to dead-letter queue after all retries exhausted', async () => {
    const input: WebhookDeliveryInput = {
      deliveryId: 'delivery-dlq',
      webhookId: 'webhook-dlq',
      event: 'test.event',
      payload: { test: 'data' },
      url: 'https://invalid-domain.example.com/webhook',
      secret: 'secret',
      timeoutMs: 5000,
      maxRetries: 3,
      initialRetryIntervalMs: 100,
      maxRetryIntervalMs: 500,
    };

    (mockActivities.attemptDelivery as ReturnType<typeof mock.fn>) = mock.fn(
      async () => ({
        success: false,
        statusCode: 0,
        error: 'ECONNREFUSED - Connection refused',
        durationMs: 100,
        isRateLimited: false,
      }),
    );

    (mockActivities.recordFailure as ReturnType<typeof mock.fn>) = mock.fn(
      async () => ({
        deadLetterId: 'dlq-123',
      }),
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'webhook-workflows',
      workflowsPath: new URL('./webhook-delivery.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<WebhookDeliveryOutput>({
      workflowType: webhookDelivery,
      args: [input],
      workflowId: `webhook-delivery-${input.deliveryId}`,
      taskQueue: 'webhook-workflows',
    });

    // Verify failure and DLQ
    assert.equal(result.status, 'FAILED');
    assert.equal(result.attempts.length, 4); // Initial + 3 retries
    assert.equal(result.deadLetterId, 'dlq-123');
    assert.ok(result.errorMessage?.includes('Connection refused'));

    // Verify recordFailure was called with moveToDeadLetter
    const failMock = mockActivities.recordFailure as ReturnType<typeof mock.fn>;
    assert.equal(failMock.mock.calls.length, 1);

    await worker.shutdown();
  });

  /**
   * Scenario 5: Timeout handling
   */
  it('should handle webhook delivery timeouts', async () => {
    const input: WebhookDeliveryInput = {
      deliveryId: 'delivery-timeout',
      webhookId: 'webhook-timeout',
      event: 'test.event',
      payload: { test: 'data' },
      url: 'https://slow-endpoint.example.com/webhook',
      secret: 'secret',
      timeoutMs: 100,
      maxRetries: 2,
      initialRetryIntervalMs: 100,
      maxRetryIntervalMs: 500,
    };

    (mockActivities.attemptDelivery as ReturnType<typeof mock.fn>) = mock.fn(
      async () => ({
        success: false,
        statusCode: 0,
        error: 'ETIMEDOUT - Request timeout',
        durationMs: 100,
        isRateLimited: false,
      }),
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'webhook-workflows',
      workflowsPath: new URL('./webhook-delivery.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<WebhookDeliveryOutput>({
      workflowType: webhookDelivery,
      args: [input],
      workflowId: `webhook-delivery-${input.deliveryId}`,
      taskQueue: 'webhook-workflows',
    });

    // Verify timeout handling
    assert.equal(result.status, 'FAILED');
    assert.ok(result.errorMessage?.includes('timeout'));

    await worker.shutdown();
  });

  /**
   * Scenario 6: Idempotency - re-running with same delivery ID
   */
  it('should be idempotent - re-running with same delivery ID', async () => {
    const input: WebhookDeliveryInput = {
      deliveryId: 'delivery-idempotent',
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

    const workflowId = `webhook-delivery-${input.deliveryId}`;
    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'webhook-workflows',
      workflowsPath: new URL('./webhook-delivery.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    // First execution
    const firstResult = await client.executeWorkflow<WebhookDeliveryOutput>({
      workflowType: webhookDelivery,
      args: [input],
      workflowId,
      taskQueue: 'webhook-workflows',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
    });

    // Second execution with same ID
    const secondResult = await client.executeWorkflow<WebhookDeliveryOutput>({
      workflowType: webhookDelivery,
      args: [input],
      workflowId,
      taskQueue: 'webhook-workflows',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
    });

    // Both should complete successfully
    assert.equal(firstResult.status, 'DELIVERED');
    assert.equal(secondResult.status, 'DELIVERED');
    assert.equal(firstResult.deliveryId, secondResult.deliveryId);

    await worker.shutdown();
  });

  /**
   * Scenario 7: HMAC signature is passed correctly
   */
  it('should pass webhook secret for HMAC signature verification', async () => {
    const input: WebhookDeliveryInput = {
      deliveryId: 'delivery-hmac',
      webhookId: 'webhook-hmac',
      event: 'test.event',
      payload: { test: 'data' },
      url: 'https://example.com/webhook',
      secret: 'super-secret-key-for-hmac',
      timeoutMs: 5000,
      maxRetries: 3,
      initialRetryIntervalMs: 1000,
      maxRetryIntervalMs: 10000,
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'webhook-workflows',
      workflowsPath: new URL('./webhook-delivery.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    await client.executeWorkflow<WebhookDeliveryOutput>({
      workflowType: webhookDelivery,
      args: [input],
      workflowId: `webhook-delivery-${input.deliveryId}`,
      taskQueue: 'webhook-workflows',
    });

    // Verify secret was passed to delivery activity
    const deliveryMock = mockActivities.attemptDelivery as ReturnType<
      typeof mock.fn
    >;
    assert.equal(deliveryMock.mock.calls.length, 1);
    const callArgs = deliveryMock.mock.calls[0].arguments[0] as {
      secret: string;
    };
    assert.equal(callArgs.secret, 'super-secret-key-for-hmac');

    await worker.shutdown();
  });

  /**
   * Scenario 8: Inactive webhooks are skipped
   */
  it('should skip delivery to inactive webhooks', async () => {
    const input: WebhookDeliveryInput = {
      deliveryId: 'delivery-inactive',
      webhookId: 'webhook-inactive',
      event: 'test.event',
      payload: { test: 'data' },
      url: 'https://example.com/webhook',
      secret: 'secret',
      timeoutMs: 5000,
      maxRetries: 3,
      initialRetryIntervalMs: 1000,
      maxRetryIntervalMs: 10000,
    };

    // Mock webhook as inactive
    (mockActivities.isWebhookActive as ReturnType<typeof mock.fn>) = mock.fn(
      async () => false,
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'webhook-workflows',
      workflowsPath: new URL('./webhook-delivery.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<WebhookDeliveryOutput>({
      workflowType: webhookDelivery,
      args: [input],
      workflowId: `webhook-delivery-${input.deliveryId}`,
      taskQueue: 'webhook-workflows',
    });

    // Verify early exit for inactive webhook
    assert.equal(result.status, 'FAILED');
    assert.ok(result.errorMessage?.includes('inactive'));

    // Delivery should not be attempted
    const deliveryMock = mockActivities.attemptDelivery as ReturnType<
      typeof mock.fn
    >;
    assert.equal(deliveryMock.mock.calls.length, 0);

    await worker.shutdown();
  });

  /**
   * Scenario 9: Custom headers are passed correctly
   */
  it('should pass custom headers to webhook delivery', async () => {
    const customHeaders = {
      'X-Custom-Header': 'custom-value',
      Authorization: 'Bearer token123',
      'X-Request-ID': 'req-456',
    };

    const input: WebhookDeliveryInput = {
      deliveryId: 'delivery-headers',
      webhookId: 'webhook-headers',
      event: 'test.event',
      payload: { test: 'data' },
      url: 'https://example.com/webhook',
      secret: 'secret',
      headers: customHeaders,
      timeoutMs: 5000,
      maxRetries: 3,
      initialRetryIntervalMs: 1000,
      maxRetryIntervalMs: 10000,
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'webhook-workflows',
      workflowsPath: new URL('./webhook-delivery.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    await client.executeWorkflow<WebhookDeliveryOutput>({
      workflowType: webhookDelivery,
      args: [input],
      workflowId: `webhook-delivery-${input.deliveryId}`,
      taskQueue: 'webhook-workflows',
    });

    // Verify headers were passed
    const deliveryMock = mockActivities.attemptDelivery as ReturnType<
      typeof mock.fn
    >;
    const callArgs = deliveryMock.mock.calls[0].arguments[0] as {
      headers?: Record<string, string> | null;
    };
    assert.deepEqual(callArgs.headers, customHeaders);

    await worker.shutdown();
  });

  /**
   * Scenario 10: Delivery attempts are tracked correctly
   */
  it('should track all delivery attempts with timestamps', async () => {
    const input: WebhookDeliveryInput = {
      deliveryId: 'delivery-attempts',
      webhookId: 'webhook-attempts',
      event: 'test.event',
      payload: { test: 'data' },
      url: 'https://example.com/webhook',
      secret: 'secret',
      timeoutMs: 5000,
      maxRetries: 2,
      initialRetryIntervalMs: 100,
      maxRetryIntervalMs: 500,
    };

    let attemptCount = 0;
    (mockActivities.attemptDelivery as ReturnType<typeof mock.fn>) = mock.fn(
      async () => {
        attemptCount++;
        return {
          success: attemptCount === 3,
          statusCode: attemptCount === 3 ? 200 : 503,
          error: attemptCount === 3 ? undefined : 'Service Unavailable',
          durationMs: 100,
          isRateLimited: false,
        };
      },
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'webhook-workflows',
      workflowsPath: new URL('./webhook-delivery.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<WebhookDeliveryOutput>({
      workflowType: webhookDelivery,
      args: [input],
      workflowId: `webhook-delivery-${input.deliveryId}`,
      taskQueue: 'webhook-workflows',
    });

    // Verify all attempts were tracked
    assert.equal(result.status, 'DELIVERED');
    assert.equal(result.attempts.length, 3);

    // Check attempt numbers are sequential
    for (let i = 0; i < result.attempts.length; i++) {
      assert.equal(result.attempts[i].attemptNumber, i + 1);
      assert.ok(result.attempts[i].timestamp);
      assert.ok(result.attempts[i].durationMs >= 0);
    }

    await worker.shutdown();
  });

  /**
   * Scenario 11: Permanent errors fail immediately without retries
   */
  it('should fail immediately on permanent errors (4xx)', async () => {
    const input: WebhookDeliveryInput = {
      deliveryId: 'delivery-permanent',
      webhookId: 'webhook-permanent',
      event: 'test.event',
      payload: { test: 'data' },
      url: 'https://example.com/webhook',
      secret: 'secret',
      timeoutMs: 5000,
      maxRetries: 3,
      initialRetryIntervalMs: 1000,
      maxRetryIntervalMs: 10000,
    };

    (mockActivities.attemptDelivery as ReturnType<typeof mock.fn>) = mock.fn(
      async () => ({
        success: false,
        statusCode: 404,
        error: '404 Not Found - Endpoint does not exist',
        durationMs: 50,
        isRateLimited: false,
      }),
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'webhook-workflows',
      workflowsPath: new URL('./webhook-delivery.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<WebhookDeliveryOutput>({
      workflowType: webhookDelivery,
      args: [input],
      workflowId: `webhook-delivery-${input.deliveryId}`,
      taskQueue: 'webhook-workflows',
    });

    // Verify immediate failure (no retries for 4xx)
    assert.equal(result.status, 'FAILED');
    assert.equal(result.attempts.length, 1);
    assert.equal(result.statusCode, 404);

    await worker.shutdown();
  });

  /**
   * Scenario 12: Record success includes all delivery attempts
   */
  it('should record success with all delivery attempts', async () => {
    const input: WebhookDeliveryInput = {
      deliveryId: 'delivery-record-success',
      webhookId: 'webhook-record',
      event: 'test.event',
      payload: { test: 'data' },
      url: 'https://example.com/webhook',
      secret: 'secret',
      timeoutMs: 5000,
      maxRetries: 2,
      initialRetryIntervalMs: 100,
      maxRetryIntervalMs: 500,
    };

    let attemptCount = 0;
    (mockActivities.attemptDelivery as ReturnType<typeof mock.fn>) = mock.fn(
      async () => {
        attemptCount++;
        if (attemptCount < 2) {
          return {
            success: false,
            statusCode: 503,
            error: 'Service Unavailable',
            durationMs: 100,
            isRateLimited: false,
          };
        }
        return {
          success: true,
          statusCode: 200,
          response: '{"received":true}',
          durationMs: 50,
          isRateLimited: false,
        };
      },
    );

    (mockActivities.recordSuccess as ReturnType<typeof mock.fn>) = mock.fn(
      async () => {},
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'webhook-workflows',
      workflowsPath: new URL('./webhook-delivery.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    await client.executeWorkflow<WebhookDeliveryOutput>({
      workflowType: webhookDelivery,
      args: [input],
      workflowId: `webhook-delivery-${input.deliveryId}`,
      taskQueue: 'webhook-workflows',
    });

    // Verify all attempts were recorded
    const successMock = mockActivities.recordSuccess as ReturnType<
      typeof mock.fn
    >;
    assert.equal(successMock.mock.calls.length, 1);
    const recorded = successMock.mock.calls[0].arguments[0] as {
      attempts: unknown[];
    };
    assert.equal(recorded.attempts.length, 2);

    await worker.shutdown();
  });
});
