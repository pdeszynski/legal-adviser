/**
 * Temporal Activities Index
 *
 * Central export point for all Temporal activity implementations.
 * This file is used by the worker to register all available activities.
 *
 * IMPORTANT: All activities must be exported here to be registered with the worker.
 * If an activity implementation is missing from this list, it will NOT be available to workflows.
 *
 * Note: We don't use wildcard exports here because there are naming conflicts
 * between activity files (e.g., CheckRateLimitInput, sleep function). Activities
 * should be imported directly from their source files.
 */

/**
 * Activity Registry Metadata
 *
 * Complete list of all activity metadata for registration verification.
 * The actual activity classes are imported by the worker from their
 * respective files.
 *
 * This registry is used by:
 * - Tests: To verify all activities are documented
 * - CLI: To list available activities
 * - Worker: To verify registration during startup
 */
export const ACTIVITY_REGISTRY = {
  // Document Activities
  documentGeneration: {
    name: 'documentGeneration',
    file: './activities/document/document-generation.activities.ts',
  },
  pdfExport: {
    name: 'pdfExport',
    file: './activities/document/pdf-export.activities.ts',
  },

  // Billing Activities
  rulingIndexing: {
    name: 'rulingIndexing',
    file: './activities/billing/ruling-indexing.activities.ts',
  },

  // Notification Activities
  emailSending: {
    name: 'emailSending',
    file: './activities/notification/email-sending.activities.ts',
  },

  // Webhook Activities
  webhookDelivery: {
    name: 'webhookDelivery',
    file: './activities/webhook/webhook-delivery.activities.ts',
  },

  // Chat Activities
  chatCleanup: {
    name: 'chatCleanup',
    file: './activities/chat/chat-cleanup.activities.ts',
  },

  // AI Activities
  aiQueryProcessing: {
    name: 'aiQueryProcessing',
    file: './activities/ai/ai-query-processing.activities.ts',
  },
} as const;

/**
 * Get all registered activity names
 *
 * Utility function to get a list of all activity names for verification.
 */
export function getAllActivityNames(): string[] {
  return Object.values(ACTIVITY_REGISTRY).map((a) => a.name);
}
