import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, DataSource, ILike } from 'typeorm';
import {
  LegalRuling,
  CourtType,
  RulingMetadata,
} from '../entities/legal-ruling.entity';

/**
 * Search result with relevance score
 */
export interface SearchResult {
  ruling: LegalRuling;
  rank: number;
  headline?: string;
}

/**
 * Search options for full-text search
 */
export interface SearchOptions {
  query: string;
  courtType?: CourtType;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Query options for filtering rulings
 */
export interface RulingQueryOptions {
  courtType?: CourtType;
  courtName?: string;
  dateFrom?: Date;
  dateTo?: Date;
  legalArea?: string;
  limit?: number;
  offset?: number;
}

/**
 * Create LegalRuling DTO
 */
export interface CreateLegalRulingDto {
  signature: string;
  rulingDate: Date;
  courtName: string;
  courtType?: CourtType;
  summary?: string;
  fullText?: string;
  metadata?: RulingMetadata;
}

/**
 * Update LegalRuling DTO
 */
export interface UpdateLegalRulingDto {
  signature?: string;
  rulingDate?: Date;
  courtName?: string;
  courtType?: CourtType;
  summary?: string;
  fullText?: string;
  metadata?: RulingMetadata;
}

/**
 * Legal Ruling Service
 *
 * Provides CRUD operations and full-text search for LegalRuling entities.
 * Uses PostgreSQL's built-in full-text search capabilities (tsvector/tsquery).
 *
 * Full-text search features:
 * - Weighted search: signature and court name have higher relevance
 * - Headline generation: highlighted snippets of matching content
 * - Ranking: results sorted by relevance score
 * - Combined filtering: search + court type + date range
 */
@Injectable()
export class LegalRulingService {
  constructor(
    @InjectRepository(LegalRuling)
    private readonly rulingRepository: Repository<LegalRuling>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new legal ruling
   * Updates the search vector after creation
   */
  async create(dto: CreateLegalRulingDto): Promise<LegalRuling> {
    const ruling = this.rulingRepository.create({
      signature: dto.signature,
      rulingDate: dto.rulingDate,
      courtName: dto.courtName,
      courtType: dto.courtType ?? CourtType.OTHER,
      summary: dto.summary ?? null,
      fullText: dto.fullText ?? null,
      metadata: dto.metadata ?? null,
    });

    const savedRuling = await this.rulingRepository.save(ruling);

    // Update search vector using raw SQL for proper tsvector generation
    await this.updateSearchVector(savedRuling.id);

    return savedRuling;
  }

  /**
   * Find a ruling by ID
   */
  async findById(id: string): Promise<LegalRuling | null> {
    return this.rulingRepository.findOne({
      where: { id },
    });
  }

  /**
   * Find a ruling by ID or throw NotFoundException
   */
  async findByIdOrFail(id: string): Promise<LegalRuling> {
    const ruling = await this.findById(id);
    if (!ruling) {
      throw new NotFoundException(`Legal ruling with ID ${id} not found`);
    }
    return ruling;
  }

  /**
   * Find a ruling by signature (unique case identifier)
   *
   * @deprecated Use findByCourtSignatureDate instead for proper uniqueness
   * Different courts can have judgments with the same signature
   */
  async findBySignature(signature: string): Promise<LegalRuling | null> {
    return this.rulingRepository.findOne({
      where: { signature },
    });
  }

  /**
   * Find a ruling by the composite key: courtName + signature + rulingDate
   *
   * This is the proper unique identifier for legal rulings since signatures
   * are only unique within a single court, not nationwide.
   *
   * @param courtName Name of the court
   * @param signature Case signature/identifier
   * @param rulingDate Date of the ruling
   * @returns The ruling if found, null otherwise
   */
  async findByCourtSignatureDate(
    courtName: string,
    signature: string,
    rulingDate: Date,
  ): Promise<LegalRuling | null> {
    return this.rulingRepository.findOne({
      where: {
        courtName,
        signature,
        rulingDate,
      },
    });
  }

  /**
   * Find all rulings with optional filtering
   */
  async findAll(options?: RulingQueryOptions): Promise<LegalRuling[]> {
    const queryBuilder = this.rulingRepository
      .createQueryBuilder('ruling')
      .orderBy('ruling.rulingDate', 'DESC');

    if (options?.courtType) {
      queryBuilder.andWhere('ruling.courtType = :courtType', {
        courtType: options.courtType,
      });
    }

    if (options?.courtName) {
      queryBuilder.andWhere('ruling.courtName ILIKE :courtName', {
        courtName: `%${options.courtName}%`,
      });
    }

    if (options?.dateFrom) {
      queryBuilder.andWhere('ruling.rulingDate >= :dateFrom', {
        dateFrom: options.dateFrom,
      });
    }

    if (options?.dateTo) {
      queryBuilder.andWhere('ruling.rulingDate <= :dateTo', {
        dateTo: options.dateTo,
      });
    }

    if (options?.legalArea) {
      queryBuilder.andWhere("ruling.metadata->>'legalArea' ILIKE :legalArea", {
        legalArea: `%${options.legalArea}%`,
      });
    }

    if (options?.limit) {
      queryBuilder.take(options.limit);
    }

    if (options?.offset) {
      queryBuilder.skip(options.offset);
    }

    return queryBuilder.getMany();
  }

  /**
   * Update a ruling
   * Updates the search vector after modification
   */
  async update(id: string, dto: UpdateLegalRulingDto): Promise<LegalRuling> {
    const ruling = await this.findByIdOrFail(id);

    if (dto.signature !== undefined) {
      ruling.signature = dto.signature;
    }
    if (dto.rulingDate !== undefined) {
      ruling.rulingDate = dto.rulingDate;
    }
    if (dto.courtName !== undefined) {
      ruling.courtName = dto.courtName;
    }
    if (dto.courtType !== undefined) {
      ruling.courtType = dto.courtType;
    }
    if (dto.summary !== undefined) {
      ruling.summary = dto.summary;
    }
    if (dto.fullText !== undefined) {
      ruling.fullText = dto.fullText;
    }
    if (dto.metadata !== undefined) {
      ruling.metadata = dto.metadata;
    }

    const savedRuling = await this.rulingRepository.save(ruling);

    // Update search vector using raw SQL
    await this.updateSearchVector(savedRuling.id);

    return savedRuling;
  }

  /**
   * Delete a ruling
   */
  async delete(id: string): Promise<void> {
    const ruling = await this.findByIdOrFail(id);
    await this.rulingRepository.remove(ruling);
  }

  /**
   * Full-text search for legal rulings
   *
   * Uses PostgreSQL's full-text search with:
   * - to_tsquery for query parsing (using Polish configuration)
   * - ts_rank with weights array for relevance scoring
   * - ts_headline for highlighted snippets
   *
   * Weights used in ranking:
   * - A (1.0): signature, court name - highest priority
   * - B (0.7): legal area, division name
   * - C (0.5): summary, keywords, legal basis
   * - D (0.3): full text - lowest priority
   *
   * @param options Search options including query string and filters
   * @returns Array of search results with relevance ranking
   */
  async search(options: SearchOptions): Promise<SearchResult[]> {
    const {
      query,
      courtType,
      dateFrom,
      dateTo,
      limit = 20,
      offset = 0,
    } = options;

    // Sanitize the search query for PostgreSQL
    const sanitizedQuery = this.sanitizeSearchQuery(query);

    if (!sanitizedQuery) {
      return [];
    }

    // Build the search query using PostgreSQL full-text search with Polish configuration
    // The weights array {1.0, 0.7, 0.5, 0.3} corresponds to A, B, C, D weights
    let sql = `
      SELECT
        r.*,
        ts_rank(
          COALESCE(r."searchVector", to_tsvector('polish', '')),
          plainto_tsquery('polish', $1),
          1 -- Normalization method (1 = normalize by document length)
        ) as rank,
        ts_headline(
          'polish',
          COALESCE(r.summary, '') || ' ' || COALESCE(r."fullText", ''),
          plainto_tsquery('polish', $1),
          'MaxWords=35, MinWords=15, ShortWord=3, HighlightAll=FALSE, MaxFragments=2, FragmentDelimiter=" ... "'
        ) as headline
      FROM legal_rulings r
      WHERE (
        r."searchVector" @@ plainto_tsquery('polish', $1)
        OR r.signature ILIKE $2
        OR r."courtName" ILIKE $2
      )
    `;

    const params: (string | Date | number)[] = [
      sanitizedQuery,
      `%${sanitizedQuery}%`,
    ];
    let paramIndex = 3;

    // Add court type filter
    if (courtType) {
      sql += ` AND r."courtType" = $${paramIndex}`;
      params.push(courtType);
      paramIndex++;
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
        ruling: this.mapRowToRuling(row),
        rank: parseFloat(row.rank?.toString() || '0'),
        headline: row.headline,
      }),
    );
  }

