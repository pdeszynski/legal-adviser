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
 */
export interface LegalRulingMetadata {
  legalArea?: string;
  keywords?: string[];
  relatedCases?: string[];
  sourceReference?: string;
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
