/**
 * Ruling Indexing Workflow E2E Tests
 *
 * Comprehensive end-to-end tests for the ruling indexing workflow using
 * Temporal's test workflow environment to simulate workflow execution.
 *
 * Test Scenarios:
 * - Successful batch indexing from SAOS source
 * - Successful batch indexing from ISAP source
 * - Partial completion when some batches fail
 * - Date range filtering
 * - Court type filtering
 * - Batch retry with exponential backoff
 * - Large batch processing (many batches)
 * - Idempotency: re-running with same job ID
 */

import {
  TestWorkflowEnvironment,
  WorkflowIdReusePolicy,
} from '@temporalio/testing';
import { after, before, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type {
  RulingIndexingInput,
  RulingIndexingOutput,
} from './ruling-indexing.workflow';
import { rulingIndexing } from './ruling-indexing.workflow';
import type { CourtType } from '../../../../documents/entities/legal-ruling.entity';

// Mock activities interface
interface RulingIndexingActivities {
  initializeIndexing(input: {
    jobId: string;
    source: 'SAOS' | 'ISAP';
    dateFrom?: Date;
    dateTo?: Date;
    courtType?: CourtType;
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
    courtType?: CourtType;
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

describe('Ruling Indexing Workflow - E2E Tests', () => {
  let testEnv: TestWorkflowEnvironment;
  let mockActivities: Partial<RulingIndexingActivities>;

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
      initializeIndexing: mock.fn(async () => ({
        totalAvailable: 250,
        estimatedBatches: 3,
      })),
      processIndexingBatch: mock.fn(async (input) => ({
        batchNumber: input.batchNumber,
        processed: input.batchSize,
        indexed: Math.floor(input.batchSize * 0.8),
        skipped: Math.floor(input.batchSize * 0.15),
        failed: Math.floor(input.batchSize * 0.05),
        processingTimeMs: 1000,
      })),
      completeIndexing: mock.fn(async () => {}),
      failIndexing: mock.fn(async () => {}),
    };
  });

  /**
   * Scenario 1: Successful batch indexing from SAOS source
   */
  it('should complete SAOS ruling indexing successfully', async () => {
    const input: RulingIndexingInput = {
      jobId: 'indexing-saos-123',
      source: 'SAOS',
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-01-31'),
      courtType: CourtType.COMMON,
      batchSize: 100,
      updateExisting: true,
      userId: 'user-123',
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'billing-workflows',
      workflowsPath: new URL('./ruling-indexing.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<RulingIndexingOutput>({
      workflowType: rulingIndexing,
      args: [input],
      workflowId: `ruling-indexing-saos-${Date.now()}`,
      taskQueue: 'billing-workflows',
    });

    // Verify success
    assert.equal(result.status, 'COMPLETED');
    assert.equal(result.jobId, 'indexing-saos-123');
    assert.equal(result.source, 'SAOS');
    assert.equal(result.totalProcessed, 250);
    assert.equal(result.totalIndexed, 200); // 80% of 250
    assert.equal(result.totalSkipped, 37); // ~15% of 250
    assert.equal(result.totalFailed, 12); // ~5% of 250 (rounding)
    assert.ok(result.batchResults.length > 0);
    assert.ok(result.indexingTimeMs > 0);
    assert.ok(result.completedAt);

    // Verify activities were called
    const initMock = mockActivities.initializeIndexing as ReturnType<
      typeof mock.fn
    >;
    const batchMock = mockActivities.processIndexingBatch as ReturnType<
      typeof mock.fn
    >;
    const completeMock = mockActivities.completeIndexing as ReturnType<
      typeof mock.fn
    >;

    assert.equal(initMock.mock.calls.length, 1);
    assert.ok(batchMock.mock.calls.length >= 3); // 250 items / 100 batch size = 3 batches
    assert.equal(completeMock.mock.calls.length, 1);

    await worker.shutdown();
  });

  /**
   * Scenario 2: Successful batch indexing from ISAP source
   */
  it('should complete ISAP ruling indexing successfully', async () => {
    const input: RulingIndexingInput = {
      jobId: 'indexing-isap-456',
      source: 'ISAP',
      dateFrom: new Date('2024-02-01'),
      dateTo: new Date('2024-02-28'),
      courtType: CourtType.SUPREME,
      batchSize: 50,
      updateExisting: false,
      userId: 'user-456',
    };

    // Return different counts for ISAP
    (mockActivities.initializeIndexing as ReturnType<typeof mock.fn>) = mock.fn(
      async () => ({
        totalAvailable: 150,
        estimatedBatches: 3,
      }),
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'billing-workflows',
      workflowsPath: new URL('./ruling-indexing.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<RulingIndexingOutput>({
      workflowType: rulingIndexing,
      args: [input],
      workflowId: `ruling-indexing-isap-${Date.now()}`,
      taskQueue: 'billing-workflows',
    });

    // Verify success
    assert.equal(result.status, 'COMPLETED');
    assert.equal(result.source, 'ISAP');
    assert.equal(result.totalProcessed, 150);

    await worker.shutdown();
  });

  /**
   * Scenario 3: Partial completion when some batches fail
   */
  it('should return PARTIALLY_COMPLETED status when some batches fail', async () => {
    const input: RulingIndexingInput = {
      jobId: 'indexing-partial-789',
      source: 'SAOS',
      batchSize: 100,
      updateExisting: true,
    };

    let batchCallCount = 0;
    (mockActivities.processIndexingBatch as ReturnType<typeof mock.fn>) =
      mock.fn(async (input) => {
        batchCallCount++;
        // First two batches succeed, third has failures
        if (batchCallCount === 3) {
          return {
            batchNumber: input.batchNumber,
            processed: input.batchSize,
            indexed: 50,
            skipped: 0,
            failed: 50, // High failure rate
            processingTimeMs: 1000,
          };
        }
        return {
          batchNumber: input.batchNumber,
          processed: input.batchSize,
          indexed: input.batchSize,
          skipped: 0,
          failed: 0,
          processingTimeMs: 1000,
        };
      });

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'billing-workflows',
      workflowsPath: new URL('./ruling-indexing.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<RulingIndexingOutput>({
      workflowType: rulingIndexing,
      args: [input],
      workflowId: `ruling-indexing-partial-${Date.now()}`,
      taskQueue: 'billing-workflows',
    });

    // Verify partial completion
    assert.equal(result.status, 'PARTIALLY_COMPLETED');
    assert.ok(result.totalFailed > 0);
    assert.ok(result.batchResults.some((b) => b.failed > 0));

    await worker.shutdown();
  });

  /**
   * Scenario 4: Date range filtering is applied correctly
   */
  it('should apply date range filtering to indexing', async () => {
    const dateFrom = new Date('2024-01-01');
    const dateTo = new Date('2024-01-31');

    const input: RulingIndexingInput = {
      jobId: 'indexing-dates-101',
      source: 'SAOS',
      dateFrom,
      dateTo,
      batchSize: 100,
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'billing-workflows',
      workflowsPath: new URL('./ruling-indexing.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<RulingIndexingOutput>({
      workflowType: rulingIndexing,
      args: [input],
      workflowId: `ruling-indexing-dates-${Date.now()}`,
      taskQueue: 'billing-workflows',
    });

    // Verify date range was passed to initialize activity
    const initMock = mockActivities.initializeIndexing as ReturnType<
      typeof mock.fn
    >;
    assert.equal(initMock.mock.calls.length, 1);
    const initCall = initMock.mock.calls[0].arguments[0] as {
      dateFrom?: Date;
      dateTo?: Date;
    };
    assert.deepEqual(initCall.dateFrom, dateFrom);
    assert.deepEqual(initCall.dateTo, dateTo);

    assert.equal(result.status, 'COMPLETED');

    await worker.shutdown();
  });

  /**
   * Scenario 5: Court type filtering is applied correctly
   */
  it('should apply court type filtering to indexing', async () => {
    const input: RulingIndexingInput = {
      jobId: 'indexing-court-202',
      source: 'ISAP',
      courtType: CourtType.APPEAL,
      batchSize: 100,
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'billing-workflows',
      workflowsPath: new URL('./ruling-indexing.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<RulingIndexingOutput>({
      workflowType: rulingIndexing,
      args: [input],
      workflowId: `ruling-indexing-court-${Date.now()}`,
      taskQueue: 'billing-workflows',
    });

    // Verify court type was passed to activities
    const initMock = mockActivities.initializeIndexing as ReturnType<
      typeof mock.fn
    >;
    const initCall = initMock.mock.calls[0].arguments[0] as {
      courtType?: CourtType;
    };
    assert.equal(initCall.courtType, CourtType.APPEAL);

    assert.equal(result.status, 'COMPLETED');

    await worker.shutdown();
  });

  /**
   * Scenario 6: Large batch processing (many batches)
   */
  it('should handle large batch processing with many batches', async () => {
    const input: RulingIndexingInput = {
      jobId: 'indexing-large-303',
      source: 'SAOS',
      batchSize: 100,
      updateExisting: true,
    };

    // Simulate large dataset
    (mockActivities.initializeIndexing as ReturnType<typeof mock.fn>) = mock.fn(
      async () => ({
        totalAvailable: 1000,
        estimatedBatches: 10,
      }),
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'billing-workflows',
      workflowsPath: new URL('./ruling-indexing.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<RulingIndexingOutput>({
      workflowType: rulingIndexing,
      args: [input],
      workflowId: `ruling-indexing-large-${Date.now()}`,
      taskQueue: 'billing-workflows',
    });

    // Verify all batches were processed
    assert.equal(result.status, 'COMPLETED');
    assert.equal(result.totalProcessed, 1000);

    const batchMock = mockActivities.processIndexingBatch as ReturnType<
      typeof mock.fn
    >;
    assert.equal(batchMock.mock.calls.length, 10);

    await worker.shutdown();
  });

  /**
   * Scenario 7: Batch retry with exponential backoff
   */
  it('should retry failed batches with exponential backoff', async () => {
    const input: RulingIndexingInput = {
      jobId: 'indexing-retry-404',
      source: 'SAOS',
      batchSize: 100,
    };

    let attemptCount = 0;
    (mockActivities.processIndexingBatch as ReturnType<typeof mock.fn>) =
      mock.fn(async (input) => {
        attemptCount++;
        if (input.batchNumber === 1 && attemptCount < 3) {
          throw new Error('Transient network error');
        }
        return {
          batchNumber: input.batchNumber,
          processed: input.batchSize,
          indexed: input.batchSize,
          skipped: 0,
          failed: 0,
          processingTimeMs: 1000,
        };
      });

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'billing-workflows',
      workflowsPath: new URL('./ruling-indexing.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<RulingIndexingOutput>({
      workflowType: rulingIndexing,
      args: [input],
      workflowId: `ruling-indexing-retry-${Date.now()}`,
      taskQueue: 'billing-workflows',
    });

    // Verify retry success
    assert.equal(result.status, 'COMPLETED');
    assert.ok(attemptCount >= 3); // Initial + at least 2 retries

    await worker.shutdown();
  });

  /**
   * Scenario 8: Workflow failure on critical error
   */
  it('should fail workflow on critical initialization error', async () => {
    const input: RulingIndexingInput = {
      jobId: 'indexing-fail-505',
      source: 'ISAP',
      batchSize: 100,
    };

    // Mock initialization to fail
    (mockActivities.initializeIndexing as ReturnType<typeof mock.fn>) = mock.fn(
      async () => {
        throw new Error('Authentication failed: Invalid API credentials');
      },
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'billing-workflows',
      workflowsPath: new URL('./ruling-indexing.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<RulingIndexingOutput>({
      workflowType: rulingIndexing,
      args: [input],
      workflowId: `ruling-indexing-fail-${Date.now()}`,
      taskQueue: 'billing-workflows',
    });

    // Verify failure
    assert.equal(result.status, 'FAILED');
    assert.ok(result.errorMessage?.includes('Authentication failed'));

    // Verify failIndexing was called
    const failMock = mockActivities.failIndexing as ReturnType<typeof mock.fn>;
    assert.equal(failMock.mock.calls.length, 1);

    await worker.shutdown();
  });

  /**
   * Scenario 9: Idempotency - re-running with same job ID
   */
  it('should be idempotent - re-running with same job ID', async () => {
    const input: RulingIndexingInput = {
      jobId: 'indexing-idempotent-606',
      source: 'SAOS',
      batchSize: 100,
    };

    const workflowId = `ruling-indexing-saos-${input.jobId}`;
    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'billing-workflows',
      workflowsPath: new URL('./ruling-indexing.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    // First execution
    const firstResult = await client.executeWorkflow<RulingIndexingOutput>({
      workflowType: rulingIndexing,
      args: [input],
      workflowId,
      taskQueue: 'billing-workflows',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
    });

    // Second execution with same ID
    const secondResult = await client.executeWorkflow<RulingIndexingOutput>({
      workflowType: rulingIndexing,
      args: [input],
      workflowId,
      taskQueue: 'billing-workflows',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
    });

    // Both should complete successfully
    assert.equal(firstResult.status, 'COMPLETED');
    assert.equal(secondResult.status, 'COMPLETED');
    assert.equal(firstResult.jobId, secondResult.jobId);

    await worker.shutdown();
  });

  /**
   * Scenario 10: Batch results are tracked correctly
   */
  it('should track batch results correctly', async () => {
    const input: RulingIndexingInput = {
      jobId: 'indexing-batches-707',
      source: 'SAOS',
      batchSize: 100,
    };

    let batchNumber = 0;
    (mockActivities.processIndexingBatch as ReturnType<typeof mock.fn>) =
      mock.fn(async (input) => {
        batchNumber++;
        return {
          batchNumber,
          processed: input.batchSize,
          indexed: 80 + batchNumber, // Varying results
          skipped: 10 - batchNumber,
          failed: batchNumber,
          processingTimeMs: 1000 * batchNumber,
        };
      });

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'billing-workflows',
      workflowsPath: new URL('./ruling-indexing.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<RulingIndexingOutput>({
      workflowType: rulingIndexing,
      args: [input],
      workflowId: `ruling-indexing-batches-${Date.now()}`,
      taskQueue: 'billing-workflows',
    });

    // Verify batch results
    assert.equal(result.status, 'COMPLETED');
    assert.ok(result.batchResults.length > 0);

    // Check that batch numbers are sequential
    for (let i = 0; i < result.batchResults.length; i++) {
      assert.equal(result.batchResults[i].batchNumber, i + 1);
    }

    // Verify totals match sum of batches
    /* eslint-disable @typescript-eslint/no-unsafe-return */
    const totalIndexed = result.batchResults.reduce(
      (sum: number, b) => sum + b.indexed,
      0,
    );
    const totalFailed = result.batchResults.reduce(
      (sum: number, b) => sum + b.failed,
      0,
    );
    /* eslint-enable @typescript-eslint/no-unsafe-return */

    assert.equal(result.totalIndexed, totalIndexed);
    assert.equal(result.totalFailed, totalFailed);

    await worker.shutdown();
  });

  /**
   * Scenario 11: Workflow handles empty dataset
   */
  it('should handle empty dataset gracefully', async () => {
    const input: RulingIndexingInput = {
      jobId: 'indexing-empty-808',
      source: 'ISAP',
      dateFrom: new Date('2025-01-01'), // Future date
      dateTo: new Date('2025-12-31'),
      batchSize: 100,
    };

    // Return empty dataset
    (mockActivities.initializeIndexing as ReturnType<typeof mock.fn>) = mock.fn(
      async () => ({
        totalAvailable: 0,
        estimatedBatches: 0,
      }),
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'billing-workflows',
      workflowsPath: new URL('./ruling-indexing.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<RulingIndexingOutput>({
      workflowType: rulingIndexing,
      args: [input],
      workflowId: `ruling-indexing-empty-${Date.now()}`,
      taskQueue: 'billing-workflows',
    });

    // Verify completion with no items processed
    assert.equal(result.status, 'COMPLETED');
    assert.equal(result.totalProcessed, 0);
    assert.equal(result.totalIndexed, 0);
    assert.equal(result.batchResults.length, 0);

    // No batch processing should occur
    const batchMock = mockActivities.processIndexingBatch as ReturnType<
      typeof mock.fn
    >;
    assert.equal(batchMock.mock.calls.length, 0);

    await worker.shutdown();
  });

  /**
   * Scenario 12: updateExisting flag is passed correctly
   */
  it('should pass updateExisting flag correctly to batch processing', async () => {
    const input: RulingIndexingInput = {
      jobId: 'indexing-update-909',
      source: 'SAOS',
      batchSize: 100,
      updateExisting: false, // Don't update existing
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'billing-workflows',
      workflowsPath: new URL('./ruling-indexing.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    await client.executeWorkflow<RulingIndexingOutput>({
      workflowType: rulingIndexing,
      args: [input],
      workflowId: `ruling-indexing-update-${Date.now()}`,
      taskQueue: 'billing-workflows',
    });

    // Verify updateExisting was passed to batch activities
    const batchMock = mockActivities.processIndexingBatch as ReturnType<
      typeof mock.fn
    >;
    assert.ok(batchMock.mock.calls.length > 0);
    const firstBatchCall = batchMock.mock.calls[0].arguments[0] as {
      updateExisting?: boolean;
    };
    assert.equal(firstBatchCall.updateExisting, false);

    await worker.shutdown();
  });
});
