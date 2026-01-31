import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CourtType } from '../entities/legal-ruling.entity';
import {
  AdvancedSearchLegalRulingsInput,
  AdvancedSearchTermInput,
  BooleanOperator,
  SearchField,
  SearchSource,
} from '../dto/legal-ruling-search.dto';

/**
 * Search result with relevance score and source information
 */
interface AdvancedSearchResult {
  ruling: Record<string, unknown>;
  rank: number;
  headline?: string;
  source: SearchSource;
}

/**
 * Advanced search response with query explanation
 */
interface AdvancedSearchResponse {
  results: AdvancedSearchResult[];
  totalCount: number;
  count: number;
  offset: number;
  hasMore: boolean;
  queryExplanation?: string;
}

/**
 * Advanced search options
 */
interface AdvancedSearchOptions {
  searchTerms: AdvancedSearchTermInput[];
  courtType?: CourtType;
  legalArea?: string;
  keywords?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  sources: Array<'LOCAL' | 'SAOS' | 'ISAP'>;
  limit: number;
  offset: number;
}

/**
 * Advanced Legal Ruling Search Service
 *
 * Provides advanced search capabilities with:
 * - Boolean operators (AND, OR, NOT)
 * - Field-specific search (signature, court name, summary, full text, keywords, legal area)
 * - Multiple search terms combined with operators
 * - Query explanation for users
 *
 * Uses PostgreSQL full-text search with tsquery for advanced boolean operations.
 */
