/**
 * External API Types for ISAP (Internet System of Court Records)
 *
 * These represent the actual ISAP API response format.
 * Changes in ISAP API should only affect these types.
 */

/**
 * ISAP court ruling structure
 */
export interface IsapRuling {
  id: string;
  signature: string;
  date: string;
  court: {
    name: string;
    type: string;
    code: string;
  };
  text?: string;
  abstract?: string;
  legal_basis?: string[];
  keywords?: string[];
  references?: string[];
  year: number;
  position: number;
  metadata?: {
    [key: string]: unknown;
  };
}

/**
 * ISAP search request parameters
 */
export interface IsapSearchRequest {
  q: string; // Search query
  year_from?: number;
  year_to?: number;
  court_type?: string;
  limit?: number;
  offset?: number;
}

/**
 * ISAP search response
 */
export interface IsapSearchResponse {
  items: IsapRuling[];
  total: number;
  page: number;
  per_page: number;
}

/**
 * ISAP error response
 */
export interface IsapErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
