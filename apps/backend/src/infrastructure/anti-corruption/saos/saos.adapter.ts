import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IntegrationResult, DEFAULT_RETRY_CONFIG } from '../base/interfaces';
import { SaosTransformer } from './saos.transformer';
import {
  SearchRulingsQuery,
  LegalRulingDto,
  RulingSearchResult,
  RulingSearchResponse,
} from '../../../domain/legal-rulings/value-objects/ruling-source.vo';
import {
  SaosJudgment,
  SaosSearchRequest,
  SaosSearchResponse,
  SaosErrorResponse,
} from './saos.types';

/**
 * Configuration for batch detail fetching
 */
export interface FetchJudgmentsDetailsOptions {
  /** Maximum number of concurrent requests */
  concurrency?: number;
  /** Delay between batches in milliseconds */
  batchDelay?: number;
  /** Whether to continue on error */
  continueOnError?: boolean;
  /** Progress callback */
  onProgress?: (current: number, total: number) => void;
}

/**
 * SAOS Anti-Corruption Layer Adapter
 *
 * Provides a clean interface to SAOS API, isolating the domain
 * from external API changes and handling transformation, validation,
 * and error recovery.
 */
@Injectable()
export class SaosAdapter {
  private readonly logger = new Logger(SaosAdapter.name);
  private readonly saosApiUrl: string;
  private readonly saosApiKey?: string;
  private readonly retryConfig = DEFAULT_RETRY_CONFIG;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly transformer: SaosTransformer,
  ) {
    this.saosApiUrl =
      this.configService.get<string>('SAOS_API_URL') ||
      'https://www.saos.org.pl/api';
    this.saosApiKey = this.configService.get<string>('SAOS_API_KEY');
    this.logger.log(`SAOS Adapter initialized with URL: ${this.saosApiUrl}`);
  }

  /**
   * Search SAOS for legal rulings
   */
  async search(
    query: SearchRulingsQuery,
  ): Promise<IntegrationResult<RulingSearchResponse>> {
    try {
      const saosRequest = this.transformer.toExternal(query);

      const saosResponse = await this.executeWithRetry<SaosSearchResponse>(
        async () => {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': 'Legal-AI-Platform/1.0',
          };

          if (this.saosApiKey) {
            headers['Authorization'] = `Bearer ${this.saosApiKey}`;
          }

          // Build query parameters for GET request
          // Using correct SAOS API parameter names
          const params = new URLSearchParams();
          if (saosRequest.query) params.append('q', saosRequest.query);
          if (saosRequest.judgmentDateFrom)
            params.append('judgmentDateFrom', saosRequest.judgmentDateFrom);
          if (saosRequest.judgmentDateTo)
            params.append('judgmentDateTo', saosRequest.judgmentDateTo);
          if (saosRequest.courtType)
            params.append('courtType', saosRequest.courtType);
          if (saosRequest.pageSize)
            params.append('pageSize', saosRequest.pageSize.toString());
          if (saosRequest.pageNumber !== undefined)
            params.append('pageNumber', saosRequest.pageNumber.toString());

          const url = `${this.saosApiUrl}/search/judgments?${params.toString()}`;

          const result = await firstValueFrom(
            this.httpService.get<SaosSearchResponse | SaosErrorResponse>(url, {
              headers,
            }),
          );

          // Check for error response
          if ('error' in result.data) {
            throw new Error(`SAOS API error: ${result.data.message}`);
          }

          return result.data;
        },
        'searchSaos',
      );

      // Transform SAOS judgments to domain models
      const itemCount = saosResponse.items?.length || 0;
      const results: RulingSearchResult[] = (saosResponse.items || [])
        .filter((judgment) => this.transformer.validateExternal(judgment))
        .map((judgment) => {
          const ruling = this.transformer.toDomain(judgment);
          const relevanceScore = this.transformer.calculateRelevance(
            query.query,
            judgment,
          );
          const headline = this.transformer.generateHeadline(
            query.query,
            judgment,
          );

          return {
            ruling,
            rank: relevanceScore,
            headline,
            relevanceScore,
          };
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

      if (itemCount > 0) {
        this.logger.log(
          `SAOS: Transformed ${results.length}/${itemCount} items`,
        );
      }

      return {
        success: true,
        data: {
          results,
          totalCount: saosResponse.info?.totalResults || results.length,
        },
      };
    } catch (error) {
      this.logger.error('Failed to search SAOS', error);
      return {
        success: false,
        error: this.transformer.createIntegrationError(error),
      };
    }
  }

  /**
   * Get a specific judgment by ID
   */
  async getJudgment(id: string): Promise<IntegrationResult<LegalRulingDto>> {
    try {
      const saosResponse = await this.executeWithRetry<SaosJudgment>(
        async () => {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': 'Legal-AI-Platform/1.0',
          };

          if (this.saosApiKey) {
            headers['Authorization'] = `Bearer ${this.saosApiKey}`;
          }

          const result = await firstValueFrom(
            this.httpService.get<SaosJudgment | SaosErrorResponse>(
              `${this.saosApiUrl}/judgments/${id}`,
              { headers },
            ),
          );

          // Check for error response
          if ('error' in result.data) {
            throw new Error(`SAOS API error: ${result.data.message}`);
          }

          return result.data;
        },
        'getSaosJudgment',
      );

      if (!this.transformer.validateExternal(saosResponse)) {
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'SAOS returned invalid judgment format',
            retryable: false,
          },
        };
      }

      const ruling = this.transformer.toDomain(saosResponse);

      return {
        success: true,
        data: ruling,
      };
    } catch (error) {
      this.logger.error(`Failed to get SAOS judgment ${id}`, error);
      return {
        success: false,
        error: this.transformer.createIntegrationError(error, false),
      };
    }
  }

  /**
   * Fetch full details for multiple judgments by their SAOS IDs
   *
   * This method handles rate limiting, retries, and concurrent requests
   * to efficiently fetch full judgment details for a list of IDs.
   *
   * @param judgmentIds - Array of SAOS judgment IDs (as numbers or strings)
   * @param options - Configuration for batch fetching
   * @returns Map of SAOS ID to LegalRulingDto (successful fetches only)
   */
  async fetchJudgmentDetails(
    judgmentIds: Array<string | number>,
    options: FetchJudgmentsDetailsOptions = {},
  ): Promise<Map<string, LegalRulingDto>> {
    const {
      concurrency = 5,
      batchDelay = 100,
      continueOnError = true,
      onProgress,
    } = options;

    const result = new Map<string, LegalRulingDto>();
    const failedIds: Array<{ id: string; error: string }> = [];
    const total = judgmentIds.length;

    if (total === 0) {
      return result;
    }

    this.logger.log(
      `[SAOS] Fetching full details for ${total} judgments (concurrency: ${concurrency}, batchDelay: ${batchDelay}ms)`,
    );

    // Process in batches to control concurrency and rate limiting
    for (let i = 0; i < judgmentIds.length; i += concurrency) {
      const batchNumber = Math.floor(i / concurrency) + 1;
      const batch = judgmentIds.slice(i, i + concurrency);

      this.logger.debug(
        `[SAOS] Processing batch ${batchNumber}: ${batch.length} judgments (IDs: ${batch.map(String).join(', ')})`,
      );

      // Fetch all judgments in this batch concurrently
      const batchResults = await Promise.allSettled(
        batch.map((id) => this.getJudgment(String(id))),
      );

      // Process results
      for (let j = 0; j < batchResults.length; j++) {
        const settledResult = batchResults[j];
        const judgmentId = String(batch[j]);

        if (settledResult.status === 'fulfilled') {
          const judgmentResult = settledResult.value;
          if (judgmentResult.success && judgmentResult.data) {
            result.set(judgmentId, judgmentResult.data);
            this.logger.debug(
              `[SAOS] Successfully fetched judgment ${judgmentId}: signature="${judgmentResult.data.signature}", court="${judgmentResult.data.courtName}"`,
            );
          } else {
            const errorMsg = judgmentResult.error?.message || 'Unknown error';
            this.logger.warn(
              `[SAOS] Failed to fetch judgment ${judgmentId}: ${errorMsg}`,
            );
            failedIds.push({ id: judgmentId, error: errorMsg });
            if (!continueOnError) {
              throw new Error(
                `Failed to fetch judgment ${judgmentId}: ${judgmentResult.error?.message}`,
              );
            }
          }
        } else {
          const errorMsg = settledResult.reason instanceof Error
            ? settledResult.reason.message
            : String(settledResult.reason);
          this.logger.error(
            `[SAOS] Promise rejected for judgment ${judgmentId}: ${errorMsg}`,
          );
          this.logger.debug(
            `[SAOS] Full error for judgment ${judgmentId}: ${settledResult.reason}`,
          );
          failedIds.push({ id: judgmentId, error: errorMsg });
          if (!continueOnError) {
            throw settledResult.reason;
          }
        }
      }

      // Report progress
      const currentCount = result.size;
      if (onProgress) {
        onProgress(currentCount, total);
      }

      // Add delay between batches for rate limiting (except for last batch)
      if (i + concurrency < judgmentIds.length && batchDelay > 0) {
        await this.sleep(batchDelay);
      }

      this.logger.debug(
        `[SAOS] Batch ${batchNumber} complete: ${currentCount}/${total} judgments fetched (${result.size} successful, ${failedIds.length} failed)`,
      );
    }

    // Log summary of completed fetch
    this.logger.log(
      `[SAOS] Fetched full details for ${result.size}/${total} judgments (${failedIds.length} failed)`,
    );

    // If there were failures, log a summary
    if (failedIds.length > 0) {
      this.logger.warn(
        `[SAOS] Failed to fetch ${failedIds.length} judgments. ` +
          `Failed IDs: ${failedIds.map((f) => f.id).join(', ')}`,
      );
      // Log first few failures in detail
      failedIds.slice(0, 5).forEach((f, idx) => {
        this.logger.debug(
          `[SAOS] Failure ${idx + 1}/${failedIds.length}: ID=${f.id}, error="${f.error}"`,
        );
      });
      if (failedIds.length > 5) {
        this.logger.debug(`[SAOS] ... and ${failedIds.length - 5} more failures`);
      }
    }

    return result;

    return result;
  }

  /**
   * Search SAOS for legal rulings with optional full detail fetching
   *
   * @param query - Search query parameters
   * @param fetchDetails - If true, fetches full details for all results
   * @param fetchOptions - Options for batch detail fetching (when fetchDetails is true)
   */
  async searchWithDetails(
    query: SearchRulingsQuery,
    fetchDetails: boolean = false,
    fetchOptions?: FetchJudgmentsDetailsOptions,
  ): Promise<IntegrationResult<RulingSearchResponse>> {
    // First, get search results (summary data)
    const searchResult = await this.search(query);

    if (!searchResult.success || !searchResult.data) {
      return searchResult;
    }

    // If not fetching details, return as-is
    if (!fetchDetails) {
      return searchResult;
    }

    // Fetch full details for all results
    const saosIds = searchResult.data.results
      .map((result) => result.ruling.externalId)
      .filter((id): id is string => id !== undefined);

    if (saosIds.length === 0) {
      return searchResult;
    }

    const detailMap = await this.fetchJudgmentDetails(saosIds, fetchOptions);

    // Merge detailed data back into search results
    const enhancedResults = searchResult.data.results.map((result) => {
      const detailedRuling = detailMap.get(result.ruling.externalId || '');
      if (detailedRuling) {
        return {
          ...result,
          ruling: detailedRuling,
        };
      }
      return result;
    });

    return {
      success: true,
      data: {
        ...searchResult.data,
        results: enhancedResults,
      },
    };
  }

  /**
   * Health check for SAOS API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await firstValueFrom(this.httpService.get(`${this.saosApiUrl}/health`));
      return true;
    } catch (error) {
      this.logger.error('SAOS health check failed', error);
      return false;
    }
  }

  /**
   * Execute operation (for IIntegrationAdapter interface compliance)
   */
  async execute(
    request: SearchRulingsQuery,
  ): Promise<IntegrationResult<RulingSearchResponse>> {
    return this.search(request);
  }

  /**
   * Execute operation with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    let lastError: unknown;
    let delay = this.retryConfig.initialDelayMs;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const errorCode = this.extractErrorCode(error);

        if (!this.isRetryable(errorCode)) {
          this.logger.error(
            `Non-retryable error in ${operationName}: ${errorCode}`,
            error,
          );
          throw error;
        }

        if (attempt < this.retryConfig.maxAttempts) {
          this.logger.warn(
            `Attempt ${attempt}/${this.retryConfig.maxAttempts} failed for ${operationName}. Retrying in ${delay}ms...`,
          );
          await this.sleep(delay);
          delay = Math.min(
            delay * this.retryConfig.backoffMultiplier,
            this.retryConfig.maxDelayMs,
          );
        }
      }
    }

    this.logger.error(
      `All ${this.retryConfig.maxAttempts} attempts failed for ${operationName}`,
      lastError,
    );
    throw lastError;
  }

  /**
   * Extract error code from error object
   */
  private extractErrorCode(error: unknown): string {
    if (error instanceof Error) {
      return error.name;
    }
    if (typeof error === 'object' && error !== null && 'code' in error) {
      return String(error.code);
    }
    return 'UNKNOWN';
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(errorCode: string): boolean {
    return this.retryConfig.retryableErrors.includes(errorCode);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