  /**
   * Count search results for pagination
   */
  async countSearchResults(
    options: Omit<SearchOptions, 'limit' | 'offset'>,
  ): Promise<number> {
    const { query, courtType, dateFrom, dateTo } = options;

    const sanitizedQuery = this.sanitizeSearchQuery(query);
    if (!sanitizedQuery) {
      return 0;
    }

    let sql = `
      SELECT COUNT(*) as count
      FROM legal_rulings r
      WHERE (
        r."searchVector" @@ plainto_tsquery('polish', $1)
        OR r.signature ILIKE $2
        OR r."courtName" ILIKE $2
      )
    `;

    const params: (string | Date)[] = [sanitizedQuery, `%${sanitizedQuery}%`];
    let paramIndex = 3;

    if (courtType) {
      sql += ` AND r."courtType" = $${paramIndex}`;
      params.push(courtType);
      paramIndex++;
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
   * Find rulings by court type
   */
  async findByCourtType(
    courtType: CourtType,
    limit?: number,
  ): Promise<LegalRuling[]> {
    return this.findAll({ courtType, limit });
  }

  /**
   * Find rulings from higher courts (Supreme, Appellate, Constitutional)
   */
  async findFromHigherCourts(limit?: number): Promise<LegalRuling[]> {
    const queryBuilder = this.rulingRepository
      .createQueryBuilder('ruling')
      .where('ruling.courtType IN (:...courtTypes)', {
        courtTypes: [
          CourtType.SUPREME_COURT,
          CourtType.APPELLATE_COURT,
          CourtType.CONSTITUTIONAL_TRIBUNAL,
        ],
      })
      .orderBy('ruling.rulingDate', 'DESC');

    if (limit) {
      queryBuilder.take(limit);
    }

    return queryBuilder.getMany();
  }

  /**
   * Count rulings with optional filtering
   */
  async count(
    options?: Omit<RulingQueryOptions, 'limit' | 'offset'>,
  ): Promise<number> {
    const queryBuilder = this.rulingRepository.createQueryBuilder('ruling');

    if (options?.courtType) {
      queryBuilder.andWhere('ruling.courtType = :courtType', {
        courtType: options.courtType,
      });
    }

    if (options?.courtName) {
      queryBuilder.andWhere('ruling.courtName ILIKE :courtName', {
        courtName: `%${options.courtName}%`,
      });
    }

    if (options?.dateFrom) {
      queryBuilder.andWhere('ruling.rulingDate >= :dateFrom', {
        dateFrom: options.dateFrom,
      });
    }

    if (options?.dateTo) {
      queryBuilder.andWhere('ruling.rulingDate <= :dateTo', {
        dateTo: options.dateTo,
      });
    }

    return queryBuilder.getCount();
  }

  /**
   * Update the search vector for a ruling using PostgreSQL tsvector
   * Uses weighted vectors for different fields (A=highest, D=lowest)
   *
   * NOTE: With the new trigger, this is typically called automatically.
   * This method is kept for manual updates if needed.
   *
   * Weights:
   *   A (1.0): signature, court name (highest)
   *   B (0.7): legal area, division name
   *   C (0.5): summary, keywords, legal basis
   *   D (0.3): full text (lowest)
   */
  private async updateSearchVector(rulingId: string): Promise<void> {
    // Use PostgreSQL setweight function for weighted full-text search with Polish configuration
    await this.dataSource.query(
      `
      UPDATE legal_rulings
      SET "searchVector" = (
        -- Weight A (highest): signature and court name
        setweight(to_tsvector('polish', COALESCE(signature, '')), 'A') ||
        setweight(to_tsvector('polish', COALESCE("courtName", '')), 'A') ||

        -- Weight B: legal area, division name
        setweight(to_tsvector('polish', COALESCE(metadata->>'legalArea', '')), 'B') ||
        setweight(to_tsvector('polish', COALESCE(metadata->>'divisionName', '')), 'B') ||

        -- Weight C: summary, keywords, legal basis
        setweight(to_tsvector('polish', COALESCE(summary, '')), 'C') ||
        setweight(to_tsvector('polish', COALESCE(
          array_to_string(
            ARRAY(SELECT jsonb_array_elements_text(COALESCE(metadata->'keywords', '[]'::jsonb))),
            ' '
          ), ''
        )), 'C') ||
        setweight(to_tsvector('polish', COALESCE(
          array_to_string(
            ARRAY(SELECT jsonb_array_elements_text(COALESCE(metadata->'legalBasis', '[]'::jsonb))),
            ' '
          ), ''
        )), 'C') ||

        -- Weight D (lowest): full text content and proceeding type
        setweight(to_tsvector('polish', COALESCE("fullText", '')), 'D') ||
        setweight(to_tsvector('polish', COALESCE(metadata->>'proceedingType', '')), 'D')
      )
      WHERE id = $1
    `,
      [rulingId],
    );
  }

  /**
   * Rebuild search vectors for all rulings using Polish text configuration
   * Useful for initial setup or after schema changes.
   * NOTE: This is typically done automatically by the trigger after running the migration.
   */
  async rebuildAllSearchVectors(): Promise<number> {
    const rulings = await this.rulingRepository.find({ select: ['id'] });

    for (const ruling of rulings) {
      await this.updateSearchVector(ruling.id);
    }

    return rulings.length;
  }

  /**
   * Sanitize search query to prevent SQL injection and handle special characters
   */
  private sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      return '';
    }

    // Trim and remove excessive whitespace
    let sanitized = query.trim().replace(/\s+/g, ' ');

    // Remove special characters that could affect tsquery parsing
    // Keep alphanumeric, spaces, and Polish diacritics
    sanitized = sanitized.replace(/[^\w\s\u0080-\u017F]/g, ' ');

    return sanitized.trim();
  }

  /**
   * Map raw database row to LegalRuling entity
   */
  private mapRowToRuling(row: Record<string, unknown>): LegalRuling {
    const ruling = new LegalRuling();
    ruling.id = row['id'] as string;
    ruling.signature = row['signature'] as string;
    ruling.rulingDate = new Date(row['rulingDate'] as string);
    ruling.courtName = row['courtName'] as string;
    ruling.courtType = row['courtType'] as CourtType;
    ruling.summary = row['summary'] as string | null;
    ruling.fullText = row['fullText'] as string | null;
    ruling.metadata = row['metadata'] as RulingMetadata | null;
    ruling.createdAt = new Date(row['createdAt'] as string);
    ruling.updatedAt = new Date(row['updatedAt'] as string);
    return ruling;
  }
}
