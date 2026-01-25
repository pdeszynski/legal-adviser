/**
 * Temporal Module Public API
 *
 * Exports all public classes, interfaces, and constants for the Temporal module.
 */

export * from './temporal.module';
export * from './temporal.service';
export * from './temporal.worker';
export * from './temporal.constants';
export * from './temporal.interfaces';
export * from './temporal-metrics.service';
export * from './temporal-observability.service';

// Document Generation Workflow exports
export {
  type DocumentGenerationInput,
  type DocumentGenerationOutput,
  documentGeneration,
  generateWorkflowId as generateDocumentGenerationWorkflowId,
  workflowInfo,
} from './workflows/document/document-generation.workflow';
export {
  DocumentGenerationStarter,
  type StartDocumentGenerationRequest,
  type DocumentGenerationWorkflowStartResult,
} from './workflows/document/document-generation.starter';

// PDF Export Workflow exports
export {
  type PdfExportInput,
  type PdfExportOutput,
  pdfExport,
  generateWorkflowId as generatePdfExportWorkflowId,
} from './workflows/document/pdf-export.workflow';
export {
  PdfExportStarter,
  type StartPdfExportRequest,
  type PdfExportWorkflowStartResult,
} from './workflows/document/pdf-export.starter';

// Ruling Indexing Workflow exports
export {
  type RulingIndexingInput,
  type RulingIndexingOutput,
  type RulingSource,
  rulingIndexing,
  generateWorkflowId as generateRulingIndexingWorkflowId,
} from './workflows/billing/ruling-indexing.workflow';
export {
  RulingIndexingStarter,
  type StartRulingIndexingRequest,
  type RulingIndexingWorkflowStartResult,
  type DailySyncResult,
} from './workflows/billing/ruling-indexing.starter';

// Ruling Backfill Workflow exports
export {
  type RulingBackfillInput,
  type RulingBackfillOutput,
  rulingBackfill,
  generateBackfillWorkflowId,
} from './workflows/billing/ruling-backfill.workflow';
export {
  RulingBackfillStarter,
  type StartRulingBackfillRequest,
  type RulingBackfillWorkflowStartResult,
} from './workflows/billing/ruling-backfill.starter';

// Ruling Indexing Scheduler exports
export {
  RulingIndexingSchedulerService,
  type RulingIndexingSchedule,
  type CreateScheduleOptions,
  type ScheduleInfo,
  DEFAULT_CRON_EXPRESSIONS,
} from './workflows/billing/ruling-scheduler.service';

// Webhook Delivery Workflow exports
export {
  type WebhookDeliveryInput,
  type WebhookDeliveryOutput,
  webhookDelivery,
  generateWorkflowId as generateWebhookDeliveryWorkflowId,
} from './workflows/webhook/webhook-delivery.workflow';
export {
  WebhookDeliveryStarter,
  type StartWebhookDeliveryRequest,
  type WebhookDeliveryWorkflowStartResult,
} from './workflows/webhook/webhook-delivery.starter';

// Webhook Replay Workflow exports
export {
  type WebhookReplayInput,
  type WebhookReplayOutput,
  webhookReplay,
  generateReplayWorkflowId,
} from './workflows/webhook/webhook-replay.workflow';
export {
  WebhookReplayStarter,
  type StartWebhookReplayRequest,
  type WebhookReplayWorkflowStartResult,
} from './workflows/webhook/webhook-replay.starter';

// Email Sending Workflow exports
export {
  type EmailSendingInput,
  generateWorkflowId as generateEmailSendingWorkflowId,
} from './workflows/notification/email-sending.workflow';
export {
  EmailSendingStarter,
  type QueueEmailRequest,
  type EmailWorkflowStartResult,
} from './workflows/notification/email-sending.starter';

// Activity exports - renamed to avoid conflicts
export {
  type InitializeDocumentInput,
  type InitializeDocumentOutput,
  type StartAiGenerationInput,
  type StartAiGenerationOutput,
  type PollAiCompletionInput,
  type PollAiCompletionOutput,
  type CompleteDocumentInput,
  type CompleteDocumentOutput,
  type FailDocumentInput,
  type FailDocumentOutput,
  type SendCompletionEmailInput,
  type SendCompletionEmailOutput,
  type SendFailureEmailInput,
  type SendFailureEmailOutput,
  mapDocumentType,
  sleep,
  DocumentGenerationActivities as DocumentGenerationActivitiesImpl,
  createDocumentGenerationActivities,
} from './activities/document/document-generation.activities';

// PDF Export Activities exports
export {
  type InitializeExportInput,
  type InitializeExportOutput,
  type GeneratePdfInput,
  type GeneratePdfOutput,
  type CompleteExportInput,
  type CompleteExportOutput,
  type FailExportInput,
  type FailExportOutput,
  type SendCompletionNotificationInput,
  type SendCompletionNotificationOutput,
  PdfExportActivities as PdfExportActivitiesImpl,
  createPdfExportActivities,
} from './activities/document/pdf-export.activities';

// Ruling Indexing Activities exports
export {
  type InitializeIndexingInput,
  type InitializeIndexingOutput,
  type ProcessIndexingBatchInput,
  type ProcessIndexingBatchOutput,
  type CompleteIndexingInput,
  type CompleteIndexingOutput,
  type FailIndexingInput,
  type FailIndexingOutput,
  type CheckRateLimitInput,
  type CheckRateLimitOutput,
  type IndexInVectorStoreInput,
  type IndexInVectorStoreOutput,
  RulingIndexingActivities as RulingIndexingActivitiesImpl,
  createRulingIndexingActivities,
} from './activities/billing/ruling-indexing.activities';

// Webhook Delivery Activities exports
export {
  type AttemptWebhookDeliveryInput,
  type AttemptWebhookDeliveryOutput,
  type RecordWebhookSuccessInput,
  type RecordWebhookFailureInput,
  type RecordWebhookFailureOutput,
  type CheckWebhookActiveInput,
  type CheckWebhookActiveOutput,
  type CheckWebhookRateLimitInput,
  type CheckWebhookRateLimitOutput,
  type IncrementWebhookRateLimitInput,
  WebhookDeliveryActivities as WebhookDeliveryActivitiesImpl,
  createWebhookDeliveryActivities,
} from './activities/webhook/webhook-delivery.activities';
