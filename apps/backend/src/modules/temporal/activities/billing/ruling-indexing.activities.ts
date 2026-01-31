/**
 * Ruling Indexing Activities
 *
 * Individual activities that can be called within workflows
 * for ruling indexing operations from external sources (SAOS, ISAP).
 *
 * These activities replace the Bull-based ruling indexing queue with
 * Temporal workflow activities.
 *
 * Activities handle:
 * - Fetching new rulings from SAOS/ISAP APIs
 * - Processing and parsing ruling data
 * - Indexing in vector store for RAG
 * - Storing in database with deduplication
 * - API rate limiting
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import { CourtType } from '../../../documents/entities/legal-ruling.entity';
import { SaosAdapter } from '../../../../infrastructure/anti-corruption/saos/saos.adapter';
import type { FetchJudgmentsDetailsOptions } from '../../../../infrastructure/anti-corruption/saos/saos.adapter';
import { IsapAdapter } from '../../../../infrastructure/anti-corruption/isap/isap.adapter';
import { LegalRulingService } from '../../../documents/services/legal-ruling.service';
import { VectorStoreService } from '../../../documents/services/vector-store.service';
import type { SearchRulingsQuery } from '../../../../domain/legal-rulings/value-objects/ruling-source.vo';
import { SaosIndexingAnalyticsService } from '../../../analytics/services/saos-indexing-analytics.service';

/**
 * Initialize Indexing Activity Input
 *
 * Input for initializing a ruling indexing job.
 * Estimates the total available rulings for batching.
 */
export interface InitializeIndexingInput {
  /** Unique indexing job ID */
  jobId: string;
  /** Data source to index from */
  source: 'SAOS' | 'ISAP';
  /** Start date for filtering */
  dateFrom?: Date;
  /** End date for filtering */
  dateTo?: Date;
  /** Filter by court type */
  courtType?: CourtType;
  /** User ID for tracking */
  userId?: string;
}

/**
 * Initialize Indexing Activity Output
 *
 * Output from initialization with estimated batch counts.
 */
export interface InitializeIndexingOutput {
  /** Total number of rulings available from source */
  totalAvailable: number;
  /** Estimated number of batches needed */
  estimatedBatches: number;
  /** Timestamp of initialization */
  initializedAt: string;
}

/**
 * Process Indexing Batch Activity Input
 *
 * Input for processing a single batch of rulings.
 */
export interface ProcessIndexingBatchInput {
  /** Unique indexing job ID */
  jobId: string;
  /** Data source to index from */
  source: 'SAOS' | 'ISAP';
  /** Batch number for progress tracking */
  batchNumber: number;
  /** Offset for pagination */
  offset: number;
  /** Number of rulings to process in this batch */
  batchSize: number;
  /** Start date for filtering */
  dateFrom?: Date;
  /** End date for filtering */
  dateTo?: Date;
  /** Filter by court type */
  courtType?: CourtType;
  /** Whether to update existing rulings */
  updateExisting?: boolean;
  /** Idempotency key for this batch */
  idempotencyKey?: string;
  /** Whether to fetch full judgment details (default: true) */
  fetchFullDetails?: boolean;
}

/**
 * Process Indexing Batch Activity Output
 *
 * Output from processing a batch of rulings.
 */
export interface ProcessIndexingBatchOutput {
  /** Batch number */
  batchNumber: number;
  /** Number of rulings processed */
  processed: number;
  /** Number of rulings indexed successfully */
  indexed: number;
  /** Number of rulings skipped (already exists, no update) */
  skipped: number;
  /** Number of rulings that failed */
  failed: number;
  /** Signatures of processed rulings */
  processedSignatures: string[];
  /** Processing time in milliseconds */
  processingTimeMs: number;
}

/**
 * Complete Indexing Activity Input
 *
 * Input for marking an indexing job as complete.
 */
export interface CompleteIndexingInput {
  /** Unique indexing job ID */
  jobId: string;
  /** Data source that was indexed */
  source: 'SAOS' | 'ISAP';
  /** Total number of rulings indexed */
  totalIndexed: number;
  /** Total number of rulings that failed */
  totalFailed: number;
  /** User ID for tracking */
  userId?: string;
}

/**
 * Complete Indexing Activity Output
 *
 * Output from completing an indexing job.
 */
