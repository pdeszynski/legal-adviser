import { InjectQueue, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Job, Queue } from 'bull';
import { QUEUE_NAMES } from '../../../shared/queues/base/queue-names';
import { LegalRulingService } from '../services/legal-ruling.service';
import { SaosAdapter } from '../../../infrastructure/anti-corruption/saos/saos.adapter';
import { IsapAdapter } from '../../../infrastructure/anti-corruption/isap/isap.adapter';
import { CourtType } from '../entities/legal-ruling.entity';
import {
  SearchRulingsQuery,
  RulingSource,
} from '../../../domain/legal-rulings/value-objects/ruling-source.vo';
import type {
  RulingIndexingJobData,
  RulingIndexingJobResult,
} from './ruling-index.job';

/**
 * Ruling Indexing Queue Processor
 *
 * Handles asynchronous ruling indexing jobs from external sources (SAOS, ISAP).
 * Fetches rulings from external APIs and stores them in the local database.
 *
 * Processing Flow:
 * 1. Receive job with source and filtering parameters
 * 2. Fetch rulings from external source (SAOS or ISAP)
 * 3. Deduplicate against existing local rulings by signature
 * 4. Insert new rulings or update existing ones
 * 5. Update search vectors for full-text search
 *
 * Error Recovery:
 * - Jobs are retried up to 3 times by default
 * - Failed individual rulings are logged and skipped
 * - Partial results are tracked and reported
 */
@Injectable()
export class RulingIndexingProcessor implements OnModuleInit {
  private readonly logger = new Logger(RulingIndexingProcessor.name);

  /**
   * Default batch size if not specified
   */
  private readonly DEFAULT_BATCH_SIZE = 100;

  /**
   * Maximum batch size to prevent memory issues
   */
  private readonly MAX_BATCH_SIZE = 500;

  constructor(
    @InjectQueue(QUEUE_NAMES.RULING.INDEX)
    private readonly rulingIndexQueue: Queue<RulingIndexingJobData>,
    private readonly legalRulingService: LegalRulingService,
    private readonly saosAdapter: SaosAdapter,
    private readonly isapAdapter: IsapAdapter,
  ) {}

