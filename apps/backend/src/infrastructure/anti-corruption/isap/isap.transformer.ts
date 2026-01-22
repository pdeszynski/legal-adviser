import { Injectable } from '@nestjs/common';
import { IntegrationError } from '../base/interfaces';
import {
  LegalRulingDto,
  SearchRulingsQuery,
  RulingSearchResult,
  CourtType,
  RulingSource,
  LegalRulingMetadata,
} from '../../../domain/legal-rulings/value-objects/ruling-source.vo';
import { IsapRuling, IsapSearchRequest } from './isap.types';

/**
 * ISAP Anti-Corruption Layer Transformer
 *
 * Translates between domain models and ISAP API models.
 * Isolates the domain from ISAP API changes.
 */
@Injectable()
export class IsapTransformer {
  /**
   * Transform ISAP ruling to domain ruling
   */
  toDomain(external: IsapRuling): LegalRulingDto {
    const metadata: LegalRulingMetadata = {
      legalArea: external.metadata?.legalArea as string | undefined,
      keywords: external.keywords,
      relatedCases: external.references,
      sourceReference: `ISAP:${external.id}`,
    };

    return {
      signature: external.signature,
      rulingDate: new Date(external.date),
      courtName: external.court.name,
      courtType: this.mapCourtType(external.court.type, external.court.code),
      summary: external.abstract ?? null,
      fullText: external.text ?? null,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      source: RulingSource.ISAP,
      externalId: external.id,
    };
  }

  /**
   * Transform domain search query to ISAP search request
   */
  toExternal(domain: SearchRulingsQuery): IsapSearchRequest {
    return {
      q: domain.query,
      year_from: domain.dateFrom?.getFullYear(),
      year_to: domain.dateTo?.getFullYear(),
      court_type: this.courtTypeToIsapType(domain.courtType),
      limit: domain.limit,
      offset: domain.offset,
    };
  }

  /**
   * Validate ISAP ruling structure
   */
  validateExternal(external: unknown): external is IsapRuling {
    if (!external || typeof external !== 'object') {
      return false;
    }

    const ruling = external as Partial<IsapRuling>;

    return (
      typeof ruling.id === 'string' &&
      typeof ruling.signature === 'string' &&
      typeof ruling.date === 'string' &&
      typeof ruling.court === 'object' &&
      ruling.court !== null &&
      typeof ruling.court.name === 'string' &&
      typeof ruling.court.type === 'string'
    );
  }

  /**
   * Map ISAP court type/code to domain court type
   */
  private mapCourtType(isapType: string, isapCode: string): CourtType {
    const typeMap: Record<string, CourtType> = {
      'Sąd Rejonowy': CourtType.REGIONAL_COURT,
      'Sąd Okręgowy': CourtType.DISTRICT_COURT,
      'Sąd Apelacyjny': CourtType.APPELLATE_COURT,
      'Sąd Najwyższy': CourtType.SUPREME_COURT,
      'Trybunał Konstytucyjny': CourtType.CONSTITUTIONAL_TRIBUNAL,
    };

    // Try by type first, then by code
    return typeMap[isapType] || this.mapCourtCode(isapCode);
  }

  /**
   * Map ISAP court code to domain court type
   */
  private mapCourtCode(isapCode: string): CourtType {
    const codeMap: Record<string, CourtType> = {
      SR: CourtType.REGIONAL_COURT,
      SO: CourtType.DISTRICT_COURT,
      SA: CourtType.APPELLATE_COURT,
      SN: CourtType.SUPREME_COURT,
      TK: CourtType.CONSTITUTIONAL_TRIBUNAL,
    };

    return codeMap[isapCode] || CourtType.REGIONAL_COURT;
  }

  /**
   * Map domain court type to ISAP court type
   */
  private courtTypeToIsapType(courtType?: CourtType): string | undefined {
    if (!courtType) {
      return undefined;
    }

    const typeMap: Record<CourtType, string | undefined> = {
      [CourtType.REGIONAL_COURT]: 'Sąd Rejonowy',
      [CourtType.DISTRICT_COURT]: 'Sąd Okręgowy',
      [CourtType.APPELLATE_COURT]: 'Sąd Apelacyjny',
      [CourtType.SUPREME_COURT]: 'Sąd Najwyższy',
      [CourtType.CONSTITUTIONAL_TRIBUNAL]: 'Trybunał Konstytucyjny',
      [CourtType.ADMINISTRATIVE_COURT]: undefined,
      [CourtType.SUPREME_ADMINISTRATIVE_COURT]: undefined,
    };

    return typeMap[courtType];
  }

  /**
   * Create integration error
   */
  createIntegrationError(
    error: unknown,
    retryable: boolean = true,
  ): IntegrationError {
    const code = error instanceof Error ? error.name : 'ISAP_INTEGRATION_ERROR';

    const message =
      error instanceof Error
        ? error.message
        : 'Unknown error in ISAP integration';

    return {
      code,
      message,
      retryable,
      originalError: error,
    };
  }

  /**
   * Calculate relevance score for ISAP result
   */
  calculateRelevance(query: string, ruling: IsapRuling): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    let score = 0;

    // Check signature match
    if (ruling.signature.toLowerCase().includes(query.toLowerCase())) {
      score += 1.0;
    }

    // Check court name match
    for (const term of queryTerms) {
      if (ruling.court.name.toLowerCase().includes(term)) {
        score += 0.3;
      }
    }

    // Check abstract match
    if (ruling.abstract) {
      const abstractLower = ruling.abstract.toLowerCase();
      const matchCount = queryTerms.filter((term) =>
        abstractLower.includes(term),
      ).length;
      score += (matchCount / queryTerms.length) * 0.7;
    }

    // Check full text match
    if (ruling.text) {
      const textLower = ruling.text.toLowerCase();
      const matchCount = queryTerms.filter((term) =>
        textLower.includes(term),
      ).length;
      score += (matchCount / queryTerms.length) * 0.5;
    }

    // Check keywords match
    if (ruling.keywords) {
      const keywordsLower = ruling.keywords.map((k) => k.toLowerCase());
      const matchCount = queryTerms.filter((term) =>
        keywordsLower.some((keyword) => keyword.includes(term)),
      ).length;
      score += (matchCount / queryTerms.length) * 0.6;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Generate headline snippet
   */
  generateHeadline(query: string, ruling: IsapRuling): string | undefined {
    const maxLength = 200;
    const text = ruling.abstract || ruling.text || '';

    if (!text) {
      return undefined;
    }

    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();

    const matchIndex = textLower.indexOf(queryLower);

    if (matchIndex === -1) {
      return text.length > maxLength
        ? text.substring(0, maxLength) + '...'
        : text;
    }

    const start = Math.max(0, matchIndex - 50);
    const end = Math.min(text.length, matchIndex + query.length + 50);

    let snippet = text.substring(start, end);

    if (start > 0) {
      snippet = '...' + snippet;
    }
    if (end < text.length) {
      snippet = snippet + '...';
    }

    return snippet;
  }
}