export interface CompleteIndexingOutput {
  /** Job ID */
  jobId: string;
  /** Timestamp of completion */
  completedAt: string;
}

/**
 * Fail Indexing Activity Input
 *
 * Input for marking an indexing job as failed.
 */
export interface FailIndexingInput {
  /** Unique indexing job ID */
  jobId: string;
  /** Data source that was being indexed */
  source: 'SAOS' | 'ISAP';
  /** Error message describing the failure */
  errorMessage: string;
  /** User ID for tracking */
  userId?: string;
}

/**
 * Fail Indexing Activity Output
 *
 * Output from failing an indexing job.
 */
export interface FailIndexingOutput {
  /** Job ID */
  jobId: string;
  /** Timestamp of failure */
  failedAt: string;
  /** Error message */
  errorMessage: string;
}

/**
 * Rate Limit Check Activity Input
 */
export interface CheckRateLimitInput {
  /** Source being accessed */
  source: 'SAOS' | 'ISAP';
  /** Number of requests about to be made */
  requestCount: number;
}

/**
 * Rate Limit Check Activity Output
 */
export interface CheckRateLimitOutput {
  /** Whether requests are allowed */
  allowed: boolean;
  /** Time to wait before next request if not allowed (milliseconds) */
  waitTimeMs?: number;
  /** Current rate limit window info */
  windowInfo?: {
    remaining: number;
    resetAt: string;
  };
}

/**
 * Index in Vector Store Activity Input
 */
export interface IndexInVectorStoreInput {
  /** Ruling ID to index */
  rulingId: string;
  /** Full text content to index */
  fullText: string;
  /** Metadata for the embeddings */
  metadata?: Record<string, unknown>;
}

/**
 * Index in Vector Store Activity Output
 */
export interface IndexInVectorStoreOutput {
  /** Number of chunks indexed */
  chunkCount: number;
  /** Timestamp of indexing */
  indexedAt: string;
}

/**
 * Ruling Indexing Activities Container Class
 *
 * This class contains all activity implementations for ruling indexing.
 * Activities are registered with Temporal workers and called from workflows.
 */
@Injectable()
export class RulingIndexingActivities {
  private readonly logger = new Logger(RulingIndexingActivities.name);

  // Rate limiting state (in production, use Redis)
  private readonly rateLimitState = new Map<
    string,
    { count: number; resetAt: number }
  >();
  private readonly RATE_LIMITS = {
    SAOS: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
    ISAP: { maxRequests: 50, windowMs: 60000 }, // 50 requests per minute
  };

  // Idempotency tracking for processed batches
  private readonly processedBatches = new Set<string>();

  constructor(
    private readonly saosAdapter: SaosAdapter,
    private readonly isapAdapter: IsapAdapter,
    private readonly legalRulingService: LegalRulingService,
    private readonly vectorStoreService?: VectorStoreService,
    @Optional() private readonly saosAnalytics?: SaosIndexingAnalyticsService,
  ) {}

