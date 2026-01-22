import { Injectable, Logger } from '@nestjs/common';
import { LegalRuling, CourtType } from '../entities/legal-ruling.entity';
import { LegalRulingService } from './legal-ruling.service';
import { SaosAdapter } from '../../../infrastructure/anti-corruption/saos/saos.adapter';
import { IsapAdapter } from '../../../infrastructure/anti-corruption/isap/isap.adapter';
import {
  LegalRulingDto,
  RulingSource,
  SearchRulingsQuery,
  RulingSearchResult,
  CourtType as DomainCourtType,
} from '../../../domain/legal-rulings/value-objects/ruling-source.vo';

/**
 * External search result interface (for internal use in aggregator)
 */
interface ExternalSearchResult {
  signature: string;
  rulingDate: Date;
  courtName: string;
  courtType: CourtType;
  summary?: string | null;
  fullText?: string | null;
  metadata?: {
    legalArea?: string;
    keywords?: string[];
    relatedCases?: string[];
    sourceReference?: string;
  } | null;
  source: 'SAOS' | 'ISAP' | 'LOCAL';
}

/**
 * Aggregated search result with ranking
 */
export interface AggregatedSearchResult {
  ruling: LegalRuling;
  rank: number;
  headline?: string;
  source: 'SAOS' | 'ISAP' | 'LOCAL';
}

/**
 * Search options for the aggregator
 */
export interface AggregatorSearchOptions {
  query: string;
  courtType?: CourtType;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  sources?: ('SAOS' | 'ISAP' | 'LOCAL')[];
}

/**
 * Ruling Search Aggregator Service
 *
 * Aggregates search results from multiple sources:
 * - LOCAL: PostgreSQL database with full-text search
 * - SAOS: Supreme Administrative Court Database (external API)
 * - ISAP: Internet System of Court Records (external API)
 *
 * Implements a ranking algorithm that prioritizes:
 * 1. Relevance (text match quality)
 * 2. Recency (more recent rulings get slight boost)
 * 3. Source priority (LOCAL > SAOS > ISAP for same relevance)
 * 4. Court authority (higher courts get boost)
 */
@Injectable()
export class RulingSearchAggregatorService {
  private readonly logger = new Logger(RulingSearchAggregatorService.name);

  // Weighting factors for ranking algorithm
  private readonly WEIGHTS = {
    RELEVANCE: 1.0, // Text relevance score
    RECENCY: 0.1, // Recency boost (per year)
    SOURCE_LOCAL: 0.2, // Boost for local database
    SOURCE_SAOS: 0.1, // Boost for SAOS
    SOURCE_ISAP: 0.0, // No boost for ISAP
    COURT_HIGHER: 0.15, // Boost for higher courts
    RECENCY_YEARS: 5, // Years to consider for recency boost
  };

  constructor(
    private readonly legalRulingService: LegalRulingService,
    private readonly saosAdapter: SaosAdapter,
    private readonly isapAdapter: IsapAdapter,
  ) {}

  /**
   * Aggregate search results from multiple sources
   *
   * @param options Search options including query, filters, and source selection
   * @returns Aggregated and ranked search results
   */
  async aggregateSearch(options: AggregatorSearchOptions): Promise<{
    results: AggregatedSearchResult[];
    totalCount: number;
    count: number;
    offset: number;
    hasMore: boolean;
  }> {
    const {
      query,
      courtType,
      dateFrom,
      dateTo,
      limit = 20,
      offset = 0,
      sources = ['LOCAL', 'SAOS', 'ISAP'],
    } = options;

    this.logger.debug(
      `Aggregating search for query "${query}" from sources: ${sources.join(', ')}`,
    );

    // Fetch results from all enabled sources in parallel
    const searchPromises: Promise<{
      results: ExternalSearchResult[];
      source: 'SAOS' | 'ISAP' | 'LOCAL';
    }>[] = [];

    if (sources.includes('LOCAL')) {
      searchPromises.push(this.searchLocal(query, courtType, dateFrom, dateTo));
    }

    if (sources.includes('SAOS')) {
      searchPromises.push(this.searchSaos(query, courtType, dateFrom, dateTo));
    }

    if (sources.includes('ISAP')) {
      searchPromises.push(this.searchIsap(query, courtType, dateFrom, dateTo));
    }

    // Wait for all searches to complete
    const searchResults = await Promise.all(searchPromises);

    // Flatten results
    const allResults: ExternalSearchResult[] = [];
    for (const sourceResult of searchResults) {
      for (const result of sourceResult.results) {
        allResults.push({ ...result, source: sourceResult.source });
      }
    }

    // Deduplicate by signature (keep highest ranked source)
    const deduplicatedResults = this.deduplicateResults(allResults);

    // Apply ranking algorithm
    const rankedResults = this.rankResults(query, deduplicatedResults);

    // Convert to LegalRuling entities
    const finalResults: AggregatedSearchResult[] = rankedResults
      .map((result) => ({
        ruling: this.convertToLegalRuling(result),
        rank: result.rank,
        headline: result.headline,
        source: result.source,
      }))
      .slice(offset, offset + limit);

    // Get total count before pagination
    const totalCount = rankedResults.length;

    return {
      results: finalResults,
      totalCount,
      count: finalResults.length,
      offset,
      hasMore: offset + finalResults.length < totalCount,
    };
  }

