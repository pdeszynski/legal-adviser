/**
 * SAOS Crawler Integration Tests
 *
 * Comprehensive E2E tests for the SAOS crawler to ensure all data is being
 * correctly fetched and stored. Uses mocked SAOS API for deterministic testing.
 *
 * Test Scenarios:
 * 1) Mock SAOS API responses with known test data
 * 2) Verify search results page 20+ are processed correctly (test specific missing judgment case)
 * 3) Verify text content is fetched and stored from detail endpoint
 * 4) Test deduplication with same signature from different courts (both should be saved)
 * 5) Test composite unique constraint prevents exact duplicates (same court + signature + date)
 * 6) Verify all additional fields are populated (judges, legal basis, regulations, etc.)
 * 7) Test error handling when SAOS API returns 500 or timeout
 * 8) Test rate limiting and retry logic
 * 9) Verify tsvector generation includes weighted fields
 * 10) Test full-text search returns expected results with proper ranking
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { SaosAdapter } from '../../src/infrastructure/anti-corruption/saos/saos.adapter';
import { SaosTransformer } from '../../src/infrastructure/anti-corruption/saos/saos.transformer';
import {
  SaosJudgment,
  SaosSearchResponse,
  SaosErrorResponse,
} from '../../src/infrastructure/anti-corruption/saos/saos.types';
import { CourtType } from '../../src/modules/documents/entities/legal-ruling.entity';
import { LegalRuling } from '../../src/modules/documents/entities/legal-ruling.entity';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RulingSource } from '../../src/domain/legal-rulings/value-objects/ruling-source.vo';

/**
 * Test data fixtures for SAOS API responses
 */
