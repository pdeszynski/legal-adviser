import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { LegalRulingService } from './services/legal-ruling.service';
import { LegalRuling, CourtType } from './entities/legal-ruling.entity';
import {
  SearchLegalRulingsInput,
  FilterLegalRulingsInput,
  LegalRulingSearchResponse,
} from './dto/legal-ruling-search.dto';

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
 * - legalRulingBySignature: Find by unique case signature
 */
@Resolver(() => LegalRuling)
export class LegalRulingResolver {
  constructor(private readonly legalRulingService: LegalRulingService) {}

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
   * Query: Find ruling by unique signature
   * Case signatures are unique identifiers like "III CZP 8/21"
   */
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
}
