import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IntegrationResult, DEFAULT_RETRY_CONFIG } from '../base/interfaces';
import { IsapTransformer } from './isap.transformer';
import {
  SearchRulingsQuery,
  LegalRulingDto,
  RulingSearchResult,
  RulingSearchResponse,
} from '../../../domain/legal-rulings/value-objects/ruling-source.vo';
import {
  IsapRuling,
  IsapSearchRequest,
  IsapSearchResponse,
  IsapErrorResponse,
} from './isap.types';

/**
 * ISAP Anti-Corruption Layer Adapter
 *
 * Provides a clean interface to ISAP API, isolating the domain
 * from external API changes and handling transformation, validation,
 * and error recovery.
 */
@Injectable()
export class IsapAdapter {
  private readonly logger = new Logger(IsapAdapter.name);
  private readonly isapApiUrl: string;
  private readonly isapApiKey?: string;
  private readonly retryConfig = DEFAULT_RETRY_CONFIG;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly transformer: IsapTransformer,
  ) {
    this.isapApiUrl =
      this.configService.get<string>('ISAP_API_URL') ||
      'https://isap.sejm.gov.pl/api';
    this.isapApiKey = this.configService.get<string>('ISAP_API_KEY');
    this.logger.log(`ISAP Adapter initialized with URL: ${this.isapApiUrl}`);
  }

  /**
   * Search ISAP for legal rulings
   */
  async search(
    query: SearchRulingsQuery,
  ): Promise<IntegrationResult<RulingSearchResponse>> {
    try {
      const isapRequest = this.transformer.toExternal(query);

      const isapResponse = await this.executeWithRetry<IsapSearchResponse>(
        async () => {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          };

          if (this.isapApiKey) {
            headers['Authorization'] = `Bearer ${this.isapApiKey}`;
          }

          const result = await firstValueFrom(
            this.httpService.get<IsapSearchResponse | IsapErrorResponse>(
              `${this.isapApiUrl}/search`,
              {
                headers,
                params: isapRequest as unknown as Record<string, unknown>,
              },
            ),
          );

          // Check for error response
          if ('error' in result.data) {
            throw new Error(`ISAP API error: ${result.data.message}`);
          }

          return result.data;
        },
        'searchIsap',
      );

      // Transform ISAP rulings to domain models
      const results: RulingSearchResult[] = isapResponse.items
        .filter((ruling) => this.transformer.validateExternal(ruling))
        .map((ruling) => {
          const domainRuling = this.transformer.toDomain(ruling);
          const relevanceScore = this.transformer.calculateRelevance(
            query.query,
            ruling,
          );
          const headline = this.transformer.generateHeadline(
            query.query,
            ruling,
          );

          return {
            ruling: domainRuling,
            rank: relevanceScore,
            headline,
            relevanceScore,
          };
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

      return {
        success: true,
        data: {
          results,
          totalCount: isapResponse.total || results.length,
        },
      };
    } catch (error) {
      this.logger.error('Failed to search ISAP', error);
      return {
        success: false,
        error: this.transformer.createIntegrationError(error),
      };
    }
  }

  /**
   * Get a specific ruling by ID
   */
  async getRuling(id: string): Promise<IntegrationResult<LegalRulingDto>> {
    try {
      const isapResponse = await this.executeWithRetry<IsapRuling>(async () => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };

        if (this.isapApiKey) {
          headers['Authorization'] = `Bearer ${this.isapApiKey}`;
        }

        const result = await firstValueFrom(
          this.httpService.get<IsapRuling | IsapErrorResponse>(
            `${this.isapApiUrl}/rulings/${id}`,
            { headers },
          ),
        );

        // Check for error response
        if ('error' in result.data) {
          throw new Error(`ISAP API error: ${result.data.message}`);
        }

        return result.data;
      }, 'getIsapRuling');

      if (!this.transformer.validateExternal(isapResponse)) {
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'ISAP returned invalid ruling format',
            retryable: false,
          },
        };
      }

      const ruling = this.transformer.toDomain(isapResponse);

      return {
        success: true,
        data: ruling,
      };
    } catch (error) {
      this.logger.error(`Failed to get ISAP ruling ${id}`, error);
      return {
        success: false,
        error: this.transformer.createIntegrationError(error, false),
      };
    }
  }

  /**
   * Health check for ISAP API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await firstValueFrom(this.httpService.get(`${this.isapApiUrl}/health`));
      return true;
    } catch (error) {
      this.logger.error('ISAP health check failed', error);
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
