import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LegalRulingService } from './services/legal-ruling.service';
import {
  RulingSearchAggregatorService,
  AggregatedSearchResult,
} from './services/ruling-search-aggregator.service';
import { AdvancedLegalRulingSearchService } from './services/advanced-legal-ruling-search.service';
import { LegalRuling, CourtType } from './entities/legal-ruling.entity';
import {
  SearchLegalRulingsInput,
  FilterLegalRulingsInput,
  LegalRulingSearchResponse,
  AggregatedSearchLegalRulingsInput,
  AggregatedLegalRulingSearchResponse,
  SearchSource,
  AdvancedSearchLegalRulingsInput,
  AdvancedLegalRulingSearchResponse,
} from './dto/legal-ruling-search.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Custom GraphQL Resolver for Legal Rulings
 *
 * Provides custom search and filtering operations that complement the
 * auto-generated CRUD resolvers from nestjs-query.
 *
 * Auto-generated operations (via nestjs-query):
 * - legalRulings: Query all rulings with filtering, sorting, paging
 * - legalRuling: Query single ruling by ID
 * - createOneLegalRuling: Create a new ruling
 * - updateOneLegalRuling: Update a ruling
 * - deleteOneLegalRuling: Delete a ruling
 *
 * Custom operations (this resolver):
 * - searchLegalRulings: Full-text search with relevance ranking
 * - legalRulingsByCourtType: Filter by court type
 * - legalRulingsFromHigherCourts: Get rulings from higher courts
 * - legalRulingBySignature: Find by unique case signature (public)
 *
 * Most operations require authentication, but legalRulingBySignature is public.
 */
@Resolver(() => LegalRuling)
@UseGuards(GqlAuthGuard)
export class LegalRulingResolver {
  constructor(
    private readonly legalRulingService: LegalRulingService,
    private readonly aggregatorService: RulingSearchAggregatorService,
    private readonly advancedSearchService: AdvancedLegalRulingSearchService,
  ) {}

  /**
   * Query: Full-text search for legal rulings
   *
   * Searches across signature, court name, summary, full text, and keywords.
   * Returns results ranked by relevance with highlighted snippets.
   *
   * Example GraphQL query:
   * ```graphql
   * query {
   *   searchLegalRulings(input: {
   *     query: "konstytucja"
   *     courtType: CONSTITUTIONAL_TRIBUNAL
   *     dateFrom: "2020-01-01"
   *     limit: 10
   *   }) {
   *     results {
   *       ruling {
   *         id
   *         signature
   *         courtName
   *         summary
   *       }
   *       rank
   *       headline
   *     }
   *     totalCount
   *     hasMore
   *   }
   * }
   * ```
   */
  @Query(() => LegalRulingSearchResponse, {
    name: 'searchLegalRulings',
    description: 'Full-text search for legal rulings with relevance ranking',
  })
  async searchLegalRulings(
    @Args('input') input: SearchLegalRulingsInput,
  ): Promise<LegalRulingSearchResponse> {
    const searchOptions = {
      query: input.query,
      courtType: input.courtType,
      dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
      dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
      limit: input.limit ?? 20,
      offset: input.offset ?? 0,
    };

    const [results, totalCount] = await Promise.all([
      this.legalRulingService.search(searchOptions),
      this.legalRulingService.countSearchResults({
        query: input.query,
        courtType: input.courtType,
        dateFrom: searchOptions.dateFrom,
        dateTo: searchOptions.dateTo,
      }),
    ]);

    const count = results.length;
    const hasMore = searchOptions.offset + count < totalCount;

    return {
      results,
      totalCount,
      count,
      offset: searchOptions.offset,
      hasMore,
    };
  }

  /**
   * Query: Get rulings by court type
   * Convenience query for filtering by court type
   */
  @Query(() => [LegalRuling], {
    name: 'legalRulingsByCourtType',
    description: 'Get legal rulings filtered by court type',
  })
  async findByCourtType(
    @Args('courtType', { type: () => CourtType }) courtType: CourtType,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit?: number,
  ): Promise<LegalRuling[]> {
    return this.legalRulingService.findByCourtType(courtType, limit);
  }

  /**
   * Query: Get rulings from higher courts
   * Returns rulings from Supreme Court, Appellate Courts, and Constitutional Tribunal
   */
  @Query(() => [LegalRuling], {
    name: 'legalRulingsFromHigherCourts',
    description:
      'Get legal rulings from higher courts (Supreme, Appellate, Constitutional)',
  })
  async findFromHigherCourts(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit?: number,
  ): Promise<LegalRuling[]> {
    return this.legalRulingService.findFromHigherCourts(limit);
  }

  /**
   * Query: Find ruling by unique signature (public)
   * Case signatures are unique identifiers like "III CZP 8/21"
   * This is a public endpoint for looking up rulings by their signature.
   */
  @Public()
  @Query(() => LegalRuling, {
    name: 'legalRulingBySignature',
    nullable: true,
    description: 'Find a legal ruling by its unique case signature',
  })
  async findBySignature(
    @Args('signature', { type: () => String }) signature: string,
  ): Promise<LegalRuling | null> {
    return this.legalRulingService.findBySignature(signature);
  }

