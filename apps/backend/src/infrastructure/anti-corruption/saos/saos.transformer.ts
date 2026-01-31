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
    // Convert numeric id to string (SAOS API returns id as number)
    const idStr = String(external.id);

    // Build comprehensive metadata from all available SAOS fields
    const metadata: LegalRulingMetadata = {
      legalArea: external.metadata?.legalArea as string | undefined,
      keywords: external.keywords || external.keywordsDetail,
      relatedCases: external.references,
      sourceReference: `SAOS:${idStr}`,

      // Full judgment detail fields
      divisionName: external.divisionName || external.division?.name,
      legalBasis: external.legalBasis || external.legal_basis,
      referencedRegulations: external.referencedRegulations,
      parties: external.parties,
      attorneys: external.attorneys,
      proceedingType: external.proceedingType,

      // Judges information
      judges: external.judges?.map((judge) => ({
        name: judge.name,
        function: judge.function || undefined,
        specialRoles: judge.specialRoles,
      })),

      // Referenced court cases
      referencedCourtCases: external.referencedCourtCases,
    };

    // Handle both old and new SAOS API response structures
    const signature =
      external.signature ||
      (external.courtCases && external.courtCases[0]?.caseNumber) ||
      `SAOS-${idStr}`;

    const judgmentDateValue = external.judgmentDate || external.judgment_date;
    const rulingDate = judgmentDateValue
      ? new Date(judgmentDateValue)
      : new Date();

    const courtName =
      external.court?.name || external.court_name || 'Unknown Court';

    const courtCode =
      external.division?.code ||
      external.court_code ||
      external.courtType ||
      'COMMON';

    // Use fullTextContent from detail view if available, otherwise fall back to textContent/text_content
    const fullText =
      external.fullTextContent ||
      external.textContent ||
      external.text_content ||
      null;

    return {
      signature,
      rulingDate,
      courtName,
      courtType: this.mapCourtType(courtCode),
      summary: external.summary ?? null,
      fullText,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      source: RulingSource.SAOS,
      externalId: idStr,
    };
  }

  /**
   * Transform domain search query to SAOS search request
   */
  toExternal(domain: SearchRulingsQuery): SaosSearchRequest {
    // Helper to safely convert Date or string to ISO date string (YYYY-MM-DD)
    const toIsoDateString = (
      date: Date | string | undefined,
    ): string | undefined => {
      if (!date) return undefined;
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      // Check if date is valid
      if (isNaN(dateObj.getTime())) return undefined;
      return dateObj.toISOString().split('T')[0];
    };

    // Calculate pageNumber from offset (offset is 0-based, pageNumber is 0-based)
    // Assuming pageSize defaults to 10 if not specified
    const pageSize = domain.limit || 10;
    const pageNumber = domain.offset ? Math.floor(domain.offset / pageSize) : 0;

    return {
      judgmentDateFrom: toIsoDateString(domain.dateFrom),
      judgmentDateTo: toIsoDateString(domain.dateTo),
      courtType: domain.courtType,
      pageNumber,
      pageSize,
    };
  }

  /**
   * Validate SAOS judgment structure
   * Supports both new (camelCase) and old (snake_case) field names
   */
  validateExternal(external: unknown): external is SaosJudgment {
    if (!external || typeof external !== 'object') {
      return false;
    }

    const judgment = external as Partial<SaosJudgment>;

    // Check required id field (SAOS returns id as number, not string)
    if (typeof judgment.id !== 'string' && typeof judgment.id !== 'number') {
      return false;
    }

    // Check judgmentDate (new) or judgment_date (old)
    const hasJudgmentDate =
      typeof judgment.judgmentDate === 'string' ||
      typeof judgment.judgment_date === 'string';
    if (!hasJudgmentDate) {
      return false;
    }

    // Check court code (can be division.code, court.code, court_code, or courtType)
    const hasCourtCode =
      typeof judgment.division?.code === 'string' ||
      typeof judgment.court?.code === 'string' ||
      typeof judgment.court_code === 'string' ||
      typeof judgment.courtType === 'string';
    if (!hasCourtCode) {
      return false;
    }

    // Optional: signature is not required (can be generated)
    return true;
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
    if (
      judgment.signature &&
      judgment.signature.toLowerCase().includes(query.toLowerCase())
    ) {
      score += 1.0;
    }

    // Check court name match
    const courtName = judgment.court?.name || judgment.court_name;
    for (const term of queryTerms) {
      if (courtName && courtName.toLowerCase().includes(term)) {
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

    // Check full text match (handle both textContent and text_content)
    const fullText = judgment.textContent || judgment.text_content;
    if (fullText) {
      const textLower = fullText.toLowerCase();
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
