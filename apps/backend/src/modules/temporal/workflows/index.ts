/**
 * Temporal Workflows Index
 *
 * Central export point for all Temporal workflows.
 * This file is used by the worker to register all available workflows.
 *
 * IMPORTANT: All workflows must be exported here to be registered with the worker.
 * If a workflow is missing from this list, it will NOT be executed by Temporal.
 */

// Re-export all workflow functions for Temporal worker bundling
export { documentGeneration } from './document/document-generation.workflow';
export { pdfExport } from './document/pdf-export.workflow';
export { emailSending } from './notification/email-sending.workflow';
export { bulkEmailSending } from './notification/bulk-email-sending.workflow';
export { rulingIndexing } from './billing/ruling-indexing.workflow';
export { rulingBackfill } from './billing/ruling-backfill.workflow';
export { webhookDelivery } from './webhook/webhook-delivery.workflow';
export { webhookReplay } from './webhook/webhook-replay.workflow';
export { aiQueryProcessing } from './ai/ai-query-processing.workflow';
export { chatCleanup } from './chat/chat-cleanup.workflow';

/**
 * Workflow Registry Metadata
 *
 * Complete list of all workflow metadata for registration verification.
 * The actual workflow functions are imported by the worker directly from
 * their respective files using Temporal's ESM loader.
 *
 * This registry is used by:
 * - Tests: To verify all workflows are documented
 * - CLI: To list available workflows
 * - Worker: To verify registration during startup
 */
export const WORKFLOW_REGISTRY = {
  // Document Workflows
  documentGeneration: {
    name: 'documentGeneration',
    taskQueue: 'document-processing',
    file: './workflows/document/document-generation.workflow.ts',
  },
  pdfExport: {
    name: 'pdfExport',
    taskQueue: 'document-processing',
    file: './workflows/document/pdf-export.workflow.ts',
  },

  // Notification Workflows
  emailSending: {
    name: 'emailSending',
    taskQueue: 'notification-workflows',
    file: './workflows/notification/email-sending.workflow.ts',
  },
  bulkEmailSending: {
    name: 'bulkEmailSending',
    taskQueue: 'notification-workflows',
    file: './workflows/notification/bulk-email-sending.workflow.ts',
  },

  // Billing/Ruling Workflows
  rulingIndexing: {
    name: 'rulingIndexing',
    taskQueue: 'billing-workflows',
    file: './workflows/billing/ruling-indexing.workflow.ts',
  },
  rulingBackfill: {
    name: 'rulingBackfill',
    taskQueue: 'billing-workflows',
    file: './workflows/billing/ruling-backfill.workflow.ts',
  },

  // Webhook Workflows
  webhookDelivery: {
    name: 'webhookDelivery',
    taskQueue: 'webhook-workflows',
    file: './workflows/webhook/webhook-delivery.workflow.ts',
  },
  webhookReplay: {
    name: 'webhookReplay',
    taskQueue: 'webhook-workflows',
    file: './workflows/webhook/webhook-replay.workflow.ts',
  },

  // AI Workflows
  aiQueryProcessing: {
    name: 'aiQueryProcessing',
    taskQueue: 'ai-workflows',
    file: './workflows/ai/ai-query-processing.workflow.ts',
  },

  // Chat Workflows
  chatCleanup: {
    name: 'chatCleanup',
    taskQueue: 'legal-ai-task-queue',
    file: './workflows/chat/chat-cleanup.workflow.ts',
  },
} as const;

/**
 * Get all registered workflow names
 *
 * Utility function to get a list of all workflow names for verification.
 */
export function getAllWorkflowNames(): string[] {
  return Object.values(WORKFLOW_REGISTRY).map((w) => w.name);
}

/**
 * Get all registered task queues
 *
 * Utility function to get a list of all task queues for verification.
 */
export function getAllTaskQueues(): string[] {
  const queues = new Set(Object.values(WORKFLOW_REGISTRY).map((w) => w.taskQueue));
  return Array.from(queues);
}
