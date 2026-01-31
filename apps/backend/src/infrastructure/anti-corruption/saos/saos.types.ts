/**
 * External API Types for SAOS (Supreme Administrative Court Database)
 *
 * These represent the actual SAOS API response format.
 * Changes in SAOS API should only affect these types.
 */

/**
 * SAOS judgment response structure
 * Based on https://www.saos.org.pl/api/search/judgments and https://www.saos.org.pl/api/judgments/{id}
 *
 * Note: The search endpoint returns summary data (fields marked with summary: true)
 * The detail endpoint /api/judgments/{id} returns complete data
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

  // Full judgment detail fields (from /api/judgments/{id} endpoint)
  /** Division name (wydział) - available in detail view */
  divisionName?: string;
  /** Full legal basis (podstawa prawna) for the judgment */
  legalBasis?: string[];
  /** Referenced regulations (przepisy) cited in the judgment */
  referencedRegulations?: Array<{
    raw: string;
    journalNo?: string;
    year?: number;
    position?: number;
    text?: string;
  }>;
  /** Parties to the proceedings (strony) */
  parties?: Array<{
    name: string;
    type: 'PERSON' | 'INSTITUTION' | 'UNKNOWN';
    role?: string;
  }>;
  /** Attorneys/representatives (pełnomocnicy) */
  attorneys?: Array<{
    name: string;
    role?: string;
    representedParty?: string;
  }>;
  /** Type of proceeding (typ postępowania) */
  proceedingType?: string;
  /** Summary/thesis of the judgment (teza) */
  summary?: string;
  /** Full text content (textContent) - available in detail view */
  fullTextContent?: string;
  /** Referenced court cases */
  referencedCourtCases?: Array<{
    caseNumber: string;
    href?: string;
  }>;
  /** Legal bases referenced */
  legalReferences?: Array<{
    raw: string;
  }>;
  /** Judgment keywords (słowa kluczowe) */
  keywordsDetail?: string[];

  // For backward compatibility with old transformer
  signature?: string;
  judgment_date?: string;
  court_name?: string;
  court_code?: string;
  text_content?: string;
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
