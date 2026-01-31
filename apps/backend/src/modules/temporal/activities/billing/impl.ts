/**
 * Ruling Indexing Activities Worker Implementation
 *
 * This file provides the activity implementations with their dependencies
 * to the Temporal worker. It serves as the connection point between
 * the activity definitions and the NestJS dependency injection container.
 *
 * The Temporal worker loads activities from the compiled dist/modules/temporal/activities/billing/impl.js
 */

import {
  RulingIndexingActivities,
  createRulingIndexingActivities,
} from './ruling-indexing.activities';

/**
 * Activities implementation for the Temporal worker
 *
 * This file is loaded by the Temporal worker to register activities.
 * The worker calls the exported functions to get activity instances
 * with their dependencies injected.
 */

// Type for the activities object expected by Temporal
export interface Activities {
  // Ruling Indexing activities
  initializeIndexing: RulingIndexingActivities['initializeIndexing'];
  processIndexingBatch: RulingIndexingActivities['processIndexingBatch'];
  completeIndexing: RulingIndexingActivities['completeIndexing'];
  failIndexing: RulingIndexingActivities['failIndexing'];
  checkRateLimit: RulingIndexingActivities['checkRateLimit'];
  indexInVectorStore: RulingIndexingActivities['indexInVectorStore'];
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
  saosAdapter: {
    search: (query: {
      query: string;
      courtType?: any;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    }) => Promise<{
      success: boolean;
      data?: Array<{
        ruling: {
          signature: string;
          rulingDate: Date;
          courtName: string;
          courtType: any;
          summary?: string;
          fullText?: string;
          metadata?: {
            sourceReference?: string;
            [key: string]: unknown;
          };
        };
      }>;
      error?: {
        message: string;
      };
    }>;
  };
  isapAdapter: {
    search: (query: {
      query: string;
      courtType?: any;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    }) => Promise<{
      success: boolean;
      data?: Array<{
        ruling: {
          signature: string;
          rulingDate: Date;
          courtName: string;
          courtType: any;
          summary?: string;
          fullText?: string;
          metadata?: {
            sourceReference?: string;
            [key: string]: unknown;
          };
        };
      }>;
      error?: {
        message: string;
      };
    }>;
  };
  legalRulingService: {
    findBySignature: (signature: string) => Promise<{
      id: string;
      signature: string;
      rulingDate: Date;
      courtName: string;
      courtType: any;
      summary?: string;
      fullText?: string;
      metadata?: {
        sourceReference?: string;
        [key: string]: unknown;
      };
    } | null>;
    findByCourtSignatureDate: (
      courtName: string,
      signature: string,
      rulingDate: Date,
    ) => Promise<{
      id: string;
      signature: string;
      rulingDate: Date;
      courtName: string;
      courtType: any;
      summary?: string;
      fullText?: string;
      metadata?: {
        sourceReference?: string;
        [key: string]: unknown;
      };
    } | null>;
    create: (data: {
      signature: string;
      rulingDate: Date;
      courtName: string;
      courtType?: any;
      summary?: string;
      fullText?: string;
      metadata?: {
        sourceReference?: string;
        indexedFrom?: string;
        indexedAt?: string;
        [key: string]: unknown;
      };
    }) => Promise<{
      id: string;
      signature: string;
    }>;
    update: (
      id: string,
      data: {
        signature?: string;
        rulingDate?: Date;
        courtName?: string;
        courtType?: any;
        summary?: string;
        fullText?: string;
        metadata?: {
          sourceReference?: string;
          indexedFrom?: string;
          indexedAt?: string;
          [key: string]: unknown;
        };
      },
    ) => Promise<{
      id: string;
      signature: string;
    }>;
  };
  vectorStoreService: {
    indexDocument: (
      documentId: string,
      content: string,
      options?: {
        chunkSize?: number;
        chunkOverlap?: number;
        metadata?: Record<string, unknown>;
      },
    ) => Promise<Array<{ id: string }>>;
  };
}): Activities {
  // Create ruling indexing activities
  const rulingIndexingActivities = createRulingIndexingActivities({
    saosAdapter: dependencies.saosAdapter as any,
    isapAdapter: dependencies.isapAdapter as any,
    legalRulingService: dependencies.legalRulingService as any,
    vectorStoreService: dependencies.vectorStoreService as any,
  });

  // Return all activities bound to their implementations
  return {
    // Ruling Indexing activities
    initializeIndexing: rulingIndexingActivities.initializeIndexing.bind(
      rulingIndexingActivities,
    ),
    processIndexingBatch: rulingIndexingActivities.processIndexingBatch.bind(
      rulingIndexingActivities,
    ),
    completeIndexing: rulingIndexingActivities.completeIndexing.bind(
      rulingIndexingActivities,
    ),
    failIndexing: rulingIndexingActivities.failIndexing.bind(
      rulingIndexingActivities,
    ),
    checkRateLimit: rulingIndexingActivities.checkRateLimit.bind(
      rulingIndexingActivities,
    ),
    indexInVectorStore: rulingIndexingActivities.indexInVectorStore.bind(
      rulingIndexingActivities,
    ),
  };
}

/**
 * Export activities for direct import
 *
 * This export allows the worker to import activities directly
 * without calling the factory function.
 */
export const activities: Activities = {} as Activities;
