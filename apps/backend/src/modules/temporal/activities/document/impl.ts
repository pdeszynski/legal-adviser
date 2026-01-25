/**
 * PDF Export Activities Worker Implementation
 *
 * This file provides the activity implementations with their dependencies
 * to the Temporal worker. It serves as the connection point between
 * the activity definitions and the NestJS dependency injection container.
 *
 * The Temporal worker loads activities from the compiled dist/modules/temporal/activities/document/impl.js
 */

import {
  PdfExportActivities,
  createPdfExportActivities,
} from './pdf-export.activities';
import {
  DocumentGenerationActivities,
  createDocumentGenerationActivities,
} from './document-generation.activities';
import { DocumentType } from '../../../documents/entities/legal-document.entity';

/**
 * Activities implementation for the Temporal worker
 *
 * This file is loaded by the Temporal worker to register activities.
 * The worker calls the exported functions to get activity instances
 * with their dependencies injected.
 *
 * Note: In a production setup, dependencies would be injected via a
 * NestJS module that provides the services. For development, this
 * file provides a placeholder implementation.
 */

// Type for the activities object expected by Temporal
export interface Activities {
  // PDF Export activities
  initializeExport: PdfExportActivities['initializeExport'];
  generatePdf: PdfExportActivities['generatePdf'];
  completeExport: PdfExportActivities['completeExport'];
  failExport: PdfExportActivities['failExport'];
  sendCompletionNotification: PdfExportActivities['sendCompletionNotification'];

  // Document Generation activities
  initializeDocument: DocumentGenerationActivities['initializeDocument'];
  startAiGeneration: DocumentGenerationActivities['startAiGeneration'];
  pollAiCompletion: DocumentGenerationActivities['pollAiCompletion'];
  completeDocument: DocumentGenerationActivities['completeDocument'];
  failDocument: DocumentGenerationActivities['failDocument'];
  sendCompletionEmail: DocumentGenerationActivities['sendCompletionEmail'];
  sendFailureEmail: DocumentGenerationActivities['sendFailureEmail'];
}

/**
 * Create activities with dependencies
 *
 * This function is called by the Temporal worker to get the activity
 * implementations with their dependencies. In a real application, you
 * would pass in the actual service dependencies from your DI container.
 *
 * @param dependencies - Service dependencies
 * @returns Activities object for Temporal worker
 */