@Injectable()
export class AdvancedLegalRulingSearchService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Advanced search with boolean operators and field-specific search
   *
   * @param options Advanced search options
   * @returns Search results with relevance ranking and query explanation
   */
  async advancedSearch(
    options: AdvancedSearchOptions,
  ): Promise<AdvancedSearchResponse> {
    const { searchTerms, limit, offset } = options;

    // Build the PostgreSQL query with boolean operators
    const { tsquery, queryExplanation } = this.buildTsQuery(searchTerms);

    if (!tsquery) {
      return {
        results: [],
        totalCount: 0,
        count: 0,
        offset,
        hasMore: false,
        queryExplanation: 'Invalid search query',
      };
    }

    // Build field-specific search conditions
    const fieldConditions = this.buildFieldConditions(searchTerms);

    // Execute search (LOCAL only for now, could be extended to SAOS/ISAP)
    const [results, totalCount] = await Promise.all([
      this.executeSearch(tsquery, fieldConditions, options, limit, offset),
      this.countResults(tsquery, fieldConditions, options),
    ]);

    const count = results.length;
    const hasMore = offset + count < totalCount;

    return {
      results,
      totalCount,
      count,
      offset,
      hasMore,
      queryExplanation,
    };
  }

  /**
   * Build PostgreSQL tsquery from search terms with boolean operators
   */
  private buildTsQuery(searchTerms: AdvancedSearchTermInput[]): {
    tsquery: string;
    queryExplanation: string;
  } {
    if (!searchTerms || searchTerms.length === 0) {
      return { tsquery: '', queryExplanation: 'No search terms provided' };
    }

    const queryParts: string[] = [];
    const explanationParts: string[] = [];

    for (let i = 0; i < searchTerms.length; i++) {
      const term = searchTerms[i];
      const sanitizedTerm = this.sanitizeSearchTerm(term.term);

      if (!sanitizedTerm) {
        continue;
      }

      // Convert to tsquery format
      const tsqueryTerm = this.termToTsquery(sanitizedTerm);

      // Apply boolean operator (except for first term)
      let operator = '';
      if (i === 0) {
        operator = '';
      } else {
        switch (term.operator) {
          case BooleanOperator.AND:
            operator = '& ';
            break;
          case BooleanOperator.OR:
            operator = '| ';
            break;
          case BooleanOperator.NOT:
            operator = '&! ';
            break;
          default:
            operator = '& ';
        }
      }

      // Apply field-specific weighting
      let weightedQuery = tsqueryTerm;
      let fieldExplanation = '';

      switch (term.field) {
        case SearchField.SIGNATURE:
          // Highest weight (A)
          weightedQuery = `${tsqueryTerm} <= A`;
          fieldExplanation = 'in signature';
          break;
        case SearchField.COURT_NAME:
          // High weight (B)
          weightedQuery = `${tsqueryTerm} <= B`;
          fieldExplanation = 'in court name';
          break;
        case SearchField.SUMMARY:
          // Medium weight (C)
          weightedQuery = `${tsqueryTerm} <= C`;
          fieldExplanation = 'in summary';
          break;
        case SearchField.FULL_TEXT:
          // Low weight (D)
          weightedQuery = `${tsqueryTerm} <= D`;
          fieldExplanation = 'in full text';
          break;
        case SearchField.KEYWORDS:
          // Medium weight (C)
          weightedQuery = `${tsqueryTerm} <= C`;
          fieldExplanation = 'in keywords';
          break;
        case SearchField.LEGAL_AREA:
          // High weight (B)
          weightedQuery = `${tsqueryTerm} <= B`;
          fieldExplanation = 'in legal area';
          break;
        case SearchField.ALL:
        default:
          // No field restriction, search all fields
          weightedQuery = tsqueryTerm;
          fieldExplanation = 'in all fields';
          break;
      }

      queryParts.push(operator + weightedQuery);

      // Build explanation
      const operatorText =
        i === 0
          ? ''
          : term.operator === BooleanOperator.AND
            ? ' AND '
            : term.operator === BooleanOperator.OR
              ? ' OR '
              : ' NOT ';

      explanationParts.push(
        `${operatorText}"${sanitizedTerm}" ${fieldExplanation}`,
      );
    }

    const tsquery = queryParts.join(' ');
    const queryExplanation = explanationParts.join('');

    return { tsquery, queryExplanation };
  }

  /**
   * Build field-specific search conditions for WHERE clause
   */
  private buildFieldConditions(searchTerms: AdvancedSearchTermInput[]): {
    signatureConditions: string[];
    courtNameConditions: string[];
    summaryConditions: string[];
    fullTextConditions: string[];
    keywordsConditions: string[];
    legalAreaConditions: string[];
  } {
    const conditions = {
      signatureConditions: [] as string[],
      courtNameConditions: [] as string[],
      summaryConditions: [] as string[],
      fullTextConditions: [] as string[],
      keywordsConditions: [] as string[],
      legalAreaConditions: [] as string[],
    };

    for (const term of searchTerms) {
      const sanitizedTerm = this.sanitizeSearchTerm(term.term);
      if (!sanitizedTerm) {
        continue;
      }

      const ilikePattern = `%${sanitizedTerm}%`;

      switch (term.field) {
        case SearchField.SIGNATURE:
          conditions.signatureConditions.push(
            `r.signature ILIKE '${ilikePattern}'`,
          );
          break;
        case SearchField.COURT_NAME:
          conditions.courtNameConditions.push(
            `r."courtName" ILIKE '${ilikePattern}'`,
          );
          break;
        case SearchField.SUMMARY:
          conditions.summaryConditions.push(
            `r.summary ILIKE '${ilikePattern}'`,
          );
          break;
        case SearchField.FULL_TEXT:
          conditions.fullTextConditions.push(
            `r."fullText" ILIKE '${ilikePattern}'`,
          );
          break;
        case SearchField.KEYWORDS:
          conditions.keywordsConditions.push(
            `EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(r.metadata->'keywords', '[]'::jsonb)) kw WHERE kw ILIKE '${ilikePattern}')`,
          );
          break;
        case SearchField.LEGAL_AREA:
          conditions.legalAreaConditions.push(
            `r.metadata->>'legalArea' ILIKE '${ilikePattern}'`,
          );
          break;
        case SearchField.ALL:
        default:
          // Add to all conditions
          conditions.signatureConditions.push(
            `r.signature ILIKE '${ilikePattern}'`,
          );
          conditions.courtNameConditions.push(
            `r."courtName" ILIKE '${ilikePattern}'`,
          );
          conditions.summaryConditions.push(
            `r.summary ILIKE '${ilikePattern}'`,
          );
          conditions.fullTextConditions.push(
            `r."fullText" ILIKE '${ilikePattern}'`,
          );
          conditions.keywordsConditions.push(
            `EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(r.metadata->'keywords', '[]'::jsonb)) kw WHERE kw ILIKE '${ilikePattern}')`,
          );
          conditions.legalAreaConditions.push(
            `r.metadata->>'legalArea' ILIKE '${ilikePattern}'`,
          );
          break;
      }
    }

    return conditions;
  }

  /**
   * Execute the search query
   */
  private async executeSearch(
    tsquery: string,
    fieldConditions: ReturnType<
      AdvancedLegalRulingSearchService['buildFieldConditions']
    >,
    options: AdvancedSearchOptions,
    limit: number,
    offset: number,
  ): Promise<AdvancedSearchResult[]> {
    const { courtType, legalArea, keywords, dateFrom, dateTo, sources } =
      options;

    // Only search LOCAL source for now
    if (!sources.includes('LOCAL')) {
      return [];
    }

    let sql = `
      SELECT
        r.*,
        ts_rank(
          COALESCE(r."searchVector", to_tsvector('polish', '')),
          to_tsquery('polish', $1),
          1 -- Normalization by document length
        ) as rank,
        ts_headline(
          'polish',
          COALESCE(r.summary, '') || ' ' || COALESCE(r."fullText", ''),
          to_tsquery('polish', $1),
          'MaxWords=35, MinWords=15, ShortWord=3, HighlightAll=FALSE, MaxFragments=2, FragmentDelimiter=" ... "'
        ) as headline
      FROM legal_rulings r
      WHERE r."searchVector" @@ to_tsquery('polish', $1)
    `;

    const params: (string | Date | number)[] = [tsquery];
    let paramIndex = 2;

    // Add court type filter
    if (courtType) {
      sql += ` AND r."courtType" = $${paramIndex}`;
      params.push(courtType);
      paramIndex++;
    }

    // Add legal area filter
    if (legalArea) {
      sql += ` AND r.metadata->>'legalArea' ILIKE $${paramIndex}`;
      params.push(`%${legalArea}%`);
      paramIndex++;
    }

    // Add keywords filter (must match all)
    if (keywords && keywords.length > 0) {
      for (const keyword of keywords) {
        sql += ` AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(r.metadata->'keywords', '[]'::jsonb)) kw WHERE kw ILIKE $${paramIndex})`;
        params.push(`%${keyword}%`);
        paramIndex++;
      }
    }

    // Add date range filters
    if (dateFrom) {
      sql += ` AND r."rulingDate" >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      sql += ` AND r."rulingDate" <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    // Order by relevance rank, then by ruling date
    sql += ` ORDER BY rank DESC, r."rulingDate" DESC`;

    // Add pagination
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    // Execute the raw query
    const results = await this.dataSource.query(sql, params);

    // Map results to SearchResult objects
    return results.map(
      (row: Record<string, unknown> & { rank: number; headline: string }) => ({
        ruling: row,
        rank: parseFloat(row.rank?.toString() || '0'),
        headline: row.headline,
        source: SearchSource.LOCAL,
      }),
    );
  }

  /**
   * Count total results for pagination
   */
  private async countResults(
    tsquery: string,
    fieldConditions: ReturnType<
      AdvancedLegalRulingSearchService['buildFieldConditions']
    >,
    options: AdvancedSearchOptions,
  ): Promise<number> {
    const { courtType, legalArea, keywords, dateFrom, dateTo, sources } =
      options;

    // Only count from LOCAL source for now
    if (!sources.includes('LOCAL')) {
      return 0;
    }

    let sql = `
      SELECT COUNT(*) as count
      FROM legal_rulings r
      WHERE r."searchVector" @@ to_tsquery('polish', $1)
    `;

    const params: (string | Date)[] = [tsquery];
    let paramIndex = 2;

    if (courtType) {
      sql += ` AND r."courtType" = $${paramIndex}`;
      params.push(courtType);
      paramIndex++;
    }

    if (legalArea) {
      sql += ` AND r.metadata->>'legalArea' ILIKE $${paramIndex}`;
      params.push(`%${legalArea}%`);
      paramIndex++;
    }

    if (keywords && keywords.length > 0) {
      for (const keyword of keywords) {
        sql += ` AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(r.metadata->'keywords', '[]'::jsonb)) kw WHERE kw ILIKE $${paramIndex})`;
        params.push(`%${keyword}%`);
        paramIndex++;
      }
    }

    if (dateFrom) {
      sql += ` AND r."rulingDate" >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      sql += ` AND r."rulingDate" <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    const result = await this.dataSource.query(sql, params);
    return parseInt(result[0]?.count || '0', 10);
  }

  /**
   * Convert search term to tsquery format
   * Handles phrases and special characters
   */
  private termToTsquery(term: string): string {
    // Replace spaces with & for phrase search
    // TODO: Could be enhanced to support quoted phrases
    return term.replace(/\s+/g, ' & ');
  }

  /**
   * Sanitize search term to prevent SQL injection
   */
  private sanitizeSearchTerm(term: string): string {
    if (!term || typeof term !== 'string') {
      return '';
    }

    // Trim and normalize whitespace
    let sanitized = term.trim().replace(/\s+/g, ' ');

    // Remove dangerous characters (keep alphanumeric, spaces, Polish diacritics, and basic punctuation)
    sanitized = sanitized.replace(/[^\w\s\u0080-\u017F\-\+\&\|\!\(\)\"]/g, ' ');

    return sanitized.trim();
  }
}
