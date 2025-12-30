/**
 * Queue Names Constants
 *
 * Centralized definition of all queue names used in the application.
 * This ensures consistency and prevents typos when registering queues.
 *
 * Queue Naming Convention: `domain-entity-action` or `domain-action`
 * Examples:
 * - document-generation
 * - document-export-pdf
 * - email-send
 * - notification-push
 */
export const QUEUE_NAMES = {
  /**
   * Document-related queues
   */
  DOCUMENT: {
    GENERATION: 'document-generation',
    EXPORT_PDF: 'document-export-pdf',
  },

  /**
   * Email-related queues
   */
  EMAIL: {
    SEND: 'email-send',
    SEND_WELCOME: 'email-send-welcome',
    SEND_NOTIFICATION: 'email-send-notification',
  },

  /**
   * Notification-related queues
   */
  NOTIFICATION: {
    PUSH: 'notification-push',
    PUSH_DOCUMENT_READY: 'notification-push-document-ready',
  },

  /**
   * AI-related queues
   */
  AI: {
    PROCESS_QUERY: 'ai-process-query',
    GENERATE_DOCUMENT: 'ai-generate-document',
  },
} as const;

/**
 * Type helper to get all queue names as a union type
 */
export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES][keyof (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]];

