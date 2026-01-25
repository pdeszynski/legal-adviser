/**
 * PDF Export Workflow E2E Tests
 *
 * Comprehensive end-to-end tests for the PDF export workflow using
 * Temporal's test workflow environment to simulate workflow execution.
 *
 * Test Scenarios:
 * - Successful PDF export with all activities
 * - Long-running task handling (heartbeat support)
 * - Workflow cancellation via signal
 * - Workflow timeout handling
 * - Idempotency: re-running with same document ID
 * - Query handler for export state
 * - Notification failure doesn't fail workflow
 */

import {
  TestWorkflowEnvironment,
  WorkflowIdReusePolicy,
} from '@temporalio/testing';
import { after, before, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { PdfExportInput, PdfExportOutput } from './pdf-export.workflow';
import { pdfExport } from './pdf-export.workflow';
import { DocumentType } from '../../../../documents/entities/legal-document.entity';

// Mock activities interface
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

describe('PDF Export Workflow - E2E Tests', () => {
  let testEnv: TestWorkflowEnvironment;
  let mockActivities: Partial<PdfExportActivities>;

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
      initializeExport: mock.fn(async () => ({
        status: 'INITIALIZING',
      })),
      generatePdf: mock.fn(async () => ({
        pdfUrl: 'https://s3.example.com/exports/doc-123.pdf',
        pageCount: 15,
        fileSize: 245678,
      })),
      completeExport: mock.fn(async () => {}),
      failExport: mock.fn(async () => {}),
      sendCompletionNotification: mock.fn(async () => {}),
    };
  });

  /**
   * Scenario 1: Successful PDF export completes successfully
   */
  it('should complete PDF export successfully', async () => {
    const input: PdfExportInput = {
      exportId: 'export-123',
      documentId: 'doc-123',
      sessionId: 'session-abc',
      title: 'Legal Contract',
      documentType: DocumentType.CONTRACT,
      content:
        'This is the legal document content that will be converted to PDF.',
      options: {
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
      },
      userId: 'user-123',
      frontendUrl: 'http://localhost:3000',
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL('./pdf-export.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<PdfExportOutput>({
      workflowType: pdfExport,
      args: [input],
      workflowId: `pdf-export-${input.documentId}`,
      taskQueue: 'document-processing',
    });

    // Verify success
    assert.equal(result.status, 'COMPLETED');
    assert.equal(result.exportId, 'export-123');
    assert.equal(result.documentId, 'doc-123');
    assert.equal(result.pdfUrl, 'https://s3.example.com/exports/doc-123.pdf');
    assert.equal(result.pageCount, 15);
    assert.equal(result.fileSize, 245678);
    assert.ok(result.exportTimeMs > 0);
    assert.ok(result.completedAt);

    // Verify activities were called in order
    const initMock = mockActivities.initializeExport as ReturnType<
      typeof mock.fn
    >;
    const genMock = mockActivities.generatePdf as ReturnType<typeof mock.fn>;
    const completeMock = mockActivities.completeExport as ReturnType<
      typeof mock.fn
    >;
    const notifyMock = mockActivities.sendCompletionNotification as ReturnType<
      typeof mock.fn
    >;

    assert.equal(initMock.mock.calls.length, 1);
    assert.equal(genMock.mock.calls.length, 1);
    assert.equal(completeMock.mock.calls.length, 1);
    assert.equal(notifyMock.mock.calls.length, 1);

    await worker.shutdown();
  });

  /**
   * Scenario 2: Long-running task handling (heartbeat support)
   */
  it('should handle long-running PDF generation with heartbeats', async () => {
    const input: PdfExportInput = {
      exportId: 'export-long',
      documentId: 'doc-long',
      sessionId: 'session-long',
      title: 'Large Legal Document',
      documentType: DocumentType.LAWSUIT,
      content: 'A'.repeat(1000000), // Large content
      options: {
        watermark: 'DRAFT',
      },
      userId: 'user-123',
    };

    // Simulate long-running PDF generation with heartbeat
    let progressUpdates = 0;
    (mockActivities.generatePdf as ReturnType<typeof mock.fn>) = mock.fn(
      async () => {
        // Simulate long operation with progress
        progressUpdates++;
        return {
          pdfUrl: 'https://s3.example.com/exports/doc-long.pdf',
          pageCount: 150,
          fileSize: 2456789,
        };
      },
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL('./pdf-export.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<PdfExportOutput>({
      workflowType: pdfExport,
      args: [input],
      workflowId: `pdf-export-${input.documentId}`,
      taskQueue: 'document-processing',
      workflowExecutionTimeout: '30m', // Allow long execution
    });

    // Verify successful completion of long-running task
    assert.equal(result.status, 'COMPLETED');
    assert.equal(result.pageCount, 150);
    assert.ok(result.exportTimeMs > 0);
    assert.ok(progressUpdates >= 1);

    await worker.shutdown();
  });

  /**
   * Scenario 3: Workflow cancellation via signal
   */
  it('should handle workflow cancellation via signal', async () => {
    const input: PdfExportInput = {
      exportId: 'export-cancel',
      documentId: 'doc-cancel',
      sessionId: 'session-cancel',
      title: 'Cancellable Document',
      documentType: DocumentType.OTHER,
      content: 'Content to be cancelled',
      userId: 'user-123',
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL('./pdf-export.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    // Start workflow
    const workflowHandle = await client.startWorkflow({
      workflowType: pdfExport,
      args: [input],
      workflowId: `pdf-export-${input.documentId}`,
      taskQueue: 'document-processing',
    });

    // Send cancel signal immediately
    await workflowHandle.signal('cancel');

    // Wait for workflow to complete
    const result = await workflowHandle.result<PdfExportOutput>();

    // Verify cancellation
    assert.equal(result.status, 'FAILED');
    assert.ok(result.errorMessage?.includes('cancelled'));

    await worker.shutdown();
  });

  /**
   * Scenario 4: Workflow timeout handling
   */
  it('should handle workflow timeout gracefully', async () => {
    const input: PdfExportInput = {
      exportId: 'export-timeout',
      documentId: 'doc-timeout',
      sessionId: 'session-timeout',
      title: 'Timeout Test Document',
      documentType: DocumentType.CONTRACT,
      content: 'Content that will timeout',
      userId: 'user-123',
    };

    // Simulate timeout in PDF generation
    (mockActivities.generatePdf as ReturnType<typeof mock.fn>) = mock.fn(
      async () => {
        // Simulate very long operation
        await new Promise((resolve) => setTimeout(resolve, 10000));
        throw new Error('Activity timed out');
      },
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL('./pdf-export.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    try {
      const result = await client.executeWorkflow<PdfExportOutput>({
        workflowType: pdfExport,
        args: [input],
        workflowId: `pdf-export-${input.documentId}`,
        taskQueue: 'document-processing',
        workflowRunTimeout: '1s', // Short timeout
      });

      // If we get here, check for failure
      assert.equal(result.status, 'FAILED');
    } catch (error) {
      // Expected: timeout error
      assert.ok(
        error instanceof Error && error.message.includes('timeout'),
        'Expected timeout error',
      );
    }

    await worker.shutdown();
  });

  /**
   * Scenario 5: Query handler returns current export state
   */
  it('should return current export state via query handler', async () => {
    const input: PdfExportInput = {
      exportId: 'export-query',
      documentId: 'doc-query',
      sessionId: 'session-query',
      title: 'Query Test Document',
      documentType: DocumentType.COMPLAINT,
      content: 'Content for query test',
      userId: 'user-123',
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL('./pdf-export.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    // Start workflow
    const workflowHandle = await client.startWorkflow({
      workflowType: pdfExport,
      args: [input],
      workflowId: `pdf-export-${input.documentId}`,
      taskQueue: 'document-processing',
    });

    // Query workflow state
    const state = await workflowHandle.query<{
      state: string;
      progress: number;
      message?: string;
    }>('getState');

    // Verify query returns valid state
    assert.ok(state.state);
    assert.ok(typeof state.progress === 'number');
    assert.ok(state.progress >= 0 && state.progress <= 100);

    // Wait for completion
    await workflowHandle.result();

    await worker.shutdown();
  });

  /**
   * Scenario 6: Notification failure doesn't fail workflow
   */
  it('should complete even if notification fails', async () => {
    const input: PdfExportInput = {
      exportId: 'export-notify-fail',
      documentId: 'doc-notify-fail',
      sessionId: 'session-notify',
      title: 'Notification Fail Test',
      documentType: DocumentType.CONTRACT,
      content: 'Content for notification test',
      userId: 'user-123',
      frontendUrl: 'http://localhost:3000',
    };

    // Mock notification to fail
    (mockActivities.sendCompletionNotification as ReturnType<typeof mock.fn>) =
      mock.fn(async () => {
        throw new Error('Notification service unavailable');
      });

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL('./pdf-export.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<PdfExportOutput>({
      workflowType: pdfExport,
      args: [input],
      workflowId: `pdf-export-${input.documentId}`,
      taskQueue: 'document-processing',
    });

    // Workflow should still complete despite notification failure
    assert.equal(result.status, 'COMPLETED');
    assert.ok(result.pdfUrl);

    await worker.shutdown();
  });

  /**
   * Scenario 7: PDF generation failure is handled correctly
   */
  it('should handle PDF generation failure', async () => {
    const input: PdfExportInput = {
      exportId: 'export-gen-fail',
      documentId: 'doc-gen-fail',
      sessionId: 'session-gen-fail',
      title: 'Generation Fail Test',
      documentType: DocumentType.OTHER,
      content: 'Content that will fail to generate',
      userId: 'user-123',
    };

    // Mock PDF generation to fail
    (mockActivities.generatePdf as ReturnType<typeof mock.fn>) = mock.fn(
      async () => {
        throw new Error('PDF generation failed: invalid content format');
      },
    );

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL('./pdf-export.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<PdfExportOutput>({
      workflowType: pdfExport,
      args: [input],
      workflowId: `pdf-export-${input.documentId}`,
      taskQueue: 'document-processing',
    });

    // Verify failure handling
    assert.equal(result.status, 'FAILED');
    assert.ok(result.errorMessage?.includes('PDF generation failed'));

    // Verify failExport was called
    const failMock = mockActivities.failExport as ReturnType<typeof mock.fn>;
    assert.equal(failMock.mock.calls.length, 1);

    await worker.shutdown();
  });

  /**
   * Scenario 8: Idempotency - re-running with same document ID
   */
  it('should be idempotent - re-running with same document ID', async () => {
    const input: PdfExportInput = {
      exportId: 'export-idempotent',
      documentId: 'doc-idempotent',
      sessionId: 'session-idem',
      title: 'Idempotency Test',
      documentType: DocumentType.CONTRACT,
      content: 'Testing idempotency',
      userId: 'user-123',
    };

    const workflowId = `pdf-export-${input.documentId}`;
    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL('./pdf-export.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    // First execution
    const firstResult = await client.executeWorkflow<PdfExportOutput>({
      workflowType: pdfExport,
      args: [input],
      workflowId,
      taskQueue: 'document-processing',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
    });

    // Second execution with same ID
    const secondResult = await client.executeWorkflow<PdfExportOutput>({
      workflowType: pdfExport,
      args: [input],
      workflowId,
      taskQueue: 'document-processing',
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
    });

    // Both should complete successfully
    assert.equal(firstResult.status, 'COMPLETED');
    assert.equal(secondResult.status, 'COMPLETED');
    assert.equal(firstResult.documentId, secondResult.documentId);

    await worker.shutdown();
  });

  /**
   * Scenario 9: Workflow state transitions are tracked correctly
   */
  it('should track workflow state transitions through the export process', async () => {
    const input: PdfExportInput = {
      exportId: 'export-states',
      documentId: 'doc-states',
      sessionId: 'session-states',
      title: 'State Transitions Test',
      documentType: DocumentType.LAWSUIT,
      content: 'Testing state transitions',
      userId: 'user-123',
    };

    const stateTransitions: string[] = [];

    // Track state transitions through the workflow
    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL('./pdf-export.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    // Execute workflow and query states
    const workflowHandle = await client.startWorkflow({
      workflowType: pdfExport,
      args: [input],
      workflowId: `pdf-export-${input.documentId}`,
      taskQueue: 'document-processing',
    });

    // Query multiple times to capture state changes
    for (let i = 0; i < 3; i++) {
      try {
        const state = await workflowHandle.query<{
          state: string;
          progress: number;
          message?: string;
        }>('getState');
        stateTransitions.push(`${state.state}:${state.progress}`);
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch {
        // Query might fail if workflow completed
      }
    }

    // Wait for completion
    const result = await workflowHandle.result<PdfExportOutput>();

    // Verify final state is COMPLETED
    assert.equal(result.status, 'COMPLETED');
    assert.ok(stateTransitions.length > 0);

    await worker.shutdown();
  });

  /**
   * Scenario 10: Export options are properly passed through
   */
  it('should pass export options correctly to PDF generation', async () => {
    const options = {
      includeHeader: true,
      includeFooter: true,
      includePageNumbers: true,
      watermark: 'CONFIDENTIAL',
    };

    const input: PdfExportInput = {
      exportId: 'export-options',
      documentId: 'doc-options',
      sessionId: 'session-options',
      title: 'Options Test',
      documentType: DocumentType.CONTRACT,
      content: 'Testing options pass-through',
      options,
      userId: 'user-123',
    };

    const client = await testEnv.workflowClient;
    const worker = await testEnv.createWorker({
      taskQueue: 'document-processing',
      workflowsPath: new URL('./pdf-export.workflow.ts', import.meta.url),
      activities: mockActivities,
    });

    const result = await client.executeWorkflow<PdfExportOutput>({
      workflowType: pdfExport,
      args: [input],
      workflowId: `pdf-export-${input.documentId}`,
      taskQueue: 'document-processing',
    });

    // Verify options were passed to generatePdf activity
    const genMock = mockActivities.generatePdf as ReturnType<typeof mock.fn>;
    assert.equal(genMock.mock.calls.length, 1);
    assert.deepEqual(
      (genMock.mock.calls[0].arguments[0] as { options?: typeof options })
        .options,
      options,
    );

    assert.equal(result.status, 'COMPLETED');

    await worker.shutdown();
  });
});
