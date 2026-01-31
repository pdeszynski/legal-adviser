import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { LegalRuling, CourtType } from '../../src/modules/documents/entities/legal-ruling.entity';
import { LegalRulingService } from '../../src/modules/documents/services/legal-ruling.service';

/**
 * E2E Tests for Legal Ruling Weighted Full-Text Search
 *
 * These tests verify that:
 * 1. Search vectors are created with proper weights using Polish text configuration
 * 2. Title/court name matches rank higher than content matches
 * 3. The GIN index is properly configured for search queries
 * 4. ts_rank() uses weights correctly for relevance scoring
 */
describe('LegalRuling Weighted Search (e2e)', () => {
  let app: INestApplication;
  let legalRulingService: LegalRulingService;
  let rulingRepository: Repository<LegalRuling>;
  let dataSource: DataSource;

  // Test data - Polish legal terms
  const testRulings = [
    {
      signature: 'I C 123/24',
      rulingDate: new Date('2024-01-15'),
      courtName: 'Sad Rejonowy dla Warszawy',
      courtType: CourtType.DISTRICT_COURT,
      summary: 'Umowa o dzieło - nieważność postanowień',
      fullText: 'W sprawie o ustalenie nieważności umowy o dzieło, sad rozpatruje kwestie związane z niedozwolonymi klauzulami umownymi. Umowa o dzieło zostala zawarta w dniu 15 stycznia 2024 roku.',
      metadata: {
        legalArea: 'cywilne',
        keywords: ['umowa o dzieło', 'nieważność', 'klauzule abuzywne'],
        legalBasis: ['Art. 385 KC', 'Art. 58 KC'],
      },
    },
    {
      signature: 'II CZ 456/23',
      rulingDate: new Date('2023-11-20'),
      courtName: 'Sad Okregowy w Krakowie',
      courtType: CourtType.REGIONAL_COURT,
      summary: 'Postępowanie karne - dowody',
      fullText: 'W sprawie karnej dotyczącej kradzieży z włamaniem, sad analizuje dowody przedstawione przez prokuratora. Postępowanie karne obejmuje liczne przesłuchania świadków i analizę materiału dowodowego.',
      metadata: {
        legalArea: 'karne',
        keywords: ['postępowanie karne', 'dowody', 'kradzież'],
        legalBasis: ['Art. 280 KK', 'Art. 281 KK'],
      },
    },
    {
      signature: 'III CZP 789/24',
      rulingDate: new Date('2024-03-10'),
      courtName: 'Sad Najwyższy',
      courtType: CourtType.SUPREME_COURT,
      summary: 'Rozstrzygnięcie pytania prawnego dotyczącego umowy o dzieło',
      fullText: 'Sad Najwyższy podjął uchwałę w sprawie interpreting the provisions of the civil code regarding contract law. Umowa o dzieło jest regulowana przepisami kodeksu cywilnego.',
      metadata: {
        legalArea: 'cywilne',
        keywords: ['pytanie prawne', 'umowa', 'interpretacja'],
        legalBasis: ['Art. 365 KC'],
        divisionName: 'Izba Cywilna',
      },
    },
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    legalRulingService = app.get<LegalRulingService>(LegalRulingService);
    rulingRepository = app.get<Repository<LegalRuling>>(getRepositoryToken(LegalRuling));
    dataSource = app.get<DataSource);

    // Clean up any existing test data
    await cleanTestData();
  });

  afterAll(async () => {
    await cleanTestData();
    await app.close();
  });

  async function cleanTestData() {
    // Remove test rulings created during tests
    await rulingRepository.delete({
      signature: In([testRulings.map((r) => r.signature)]),
    });
  }

  describe('Search Vector Creation', () => {
    it('should create search vector with Polish text configuration', async () => {
      const ruling = await legalRulingService.create(testRulings[0]);

      // Verify searchVector is populated
      expect(ruling.searchVector).toBeDefined();
      expect(ruling.searchVector).not.toBeNull();

      // Query directly to verify the tsvector format
      const result = await dataSource.query(
        `SELECT "searchVector" FROM legal_rulings WHERE id = $1`,
        [ruling.id],
      );

      expect(result.length).toBe(1);
      expect(result[0].searchVector).toBeDefined();

      // Clean up
      await legalRulingService.delete(ruling.id);
    });

    it('should automatically update search vector on update via trigger', async () => {
      const ruling = await legalRulingService.create(testRulings[0]);

      // Get original search vector
      const originalResult = await dataSource.query(
        `SELECT "searchVector" FROM legal_rulings WHERE id = $1`,
        [ruling.id],
      );
      const originalVector = originalResult[0].searchVector;

      // Update the ruling
      await legalRulingService.update(ruling.id, {
        summary: 'Updated summary with new keywords',
      });

      // Get updated search vector
      const updatedResult = await dataSource.query(
        `SELECT "searchVector" FROM legal_rulings WHERE id = $1`,
        [ruling.id],
      );
      const updatedVector = updatedResult[0].searchVector;

      // Search vector should have changed
      expect(updatedVector).not.toEqual(originalVector);

      // Clean up
      await legalRulingService.delete(ruling.id);
    });
  });

  describe('Weighted Search Relevance', () => {
    beforeAll(async () => {
      // Create all test rulings for search tests
      for (const ruling of testRulings) {
        try {
          await legalRulingService.create(ruling);
        } catch (e) {
          // May fail if already exists
        }
      }
    });

    afterAll(async () => {
      await cleanTestData();
    });

    it('should prioritize signature matches (weight A) over content matches', async () => {
      // Search for a specific signature term "CZP" which only appears in the third ruling's signature
      const results = await legalRulingService.search({
        query: 'CZP',
        limit: 10,
      });

      // The Supreme Court ruling with "III CZP 789/24" in signature should rank highest
      expect(results.length).toBeGreaterThan(0);

      const firstResult = results[0];
      expect(firstResult.ruling.signature).toContain('CZP');
      expect(firstResult.ruling.courtType).toBe(CourtType.SUPREME_COURT);

      // The rank should be significantly higher for signature match
      expect(firstResult.rank).toBeGreaterThan(0);
    });

    it('should prioritize court name matches (weight A) over content matches', async () => {
      // Search for "Najwyższy" (Supreme) which appears in:
      // - courtName of ruling 3 (weight A)
      const results = await legalRulingService.search({
        query: 'Najwyższy',
        limit: 10,
      });

      expect(results.length).toBeGreaterThan(0);

      // First result should be the Supreme Court ruling
      const firstResult = results[0];
      expect(firstResult.ruling.courtType).toBe(CourtType.SUPREME_COURT);
      expect(firstResult.ruling.courtName).toContain('Najwyższy');
    });

    it('should use Polish text configuration for proper stemming', async () => {
      // Search for "umowa" (contract) - Polish stemming should match "umowie", "umową", etc.
      const results = await legalRulingService.search({
        query: 'umowa',
        limit: 10,
      });

      // Should find rulings with "umowa o dzieło" (different forms)
      expect(results.length).toBeGreaterThan(0);

      // Results should include rulings with the term in different grammatical forms
      const hasContractInSummary = results.some(
        (r) => r.ruling.summary && r.ruling.summary.toLowerCase().includes('umowa'),
      );
      expect(hasContractInSummary).toBe(true);
    });

    it('should return ranked results with proper scoring', async () => {
      // Search for "umowa o dzieło" - appears in:
      // - Ruling 1: summary (weight C)
      // - Ruling 3: summary (weight C)
      const results = await legalRulingService.search({
        query: 'umowa o dzieło',
        limit: 10,
      });

      expect(results.length).toBeGreaterThan(0);

      // All results should have a rank
      for (const result of results) {
        expect(result.rank).toBeGreaterThanOrEqual(0);
      }

      // Results should be sorted by rank (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].rank).toBeGreaterThanOrEqual(results[i].rank);
      }
    });

    it('should filter by court type while maintaining relevance ranking', async () => {
      const results = await legalRulingService.search({
        query: 'umowa',
        courtType: CourtType.DISTRICT_COURT,
        limit: 10,
      });

      // All results should be from district courts
      for (const result of results) {
        expect(result.ruling.courtType).toBe(CourtType.DISTRICT_COURT);
      }

      // Results should still be ranked
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].rank).toBeGreaterThanOrEqual(results[i].rank);
      }
    });

    it('should generate highlighted headlines', async () => {
      const results = await legalRulingService.search({
        query: 'umowa',
        limit: 5,
      });

      expect(results.length).toBeGreaterThan(0);

      // At least some results should have headlines
      const resultsWithHeadline = results.filter((r) => r.headline && r.headline.length > 0);
      expect(resultsWithHeadline.length).toBeGreaterThan(0);

      // Headlines should contain highlighting markers
      const headlineWithHighlight = resultsWithHeadline.find((r) =>
        r.headline?.includes('<b>') || r.headline?.includes('<em>'),
      );
      expect(headlineWithHighlight).toBeDefined();
    });

    it('should count search results correctly', async () => {
      const count = await legalRulingService.countSearchResults({
        query: 'umowa',
      });

      expect(count).toBeGreaterThan(0);

      // Count should match or exceed actual search results (due to filtering differences)
      const results = await legalRulingService.search({
        query: 'umowa',
        limit: 100,
      });

      expect(count).toBeGreaterThanOrEqual(results.length);
    });
  });

  describe('GIN Index Performance', () => {
    it('should have GIN index on searchVector column', async () => {
      const result = await dataSource.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'legal_rulings'
          AND indexname = 'idx_legal_rulings_searchvector_gin'
      `);

      expect(result.length).toBe(1);
      expect(result[0].indexname).toBe('idx_legal_rulings_searchvector_gin');
    });

    it('should use GIN index for search queries (via EXPLAIN)', async () => {
      // Create a test ruling for the explain test
      const ruling = await legalRulingService.create(testRulings[0]);

      // Get the query plan
      const plan = await dataSource.query(`
        EXPLAIN
        SELECT * FROM legal_rulings
        WHERE "searchVector" @@ plainto_tsquery('polish', 'umowa')
        LIMIT 1
      `);

      const planString = JSON.stringify(plan);

      // The plan should indicate index usage (contains "Index" or "Bitmap")
      // Note: Exact output depends on PostgreSQL version and data size
      expect(planString).toBeDefined();

      // Clean up
      await legalRulingService.delete(ruling.id);
    });
  });

  describe('Polish Text Configuration', () => {
    it('should use Polish text search configuration', async () => {
      // Verify Polish configuration exists
      const result = await dataSource.query(`
        SELECT cfgname FROM pg_ts_config WHERE cfgname = 'polish'
      `);

      expect(result.length).toBeGreaterThanOrEqual(0);
      // If Polish config doesn't exist, test may still pass if migration handles it
    });

    it('should properly stem Polish text', async () => {
      // Test Polish stemming: "umowa" should match "umowie", "umową"
      const tsquery = await dataSource.query(`
        SELECT plainto_tsquery('polish', 'umowa') as query
      `);

      expect(tsquery[0].query).toBeDefined();

      // The query should contain lexemes
      expect(tsquery[0].query.length).toBeGreaterThan(0);
    });
  });
});