  /**
   * Search local PostgreSQL database
   */
  private async searchLocal(
    query: string,
    courtType?: CourtType,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{ results: ExternalSearchResult[]; source: 'LOCAL' }> {
    try {
      const localResults = await this.legalRulingService.search({
        query,
        courtType,
        dateFrom,
        dateTo,
        limit: 100, // Get more for aggregation
      });

      return {
        source: 'LOCAL',
        results: localResults.map((result) => ({
          signature: result.ruling.signature,
          rulingDate: result.ruling.rulingDate,
          courtName: result.ruling.courtName,
          courtType: result.ruling.courtType,
          summary: result.ruling.summary ?? undefined,
          fullText: result.ruling.fullText ?? undefined,
          metadata: result.ruling.metadata ?? undefined,
          source: 'LOCAL' as const,
        })),
      };
    } catch (error) {
      this.logger.error(`Error searching local database: ${error.message}`);
      return { source: 'LOCAL', results: [] };
    }
  }

  /**
   * Search SAOS (Supreme Administrative Court Database)
   *
   * Uses the anti-corruption layer to communicate with SAOS API.
   * SAOS API documentation: https://www.saos.org.pl/about
   */
  private async searchSaos(
    query: string,
    courtType?: CourtType,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{ results: ExternalSearchResult[]; source: 'SAOS' }> {
    try {
      this.logger.debug(`SAOS search for query: ${query}`);

      const searchQuery: SearchRulingsQuery = {
        query,
        courtType: courtType ? this.mapToDomainCourtType(courtType) : undefined,
        dateFrom,
        dateTo,
        limit: 100,
      };

      const result = await this.saosAdapter.search(searchQuery);

      if (!result.success || !result.data) {
        this.logger.warn(`SAOS search failed: ${result.error?.message}`);
        return { source: 'SAOS', results: [] };
      }

      const domainResults = result.data;

      return {
        source: 'SAOS',
        results: domainResults.map((r: RulingSearchResult) =>
          this.domainToExternal(r.ruling),
        ),
      };
    } catch (error) {
      this.logger.error(`Error searching SAOS: ${error.message}`);
      return { source: 'SAOS', results: [] };
    }
  }

  /**
   * Search ISAP (Internet System of Court Records)
   *
   * Uses the anti-corruption layer to communicate with ISAP API.
   * ISAP provides access to Polish court rulings through API
   */
  private async searchIsap(
    query: string,
    courtType?: CourtType,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{ results: ExternalSearchResult[]; source: 'ISAP' }> {
    try {
      this.logger.debug(`ISAP search for query: ${query}`);

      const searchQuery: SearchRulingsQuery = {
        query,
        courtType: courtType ? this.mapToDomainCourtType(courtType) : undefined,
        dateFrom,
        dateTo,
        limit: 100,
      };

      const result = await this.isapAdapter.search(searchQuery);

      if (!result.success || !result.data) {
        this.logger.warn(`ISAP search failed: ${result.error?.message}`);
        return { source: 'ISAP', results: [] };
      }

      const domainResults = result.data;

      return {
        source: 'ISAP',
        results: domainResults.map((r: RulingSearchResult) =>
          this.domainToExternal(r.ruling),
        ),
      };
    } catch (error) {
      this.logger.error(`Error searching ISAP: ${error.message}`);
      return { source: 'ISAP', results: [] };
    }
  }

  /**
   * Deduplicate results by signature
   * Keeps the result from the highest priority source (LOCAL > SAOS > ISAP)
   */
  private deduplicateResults(
    results: ExternalSearchResult[],
  ): ExternalSearchResult[] {
    const signatureMap = new Map<string, ExternalSearchResult>();

    for (const result of results) {
      const existing = signatureMap.get(result.signature);

      if (!existing) {
        // No existing result, add this one
        signatureMap.set(result.signature, result);
      } else {
        // Existing result found, keep the one with higher priority source
        const sourcePriority = { LOCAL: 3, SAOS: 2, ISAP: 1 };

        if (sourcePriority[result.source] > sourcePriority[existing.source]) {
          signatureMap.set(result.signature, result);
        }
      }
    }

    return Array.from(signatureMap.values());
  }

  /**
   * Rank results using relevance and recency algorithm
   *
   * Algorithm:
   * 1. Calculate base relevance score from text matching
   * 2. Apply recency boost (recent rulings get higher score)
   * 3. Apply source priority boost
   * 4. Apply court authority boost (higher courts get higher score)
   */
  private rankResults(
    query: string,
    results: ExternalSearchResult[],
  ): Array<ExternalSearchResult & { rank: number; headline?: string }> {
    const now = new Date();

    return results
      .map((result) => {
        // Calculate base relevance from text matching
        const relevanceScore = this.calculateRelevance(query, result);

        // Calculate recency boost
        const yearsSinceRuling =
          (now.getTime() - result.rulingDate.getTime()) /
          (1000 * 60 * 60 * 24 * 365);
        const recencyBoost = Math.max(
          0,
          (this.WEIGHTS.RECENCY_YEARS - yearsSinceRuling) /
            this.WEIGHTS.RECENCY_YEARS,
        );

        // Calculate source boost
        let sourceBoost = 0;
        if (result.source === 'LOCAL') {
          sourceBoost = this.WEIGHTS.SOURCE_LOCAL;
        } else if (result.source === 'SAOS') {
          sourceBoost = this.WEIGHTS.SOURCE_SAOS;
        } else if (result.source === 'ISAP') {
          sourceBoost = this.WEIGHTS.SOURCE_ISAP;
        }

        // Calculate court authority boost
        const courtBoost = this.isHigherCourt(result.courtType)
          ? this.WEIGHTS.COURT_HIGHER
          : 0;

        // Calculate final rank
        const rank =
          relevanceScore * this.WEIGHTS.RELEVANCE +
          recencyBoost * this.WEIGHTS.RECENCY +
          sourceBoost +
          courtBoost;

        // Generate headline snippet
        const headline = this.generateHeadline(query, result);

        return { ...result, rank, headline };
      })
      .sort((a, b) => b.rank - a.rank); // Sort by rank descending
  }

  /**
   * Calculate relevance score based on text matching
   */
  private calculateRelevance(
    query: string,
    result: ExternalSearchResult,
  ): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    let score = 0;

    // Check signature match (highest priority)
    if (result.signature.toLowerCase().includes(query.toLowerCase())) {
      score += 1.0;
    }

    // Check court name match
    for (const term of queryTerms) {
      if (result.courtName.toLowerCase().includes(term)) {
        score += 0.5;
      }
    }

    // Check summary match
    if (result.summary) {
      const summaryLower = result.summary.toLowerCase();
      const matchCount = queryTerms.filter((term) =>
        summaryLower.includes(term),
      ).length;
      score += (matchCount / queryTerms.length) * 0.7;
    }

    // Check full text match (lower weight)
    if (result.fullText) {
      const fullTextLower = result.fullText.toLowerCase();
      const matchCount = queryTerms.filter((term) =>
        fullTextLower.includes(term),
      ).length;
      score += (matchCount / queryTerms.length) * 0.3;
    }

    // Check keywords match
    if (result.metadata?.keywords) {
      const keywordsLower = result.metadata.keywords.map((k) =>
        k.toLowerCase(),
      );
      const matchCount = queryTerms.filter((term) =>
        keywordsLower.some((keyword) => keyword.includes(term)),
      ).length;
      score += (matchCount / queryTerms.length) * 0.6;
    }

    // Check legal area match
    if (result.metadata?.legalArea) {
      if (
        result.metadata.legalArea.toLowerCase().includes(query.toLowerCase())
      ) {
        score += 0.4;
      }
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Generate highlighted headline snippet
   */
  private generateHeadline(
    query: string,
    result: ExternalSearchResult,
  ): string | undefined {
    const maxLength = 200;
    const text = result.summary || result.fullText || '';

    if (!text) {
      return undefined;
    }

    // Find the most relevant snippet
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();

    const matchIndex = textLower.indexOf(queryLower);

    if (matchIndex === -1) {
      // No direct match, return first 200 chars
      return text.length > maxLength
        ? text.substring(0, maxLength) + '...'
        : text;
    }

    // Extract context around the match
    const start = Math.max(0, matchIndex - 50);
    const end = Math.min(text.length, matchIndex + query.length + 50);

    let snippet = text.substring(start, end);

    // Add ellipsis if needed
    if (start > 0) {
      snippet = '...' + snippet;
    }
    if (end < text.length) {
      snippet = snippet + '...';
    }

    return snippet;
  }

  /**
   * Check if court type is a higher court
   */
  private isHigherCourt(courtType: CourtType): boolean {
    return [
      CourtType.SUPREME_COURT,
      CourtType.APPELLATE_COURT,
      CourtType.CONSTITUTIONAL_TRIBUNAL,
      CourtType.ADMINISTRATIVE_COURT,
    ].includes(courtType);
  }

  /**
   * Convert ExternalSearchResult to LegalRuling entity
   */
  private convertToLegalRuling(result: ExternalSearchResult): LegalRuling {
    const ruling = new LegalRuling();
    ruling.signature = result.signature;
    ruling.rulingDate = result.rulingDate;
    ruling.courtName = result.courtName;
    ruling.courtType = result.courtType;
    ruling.summary = result.summary ?? null;
    ruling.fullText = result.fullText ?? null;
    ruling.metadata = result.metadata ?? null;

    // Set timestamps
    ruling.createdAt = new Date();
    ruling.updatedAt = new Date();

    // Generate a temporary ID for external results
    // In production, these might be saved to DB or use external ID
    ruling.id = `ext-${result.source}-${result.signature.replace(/\s+/g, '-')}`;

    return ruling;
  }

  /**
   * Convert domain LegalRulingDto to ExternalSearchResult
   */
  private domainToExternal(domainRuling: LegalRulingDto): ExternalSearchResult {
    return {
      signature: domainRuling.signature,
      rulingDate: domainRuling.rulingDate,
      courtName: domainRuling.courtName,
      courtType: this.mapToEntityCourtType(domainRuling.courtType),
      summary: domainRuling.summary,
      fullText: domainRuling.fullText,
      metadata: domainRuling.metadata,
      source:
        domainRuling.source === RulingSource.SAOS
          ? 'SAOS'
          : domainRuling.source === RulingSource.ISAP
            ? 'ISAP'
            : 'LOCAL',
    };
  }

  /**
   * Map entity CourtType to domain CourtType
   */
  private mapToDomainCourtType(entityCourtType: CourtType): DomainCourtType {
    const mapping: Record<CourtType, DomainCourtType> = {
      [CourtType.SUPREME_COURT]: DomainCourtType.SUPREME_COURT,
      [CourtType.APPELLATE_COURT]: DomainCourtType.APPELLATE_COURT,
      [CourtType.DISTRICT_COURT]: DomainCourtType.DISTRICT_COURT,
      [CourtType.REGIONAL_COURT]: DomainCourtType.REGIONAL_COURT,
      [CourtType.CONSTITUTIONAL_TRIBUNAL]:
        DomainCourtType.CONSTITUTIONAL_TRIBUNAL,
      [CourtType.ADMINISTRATIVE_COURT]: DomainCourtType.ADMINISTRATIVE_COURT,
      [CourtType.OTHER]: DomainCourtType.SUPREME_ADMINISTRATIVE_COURT, // Map OTHER to SUPREME_ADMINISTRATIVE_COURT for domain
    };

    return mapping[entityCourtType] || DomainCourtType.REGIONAL_COURT;
  }

  /**
   * Map domain CourtType to entity CourtType
   */
  private mapToEntityCourtType(domainCourtType: DomainCourtType): CourtType {
    const mapping: Partial<Record<DomainCourtType, CourtType>> = {
      [DomainCourtType.SUPREME_COURT]: CourtType.SUPREME_COURT,
      [DomainCourtType.APPELLATE_COURT]: CourtType.APPELLATE_COURT,
      [DomainCourtType.DISTRICT_COURT]: CourtType.DISTRICT_COURT,
      [DomainCourtType.REGIONAL_COURT]: CourtType.REGIONAL_COURT,
      [DomainCourtType.CONSTITUTIONAL_TRIBUNAL]:
        CourtType.CONSTITUTIONAL_TRIBUNAL,
      [DomainCourtType.ADMINISTRATIVE_COURT]: CourtType.ADMINISTRATIVE_COURT,
      [DomainCourtType.SUPREME_ADMINISTRATIVE_COURT]: CourtType.OTHER, // Map SUPREME_ADMINISTRATIVE_COURT to OTHER for entity
    };

    return mapping[domainCourtType] || CourtType.OTHER;
  }
}
