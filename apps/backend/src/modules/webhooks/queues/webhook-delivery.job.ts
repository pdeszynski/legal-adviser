import { JobOptions } from '../../../shared/queues/base';

/**
 * Webhook Delivery Job Data
 */
export interface WebhookDeliveryJobData {
  /**
   * Unique identifier for this job
   */
  jobId: string;

  /**
   * ID of the webhook to deliver to
   */
  webhookId: string;

  /**
   * Event type being delivered
   */
  event: string;

  /**
   * Event payload
   */
  payload: Record<string, unknown>;

  /**
   * ID of the webhook delivery log entry
   */
  deliveryId: string;

  /**
   * Current attempt number
   */
  attemptNumber: number;

  /**
   * Maximum number of retries allowed
   */
  maxRetries: number;

  /**
   * Webhook endpoint URL
   */
  url: string;

  /**
   * Secret key for signature verification
   */
  secret: string;

  /**
   * HTTP headers to include in the request
   */
  headers?: Record<string, string> | null;

  /**
   * Request timeout in milliseconds
   */
  timeoutMs: number;

  /**
   * Timestamp when the job was created
   */
  createdAt: Date;

  /**
   * Optional metadata
   */
  metadata?: {
    source?: string;
    userId?: string;
    [key: string]: unknown;
  };
}

/**
 * Webhook Delivery Job Result
 */
export interface WebhookDeliveryJobResult {
  /**
   * ID of the webhook delivery log entry
   */
  deliveryId: string;

  /**
   * ID of the webhook
   */
  webhookId: string;

  /**
   * Event type that was delivered
   */
  event: string;

  /**
   * Whether the delivery was successful
   */
  success: boolean;

  /**
   * HTTP response code from the webhook endpoint
   */
  statusCode: number | null;

  /**
   * Response body from the webhook endpoint
   */
  responseBody: string | null;

  /**
   * Error message if delivery failed
   */
  errorMessage: string | null;

  /**
   * Duration of the HTTP request in milliseconds
   */
  durationMs: number;

  /**
   * Number of attempts made
   */
  attemptNumber: number;

  /**
   * Timestamp when the job was completed
   */
  completedAt: Date;

  /**
   * Processing time in milliseconds
   */
  processingTimeMs: number;
}

/**
 * Default webhook delivery job options
 */
export const DEFAULT_WEBHOOK_DELIVERY_JOB_OPTIONS: Partial<JobOptions> = {
  attempts: 3,
  removeOnComplete: 1000, // Keep last 1000 completed jobs
  removeOnFail: 500, // Keep last 500 failed jobs
};
