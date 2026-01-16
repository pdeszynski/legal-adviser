/**
 * Base interface for Application Services.
 *
 * Application Services are orchestrators that coordinate between:
 * - Domain models (aggregates, entities, value objects)
 * - Repositories
 * - External services
 * - Multiple use cases
 *
 * They do NOT contain business logic - that belongs in the domain layer.
 * Instead, they coordinate the flow of data and operations.
 *
 * Key responsibilities:
 * - Transaction management
 * - Coordinating multiple use cases
 * - Cross-cutting concerns (logging, authorization)
 * - Input validation (before passing to use cases)
 */

/**
 * Result wrapper for application service operations.
 * Provides a consistent structure for returning operation results.
 */
export interface ServiceResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ServiceError;
}

/**
 * Service error structure for consistent error handling.
 */
export interface ServiceError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Creates a successful service result.
 */
export function successResult<T>(data: T): ServiceResult<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Creates a failed service result.
 */
export function failureResult<T>(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ServiceResult<T> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Pagination parameters for list operations.
 */
export interface PaginationParams {
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result structure.
 */
export interface PaginatedResult<T> {
  readonly items: T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

/**
 * Creates a paginated result.
 */
export function paginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
