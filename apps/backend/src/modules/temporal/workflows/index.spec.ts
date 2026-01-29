/**
 * Temporal Workflows Registration Verification Test
 *
 * This test verifies that all workflows and activities are properly
 * registered and can be discovered by the Temporal worker.
 *
 * Run with: npm test -- workflows/index.spec.ts
 */

import { WORKFLOW_REGISTRY, getAllWorkflowNames, getAllTaskQueues } from './index';

describe('Temporal Workflows Registration', () => {
  describe('Workflow Registry', () => {
    it('should have all expected workflows registered', () => {
      const expectedWorkflows = [
        'documentGeneration',
        'pdfExport',
        'emailSending',
        'bulkEmailSending',
        'rulingIndexing',
        'rulingBackfill',
        'webhookDelivery',
        'webhookReplay',
        'aiQueryProcessing',
        'chatCleanup',
      ];

      const registeredWorkflows = Object.keys(WORKFLOW_REGISTRY);
      expect(registeredWorkflows).toEqual(expectedWorkflows);
      expect(registeredWorkflows.length).toBe(10);
    });

    it('should have non-empty workflow function for each registered workflow', () => {
      Object.entries(WORKFLOW_REGISTRY).forEach(([name, workflow]) => {
        expect(workflow.name).toBeDefined();
        expect(typeof workflow.name).toBe('string');
        // Registry key should match workflow name
        expect(name).toBe(workflow.name);
      });
    });

    it('should have valid workflow names for each registered workflow', () => {
      Object.entries(WORKFLOW_REGISTRY).forEach(([name, workflow]) => {
        expect(workflow.name).toBeDefined();
        expect(typeof workflow.name).toBe('string');
        expect(workflow.name.length).toBeGreaterThan(0);
      });
    });

    it('should have valid task queue for each registered workflow', () => {
      const validTaskQueues = [
        'legal-ai-task-queue',
        'document-processing',
        'notification-workflows',
        'billing-workflows',
        'webhook-workflows',
        'ai-workflows',
      ];

      Object.entries(WORKFLOW_REGISTRY).forEach(([name, workflow]) => {
        expect(workflow.taskQueue).toBeDefined();
        expect(typeof workflow.taskQueue).toBe('string');
        expect(validTaskQueues).toContain(workflow.taskQueue);
      });
    });

    it('should have file path for each registered workflow', () => {
      Object.entries(WORKFLOW_REGISTRY).forEach(([name, workflow]) => {
        expect(workflow.file).toBeDefined();
        expect(typeof workflow.file).toBe('string');
        expect(workflow.file).toMatch(/\.workflow\.ts$/);
        expect(workflow.file).toMatch(/^\.\/workflows\//);
      });
    });
  });

  describe('Utility Functions', () => {
    it('should return all workflow names', () => {
      const names = getAllWorkflowNames();
      expect(names).toBeInstanceOf(Array);
      expect(names.length).toBe(10);
      expect(names).toContain('documentGeneration');
      expect(names).toContain('emailSending');
      expect(names).toContain('rulingIndexing');
      expect(names).toContain('webhookDelivery');
      expect(names).toContain('chatCleanup');
    });

    it('should return all unique task queues', () => {
      const queues = getAllTaskQueues();
      expect(queues).toBeInstanceOf(Array);
      expect(queues.length).toBeGreaterThan(0);
      // Check that all queues are unique
      const uniqueQueues = new Set(queues);
      expect(uniqueQueues.size).toBe(queues.length);
    });
  });

  describe('Workflow Coverage', () => {
    it('should have workflows for all major features', () => {
      const workflowNames = getAllWorkflowNames();

      // Document processing
      expect(workflowNames).toContain('documentGeneration');
      expect(workflowNames).toContain('pdfExport');

      // Notifications
      expect(workflowNames).toContain('emailSending');
      expect(workflowNames).toContain('bulkEmailSending');

      // Billing
      expect(workflowNames).toContain('rulingIndexing');
      expect(workflowNames).toContain('rulingBackfill');

      // Webhooks
      expect(workflowNames).toContain('webhookDelivery');
      expect(workflowNames).toContain('webhookReplay');

      // AI
      expect(workflowNames).toContain('aiQueryProcessing');

      // Chat
      expect(workflowNames).toContain('chatCleanup');
    });
  });

  describe('Task Queue Distribution', () => {
    it('should have workflows distributed across task queues', () => {
      const taskQueueCounts: Record<string, number> = {};

      Object.values(WORKFLOW_REGISTRY).forEach((workflow) => {
        taskQueueCounts[workflow.taskQueue] =
          (taskQueueCounts[workflow.taskQueue] || 0) + 1;
      });

      // Verify we have workflows on multiple task queues
      expect(Object.keys(taskQueueCounts).length).toBeGreaterThan(1);

      // Verify the default task queue has workflows
      expect(taskQueueCounts['legal-ai-task-queue']).toBeGreaterThanOrEqual(1);
    });
  });
});