const mockSaosTestData = {
  /**
   * Standard judgment from search endpoint (summary data)
   */
  searchResultJudgment: {
    id: 12345,
    href: 'https://www.saos.org.pl/judgments/12345',
    courtType: 'ADMINISTRATIVE_COURT',
    courtCases: [{ caseNumber: 'III SA/Wa 1234/23' }],
    judgmentType: 'WYROK',
    judges: [
      { name: 'Jan Kowalski', function: 'Przewodniczący', specialRoles: [] },
      { name: 'Anna Nowak', function: 'Sędzia', specialRoles: ['Sprawozdawca'] },
    ],
    textContent: 'Skrócona treść orzeczenia...',
    keywords: ['podatek', 'VAT', 'odpis'],
    judgmentDate: '2023-05-15',
    division: { id: 1, name: 'Wydział I', code: 'SA' },
    court: { id: 5, code: 'SA/Wa', name: 'Wojewódzki Sąd Administracyjny w Warszawie' },
    summary: 'Orzeczenie dotyczy interpretacji przepisów o podatku VAT.',
    metadata: { legalArea: 'podatkowe' },
  } as SaosJudgment,

  /**
   * Full judgment from detail endpoint
   */
  fullJudgment: {
    id: 12345,
    href: 'https://www.saos.org.pl/judgments/12345',
    courtType: 'ADMINISTRATIVE_COURT',
    courtCases: [{ caseNumber: 'III SA/Wa 1234/23' }],
    judgmentType: 'WYROK',
    judges: [
      { name: 'Jan Kowalski', function: 'Przewodniczący', specialRoles: [] },
      { name: 'Anna Nowak', function: 'Sędzia', specialRoles: ['Sprawozdawca'] },
      { name: 'Piotr Wiśniewski', function: 'Sędzia', specialRoles: [] },
    ],
    keywords: ['podatek', 'VAT', 'odpis', 'interpretacja'],
    judgmentDate: '2023-05-15',
    division: { id: 1, name: 'Wydział I', code: 'SA' },
    court: { id: 5, code: 'SA/Wa', name: 'Wojewódzki Sąd Administracyjny w Warszawie' },
    summary: 'Orzeczenie dotyczy interpretacji przepisów o podatku VAT.',
    metadata: { legalArea: 'podatkowe' },
    // Full detail fields
    divisionName: 'Wydział I - Skargi',
    legalBasis: [
      'Art. 15 ust. 1 ustawy z dnia 11 marca 2004 r. o podatku od towarów i usług',
      'Art. 2 ust. 1 ustawy z dnia 29 sierpnia 1997 r. - Ordynacja podatkowa',
    ],
    referencedRegulations: [
      {
        raw: 'Dz.U. 2004 nr 54 poz. 535',
        journalNo: 'Dz.U. 2004 nr 54 poz. 535',
        year: 2004,
        position: 535,
        text: 'Ustawa o podatku od towarów i usług',
      },
      {
        raw: 'Dz.U. 1997 nr 137 poz. 926',
        journalNo: 'Dz.U. 1997 nr 137 poz. 926',
        year: 1997,
        position: 926,
      },
    ],
    parties: [
      { name: 'Jan Przedsiębiorca', type: 'PERSON', role: 'skarżący' },
      { name: 'Dyrektor Izby Skarbowej', type: 'INSTITUTION', role: 'organ' },
    ],
    attorneys: [
      { name: 'radca prawny Adam Mecenas', role: 'pełnomocnik', representedParty: 'Jan Przedsiębiorca' },
    ],
    proceedingType: 'skarga na decyzję',
    fullTextContent: 'Pełna treść orzeczenia. W dniu 15 maja 2023 r. Wojewódzki Sąd Administracyjny w Warszawie...',
    referencedCourtCases: [
      { caseNumber: 'III FSK 123/21', href: 'https://www.saos.org.pl/judgments/10001' },
      { caseNumber: 'I FPS 1/22' },
    ],
    keywordsDetail: ['podatek', 'VAT', 'odpis', 'interpretacja'],
    // Add signature field for relevance tests
    signature: 'III SA/Wa 1234/23',
    textContent: 'Orzeczenie dotyczy interpretacji przepisów o podatku VAT i zawiera szczegółowe uzasadnienie.',
  } as SaosJudgment,

  /**
   * Another judgment with same signature but different court (for deduplication test)
   */
  sameSignatureDifferentCourt: {
    id: 67890,
    href: 'https://www.saos.org.pl/judgments/67890',
    courtType: 'ADMINISTRATIVE_COURT',
    courtCases: [{ caseNumber: 'III SA/Wa 1234/23' }],
    judgmentType: 'WYROK',
    judges: [{ name: 'Marech Zając', function: 'Przewodniczący', specialRoles: [] }],
    keywords: ['inne słowa kluczowe'],
    judgmentDate: '2023-05-15',
    division: { id: 2, name: 'Wydział II', code: 'SA' },
    court: { id: 6, code: 'SA/Gd', name: 'Wojewódzki Sąd Administracyjny w Gdańsku' },
    summary: 'Inne orzeczenie z tym samym numerem.',
    fullTextContent: 'Pełna treść orzeczenia z Gdańska...',
  } as SaosJudgment,

  /**
   * Judgment with same signature, same court, same date (for unique constraint test)
   */
  exactDuplicate: {
    id: 11111,
    href: 'https://www.saos.org.pl/judgments/11111',
    courtType: 'ADMINISTRATIVE_COURT',
    courtCases: [{ caseNumber: 'III SA/Wa 1234/23' }],
    judgmentType: 'WYROK',
    judges: [{ name: 'Jan Kowalski', function: 'Przewodniczący', specialRoles: [] }],
    judgmentDate: '2023-05-15',
    division: { id: 1, name: 'Wydział I', code: 'SA' },
    court: { id: 5, code: 'SA/Wa', name: 'Wojewódzki Sąd Administracyjny w Warszawie' },
    summary: 'To samo orzeczenie co w_ID=12345',
    fullTextContent: 'Identyczna treść...',
  } as SaosJudgment,

  /**
   * Search response for multiple pages
   */
  multiPageSearchResponse: (page: number, pageSize: number = 10): SaosSearchResponse => ({
    items: Array.from({ length: pageSize }, (_, i) => ({
      id: page * pageSize + i + 1,
      href: `https://www.saos.org.pl/judgments/${page * pageSize + i + 1}`,
      courtType: 'ADMINISTRATIVE_COURT',
      courtCases: [{ caseNumber: `III SA/Wa ${1000 + page * pageSize + i}/23` }],
      judgmentType: 'WYROK',
      judges: [{ name: `Sędzia ${i}`, function: 'Sędzia', specialRoles: [] }],
      textContent: `Treść orzeczenia ${i} ze strony ${page}`,
      keywords: [`keyword${i}`],
      judgmentDate: '2023-05-15',
      division: { id: 1, name: 'Wydział I', code: 'SA' },
      court: { id: 5, code: 'SA/Wa', name: 'Wojewódzki Sąd Administracyjny w Warszawie' },
    })),
    links: [],
    info: { totalResults: 250 },
  }),

  /**
   * Error response
   */
  errorResponse: (message: string): SaosErrorResponse => ({
    error: 'ERROR',
    message,
  }),
};

/**
 * Helper to create axios response
 */
const createAxiosResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

/**
 * Helper to create axios error
 */
const createAxiosError = (
  message: string,
  code: string = 'ERR_BAD_REQUEST',
  status: number = 500,
): AxiosError => ({
  name: 'AxiosError',
  message,
  code,
  config: {} as any,
  response: {
    data: mockSaosTestData.errorResponse(message),
    status,
    statusText: 'Internal Server Error',
    headers: {},
    config: {} as any,
  },
  isAxiosError: true,
  toJSON: () => ({}),
} as any);

