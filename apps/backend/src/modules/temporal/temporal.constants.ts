/**
 * Temporal Constants
 *
 * Defines constants for Temporal configuration, task queues,
 * and workflow types used throughout the application.
 */

// Dependency Injection Tokens
export const TEMPORAL_MODULE_OPTIONS = 'TEMPORAL_MODULE_OPTIONS';
export const TEMPORAL_CLIENT = 'TEMPORAL_CLIENT';
export const TEMPORAL_CONNECTION = 'TEMPORAL_CONNECTION';

// Task Queue Names
export const TEMPORAL_TASK_QUEUES = {
  DEFAULT: 'legal-ai-task-queue',
  DOCUMENT_PROCESSING: 'document-processing',
  AI_WORKFLOWS: 'ai-workflows',
  NOTIFICATION_WORKFLOWS: 'notification-workflows',
  BILLING_WORKFLOWS: 'billing-workflows',
  WEBHOOK_WORKFLOWS: 'webhook-workflows',
} as const;

// Workflow Names (to be used when starting workflows)
export const TEMPORAL_WORKFLOWS = {
  // Document Processing
  DOCUMENT_GENERATION: 'documentGeneration',
  PDF_EXPORT: 'pdfExport',
  DOCUMENT_EXPORT: 'documentExport',
  DOCUMENT_ANALYSIS: 'documentAnalysis',

  // AI Workflows
  AI_QUERY_PROCESSING: 'aiQueryProcessing',
  AI_CASE_RESEARCH: 'aiCaseResearch',

  // Notification Workflows
  EMAIL_SENDING: 'emailSending',
  NOTIFICATION_DELIVERY: 'notificationDelivery',

  // Billing/Ruling Workflows
  RULING_INDEXING: 'rulingIndexing',
  SUBSCRIPTION_RENEWAL: 'subscriptionRenewal',
  INVOICE_GENERATION: 'invoiceGeneration',

  // Webhook Workflows
  WEBHOOK_DELIVERY: 'webhookDelivery',
} as const;

// Environment Variable Keys
export const TEMPORAL_ENV_KEYS = {
  CLUSTER_URL: 'TEMPORAL_CLUSTER_URL',
  NAMESPACE: 'TEMPORAL_NAMESPACE',
  CLIENT_TIMEOUT: 'TEMPORAL_CLIENT_TIMEOUT',
  TASK_QUEUE: 'TEMPORAL_TASK_QUEUE',
  TLS_ENABLED: 'TEMPORAL_TLS_ENABLED',
  SERVER_NAME: 'TEMPORAL_SERVER_NAME',
  SERVER_ROOT_CA_CERT_PATH: 'TEMPORAL_SERVER_ROOT_CA_CERT_PATH',
  CLIENT_CERT_PATH: 'TEMPORAL_CLIENT_CERT_PATH',
  CLIENT_PRIVATE_KEY_PATH: 'TEMPORAL_CLIENT_PRIVATE_KEY_PATH',
} as const;

// Default Configuration Values
export const TEMPORAL_DEFAULTS = {
  CLUSTER_URL: 'localhost:7233',
  NAMESPACE: 'default',
  CLIENT_TIMEOUT: 30000, // 30 seconds in milliseconds
  TASK_QUEUE: TEMPORAL_TASK_QUEUES.DEFAULT,
  TLS_ENABLED: false,
  MAX_WORKFLOW_EXECUTION_TIME: '60m',
  MAX_WORKFLOW_TASK_TIMEOUT: '10s',
  MAX_ACTIVITY_EXECUTION_TIME: '30m',
  MAX_ACTIVITY_TASK_TIMEOUT: '10s',
} as const;

// Activity Retry Policies
export const TEMPORAL_ACTIVITY_RETRY_POLICIES = {
  // Default retry policy for most activities
  DEFAULT: {
    initialInterval: 1000, // 1 second
    backoffCoefficient: 2.0, // Exponential backoff
    maximumInterval: 60000, // 60 seconds max
    maximumAttempts: 3, // Retry up to 3 times
    nonRetryableErrorTypes: [],
  },
  // No retry for activities that should fail fast
  NO_RETRY: {
    maximumAttempts: 1, // No retry
  },
  // Extended retry for AI service calls
  AI_SERVICE: {
    initialInterval: 2000, // 2 seconds
    backoffCoefficient: 2.0, // Exponential backoff
    maximumInterval: 30000, // 30 seconds max
    maximumAttempts: 5, // Retry up to 5 times for transient AI failures
    nonRetryableErrorTypes: ['ValidationError', 'AuthenticationError'],
  },
  // Best effort retry for notifications (don't fail the workflow)
  BEST_EFFORT: {
    initialInterval: 1000,
    backoffCoefficient: 1.5,
    maximumInterval: 10000,
    maximumAttempts: 2, // Limited retries for notifications
    nonRetryableErrorTypes: [],
  },
} as const;

// Worker Options
export const TEMPORAL_WORKER_DEFAULTS = {
  MAX_CONCURRENT_WORKFLOW_TASKS: 100,
  MAX_CONCURRENT_ACTIVITIES: 100,
  MAX_CONCURRENT_LOCAL_ACTIVITIES: 100,
  TASK_QUEUE_WORKFLOWS_PER_POLL: 5,
  TASK_QUEUE_ACTIVITIES_PER_POLL: 5,
} as const;
