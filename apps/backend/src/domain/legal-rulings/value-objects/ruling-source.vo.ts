/**
 * Domain Value Object: RulingSource
 *
 * Represents the source of a legal ruling in our domain model.
 * Independent of external API representations.
 */
export enum RulingSource {
  LOCAL = 'LOCAL',
  SAOS = 'SAOS',
  ISAP = 'ISAP',
}

/**
 * Domain Value Object: CourtType
 *
 * Standardized court types in our domain model.
 */
export enum CourtType {
  SUPREME_COURT = 'SUPREME_COURT',
  APPELLATE_COURT = 'APPELLATE_COURT',
  DISTRICT_COURT = 'DISTRICT_COURT',
  REGIONAL_COURT = 'REGIONAL_COURT',
  CONSTITUTIONAL_TRIBUNAL = 'CONSTITUTIONAL_TRIBUNAL',
  ADMINISTRATIVE_COURT = 'ADMINISTRATIVE_COURT',
  SUPREME_ADMINISTRATIVE_COURT = 'SUPREME_ADMINISTRATIVE_COURT',
}

/**
 * Domain Value Object: LegalRulingMetadata
 *
 * Standardized metadata structure for legal rulings.
 * Extended to support full judgment details from SAOS.
 */
export interface LegalRulingMetadata {
  legalArea?: string;
  keywords?: string[];
  relatedCases?: string[];
  sourceReference?: string;

  // Full judgment detail fields from SAOS
  /** Division name (wydział) within the court */
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
  /** Judges who presided over the case */
  judges?: Array<{
    name: string;
    function?: string;
    specialRoles?: string[];
  }>;
  /** Referenced court cases */
  referencedCourtCases?: Array<{
    caseNumber: string;
    href?: string;
  }>;

  [key: string]: unknown;
}

/**
 * Domain Model: LegalRulingDto
 *
 * Pure domain model for legal rulings.
 * Independent of any external API representation.
 */
export interface LegalRulingDto {
  signature: string;
  rulingDate: Date;
  courtName: string;
  courtType: CourtType;
  summary?: string | null;
  fullText?: string | null;
  metadata?: LegalRulingMetadata | null;
  source: RulingSource;
  externalId?: string;
}

/**
 * Domain Model: SearchRulingsQuery
 *
 * Domain-level search query interface.
 */
export interface SearchRulingsQuery {
  query: string;
  courtType?: CourtType;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Domain Model: RulingSearchResult
 *
 * Standardized search result with ranking.
 */
export interface RulingSearchResult {
  ruling: LegalRulingDto;
  rank: number;
  headline?: string;
  relevanceScore: number;
}

/**
 * Domain Model: RulingSearchResponse
 *
 * Search results with total count for pagination.
 */
export interface RulingSearchResponse {
  results: RulingSearchResult[];
  totalCount: number;
}
