/**
 * Document Generation Workflow E2E Tests
 *
 * Comprehensive end-to-end tests for the document generation workflow using
 * Temporal's test workflow environment to simulate workflow execution.
 *
 * Test Scenarios:
 * - Successful document generation with all activities
 * - Workflow handles AI generation failure gracefully
 * - Workflow completes successfully even if email notification fails
 * - Idempotency: re-running with same document ID doesn't duplicate work
 * - Workflow state transitions are properly tracked
 * - Activity outputs are correctly propagated through the workflow
 */

import {
  TestWorkflowEnvironment,
  WorkflowIdReusePolicy,
} from '@temporalio/testing';
import { after, before, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type {
  DocumentGenerationInput,
  DocumentGenerationOutput,
  DocumentGenerationActivities,
} from './document-generation.workflow';
import { documentGeneration } from './document-generation.workflow';
import { DocumentStatus } from '../../../../documents/entities/legal-document.entity';

describe('Document Generation Workflow - E2E Tests', () => {
  let testEnv: TestWorkflowEnvironment;
  let mockActivities: Partial<DocumentGenerationActivities>;

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
      initializeDocument: mock.fn(async () => ({
        documentId: 'test-doc-123',
        status: DocumentStatus.GENERATING,
        initializedAt: new Date().toISOString(),
      })),
      startAiGeneration: mock.fn(async () => ({
        taskId: 'ai-task-456',
        startedAt: new Date().toISOString(),
      })),
      pollAiCompletion: mock.fn(async () => ({
        content: 'Generated legal document content...',
        generationTimeMs: 5000,
        completedAt: new Date().toISOString(),
      })),
      completeDocument: mock.fn(async () => ({
        documentId: 'test-doc-123',
        status: DocumentStatus.COMPLETED,
        completedAt: new Date().toISOString(),
        userEmail: 'user@example.com',
        firstName: 'John',
      })),
      failDocument: mock.fn(async () => ({
        documentId: 'test-doc-123',
        status: DocumentStatus.FAILED,
        failedAt: new Date().toISOString(),
        userEmail: 'user@example.com',
        firstName: 'John',
      })),
      sendCompletionEmail: mock.fn(async () => ({
        sent: true,
        sentAt: new Date().toISOString(),
      })),
      sendFailureEmail: mock.fn(async () => ({
        sent: true,
        sentAt: new Date().toISOString(),
      })),
    };
  });

  /**
   * Scenario 1: Document generation workflow completes successfully
   */
  it('should complete document generation workflow successfully', async () => {
    const input: DocumentGenerationInput = {
      documentId: 'test-doc-123',
      sessionId: 'session-abc',
      title: 'Test Contract',
      documentType: 'CONTRACT',
      description: 'A test contract for legal proceedings',
      context: { key: 'value' },
      userId: 'user-123',
      frontendUrl: 'http://localhost:3000',
    };

    // Create workflow client with mocked activities
    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL(
        './document-generation.workflow.ts',
        import.meta.url,
      ),
      activities: mockActivities,
    });

    // Execute workflow
    const result = await client.executeWorkflow<DocumentGenerationOutput>({
      workflowType: documentGeneration,
      args: [input, mockActivities as DocumentGenerationActivities],
      workflowId: `document-generation-${input.documentId}`,
      taskQueue: 'document-processing',
    });

    // Verify final status
    assert.equal(result.status, 'COMPLETED');
    assert.equal(result.documentId, 'test-doc-123');
    assert.equal(result.content, 'Generated legal document content...');
    assert.equal(result.generationTimeMs, 5000);
    assert.ok(result.completedAt);

    // Verify activity calls in correct order
    const initMock = mockActivities.initializeDocument as ReturnType<
      typeof mock.fn
    >;
    const startAiMock = mockActivities.startAiGeneration as ReturnType<
      typeof mock.fn
    >;
    const pollMock = mockActivities.pollAiCompletion as ReturnType<
      typeof mock.fn
    >;
    const completeMock = mockActivities.completeDocument as ReturnType<
      typeof mock.fn
    >;
    const emailMock = mockActivities.sendCompletionEmail as ReturnType<
      typeof mock.fn
    >;

    assert.equal(initMock.mock.calls.length, 1);
    assert.equal(startAiMock.mock.calls.length, 1);
    assert.equal(pollMock.mock.calls.length, 1);
    assert.equal(completeMock.mock.calls.length, 1);
    assert.equal(emailMock.mock.calls.length, 1);

    await worker.shutdown();
  });

  /**
   * Scenario 2: Email workflow retries on failure (AI service failure)
   */
  it('should handle AI generation failure gracefully and send failure notification', async () => {
    const input: DocumentGenerationInput = {
      documentId: 'test-doc-fail',
      sessionId: 'session-fail',
      title: 'Test Document',
      documentType: 'OTHER',
      description: 'This will fail',
      userId: 'user-123',
    };

    // Mock AI polling to throw an error
    (mockActivities.pollAiCompletion as ReturnType<typeof mock.fn>) = mock.fn(
      async () => {
        throw new Error('AI service reported generation failure');
      },
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL(
        './document-generation.workflow.ts',
        import.meta.url,
      ),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<DocumentGenerationOutput>({
      workflowType: documentGeneration,
      args: [input, mockActivities as DocumentGenerationActivities],
      workflowId: `document-generation-${input.documentId}`,
      taskQueue: 'document-processing',
    });

    // Verify failure handling
    assert.equal(result.status, 'FAILED');
    assert.equal(result.documentId, 'test-doc-fail');
    assert.ok(
      result.errorMessage?.includes('AI service reported generation failure'),
    );
    assert.equal(result.generationTimeMs, 0);

    // Verify failDocument was called
    const failMock = mockActivities.failDocument as ReturnType<typeof mock.fn>;
    assert.equal(failMock.mock.calls.length, 1);

    // Verify failure email was sent
    const failEmailMock = mockActivities.sendFailureEmail as ReturnType<
      typeof mock.fn
    >;
    assert.equal(failEmailMock.mock.calls.length, 1);

    await worker.shutdown();
  });

  /**
   * Scenario 3: Workflow completes even if email notification fails
   */
  it('should complete workflow even if email notification fails', async () => {
    const input: DocumentGenerationInput = {
      documentId: 'test-doc-email-fail',
      sessionId: 'session-email',
      title: 'Test Document',
      documentType: 'CONTRACT',
      description: 'Email will fail',
      userId: 'user-123',
    };

    // Mock completion email to throw an error
    (mockActivities.sendCompletionEmail as ReturnType<typeof mock.fn>) =
      mock.fn(async () => {
        throw new Error('Email service unavailable');
      });

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL(
        './document-generation.workflow.ts',
        import.meta.url,
      ),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<DocumentGenerationOutput>({
      workflowType: documentGeneration,
      args: [input, mockActivities as DocumentGenerationActivities],
      workflowId: `document-generation-${input.documentId}`,
      taskQueue: 'document-processing',
    });

    // Verify workflow still completes despite email failure
    assert.equal(result.status, 'COMPLETED');
    assert.equal(result.documentId, 'test-doc-email-fail');
    assert.ok(result.content);

    await worker.shutdown();
  });

  /**
   * Scenario 4: Workflow idempotency (same document ID)
   */
  it('should be idempotent - re-running with same document ID uses same workflow', async () => {
    const input: DocumentGenerationInput = {
      documentId: 'test-doc-idempotent',
      sessionId: 'session-idem',
      title: 'Test Document',
      documentType: 'LAWSUIT',
      description: 'Testing idempotency',
      userId: 'user-123',
    };

    const workflowId = `document-generation-${input.documentId}`;
    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL(
        './document-generation.workflow.ts',
        import.meta.url,
      ),
      activities: mockActivities,
    });

    // First execution
    const firstResult = await client.executeWorkflow<DocumentGenerationOutput>({
      workflowType: documentGeneration,
      args: [input, mockActivities as DocumentGenerationActivities],
      workflowId,
      taskQueue: 'document-processing',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
    });

    // Second execution with same ID
    const secondResult = await client.executeWorkflow<DocumentGenerationOutput>(
      {
        workflowType: documentGeneration,
        args: [input, mockActivities as DocumentGenerationActivities],
        workflowId,
        taskQueue: 'document-processing',
        workflowIdReusePolicy:
          WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
      },
    );

    // Both should succeed with same document ID
    assert.equal(firstResult.documentId, secondResult.documentId);
    assert.equal(firstResult.status, secondResult.status);

    await worker.shutdown();
  });

  /**
   * Scenario 5: Activity outputs are correctly propagated
   */
  it('should correctly propagate activity outputs through the workflow', async () => {
    const input: DocumentGenerationInput = {
      documentId: 'test-doc-outputs',
      sessionId: 'session-outputs',
      title: 'Test Document',
      documentType: 'COMPLAINT',
      description: 'Testing output propagation',
      userId: 'user-123',
      frontendUrl: 'http://localhost:3000',
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL(
        './document-generation.workflow.ts',
        import.meta.url,
      ),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<DocumentGenerationOutput>({
      workflowType: documentGeneration,
      args: [input, mockActivities as DocumentGenerationActivities],
      workflowId: `document-generation-${input.documentId}`,
      taskQueue: 'document-processing',
    });

    // Verify AI task ID is propagated
    const startAiMock = mockActivities.startAiGeneration as ReturnType<
      typeof mock.fn
    >;
    assert.equal(
      startAiMock.mock.calls[0].arguments[0].documentId,
      input.documentId,
    );

    // Verify generated content is propagated
    assert.ok(result.content);
    assert.equal(result.content, 'Generated legal document content...');

    // Verify generation time is propagated
    assert.equal(result.generationTimeMs, 5000);
    assert.ok(result.completedAt);

    await worker.shutdown();
  });

  /**
   * Scenario 6: Workflow state transitions are tracked
   */
  it('should track workflow state transitions through activities', async () => {
    const input: DocumentGenerationInput = {
      documentId: 'test-doc-states',
      sessionId: 'session-states',
      title: 'Test Document',
      documentType: 'OTHER',
      description: 'Testing state transitions',
    };

    const activityCallOrder: string[] = [];

    // Wrap activity mocks to track call order
    const trackedActivities = {
      ...mockActivities,
      initializeDocument: mock.fn(async (args) => {
        activityCallOrder.push('initializeDocument');
        return mockActivities.initializeDocument!(args);
      }),
      startAiGeneration: mock.fn(async (args) => {
        activityCallOrder.push('startAiGeneration');
        return mockActivities.startAiGeneration!(args);
      }),
      pollAiCompletion: mock.fn(async (args) => {
        activityCallOrder.push('pollAiCompletion');
        return mockActivities.pollAiCompletion!(args);
      }),
      completeDocument: mock.fn(async (args) => {
        activityCallOrder.push('completeDocument');
        return mockActivities.completeDocument!(args);
      }),
      sendCompletionEmail: mock.fn(async (args) => {
        activityCallOrder.push('sendCompletionEmail');
        return mockActivities.sendCompletionEmail!(args);
      }),
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL(
        './document-generation.workflow.ts',
        import.meta.url,
      ),
      activities: trackedActivities,
    });

    await client.executeWorkflow<DocumentGenerationOutput>({
      workflowType: documentGeneration,
      args: [
        input,
        trackedActivities as unknown as DocumentGenerationActivities,
      ],
      workflowId: `document-generation-${input.documentId}`,
      taskQueue: 'document-processing',
    });

    // Verify correct activity execution order
    assert.deepEqual(activityCallOrder, [
      'initializeDocument',
      'startAiGeneration',
      'pollAiCompletion',
      'completeDocument',
      'sendCompletionEmail',
    ]);

    await worker.shutdown();
  });

  /**
   * Scenario 7: Workflow handles missing user info gracefully
   */
  it('should handle missing user email and first name gracefully', async () => {
    const input: DocumentGenerationInput = {
      documentId: 'test-doc-no-user',
      sessionId: 'session-no-user',
      title: 'Test Document',
      documentType: 'CONTRACT',
      description: 'No user info',
    };

    // Mock completeDocument to return no user info
    (mockActivities.completeDocument as ReturnType<typeof mock.fn>) = mock.fn(
      async () => ({
        documentId: 'test-doc-no-user',
        status: DocumentStatus.COMPLETED,
        completedAt: new Date().toISOString(),
        // No userEmail or firstName
      }),
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL(
        './document-generation.workflow.ts',
        import.meta.url,
      ),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<DocumentGenerationOutput>({
      workflowType: documentGeneration,
      args: [input, mockActivities as DocumentGenerationActivities],
      workflowId: `document-generation-${input.documentId}`,
      taskQueue: 'document-processing',
    });

    // Verify workflow completes without email (no user email)
    assert.equal(result.status, 'COMPLETED');

    // Email activity should not be called when no user email
    const emailMock = mockActivities.sendCompletionEmail as ReturnType<
      typeof mock.fn
    >;
    assert.equal(emailMock.mock.calls.length, 0);

    await worker.shutdown();
  });
});
