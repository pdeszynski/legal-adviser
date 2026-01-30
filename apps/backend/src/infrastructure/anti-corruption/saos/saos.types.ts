/**
 * External API Types for SAOS (Supreme Administrative Court Database)
 *
 * These represent the actual SAOS API response format.
 * Changes in SAOS API should only affect these types.
 */

/**
 * SAOS judgment response structure
 * Based on https://www.saos.org.pl/api/search/judgments
 */
export interface SaosJudgment {
  id: number; // SAOS API returns id as number
  href: string;
  courtType: string;
  courtCases: Array<{
    caseNumber: string;
  }>;
  judgmentType: string;
  judges: Array<{
    name: string;
    function: string | null;
    specialRoles: string[];
  }>;
  textContent?: string;
  keywords?: string[];
  judgmentDate: string;
  division?: {
    id: number;
    name: string;
    code: string;
  };
  court?: {
    id: number;
    code: string;
    name: string;
  };
  metadata?: {
    [key: string]: unknown;
  };
  // For backward compatibility with old transformer
  signature?: string;
  judgment_date?: string;
  court_name?: string;
  court_code?: string;
  text_content?: string;
  summary?: string;
  legal_basis?: string[];
  references?: string[];
}

/**
 * SAOS search request parameters
 * Based on https://www.saos.org.pl/api/search/judgments
 */
export interface SaosSearchRequest {
  query?: string;
  judgmentDateFrom?: string;
  judgmentDateTo?: string;
  ccCourtType?: string;
  ccCourtCode?: string;
  ccCourtName?: string;
  courtType?: string;
  pageNumber?: number;
  pageSize?: number;
  sortingField?: string;
  sortingDirection?: string;
  lawJournalEntryCode?: string;
  caseNumber?: string;
  judgeName?: string;
  judgmentTypes?: string[];
  keywords?: string[];
}

/**
 * SAOS search response
 * Based on https://www.saos.org.pl/api/search/judgments
 */
export interface SaosSearchResponse {
  items: SaosJudgment[];
  links: Array<{
    rel: string;
    href: string;
  }>;
  queryTemplate?: {
    pageNumber?: { value: number; description: string };
    pageSize?: { value: number; description: string };
    judgmentDateFrom?: { value: string; description: string };
    judgmentDateTo?: { value: string; description: string };
    [key: string]: unknown;
  };
  info?: {
    totalResults: number;
  };
}

/**
 * SAOS error response
 */
export interface SaosErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