  /**
   * Initialize Indexing Activity
   *
   * Queries the external source to estimate total available rulings
   * and calculates the number of batches needed.
   */
  async initializeIndexing(
    input: InitializeIndexingInput,
  ): Promise<InitializeIndexingOutput> {
    const { jobId, source, dateFrom, dateTo, courtType } = input;

    this.logger.log(
      `Initializing ruling indexing job ${jobId} for source ${source}`,
    );

    try {
      // Build search query to get count
      const searchQuery: SearchRulingsQuery = {
        query: '',
        courtType: courtType ? this.mapToDomainCourtType(courtType) : undefined,
        dateFrom,
        dateTo,
        limit: 1, // Just need to check availability
      };

      const adapter = source === 'SAOS' ? this.saosAdapter : this.isapAdapter;
      const result = await adapter.search(searchQuery);

      // Adapter returns RulingSearchResponse with results and totalCount
      const responseData = result.data;
      const items = responseData?.results || [];
      const totalCount = responseData?.totalCount || 0;

      if (!result.success || !result.data) {
        this.logger.warn(
          `Failed to query ${source} during initialization: ${result.error?.message}`,
        );
        return {
          totalAvailable: 0,
          estimatedBatches: 0,
          initializedAt: new Date().toISOString(),
        };
      }

      // Use the actual total count from the API response
      const batchSize = 100;
      const estimatedBatches = Math.ceil(totalCount / batchSize);

      this.logger.log(
        `Initialized indexing job ${jobId}: ~${totalCount} rulings, ${estimatedBatches} batches`,
      );

      return {
        totalAvailable: totalCount,
        estimatedBatches,
        initializedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to initialize indexing job ${jobId}`, error);
      this.logger.debug(
        `[DEBUG] initializeIndexing error details: ${error instanceof Error ? error.stack : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Process Indexing Batch Activity
   *
   * Fetches a batch of rulings from the external source,
   * processes them, and stores them in the database with vector indexing.
   *
   * For SAOS source, can optionally fetch full judgment details including
   * judges, parties, attorneys, legal basis, and referenced regulations.
   */
  async processIndexingBatch(
    input: ProcessIndexingBatchInput,
  ): Promise<ProcessIndexingBatchOutput> {
    const {
      jobId,
      source,
      batchNumber,
      offset,
      batchSize,
      dateFrom,
      dateTo,
      courtType,
      updateExisting = true,
      idempotencyKey,
      fetchFullDetails = true, // Default to true for better data quality
    } = input;

    const startTime = Date.now();

    // Check idempotency - if this batch was already processed, return cached result
    if (idempotencyKey && this.processedBatches.has(idempotencyKey)) {
      this.logger.debug(
        `Batch ${batchNumber} (job ${jobId}) already processed, skipping`,
      );
      return {
        batchNumber,
        processed: 0,
        indexed: 0,
        skipped: 0,
        failed: 0,
        processedSignatures: [],
        processingTimeMs: 0,
      };
    }

    this.logger.debug(
      `Processing batch ${batchNumber} (job ${jobId}): offset=${offset}, size=${batchSize}`,
    );

    // Check rate limits before making requests
    const rateLimitCheck = await this.checkRateLimit({
      source,
      requestCount: 1,
    });

    if (!rateLimitCheck.allowed && rateLimitCheck.waitTimeMs) {
      this.logger.debug(
        `Rate limit reached for ${source}, waiting ${rateLimitCheck.waitTimeMs}ms`,
      );
      await this.sleep(rateLimitCheck.waitTimeMs);
    }

    let indexed = 0;
    let skipped = 0;
    let failed = 0;
    const processedSignatures: string[] = [];

    try {
      // Fetch rulings from external source
      const externalRulings = await this.fetchFromExternalSource({
        source,
        limit: batchSize,
        offset,
        dateFrom,
        dateTo,
        courtType,
        fetchFullDetails,
      });

      this.logger.log(
        `Batch ${batchNumber} (job ${jobId}): Fetched ${externalRulings.length} rulings from ${source}, processing...`,
      );

      // Track failures with details for better debugging
      const failureDetails: Array<{
        signature: string;
        error: string;
        courtName?: string;
        rulingDate?: string;
      }> = [];

      // Process each ruling
      for (const { ruling, sourceReference } of externalRulings) {
        try {
          const result = await this.indexSingleRuling({
            ruling,
            source,
            sourceReference,
            updateExisting,
          });

          if (result.indexed) {
            indexed++;
            processedSignatures.push(ruling.signature);
          } else if (result.skipped) {
            skipped++;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
          const errorDetails = {
            signature: ruling.signature || 'UNKNOWN',
            error: error instanceof Error ? error.message : 'Unknown error',
            courtName: ruling.courtName,
            rulingDate: ruling.rulingDate?.toISOString(),
          };
          failureDetails.push(errorDetails);

          // Log with full stack trace for debugging
          this.logger.error(
            `[${source}] Failed to index ruling in batch ${batchNumber}: ${JSON.stringify(errorDetails)}`,
          );
          this.logger.debug(
            `[${source}] Stack trace for ruling "${errorDetails.signature}": ${error instanceof Error ? error.stack : 'No stack trace'}`,
          );
        }
      }

      const processingTimeMs = Date.now() - startTime;

      // Log batch completion with failure details if any
      this.logger.log(
        `Batch ${batchNumber} (job ${jobId}) completed: ` +
          `indexed=${indexed}, skipped=${skipped}, failed=${failed} in ${processingTimeMs}ms`,
      );

      // Track metrics with SAOS analytics service
      if (this.saosAnalytics) {
        // Count records missing text content
        const recordsMissingTextContent = externalRulings.filter(
          ({ ruling }) => !ruling.fullText || ruling.fullText.trim().length === 0,
        ).length;

        this.saosAnalytics.logIndexingActivity({
          jobId,
          source,
          status: failed === 0 && indexed > 0 ? 'COMPLETED' : failed > 0 ? 'PARTIAL' : 'FAILED',
          recordsProcessed: externalRulings.length,
          recordsSaved: indexed,
          recordsSkipped: skipped,
          recordsWithErrors: failed,
          recordsMissingTextContent,
          processingTimeMs,
        });

        // Log errors for tracking
        for (const detail of failureDetails) {
          this.saosAnalytics.logIndexingError({
            source,
            errorType: 'INDEXING_FAILED',
            errorMessage: detail.error,
            rulingSignature: detail.signature,
            courtName: detail.courtName,
          });
        }

        // Log skipped records
        if (skipped > 0) {
          for (const { ruling } of externalRulings.slice(0, 10)) {
            // Log sample of skipped records
            const existingRuling = await this.legalRulingService.findBySignature(
              ruling.signature,
            );
            if (existingRuling) {
              this.saosAnalytics.logSkippedRecord({
                source,
                skipReason: 'DUPLICATE_SIGNATURE',
                rulingSignature: ruling.signature,
              });
            }
          }
        }
      }

      // If there were failures, log a summary for easier review
      if (failureDetails.length > 0) {
        this.logger.warn(
          `[${source}] Batch ${batchNumber} had ${failureDetails.length} failures. ` +
            `Failed signatures: ${failureDetails.map((f) => f.signature).join(', ')}`,
        );
        // Log first few failure details in detail for debugging
        failureDetails.slice(0, 3).forEach((detail, idx) => {
          this.logger.debug(
            `[${source}] Failure ${idx + 1}/${failureDetails.length}: ` +
              `signature="${detail.signature}", error="${detail.error}", ` +
              `court="${detail.courtName || 'N/A'}", date="${detail.rulingDate || 'N/A'}"`,
          );
        });
        if (failureDetails.length > 3) {
          this.logger.debug(
            `[${source}] ... and ${failureDetails.length - 3} more failures`,
          );
        }
      }

      // Mark batch as processed for idempotency
      if (idempotencyKey) {
        this.processedBatches.add(idempotencyKey);
      }

      return {
        batchNumber,
        processed: externalRulings.length,
        indexed,
        skipped,
        failed,
        processedSignatures,
        processingTimeMs,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to process batch ${batchNumber} (job ${jobId}): ${errorMessage}`,
      );
      this.logger.debug(
        `[DEBUG] Batch ${batchNumber} error stack: ${errorStack || 'No stack trace'}`,
      );

      return {
        batchNumber,
        processed: 0,
        indexed,
        skipped,
        failed,
        processedSignatures,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Complete Indexing Activity
   *
   * Marks an indexing job as complete and logs the results.
   */
  async completeIndexing(
    input: CompleteIndexingInput,
  ): Promise<CompleteIndexingOutput> {
    const { jobId, source, totalIndexed, totalFailed } = input;

    this.logger.log(
      `Ruling indexing job ${jobId} completed for source ${source}: ` +
        `indexed=${totalIndexed}, failed=${totalFailed}`,
    );

    // Track final job status with analytics service
    if (this.saosAnalytics) {
      this.saosAnalytics.logIndexingActivity({
        jobId,
        source,
        status: totalFailed === 0 ? 'COMPLETED' : 'PARTIAL',
        recordsProcessed: totalIndexed + totalFailed,
        recordsSaved: totalIndexed,
        recordsSkipped: 0,
        recordsWithErrors: totalFailed,
        recordsMissingTextContent: 0, // Not tracked at job level
        processingTimeMs: 0, // Not tracked at job level
      });
    }

    // Clean up idempotency tracking for this job
    for (const key of this.processedBatches) {
      if (key.startsWith(`${jobId}-`)) {
        this.processedBatches.delete(key);
      }
    }

    return {
      jobId,
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Fail Indexing Activity
   *
   * Marks an indexing job as failed and logs the error.
   */
  async failIndexing(input: FailIndexingInput): Promise<FailIndexingOutput> {
    const { jobId, source, errorMessage } = input;

    this.logger.error(
      `Ruling indexing job ${jobId} failed for source ${source}: ${errorMessage}`,
    );

    // Track job failure with analytics service
    if (this.saosAnalytics) {
      this.saosAnalytics.logIndexingActivity({
        jobId,
        source,
        status: 'FAILED',
        recordsProcessed: 0,
        recordsSaved: 0,
        recordsSkipped: 0,
        recordsWithErrors: 1,
        recordsMissingTextContent: 0,
        processingTimeMs: 0,
        errorMessage,
      });

      this.saosAnalytics.logIndexingError({
        source,
        errorType: 'JOB_FAILED',
        errorMessage,
      });
    }

    // Clean up idempotency tracking for this job
    for (const key of this.processedBatches) {
      if (key.startsWith(`${jobId}-`)) {
        this.processedBatches.delete(key);
      }
    }

    return {
      jobId,
      failedAt: new Date().toISOString(),
      errorMessage,
    };
  }

  /**
   * Check Rate Limit Activity
   *
   * Checks if the API request is within rate limits.
   * Uses in-memory tracking (use Redis in production).
   */
  async checkRateLimit(
    input: CheckRateLimitInput,
  ): Promise<CheckRateLimitOutput> {
    const { source, requestCount } = input;
    const now = Date.now();
    const limit = this.RATE_LIMITS[source];

    // Get or create rate limit entry
    let entry = this.rateLimitState.get(source);
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + limit.windowMs };
      this.rateLimitState.set(source, entry);
    }

    const allowed = entry.count + requestCount <= limit.maxRequests;
    const waitTimeMs = allowed ? 0 : entry.resetAt - now;

    if (allowed) {
      entry.count += requestCount;
    }

    return {
      allowed,
      waitTimeMs,
      windowInfo: {
        remaining: limit.maxRequests - entry.count,
        resetAt: new Date(entry.resetAt).toISOString(),
      },
    };
  }

  /**
   * Index in Vector Store Activity
   *
   * Indexes a ruling's full text in the vector store for semantic search.
   */
  async indexInVectorStore(
    input: IndexInVectorStoreInput,
  ): Promise<IndexInVectorStoreOutput> {
    const { rulingId, fullText, metadata } = input;

    if (!this.vectorStoreService) {
      return {
        chunkCount: 0,
        indexedAt: new Date().toISOString(),
      };
    }

    if (!fullText || fullText.trim().length === 0) {
      return {
        chunkCount: 0,
        indexedAt: new Date().toISOString(),
      };
    }

    try {
      const embeddings = await this.vectorStoreService.indexDocument(
        rulingId,
        fullText,
        {
          chunkSize: 500,
          chunkOverlap: 50,
          metadata,
        },
      );

      return {
        chunkCount: embeddings.length,
        indexedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to index ruling ${rulingId} in vector store: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      // Don't throw - vector indexing is best-effort
      return {
        chunkCount: 0,
        indexedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Fetch rulings from external source
   *
   * Private helper method to fetch rulings from SAOS or ISAP.
   * For SAOS, optionally fetches full judgment details.
   */
  private async fetchFromExternalSource(input: {
    source: 'SAOS' | 'ISAP';
    limit: number;
    offset: number;
    dateFrom?: Date;
    dateTo?: Date;
    courtType?: CourtType;
    fetchFullDetails?: boolean;
  }): Promise<Array<{ ruling: any; sourceReference?: string }>> {
    const {
      source,
      limit,
      offset,
      dateFrom,
      dateTo,
      courtType,
      fetchFullDetails = true,
    } = input;

    this.logger.debug(
      `[DEBUG] fetchFromExternalSource called with: ${JSON.stringify({
        source,
        limit,
        offset,
        dateFrom: dateFrom?.toISOString?.() ?? dateFrom,
        dateTo: dateTo?.toISOString?.() ?? dateTo,
        courtType,
        fetchFullDetails,
      })}`,
    );

    const searchQuery: SearchRulingsQuery = {
      query: '',
      courtType: courtType ? this.mapToDomainCourtType(courtType) : undefined,
      dateFrom,
      dateTo,
      limit,
      offset,
    };

    let result;

    // For SAOS, use the enhanced searchWithDetails method if requested
    if (source === 'SAOS' && fetchFullDetails) {
      this.logger.log(
        `SAOS: Fetching search results with full details (concurrency: 5, batchDelay: 100ms)`,
      );

      const fetchOptions: FetchJudgmentsDetailsOptions = {
        concurrency: 5,
        batchDelay: 100,
        continueOnError: true,
        onProgress: (current, total) => {
          this.logger.debug(`SAOS detail fetch progress: ${current}/${total}`);
        },
      };

      result = await this.saosAdapter.searchWithDetails(
        searchQuery,
        true,
        fetchOptions,
      );
    } else {
      // Standard search for ISAP or when full details not requested
      const adapter = source === 'SAOS' ? this.saosAdapter : this.isapAdapter;
      result = await adapter.search(searchQuery);
    }

    // Adapter returns RulingSearchResponse with results and totalCount
    const responseData = result.data;
    const items = responseData?.results || [];
    const totalCount = responseData?.totalCount || 0;

    if (!result.success || !result.data) {
      this.logger.warn(
        `Failed to fetch from ${source}: ${result.error?.message ?? 'Unknown error'}`,
      );
      return [];
    }

    if (items.length === 0) {
      this.logger.warn(
        `${source}: No more items to fetch for offset=${offset}, limit=${limit} (total available: ${totalCount})`,
      );
      return [];
    }

    this.logger.log(
      `${source}: Fetched ${items.length} rulings (total available: ${totalCount})`,
    );

    // Map RulingSearchResult to the expected format (extract the ruling property)
    return items.map((item: any) => ({
      ruling: item.ruling, // Extract LegalRulingDto from RulingSearchResult
      sourceReference: `${source}:${item.ruling.externalId}`,
    }));
  }

  /**
   * Index a single ruling
   *
   * Private helper method to index one ruling with deduplication.
   * Includes comprehensive logging to track each judgment's processing status.
   */
  private async indexSingleRuling(input: {
    ruling: any;
    source: 'SAOS' | 'ISAP';
    sourceReference?: string;
    updateExisting: boolean;
  }): Promise<{ indexed: boolean; skipped: boolean }> {
    const { ruling, source, sourceReference, updateExisting } = input;

    // Validate required fields before processing
    if (!ruling.signature) {
      this.logger.warn(
        `[${source}] Skipping ruling with missing signature: ${JSON.stringify({
          externalId: ruling.externalId,
          courtName: ruling.courtName,
          rulingDate: ruling.rulingDate,
        })}`,
      );
      return { indexed: false, skipped: true };
    }

    // Log warning if full text is missing (critical for RAG functionality)
    if (!ruling.fullText || ruling.fullText.trim().length === 0) {
      this.logger.warn(
        `[${source}] Ruling ${ruling.signature} has no full text content. ` +
          `This will limit search and RAG functionality. External ID: ${ruling.externalId || 'N/A'}`,
      );
    }

    // Log the start of processing for this ruling
    this.logger.debug(
      `[${source}] Processing ruling: signature="${ruling.signature}", court="${ruling.courtName}", date="${ruling.rulingDate?.toISOString()}"`,
    );

    try {
      // Check if ruling already exists by composite key (courtName + signature + rulingDate)
      // Signatures are only unique within a court, not nationwide
      const existingRuling =
        await this.legalRulingService.findByCourtSignatureDate(
          ruling.courtName,
          ruling.signature,
          ruling.rulingDate,
        );

      if (existingRuling) {
        this.logger.debug(
          `[${source}] Found existing ruling: signature="${ruling.signature}", court="${ruling.courtName}", date="${ruling.rulingDate.toISOString()}", existingId="${existingRuling.id}"`,
        );

        if (updateExisting) {
          // Update existing ruling - log what's being updated
          this.logger.debug(
            `[${source}] Updating existing ruling: signature="${ruling.signature}", hasFullText=${!!ruling.fullText}, hasSummary=${!!ruling.summary}`,
          );

          await this.legalRulingService.update(existingRuling.id, {
            ...ruling,
            metadata: {
              ...ruling.metadata,
              sourceReference:
                sourceReference ?? ruling.metadata?.sourceReference,
              indexedFrom: source,
              indexedAt: new Date().toISOString(),
            },
          });

          this.logger.log(
            `[${source}] Updated existing ruling: signature="${ruling.signature}", id="${existingRuling.id}"`,
          );

          // Re-index in vector store if full text changed
          if (ruling.fullText) {
            await this.indexInVectorStore({
              rulingId: existingRuling.id,
              fullText: ruling.fullText,
              metadata: {
                signature: ruling.signature,
                courtName: ruling.courtName,
                source,
              },
            });
          }

          return { indexed: true, skipped: false };
        } else {
          // Skip existing ruling
          this.logger.debug(
            `[${source}] Skipping existing ruling (updateExisting=false): signature="${ruling.signature}"`,
          );
          return { indexed: false, skipped: true };
        }
      } else {
        // Insert new ruling - log details before insertion
        this.logger.debug(
          `[${source}] Creating new ruling: signature="${ruling.signature}", court="${ruling.courtName}", date="${ruling.rulingDate?.toISOString()}", hasFullText=${!!ruling.fullText}, fullTextLength=${ruling.fullText?.length || 0}`,
        );

        const createdRuling = await this.legalRulingService.create({
          ...ruling,
          metadata: {
            ...ruling.metadata,
            sourceReference: sourceReference ?? ruling.metadata?.sourceReference,
            indexedFrom: source,
            indexedAt: new Date().toISOString(),
          },
        });

        this.logger.log(
          `[${source}] Created new ruling: signature="${ruling.signature}", id="${createdRuling.id}", court="${ruling.courtName}"`,
        );

        // Index in vector store
        if (ruling.fullText) {
          await this.indexInVectorStore({
            rulingId: createdRuling.id,
            fullText: ruling.fullText,
            metadata: {
              signature: ruling.signature,
              courtName: ruling.courtName,
              source,
            },
          });
        }

        return { indexed: true, skipped: false };
      }
    } catch (error) {
      // Log full error details with stack trace
      this.logger.error(
        `[${source}] Failed to index ruling: signature="${ruling.signature}", error=${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      this.logger.debug(
        `[${source}] Full error details for ruling "${ruling.signature}": ${error instanceof Error ? error.stack : String(error)}`,
      );

      // Re-throw to let the caller handle the failure
      throw error;
    }
  }

  /**
   * Map entity CourtType to domain CourtType
   */
  private mapToDomainCourtType(entityCourtType: CourtType): any {
    const {
      DomainCourtType,
    } = require('../../../../../domain/legal-rulings/value-objects/ruling-source.vo');

    const mapping: Record<CourtType, any> = {
      [CourtType.SUPREME_COURT]: DomainCourtType.SUPREME_COURT,
      [CourtType.APPELLATE_COURT]: DomainCourtType.APPELLATE_COURT,
      [CourtType.DISTRICT_COURT]: DomainCourtType.DISTRICT_COURT,
      [CourtType.REGIONAL_COURT]: DomainCourtType.REGIONAL_COURT,
      [CourtType.CONSTITUTIONAL_TRIBUNAL]:
        DomainCourtType.CONSTITUTIONAL_TRIBUNAL,
      [CourtType.ADMINISTRATIVE_COURT]: DomainCourtType.ADMINISTRATIVE_COURT,
      [CourtType.OTHER]: DomainCourtType.SUPREME_ADMINISTRATIVE_COURT,
    };

    return mapping[entityCourtType] || DomainCourtType.REGIONAL_COURT;
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Activity registration function
 *
 * Creates and returns the activities object with all dependencies injected.
 * This function is called by the Temporal worker to register activities.
 */
export type RulingIndexingActivitiesImpl = InstanceType<
  typeof RulingIndexingActivities
>;

export const createRulingIndexingActivities = (dependencies: {
  saosAdapter: SaosAdapter;
  isapAdapter: IsapAdapter;
  legalRulingService: LegalRulingService;
  vectorStoreService?: VectorStoreService;
}): RulingIndexingActivities => {
  const { saosAdapter, isapAdapter, legalRulingService, vectorStoreService } =
    dependencies;
  return new RulingIndexingActivities(
    saosAdapter,
    isapAdapter,
    legalRulingService,
    vectorStoreService,
  );
};
