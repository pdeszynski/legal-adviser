/**
 * Anti-Corruption Layer Base Interfaces
 *
 * Defines the contract for all external system integrations.
 * Prevents external API changes from propagating into the domain layer.
 */

/**
 * Result wrapper for anti-corruption layer operations
 */
export interface IntegrationResult<T> {
  success: boolean;
  data?: T;
  error?: IntegrationError;
}

/**
 * Standardized error structure for integration failures
 */
export interface IntegrationError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
  originalError?: unknown;
}

/**
 * Base interface for all anti-corruption layer transformers
 */
export interface ITransformer<TExternal, TDomain> {
  /**
   * Transform external API response to domain model
   */
  toDomain(external: TExternal): TDomain;

  /**
   * Transform domain model to external API request format
   */
  toExternal(domain: TDomain): TExternal;

  /**
   * Validate external data before transformation
   */
  validateExternal(external: unknown): external is TExternal;
}

/**
 * Base interface for integration adapters
 */
export interface IIntegrationAdapter<TExternal, TDomain> {
  /**
   * Execute the integration operation
   */
  execute(request: TDomain): Promise<IntegrationResult<TDomain>>;

  /**
   * Check if the external service is available
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'SERVICE_UNAVAILABLE',
  ],
};