export function createActivities(dependencies: {
  documentsService: {
    findOne: (id: string) => Promise<{
      id: string;
      title: string;
      contentRaw: string | null;
      type: DocumentType;
      pdfUrl: string | null;
      session?: {
        user?: {
          id: string;
          email?: string;
          firstName?: string;
        };
      };
    }>;
    update: (
      id: string,
      data: { pdfUrl?: string },
    ) => Promise<{
      id: string;
      title: string;
      pdfUrl: string | null;
    }>;
    startGeneration: (id: string) => Promise<{ id: string }>;
    completeGeneration: (
      id: string,
      content: string,
    ) => Promise<{
      id: string;
      session: { user?: { email?: string; firstName?: string } };
    }>;
    failGeneration: (
      id: string,
      errorMessage: string,
    ) => Promise<{
      id: string;
      session: { user?: { email?: string; firstName?: string } };
    }>;
  };
  pdfGeneratorService: {
    generatePdf: (
      context: {
        title: string;
        content: string;
        documentType: string;
        createdAt: Date;
        metadata?: Record<string, unknown>;
      },
      options: {
        format?: 'A4' | 'Letter' | 'Legal';
        includeHeader?: boolean;
        includeFooter?: boolean;
        includePageNumbers?: boolean;
        watermark?: string;
        language?: 'pl' | 'en';
      },
    ) => Promise<{
      buffer: Buffer;
      pageCount: number;
      sizeBytes: number;
    }>;
    generateFilename: (title: string, documentId: string) => string;
  };
  storageService: {
    upload: (
      key: string,
      buffer: Buffer,
      metadata?: Record<string, unknown>,
    ) => Promise<{ url: string; key: string }>;
  };
  notificationService?: {
    sendNotification: (input: {
      userId: string;
      userEmail: string;
      templateType: string;
      templateData: Record<string, unknown>;
      channel?: 'EMAIL' | 'IN_APP' | 'BOTH';
      priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    }) => Promise<{ emailSent: boolean; inAppCreated: boolean }>;
  };
  aiClientService?: {
    generateDocument: (request: {
      description: string;
      document_type: string;
      context?: Record<string, unknown>;
      session_id: string;
    }) => Promise<{ task_id: string }>;
    getDocumentStatus: (taskId: string) => Promise<{
      status: string;
      content?: string;
      error?: string;
    }>;
  };
  progressPubSub?: {
    publish: (event: {
      documentId: string;
      sessionId: string;
      status: string;
      progress: number;
      message?: string;
      timestamp: Date;
    }) => void;
  };
  emailProducer?: {
    queueEmail: (data: {
      to: string;
      subject: string;
      template: string;
      templateData: Record<string, unknown>;
    }) => Promise<void>;
  };
  configService: {
    get: (key: string) => string | undefined;
  };
}): Activities {
  // Create PDF export activities
  const pdfExportActivities = createPdfExportActivities({
    documentsService: dependencies.documentsService,
    pdfGeneratorService: dependencies.pdfGeneratorService,
    storageService: dependencies.storageService,
    notificationService: dependencies.notificationService,
    progressPubSub: dependencies.progressPubSub,
    configService: dependencies.configService,
  });

  // Create document generation activities if AI client is available
  let documentGenerationActivities: DocumentGenerationActivities | undefined;
  if (dependencies.aiClientService && dependencies.emailProducer) {
    documentGenerationActivities = createDocumentGenerationActivities({
      documentsService: {
        startGeneration: dependencies.documentsService.startGeneration,
        completeGeneration: dependencies.documentsService.completeGeneration,
        failGeneration: dependencies.documentsService.failGeneration,
      },
      aiClientService: dependencies.aiClientService,
      progressPubSub: dependencies.progressPubSub || {
        publish: () => {
          // No-op if not provided
        },
      },
      emailProducer: dependencies.emailProducer,
      configService: dependencies.configService,
    });
  }

  // Return all activities bound to their implementations
  return {
    // PDF Export activities
    initializeExport:
      pdfExportActivities.initializeExport.bind(pdfExportActivities),
    generatePdf: pdfExportActivities.generatePdf.bind(pdfExportActivities),
    completeExport:
      pdfExportActivities.completeExport.bind(pdfExportActivities),
    failExport: pdfExportActivities.failExport.bind(pdfExportActivities),
    sendCompletionNotification:
      pdfExportActivities.sendCompletionNotification.bind(pdfExportActivities),

    // Document Generation activities (if available)
    initializeDocument: documentGenerationActivities
      ? documentGenerationActivities.initializeDocument.bind(
          documentGenerationActivities,
        )
      : () => {
          throw new Error('Document generation activities not available');
        },
    startAiGeneration: documentGenerationActivities
      ? documentGenerationActivities.startAiGeneration.bind(
          documentGenerationActivities,
        )
      : () => {
          throw new Error('Document generation activities not available');
        },
    pollAiCompletion: documentGenerationActivities
      ? documentGenerationActivities.pollAiCompletion.bind(
          documentGenerationActivities,
        )
      : () => {
          throw new Error('Document generation activities not available');
        },
    completeDocument: documentGenerationActivities
      ? documentGenerationActivities.completeDocument.bind(
          documentGenerationActivities,
        )
      : () => {
          throw new Error('Document generation activities not available');
        },
    failDocument: documentGenerationActivities
      ? documentGenerationActivities.failDocument.bind(
          documentGenerationActivities,
        )
      : () => {
          throw new Error('Document generation activities not available');
        },
    sendCompletionEmail: documentGenerationActivities
      ? documentGenerationActivities.sendCompletionEmail.bind(
          documentGenerationActivities,
        )
      : () => {
          throw new Error('Document generation activities not available');
        },
    sendFailureEmail: documentGenerationActivities
      ? documentGenerationActivities.sendFailureEmail.bind(
          documentGenerationActivities,
        )
      : () => {
          throw new Error('Document generation activities not available');
        },
  };
}

/**
 * Export activities for direct import
 *
 * This export allows the worker to import activities directly
 * without calling the factory function.
 */
export const activities: Activities = {} as Activities;
