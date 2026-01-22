/**
 * External API Types for SAOS (Supreme Administrative Court Database)
 *
 * These represent the actual SAOS API response format.
 * Changes in SAOS API should only affect these types.
 */

/**
 * SAOS judgment response structure
 */
export interface SaosJudgment {
  id: string;
  signature: string;
  judgment_date: string;
  court_name: string;
  court_code: string;
  judges: string[];
  text_content?: string;
  summary?: string;
  legal_basis?: string[];
  keywords?: string[];
  references?: string[];
  metadata?: {
    [key: string]: unknown;
  };
}

/**
 * SAOS search request parameters
 */
export interface SaosSearchRequest {
  query: string;
  date_from?: string;
  date_to?: string;
  court_code?: string;
  limit?: number;
  offset?: number;
}

/**
 * SAOS search response
 */
export interface SaosSearchResponse {
  results: SaosJudgment[];
  total: number;
  page: number;
  per_page: number;
}

/**
 * SAOS error response
 */
export interface SaosErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
