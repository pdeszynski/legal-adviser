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
import { SaosJudgment, SaosSearchRequest } from './saos.types';

/**
 * SAOS Anti-Corruption Layer Transformer
 *
 * Translates between domain models and SAOS API models.
 * Isolates the domain from SAOS API changes.
 */
@Injectable()
export class SaosTransformer {
  /**
   * Transform SAOS judgment to domain ruling
   */
  toDomain(external: SaosJudgment): LegalRulingDto {
    const metadata: LegalRulingMetadata = {
      legalArea: external.metadata?.legalArea as string | undefined,
      keywords: external.keywords,
      relatedCases: external.references,
      sourceReference: `SAOS:${external.id}`,
    };

    return {
      signature: external.signature,
      rulingDate: new Date(external.judgment_date),
      courtName: external.court_name,
      courtType: this.mapCourtType(external.court_code),
      summary: external.summary ?? null,
      fullText: external.text_content ?? null,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      source: RulingSource.SAOS,
      externalId: external.id,
    };
  }

  /**
   * Transform domain search query to SAOS search request
   */
  toExternal(domain: SearchRulingsQuery): SaosSearchRequest {
    return {
      query: domain.query,
      date_from: domain.dateFrom?.toISOString().split('T')[0],
      date_to: domain.dateTo?.toISOString().split('T')[0],
      court_code: this.courtTypeToSaosCode(domain.courtType),
      limit: domain.limit,
      offset: domain.offset,
    };
  }

  /**
   * Validate SAOS judgment structure
   */
  validateExternal(external: unknown): external is SaosJudgment {
    if (!external || typeof external !== 'object') {
      return false;
    }

    const judgment = external as Partial<SaosJudgment>;

    return (
      typeof judgment.id === 'string' &&
      typeof judgment.signature === 'string' &&
      typeof judgment.judgment_date === 'string' &&
      typeof judgment.court_name === 'string' &&
      typeof judgment.court_code === 'string'
    );
  }

  /**
   * Map SAOS court code to domain court type
   */
  private mapCourtType(saosCode: string): CourtType {
    const codeMap: Record<string, CourtType> = {
      NSA: CourtType.SUPREME_ADMINISTRATIVE_COURT,
      WO: CourtType.ADMINISTRATIVE_COURT,
      WSA: CourtType.ADMINISTRATIVE_COURT,
    };

    return codeMap[saosCode] || CourtType.ADMINISTRATIVE_COURT;
  }

  /**
   * Map domain court type to SAOS court code
   */
  private courtTypeToSaosCode(courtType?: CourtType): string | undefined {
    if (!courtType) {
      return undefined;
    }

    const typeMap: Record<CourtType, string | undefined> = {
      [CourtType.SUPREME_ADMINISTRATIVE_COURT]: 'NSA',
      [CourtType.ADMINISTRATIVE_COURT]: 'WO',
      [CourtType.SUPREME_COURT]: undefined,
      [CourtType.APPELLATE_COURT]: undefined,
      [CourtType.DISTRICT_COURT]: undefined,
      [CourtType.REGIONAL_COURT]: undefined,
      [CourtType.CONSTITUTIONAL_TRIBUNAL]: undefined,
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
    const code = error instanceof Error ? error.name : 'SAOS_INTEGRATION_ERROR';

    const message =
      error instanceof Error
        ? error.message
        : 'Unknown error in SAOS integration';

    return {
      code,
      message,
      retryable,
      originalError: error,
    };
  }

  /**
   * Calculate relevance score for SAOS result
   */
  calculateRelevance(query: string, judgment: SaosJudgment): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    let score = 0;

    // Check signature match
    if (judgment.signature.toLowerCase().includes(query.toLowerCase())) {
      score += 1.0;
    }

    // Check court name match
    for (const term of queryTerms) {
      if (judgment.court_name.toLowerCase().includes(term)) {
        score += 0.3;
      }
    }

    // Check summary match
    if (judgment.summary) {
      const summaryLower = judgment.summary.toLowerCase();
      const matchCount = queryTerms.filter((term) =>
        summaryLower.includes(term),
      ).length;
      score += (matchCount / queryTerms.length) * 0.7;
    }

    // Check full text match
    if (judgment.text_content) {
      const textLower = judgment.text_content.toLowerCase();
      const matchCount = queryTerms.filter((term) =>
        textLower.includes(term),
      ).length;
      score += (matchCount / queryTerms.length) * 0.5;
    }

    // Check keywords match
    if (judgment.keywords) {
      const keywordsLower = judgment.keywords.map((k) => k.toLowerCase());
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
  generateHeadline(query: string, judgment: SaosJudgment): string | undefined {
    const maxLength = 200;
    const text = judgment.summary || judgment.text_content || '';

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