  /**
   * Query: Filter rulings with multiple criteria
   * Advanced filtering without full-text search
   */
  @Query(() => [LegalRuling], {
    name: 'filterLegalRulings',
    description: 'Filter legal rulings by multiple criteria',
  })
  async filterRulings(
    @Args('input') input: FilterLegalRulingsInput,
  ): Promise<LegalRuling[]> {
    return this.legalRulingService.findAll({
      courtType: input.courtType,
      courtName: input.courtName,
      legalArea: input.legalArea,
      dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
      dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
      limit: input.limit ?? 20,
      offset: input.offset ?? 0,
    });
  }

  /**
   * Query: Count rulings matching criteria
   */
  @Query(() => Int, {
    name: 'countLegalRulings',
    description: 'Count legal rulings matching filter criteria',
  })
  async countRulings(
    @Args('input', { nullable: true }) input?: FilterLegalRulingsInput,
  ): Promise<number> {
    if (!input) {
      return this.legalRulingService.count();
    }

    return this.legalRulingService.count({
      courtType: input.courtType,
      courtName: input.courtName,
      legalArea: input.legalArea,
      dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
      dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
    });
  }

  /**
   * Query: Aggregated search across multiple sources (LOCAL, SAOS, ISAP)
   *
   * Searches across local database and external legal databases (SAOS, ISAP).
   * Results are aggregated, deduplicated, and ranked by relevance and recency.
   *
   * Example GraphQL query:
   * ```graphql
   * query {
   *   aggregatedSearchLegalRulings(input: {
   *     query: "konstytucja"
   *     sources: [LOCAL, SAOS]
   *     courtType: CONSTITUTIONAL_TRIBUNAL
   *     limit: 10
   *   }) {
   *     results {
   *       ruling {
   *         id
   *         signature
   *         courtName
   *         summary
   *       }
   *       rank
   *       source
   *       headline
   *     }
   *     totalCount
   *     hasMore
   *   }
   * }
   * ```
   */
  @Query(() => AggregatedLegalRulingSearchResponse, {
    name: 'aggregatedSearchLegalRulings',
    description:
      'Search legal rulings across multiple sources (LOCAL, SAOS, ISAP) with relevance ranking',
  })
  async aggregatedSearchLegalRulings(
    @Args('input') input: AggregatedSearchLegalRulingsInput,
  ): Promise<AggregatedLegalRulingSearchResponse> {
    const searchOptions = {
      query: input.query,
      courtType: input.courtType,
      dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
      dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
      limit: input.limit ?? 20,
      offset: input.offset ?? 0,
      sources:
        input.sources ??
        (['LOCAL', 'SAOS', 'ISAP'] as Array<'LOCAL' | 'SAOS' | 'ISAP'>),
    };

    const result = await this.aggregatorService.aggregateSearch(searchOptions);

    // Map source strings to SearchSource enum
    const results = result.results.map((r) => ({
      ...r,
      source: r.source as SearchSource,
    }));

    return {
      results,
      totalCount: result.totalCount,
      count: result.count,
      offset: result.offset,
      hasMore: result.hasMore,
    };
  }

  /**
   * Query: Advanced search with boolean operators and field-specific search
   *
   * Provides advanced search capabilities including:
   * - Boolean operators (AND, OR, NOT) to combine multiple search terms
   * - Field-specific search (signature, court name, summary, full text, keywords, legal area)
   * - Legal area filter
   * - Keywords filter (must match all)
   * - Query explanation for users
   *
   * Example GraphQL query:
   * ```graphql
   * query {
   *   advancedSearchLegalRulings(input: {
   *     searchTerms: [
   *       { term: "konstytucja", field: ALL, operator: AND },
   *       { term: "trybunal", field: COURT_NAME, operator: AND },
   *       { term: "nakaz", field: SUMMARY, operator: NOT }
   *     ]
   *     legalArea: "constitutional"
   *     courtType: CONSTITUTIONAL_TRIBUNAL
   *     limit: 10
   *   }) {
   *     results {
   *       ruling {
   *         id
   *         signature
   *         courtName
   *         summary
   *       }
   *       rank
   *       source
   *       headline
   *     }
   *     totalCount
   *     hasMore
   *     queryExplanation
   *   }
   * }
   * ```
   */
  @Query(() => AdvancedLegalRulingSearchResponse, {
    name: 'advancedSearchLegalRulings',
    description:
      'Advanced search with boolean operators (AND, OR, NOT) and field-specific search',
  })
  async advancedSearchLegalRulings(
    @Args('input') input: AdvancedSearchLegalRulingsInput,
  ): Promise<AdvancedLegalRulingSearchResponse> {
    const searchOptions = {
      searchTerms: input.searchTerms,
      courtType: input.courtType,
      legalArea: input.legalArea,
      keywords: input.keywords,
      dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
      dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
      sources: (input.sources ?? ['LOCAL', 'SAOS', 'ISAP']) as Array<
        'LOCAL' | 'SAOS' | 'ISAP'
      >,
      limit: input.limit ?? 20,
      offset: input.offset ?? 0,
    };

    const result =
      await this.advancedSearchService.advancedSearch(searchOptions);

    return {
      results:
        result.results as unknown as AggregatedLegalRulingSearchResponse['results'],
      totalCount: result.totalCount,
      count: result.count,
      offset: result.offset,
      hasMore: result.hasMore,
      queryExplanation: result.queryExplanation,
    };
  }
}