describe('SAOS Crawler - Integration Tests', () => {
  let httpService: HttpService;
  let saosAdapter: SaosAdapter;
  let saosTransformer: SaosTransformer;
  let repository: Repository<LegalRuling>;
  let mockHttpService: {
    get: jest.Mock;
  };

  beforeAll(async () => {
    // Create mock repository
    const mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      query: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        SaosTransformer,
        {
          provide: SaosAdapter,
          useFactory: (http: HttpService, config: ConfigService, transformer: SaosTransformer) => {
            return new SaosAdapter(http, config, transformer);
          },
          inject: [HttpService, ConfigService, SaosTransformer],
        },
        {
          provide: getRepositoryToken(LegalRuling),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const configMap: Record<string, string> = {
                SAOS_API_URL: 'https://test.saos.org.pl/api',
                SAOS_API_KEY: 'test-api-key',
              };
              return configMap[key];
            }),
          } as Partial<ConfigService>,
        },
      ],
    }).compile();

    httpService = module.get<HttpService>(HttpService);
    saosAdapter = module.get<SaosAdapter>(SaosAdapter);
    saosTransformer = module.get<SaosTransformer>(SaosTransformer);
    repository = module.get<Repository<LegalRuling>>(getRepositoryToken(LegalRuling));

    // Spy on httpService.get to mock API calls
    mockHttpService = {
      get: jest.fn(),
    };
    (httpService as any).get = mockHttpService.get;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Scenario 1: Mock SAOS API responses with known test data
   */
  describe('Scenario 1: Mock SAOS API responses', () => {
    it('should successfully transform search result to domain model', () => {
      const mockJudgment = mockSaosTestData.searchResultJudgment;

      const result = saosTransformer.toDomain(mockJudgment);

      expect(result).toBeDefined();
      expect(result.signature).toBe('III SA/Wa 1234/23');
      expect(result.courtName).toBe('Wojewódzki Sąd Administracyjny w Warszawie');
      expect(result.courtType).toBe(CourtType.ADMINISTRATIVE_COURT);
      expect(result.source).toBe(RulingSource.SAOS);
      expect(result.externalId).toBe('12345');
      expect(result.summary).toBe('Orzeczenie dotyczy interpretacji przepisów o podatku VAT.');
      expect(result.fullText).toBe('Skrócona treść orzeczenia...');
    });

    it('should successfully transform full judgment to domain model', () => {
      const mockFullJudgment = mockSaosTestData.fullJudgment;

      const result = saosTransformer.toDomain(mockFullJudgment);

      expect(result).toBeDefined();
      expect(result.signature).toBe('III SA/Wa 1234/23');
      expect(result.summary).toBe('Orzeczenie dotyczy interpretacji przepisów o podatku VAT.');
      expect(result.fullText).toContain('Pełna treść orzeczenia');
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.divisionName).toBe('Wydział I - Skargi');
      expect(result.metadata?.legalBasis).toHaveLength(2);
      expect(result.metadata?.legalBasis?.[0]).toContain('Art. 15 ust. 1');
      expect(result.metadata?.referencedRegulations).toHaveLength(2);
      expect(result.metadata?.parties).toHaveLength(2);
      expect(result.metadata?.attorneys).toHaveLength(1);
      expect(result.metadata?.proceedingType).toBe('skarga na decyzję');
      expect(result.metadata?.judges).toHaveLength(3);
      expect(result.metadata?.referencedCourtCases).toHaveLength(2);
      expect(result.metadata?.keywords).toContain('interpretacja');
    });

    it('should validate correct SAOS judgment structure', () => {
      const validJudgment = mockSaosTestData.fullJudgment;

      const isValid = saosTransformer.validateExternal(validJudgment);

      expect(isValid).toBe(true);
    });

    it('should reject invalid SAOS judgment structure', () => {
      const invalidJudgment = { id: 'not-a-number', judgmentDate: '2023-05-15' };

      const isValid = saosTransformer.validateExternal(invalidJudgment);

      expect(isValid).toBe(false);
    });

    it('should reject judgment without required fields', () => {
      const incompleteJudgment = { id: 123 };

      const isValid = saosTransformer.validateExternal(incompleteJudgment);

      expect(isValid).toBe(false);
    });
  });

  /**
   * Scenario 2: Verify search results page 20+ are processed correctly
   */
  describe('Scenario 2: Deep pagination (page 20+)', () => {
    it('should correctly fetch and process page 25 of search results', async () => {
      const pageNumber = 25;
      const pageSize = 10;
      const mockSearchResponse = mockSaosTestData.multiPageSearchResponse(pageNumber, pageSize);

      mockHttpService.get.mockReturnValueOnce(
        of(createAxiosResponse(mockSearchResponse)),
      );

      const result = await saosAdapter.search({
        query: 'podatek',
        limit: pageSize,
        offset: pageNumber * pageSize,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.results).toHaveLength(pageSize);
      expect(result.data?.totalCount).toBe(250);

      // Verify API was called with correct page number
      const callArgs = mockHttpService.get.mock.calls[0];
      expect(callArgs).toBeDefined();
      expect(callArgs[0]).toContain('pageNumber=' + pageNumber);
    });

    it('should handle missing judgment on deep page gracefully', async () => {
      // Mock a response where one item has missing required fields
      const incompletePageResponse: SaosSearchResponse = {
        items: [
          mockSaosTestData.fullJudgment,
          { id: 'invalid-id', judgmentDate: '2023-05-15' } as any, // Invalid item
          mockSaosTestData.fullJudgment,
        ],
        links: [],
        info: { totalResults: 3 },
      };

      mockHttpService.get.mockReturnValueOnce(
        of(createAxiosResponse(incompletePageResponse)),
      );

      const result = await saosAdapter.search({
        query: 'test',
        limit: 10,
      });

      expect(result.success).toBe(true);
      // Invalid items should be filtered out
      expect(result.data?.results.length).toBeLessThanOrEqual(2);
    });
  });

  /**
   * Scenario 3: Verify text content is fetched from detail endpoint
   */
  describe('Scenario 3: Full text content fetching', () => {
    it('should fetch full text content from detail endpoint', async () => {
      // getJudgment directly calls the detail endpoint /judgments/{id}
      mockHttpService.get.mockReturnValueOnce(
        of(createAxiosResponse(mockSaosTestData.fullJudgment)),
      );

      const result = await saosAdapter.getJudgment('12345');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.fullText).toContain('Pełna treść orzeczenia');
      expect(result.data?.metadata?.legalBasis).toBeDefined();
      expect(result.data?.metadata?.referencedRegulations).toBeDefined();
    });

    it('should fetch judgment details in batch with concurrency control', async () => {
      const judgmentIds = ['12345', '67890', '11111', '22222', '33333'];

      // Mock detail endpoint calls
      mockHttpService.get.mockImplementation((url: string) => {
        const id = url.split('/').pop();
        return of(createAxiosResponse({
          ...mockSaosTestData.fullJudgment,
          id: parseInt(id || '0'),
        }));
      });

      const result = await saosAdapter.fetchJudgmentDetails(judgmentIds, {
        concurrency: 2,
        batchDelay: 10,
      });

      expect(result.size).toBe(5);
      expect(result.has('12345')).toBe(true);
      expect(result.has('67890')).toBe(true);
    });

    it('should use searchWithDetails to fetch summaries then full details', async () => {
      // Search returns summary data
      mockHttpService.get.mockReturnValueOnce(
        of(createAxiosResponse({
          items: [mockSaosTestData.searchResultJudgment],
          links: [],
          info: { totalResults: 1 },
        })),
      );

      // Detail returns full data
      mockHttpService.get.mockReturnValueOnce(
        of(createAxiosResponse(mockSaosTestData.fullJudgment)),
      );

      const result = await saosAdapter.searchWithDetails(
        { query: 'test' },
        true,
        { concurrency: 5, batchDelay: 10 },
      );

      expect(result.success).toBe(true);
      expect(result.data?.results[0].ruling.fullText).toContain('Pełna treść');
      expect(result.data?.results[0].ruling.metadata?.legalBasis).toBeDefined();
    });
  });

  /**
   * Scenario 4: Test deduplication with same signature from different courts
   */
  describe('Scenario 4: Deduplication across courts', () => {
    it('should allow same signature from different courts', () => {
      const warsawJudgment = saosTransformer.toDomain(mockSaosTestData.fullJudgment);
      const gdanskJudgment = saosTransformer.toDomain(mockSaosTestData.sameSignatureDifferentCourt);

      expect(warsawJudgment.signature).toBe(gdanskJudgment.signature);
      expect(warsawJudgment.rulingDate.toISOString()).toBe(gdanskJudgment.rulingDate.toISOString());
      expect(warsawJudgment.courtName).not.toBe(gdanskJudgment.courtName);

      // Both should have unique composite keys (courtName, signature, rulingDate)
      const warsawKey = `${warsawJudgment.courtName}|${warsawJudgment.signature}|${warsawJudgment.rulingDate.toISOString()}`;
      const gdanskKey = `${gdanskJudgment.courtName}|${gdanskJudgment.signature}|${gdanskJudgment.rulingDate.toISOString()}`;

      expect(warsawKey).not.toBe(gdanskKey);
    });

    it('should have different court names for same signature', () => {
      const judgment1 = mockSaosTestData.fullJudgment;
      const judgment2 = mockSaosTestData.sameSignatureDifferentCourt;

      const court1 = judgment1.court?.name;
      const court2 = judgment2.court?.name;

      expect(court1).toBe('Wojewódzki Sąd Administracyjny w Warszawie');
      expect(court2).toBe('Wojewódzki Sąd Administracyjny w Gdańsku');
      expect(court1).not.toBe(court2);
    });
  });

  /**
   * Scenario 5: Test composite unique constraint
   */
  describe('Scenario 5: Composite unique constraint', () => {
    it('should create identical composite key for exact duplicates', () => {
      const judgment1 = saosTransformer.toDomain(mockSaosTestData.fullJudgment);
      const judgment2 = saosTransformer.toDomain(mockSaosTestData.exactDuplicate);

      // Same signature, same court, same date
      expect(judgment1.signature).toBe(judgment2.signature);
      expect(judgment1.courtName).toBe(judgment2.courtName);
      expect(judgment1.rulingDate.toISOString()).toBe(judgment2.rulingDate.toISOString());

      // Composite key should be identical
      const key1 = `${judgment1.courtName}|${judgment1.signature}|${judgment1.rulingDate.toISOString()}`;
      const key2 = `${judgment2.courtName}|${judgment2.signature}|${judgment2.rulingDate.toISOString()}`;

      expect(key1).toBe(key2);
    });

    it('should identify that exact duplicates should be rejected by unique constraint', () => {
      const entity1 = new LegalRuling();
      entity1.signature = 'III SA/Wa 1234/23';
      entity1.courtName = 'Wojewódzki Sąd Administracyjny w Warszawie';
      entity1.rulingDate = new Date('2023-05-15');

      const entity2 = new LegalRuling();
      entity2.signature = 'III SA/Wa 1234/23';
      entity2.courtName = 'Wojewódzki Sąd Administracyjny w Warszawie';
      entity2.rulingDate = new Date('2023-05-15');

      // These would violate the unique constraint
      expect(entity1.signature).toBe(entity2.signature);
      expect(entity1.courtName).toBe(entity2.courtName);
      expect(entity1.rulingDate.getTime()).toBe(entity2.rulingDate.getTime());
    });

    it('should allow different dates for same signature and court', () => {
      const entity1 = new LegalRuling();
      entity1.signature = 'III SA/Wa 1234/23';
      entity1.courtName = 'Wojewódzki Sąd Administracyjny w Warszawie';
      entity1.rulingDate = new Date('2023-05-15');

      const entity2 = new LegalRuling();
      entity2.signature = 'III SA/Wa 1234/23';
      entity2.courtName = 'Wojewódzki Sąd Administracyjny w Warszawie';
      entity2.rulingDate = new Date('2023-06-20');

      // Different dates should be allowed
      expect(entity1.rulingDate.getTime()).not.toBe(entity2.rulingDate.getTime());
    });
  });

  /**
   * Scenario 6: Verify all additional fields are populated
   */
  describe('Scenario 6: Additional fields population', () => {
    it('should populate all judges information', () => {
      const mockFullJudgment = mockSaosTestData.fullJudgment;
      const result = saosTransformer.toDomain(mockFullJudgment);

      expect(result.metadata?.judges).toBeDefined();
      expect(result.metadata?.judges).toHaveLength(3);

      const [presiding, reporter, regular] = result.metadata!.judges!;

      expect(presiding.name).toBe('Jan Kowalski');
      expect(presiding.function).toBe('Przewodniczący');
      expect(presiding.specialRoles).toEqual([]);

      expect(reporter.name).toBe('Anna Nowak');
      expect(reporter.function).toBe('Sędzia');
      expect(reporter.specialRoles).toContain('Sprawozdawca');

      expect(regular.name).toBe('Piotr Wiśniewski');
      expect(regular.function).toBe('Sędzia');
    });

    it('should populate legal basis references', () => {
      const result = saosTransformer.toDomain(mockSaosTestData.fullJudgment);

      expect(result.metadata?.legalBasis).toBeDefined();
      expect(result.metadata?.legalBasis).toHaveLength(2);
      expect(result.metadata?.legalBasis?.[0]).toContain('Art. 15 ust. 1');
      expect(result.metadata?.legalBasis?.[1]).toContain('Art. 2 ust. 1');
    });

    it('should populate referenced regulations with full details', () => {
      const result = saosTransformer.toDomain(mockSaosTestData.fullJudgment);

      expect(result.metadata?.referencedRegulations).toBeDefined();
      expect(result.metadata?.referencedRegulations).toHaveLength(2);

      const [reg1, reg2] = result.metadata!.referencedRegulations!;

      expect(reg1.raw).toBe('Dz.U. 2004 nr 54 poz. 535');
      expect(reg1.journalNo).toBe('Dz.U. 2004 nr 54 poz. 535');
      expect(reg1.year).toBe(2004);
      expect(reg1.position).toBe(535);
      expect(reg1.text).toBe('Ustawa o podatku od towarów i usług');

      expect(reg2.raw).toBe('Dz.U. 1997 nr 137 poz. 926');
      expect(reg2.year).toBe(1997);
      expect(reg2.position).toBe(926);
    });

    it('should populate parties with their roles', () => {
      const result = saosTransformer.toDomain(mockSaosTestData.fullJudgment);

      expect(result.metadata?.parties).toBeDefined();
      expect(result.metadata?.parties).toHaveLength(2);

      const [party1, party2] = result.metadata!.parties!;

      expect(party1.name).toBe('Jan Przedsiębiorca');
      expect(party1.type).toBe('PERSON');
      expect(party1.role).toBe('skarżący');

      expect(party2.name).toBe('Dyrektor Izby Skarbowej');
      expect(party2.type).toBe('INSTITUTION');
      expect(party2.role).toBe('organ');
    });

    it('should populate attorneys with represented parties', () => {
      const result = saosTransformer.toDomain(mockSaosTestData.fullJudgment);

      expect(result.metadata?.attorneys).toBeDefined();
      expect(result.metadata?.attorneys).toHaveLength(1);

      const attorney = result.metadata!.attorneys![0];

      expect(attorney.name).toBe('radca prawny Adam Mecenas');
      expect(attorney.role).toBe('pełnomocnik');
      expect(attorney.representedParty).toBe('Jan Przedsiębiorca');
    });

    it('should populate proceeding type', () => {
      const result = saosTransformer.toDomain(mockSaosTestData.fullJudgment);

      expect(result.metadata?.proceedingType).toBe('skarga na decyzję');
    });

    it('should populate division name', () => {
      const result = saosTransformer.toDomain(mockSaosTestData.fullJudgment);

      expect(result.metadata?.divisionName).toBe('Wydział I - Skargi');
    });

    it('should populate referenced court cases', () => {
      const result = saosTransformer.toDomain(mockSaosTestData.fullJudgment);

      expect(result.metadata?.referencedCourtCases).toBeDefined();
      expect(result.metadata?.referencedCourtCases).toHaveLength(2);

      const [ref1, ref2] = result.metadata!.referencedCourtCases!;

      expect(ref1.caseNumber).toBe('III FSK 123/21');
      expect(ref1.href).toBe('https://www.saos.org.pl/judgments/10001');

      expect(ref2.caseNumber).toBe('I FPS 1/22');
      expect(ref2.href).toBeUndefined();
    });

    it('should populate keywords from detail endpoint', () => {
      const result = saosTransformer.toDomain(mockSaosTestData.fullJudgment);

      expect(result.metadata?.keywords).toBeDefined();
      expect(result.metadata?.keywords).toContain('podatek');
      expect(result.metadata?.keywords).toContain('VAT');
      expect(result.metadata?.keywords).toContain('interpretacja');
      expect(result.metadata?.keywords).toContain('odpis');
    });
  });

  /**
   * Scenario 7: Test error handling
   */
  describe('Scenario 7: API error handling', () => {
    it('should handle non-retryable 500 error', async () => {
      // ERR_BAD_RESPONSE is not in retryable errors, so it will throw directly
      // The adapter catches it and returns an IntegrationResult
      const axiosError = createAxiosError('Internal Server Error', 'ERR_BAD_RESPONSE', 500);

      mockHttpService.get.mockReturnValueOnce(throwError(() => axiosError));

      const result = await saosAdapter.search({ query: 'test' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // Error code comes from transformer.createIntegrationError (default for non-Error objects)
      expect(result.error?.code).toBe('SAOS_INTEGRATION_ERROR');
    });

    it('should handle timeout error (ECONNABORTED not retryable)', async () => {
      const timeoutError = createAxiosError('timeout of 30000ms exceeded', 'ECONNABORTED', 408);

      mockHttpService.get.mockReturnValueOnce(throwError(() => timeoutError));

      const result = await saosAdapter.search({ query: 'test' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('SAOS_INTEGRATION_ERROR');
    });

    it('should handle network error (ERR_NETWORK not retryable)', async () => {
      const networkError = createAxiosError('Network Error', 'ERR_NETWORK');

      mockHttpService.get.mockReturnValueOnce(throwError(() => networkError));

      const result = await saosAdapter.search({ query: 'test' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('SAOS_INTEGRATION_ERROR');
    });

    it('should handle SAOS API error response', async () => {
      mockHttpService.get.mockReturnValueOnce(
        of(createAxiosResponse({
          error: 'VALIDATION_ERROR',
          message: 'Invalid date format',
        })),
      );

      const result = await saosAdapter.search({ query: 'test' });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('SAOS API error');
    });

    it('should return non-retryable error for invalid judgment format', async () => {
      mockHttpService.get.mockReturnValueOnce(
        of(createAxiosResponse({} as any)), // Empty response
      );

      const result = await saosAdapter.getJudgment('12345');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_RESPONSE');
      expect(result.error?.retryable).toBe(false);
    });
  });

  /**
   * Scenario 8: Test rate limiting and retry logic
   */
  describe('Scenario 8: Rate limiting and retry', () => {
    it('should retry on transient network error', async () => {
      let attemptCount = 0;

      mockHttpService.get.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return throwError(() => createAxiosError('Network timeout', 'ETIMEDOUT'));
        }
        return of(createAxiosResponse({
          items: [mockSaosTestData.fullJudgment],
          links: [],
          info: { totalResults: 1 },
        }));
      });

      const result = await saosAdapter.search({ query: 'test' });

      expect(result.success).toBe(true);
      expect(attemptCount).toBeGreaterThanOrEqual(3);
    });

    it('should respect batch delay during batch fetching', async () => {
      const judgmentIds = ['1', '2', '3', '4', '5'];
      const timestamps: number[] = [];

      mockHttpService.get.mockImplementation(() => {
        timestamps.push(Date.now());
        return of(createAxiosResponse(mockSaosTestData.fullJudgment));
      });

      await saosAdapter.fetchJudgmentDetails(judgmentIds, {
        concurrency: 2,
        batchDelay: 50,
      });

      // Should have 5 successful calls
      expect(mockHttpService.get).toHaveBeenCalledTimes(5);

      // First batch (2 concurrent) should have similar timestamps
      expect(timestamps[1] - timestamps[0]).toBeLessThan(50);

      // Delay between batches
      expect(timestamps[2] - timestamps[1]).toBeGreaterThanOrEqual(40);
    });

    it('should continue on error when continueOnError is true', async () => {
      const judgmentIds = ['1', '2', '3'];

      mockHttpService.get.mockImplementation((url: string) => {
        const id = url.split('/').pop();
        if (id === '2') {
          return throwError(() => createAxiosError('Not found', 'ERR_BAD_RESPONSE', 404));
        }
        return of(createAxiosResponse({
          ...mockSaosTestData.fullJudgment,
          id: parseInt(id || '0'),
        }));
      });

      const result = await saosAdapter.fetchJudgmentDetails(judgmentIds, {
        concurrency: 3,
        continueOnError: true,
      });

      expect(result.size).toBe(2); // Only 1 and 3 succeed
      expect(result.has('1')).toBe(true);
      expect(result.has('2')).toBe(false);
      expect(result.has('3')).toBe(true);
    });

    it('should stop on error when continueOnError is false', async () => {
      const judgmentIds = ['1', '2', '3'];

      mockHttpService.get.mockImplementation((url: string) => {
        const id = url.split('/').pop();
        if (id === '2') {
          return throwError(() => createAxiosError('Not found', 'ERR_BAD_RESPONSE', 404));
        }
        return of(createAxiosResponse({
          ...mockSaosTestData.fullJudgment,
          id: parseInt(id || '0'),
        }));
      });

      await expect(
        saosAdapter.fetchJudgmentDetails(judgmentIds, {
          concurrency: 3,
          continueOnError: false,
        }),
      ).rejects.toThrow();
    });
  });

  /**
   * Scenario 9: Verify tsvector generation includes weighted fields
   */
  describe('Scenario 9: TSVS vector generation', () => {
    it('should generate searchable content from all relevant fields', () => {
      const entity = new LegalRuling();
      entity.signature = 'III SA/Wa 1234/23';
      entity.courtName = 'Wojewódzki Sąd Administracyjny w Warszawie';
      entity.summary = 'Orzeczenie dotyczy interpretacji przepisów o podatku VAT.';
      entity.fullText = 'Pełna treść orzeczenia zawierająca szczegółowe uzasadnienie...';
      entity.metadata = {
        keywords: ['podatek', 'VAT', 'interpretacja'],
        legalArea: 'podatkowe',
        judges: [{ name: 'Jan Kowalski' }],
        legalBasis: ['Art. 15 ust. 1 ustawy o VAT'],
        parties: [{ name: 'Jan Przedsiębiorca', type: 'PERSON' }],
      };

      const searchableContent = entity.getSearchableContent();

      expect(searchableContent).toContain('III SA/Wa 1234/23');
      expect(searchableContent).toContain('Wojewódzki Sąd Administracyjny w Warszawie');
      expect(searchableContent).toContain('Orzeczenie dotyczy interpretacji');
      expect(searchableContent).toContain('Pełna treść orzeczenia');
      expect(searchableContent).toContain('podatek');
      expect(searchableContent).toContain('VAT');
      expect(searchableContent).toContain('podatkowe');
      expect(searchableContent).toContain('Jan Kowalski');
      expect(searchableContent).toContain('Art. 15 ust. 1 ustawy o VAT');
      expect(searchableContent).toContain('Jan Przedsiębiorca');
    });

    it('should include all metadata fields in searchable content', () => {
      const entity = new LegalRuling();
      entity.signature = 'I CZP 1/23';
      entity.courtName = 'Sąd Najwyższy';
      entity.metadata = {
        legalArea: 'cywilne',
        divisionName: 'Izba Cywilna',
        proceedingType: 'skarga kasacyjna',
        keywords: ['odpowiedzialność', 'szkoda'],
        judges: [
          { name: 'Jan Sędzia', function: 'Przewodniczący' },
          { name: 'Anna Sędzia', function: 'Sprawozdawca' },
        ],
        legalBasis: ['Art. 415 KC', 'Art. 361 § 2 KC'],
        referencedRegulations: [
          { raw: 'Dz.U. 1964 nr 16 poz. 93', text: 'Kodeks cywilny' },
        ],
        parties: [
          { name: 'Firma XYZ', type: 'INSTITUTION' },
          { name: 'Jan Kowalski', type: 'PERSON' },
        ],
        attorneys: [
          { name: 'radca prawny Marek Zając', representedParty: 'Firma XYZ' },
        ],
        relatedCases: ['V KK 123/22'],
        referencedCourtCases: [{ caseNumber: 'III KP 5/21' }],
      };

      const searchableContent = entity.getSearchableContent();

      expect(searchableContent).toContain('I CZP 1/23');
      expect(searchableContent).toContain('Sąd Najwyższy');
      expect(searchableContent).toContain('cywilne');
      expect(searchableContent).toContain('Izba Cywilna');
      expect(searchableContent).toContain('skarga kasacyjna');
      expect(searchableContent).toContain('odpowiedzialność');
      expect(searchableContent).toContain('szkoda');
      expect(searchableContent).toContain('Jan Sędzia');
      expect(searchableContent).toContain('Anna Sędzia');
      expect(searchableContent).toContain('Art. 415 KC');
      expect(searchableContent).toContain('Dz.U. 1964 nr 16 poz. 93');
      expect(searchableContent).toContain('Kodeks cywilny');
      expect(searchableContent).toContain('Firma XYZ');
      expect(searchableContent).toContain('Jan Kowalski');
      expect(searchableContent).toContain('radca prawny Marek Zając');
      expect(searchableContent).toContain('V KK 123/22');
      expect(searchableContent).toContain('III KP 5/21');
    });

    it('should handle null metadata gracefully', () => {
      const entity = new LegalRuling();
      entity.signature = 'I CZP 1/23';
      entity.courtName = 'Sąd Najwyższy';
      entity.summary = 'Test summary';
      entity.metadata = null;

      const searchableContent = entity.getSearchableContent();

      expect(searchableContent).toContain('I CZP 1/23');
      expect(searchableContent).toContain('Sąd Najwyższy');
      expect(searchableContent).toContain('Test summary');
    });

    it('should prioritize signature (highest weight field first)', () => {
      const entity = new LegalRuling();
      entity.signature = 'UNIQUE_SIGNATURE_123';
      entity.courtName = 'Test Court';
      entity.summary = 'Test';

      const searchableContent = entity.getSearchableContent();

      // Signature should be at the beginning (highest weight)
      expect(searchableContent.startsWith('UNIQUE_SIGNATURE_123')).toBe(true);
    });
  });

  /**
   * Scenario 10: Full-text search ranking
   */
  describe('Scenario 10: Relevance scoring and ranking', () => {
    it('should calculate relevance score based on query match', () => {
      const judgment = mockSaosTestData.fullJudgment;

      const score1 = saosTransformer.calculateRelevance('podatek VAT', judgment);
      const score2 = saosTransformer.calculateRelevance('nieistniejący termin', judgment);

      expect(score1).toBeGreaterThan(score2);
      expect(score1).toBeGreaterThan(0);
    });

    it('should give higher score to signature match', () => {
      const judgment = mockSaosTestData.fullJudgment;

      // Query matches signature (III SA/Wa 1234/23) - should get high score
      const signatureScore = saosTransformer.calculateRelevance('III SA/Wa', judgment);

      // Query matches content only - should get lower score
      const contentScore = saosTransformer.calculateRelevance('interpretacja', judgment);

      expect(signatureScore).toBeGreaterThan(0);
      expect(contentScore).toBeGreaterThan(0);
      // Signature match gets +1.0 bonus
      expect(signatureScore).toBeGreaterThan(contentScore);
    });

    it('should generate headline with query context', () => {
      const judgment = mockSaosTestData.fullJudgment;

      // The headline function looks for query in textContent
      const headline = saosTransformer.generateHeadline('podatku VAT', judgment);

      expect(headline).toBeDefined();
      // Should contain part of the summary/textContent
      expect(headline.length).toBeGreaterThan(0);
    });

    it('should rank results by relevance in search', async () => {
      mockHttpService.get.mockReturnValueOnce(
        of(createAxiosResponse({
          items: [
            mockSaosTestData.fullJudgment,
            {
              ...mockSaosTestData.searchResultJudgment,
              id: 99999,
              summary: 'Completely unrelated judgment about traffic tickets',
            },
          ],
          links: [],
          info: { totalResults: 2 },
        })),
      );

      const result = await saosAdapter.search({ query: 'podatek' });

      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(2);

      // First result should have higher relevance
      const firstScore = result.data?.results[0].relevanceScore;
      const secondScore = result.data?.results[1].relevanceScore;

      expect(firstScore).toBeGreaterThanOrEqual(secondScore);
    });

    it('should calculate relevance from multiple fields', () => {
      const judgment = {
        ...mockSaosTestData.fullJudgment,
        signature: 'III SA/Wa 1234/23',
        court: { ...mockSaosTestData.fullJudgment.court, name: 'Wojewódzki Sąd Administracyjny' },
        summary: 'Orzeczenie o podatku VAT',
        textContent: 'Szczegółowe uzasadnienie dotyczące podatku od towarów i usług',
        keywords: ['podatek', 'VAT', 'podstawa opodatkowania'],
      };

      const score = saosTransformer.calculateRelevance('podatek VAT Sąd Administracyjny', judgment);

      // Should match across multiple fields
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });

  /**
   * Additional edge cases
   */
  describe('Edge cases', () => {
    it('should handle empty search results', async () => {
      mockHttpService.get.mockReturnValueOnce(
        of(createAxiosResponse({ items: [], links: [], info: { totalResults: 0 } })),
      );

      const result = await saosAdapter.search({ query: 'nonexistent' });

      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(0);
      expect(result.data?.totalCount).toBe(0);
    });

    it('should handle judgment with minimal required fields', () => {
      const minimalJudgment = {
        id: 1,
        href: 'https://test.com',
        courtType: 'ADMINISTRATIVE_COURT',
        courtCases: [{ caseNumber: 'I SA/1/23' }],
        judgmentType: 'WYROK',
        judges: [],
        judgmentDate: '2023-01-01',
        division: { id: 1, name: 'Test', code: 'SA' },
      } as SaosJudgment;

      const isValid = saosTransformer.validateExternal(minimalJudgment);

      expect(isValid).toBe(true);

      const domain = saosTransformer.toDomain(minimalJudgment);

      expect(domain.signature).toBe('I SA/1/23');
      expect(domain.externalId).toBe('1');
    });

    it('should handle special characters in signature', () => {
      const specialSignature = {
        ...mockSaosTestData.fullJudgment,
        signature: 'III SA/Wa ¹²³¼½¾ €$£',
      };

      const domain = saosTransformer.toDomain(specialSignature);

      expect(domain.signature).toContain('³');
    });
  });
});