  onModuleInit() {
    try {
      this.rulingIndexQueue.process(async (job) => {
        return this.process(job);
      });

      this.rulingIndexQueue.on('completed', (job, result) => {
        this.onCompleted(job, result as RulingIndexingJobResult);
      });

      this.rulingIndexQueue.on('failed', (job, err) => {
        this.onFailed(job, err);
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Cannot define the same handler twice')
      ) {
        this.logger.warn(
          'Queue handler already registered (duplicate module instantiation detected). Skipping registration.',
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Process a ruling indexing job
   *
   * Main entry point for processing ruling indexing jobs.
   * Coordinates the entire indexing workflow.
   */
  async process(
    job: Job<RulingIndexingJobData>,
  ): Promise<RulingIndexingJobResult> {
    const { source, dateFrom, dateTo, courtType, batchSize, updateExisting } =
      job.data;
    const startTime = Date.now();

    this.logger.log(
      `Processing ruling indexing job ${job.id} from source ${source}`,
    );

    try {
      await job.progress(10);

      // Validate and clamp batch size
      const safeBatchSize = Math.min(
        batchSize ?? this.DEFAULT_BATCH_SIZE,
        this.MAX_BATCH_SIZE,
      );

      this.logger.debug(
        `Fetching up to ${safeBatchSize} rulings from ${source} ` +
          `with filters: courtType=${courtType ?? 'all'}, ` +
          `dateRange=${dateFrom?.toISOString() ?? 'start'} to ${dateTo?.toISOString() ?? 'end'}`,
      );

      // Step 1: Fetch rulings from external source
      const externalRulings = await this.fetchFromExternalSource(
        source,
        safeBatchSize,
        courtType,
        dateFrom,
        dateTo,
      );

      await job.progress(50);
      this.logger.debug(
        `Fetched ${externalRulings.length} rulings from ${source}`,
      );

      // Step 2: Process and store rulings
      const result = await this.indexRulings(
        externalRulings,
        source,
        updateExisting ?? false,
      );

      await job.progress(100);

      const processingTimeMs = Date.now() - startTime;
      this.logger.log(
        `Ruling indexing job ${job.id} completed from ${source}: ` +
          `added=${result.addedCount}, updated=${result.updatedCount}, ` +
          `skipped=${result.skippedCount}, failed=${result.failedCount} ` +
          `in ${processingTimeMs}ms`,
      );

      return {
        source,
        processedCount: result.processedCount,
        addedCount: result.addedCount,
        updatedCount: result.updatedCount,
        skippedCount: result.skippedCount,
        failedCount: result.failedCount,
        processingTimeMs,
        processedSignatures: result.processedSignatures,
        errors: result.errors,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to process ruling indexing job ${job.id}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Fetch rulings from external source (SAOS or ISAP)
   */
  private async fetchFromExternalSource(
    source: 'SAOS' | 'ISAP',
    limit: number,
    courtType?: CourtType,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<Array<{ ruling: any; sourceReference?: string }>> {
    try {
      const adapter = source === 'SAOS' ? this.saosAdapter : this.isapAdapter;

      // Build search query for recent rulings
      const searchQuery: SearchRulingsQuery = {
        query: '', // Empty query to get all rulings (will be filtered by date/court)
        courtType: courtType ? this.mapToDomainCourtType(courtType) : undefined,
        dateFrom,
        dateTo,
        limit,
      };

      const result = await adapter.search(searchQuery);

      if (!result.success || !result.data) {
        this.logger.warn(
          `Failed to fetch from ${source}: ${result.error?.message ?? 'Unknown error'}`,
        );
        return [];
      }

      // Extract ruling DTOs with source references
      return result.data.map((item) => ({
        ruling: item.ruling,
        sourceReference: item.ruling.metadata?.sourceReference,
      }));
    } catch (error) {
      this.logger.error(`Error fetching from ${source}`, error);
      return [];
    }
  }

  /**
   * Index rulings into the local database
   *
   * Deduplicates by signature and inserts/updates accordingly.
   */
  private async indexRulings(
    externalRulings: Array<{ ruling: any; sourceReference?: string }>,
    source: 'SAOS' | 'ISAP',
    updateExisting: boolean,
  ): Promise<{
    processedCount: number;
    addedCount: number;
    updatedCount: number;
    skippedCount: number;
    failedCount: number;
    processedSignatures: string[];
    errors: Array<{ signature: string; error: string }>;
  }> {
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const processedSignatures: string[] = [];
    const errors: Array<{ signature: string; error: string }> = [];

    for (const { ruling, sourceReference } of externalRulings) {
      try {
        // Check if ruling already exists
        const existingRuling = await this.legalRulingService.findBySignature(
          ruling.signature,
        );

        if (existingRuling) {
          if (updateExisting) {
            // Update existing ruling
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
            updatedCount++;
            processedSignatures.push(ruling.signature);
            this.logger.debug(`Updated ruling: ${ruling.signature}`);
          } else {
            // Skip existing ruling
            skippedCount++;
            this.logger.debug(`Skipped existing ruling: ${ruling.signature}`);
          }
        } else {
          // Insert new ruling
          await this.legalRulingService.create({
            ...ruling,
            metadata: {
              ...ruling.metadata,
              sourceReference:
                sourceReference ?? ruling.metadata?.sourceReference,
              indexedFrom: source,
              indexedAt: new Date().toISOString(),
            },
          });
          addedCount++;
          processedSignatures.push(ruling.signature);
          this.logger.debug(`Added new ruling: ${ruling.signature}`);
        }
      } catch (error) {
        failedCount++;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to index ruling ${ruling.signature}: ${errorMessage}`,
        );
        errors.push({
          signature: ruling.signature,
          error: errorMessage,
        });
      }
    }

    return {
      processedCount: externalRulings.length,
      addedCount,
      updatedCount,
      skippedCount,
      failedCount,
      processedSignatures,
      errors,
    };
  }

  /**
   * Map entity CourtType to domain CourtType
   */
  private mapToDomainCourtType(entityCourtType: CourtType): any {
    // Lazy import to avoid circular dependencies
    const {
      DomainCourtType,
    } = require('../../../domain/legal-rulings/value-objects/ruling-source.vo');

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
   * Handle job completion event
   */
  onCompleted(
    job: Job<RulingIndexingJobData>,
    result: RulingIndexingJobResult,
  ): void {
    this.logger.log(
      `Job ${job.id} completed: ${result.addedCount} added, ` +
        `${result.updatedCount} updated, ${result.skippedCount} skipped from ${result.source}`,
    );
  }

  /**
   * Handle job failure event
   */
  onFailed(job: Job<RulingIndexingJobData>, error: Error): void {
    this.logger.error(
      `Job ${job.id} failed for source ${job.data.source}: ${error.message}`,
      error.stack,
    );
  }
}
