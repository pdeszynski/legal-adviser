import { LegalRuling, CourtType } from './legal-ruling.entity';

describe('LegalRuling Entity', () => {
  describe('properties', () => {
    it('should have all required properties defined', () => {
      const ruling = new LegalRuling();
      expect(ruling).toHaveProperty('id');
      expect(ruling).toHaveProperty('signature');
      expect(ruling).toHaveProperty('rulingDate');
      expect(ruling).toHaveProperty('courtName');
      expect(ruling).toHaveProperty('courtType');
      expect(ruling).toHaveProperty('summary');
      expect(ruling).toHaveProperty('fullText');
      expect(ruling).toHaveProperty('metadata');
      expect(ruling).toHaveProperty('createdAt');
      expect(ruling).toHaveProperty('updatedAt');
    });
  });

  describe('CourtType enum', () => {
    it('should have all expected court types', () => {
      expect(CourtType.SUPREME_COURT).toBe('SUPREME_COURT');
      expect(CourtType.APPELLATE_COURT).toBe('APPELLATE_COURT');
      expect(CourtType.REGIONAL_COURT).toBe('REGIONAL_COURT');
      expect(CourtType.DISTRICT_COURT).toBe('DISTRICT_COURT');
      expect(CourtType.ADMINISTRATIVE_COURT).toBe('ADMINISTRATIVE_COURT');
      expect(CourtType.CONSTITUTIONAL_TRIBUNAL).toBe('CONSTITUTIONAL_TRIBUNAL');
      expect(CourtType.OTHER).toBe('OTHER');
    });
  });

  describe('hasSummary', () => {
    it('should return true when summary has content', () => {
      const ruling = new LegalRuling();
      ruling.summary = 'This is a summary of the ruling';

      expect(ruling.hasSummary()).toBe(true);
    });

    it('should return false when summary is null', () => {
      const ruling = new LegalRuling();
      ruling.summary = null;

      expect(ruling.hasSummary()).toBe(false);
    });

    it('should return false when summary is empty string', () => {
      const ruling = new LegalRuling();
      ruling.summary = '';

      expect(ruling.hasSummary()).toBe(false);
    });

    it('should return false when summary is only whitespace', () => {
      const ruling = new LegalRuling();
      ruling.summary = '   \n\t  ';

      expect(ruling.hasSummary()).toBe(false);
    });
  });

  describe('hasFullText', () => {
    it('should return true when fullText has content', () => {
      const ruling = new LegalRuling();
      ruling.fullText = 'This is the full text of the ruling';

      expect(ruling.hasFullText()).toBe(true);
    });

    it('should return false when fullText is null', () => {
      const ruling = new LegalRuling();
      ruling.fullText = null;

      expect(ruling.hasFullText()).toBe(false);
    });

    it('should return false when fullText is empty string', () => {
      const ruling = new LegalRuling();
      ruling.fullText = '';

      expect(ruling.hasFullText()).toBe(false);
    });

    it('should return false when fullText is only whitespace', () => {
      const ruling = new LegalRuling();
      ruling.fullText = '   \n\t  ';

      expect(ruling.hasFullText()).toBe(false);
    });
  });

  describe('isComplete', () => {
    it('should return true when both summary and fullText have content', () => {
      const ruling = new LegalRuling();
      ruling.summary = 'Summary content';
      ruling.fullText = 'Full text content';

      expect(ruling.isComplete()).toBe(true);
    });

    it('should return false when only summary has content', () => {
      const ruling = new LegalRuling();
      ruling.summary = 'Summary content';
      ruling.fullText = null;

      expect(ruling.isComplete()).toBe(false);
    });

    it('should return false when only fullText has content', () => {
      const ruling = new LegalRuling();
      ruling.summary = null;
      ruling.fullText = 'Full text content';

      expect(ruling.isComplete()).toBe(false);
    });

    it('should return false when both are null', () => {
      const ruling = new LegalRuling();
      ruling.summary = null;
      ruling.fullText = null;

      expect(ruling.isComplete()).toBe(false);
    });
  });

  describe('getRulingYear', () => {
    it('should return the year of the ruling date', () => {
      const ruling = new LegalRuling();
      ruling.rulingDate = new Date('2023-05-15');

      expect(ruling.getRulingYear()).toBe(2023);
    });

    it('should handle different years correctly', () => {
      const ruling = new LegalRuling();

      ruling.rulingDate = new Date('2020-01-01');
      expect(ruling.getRulingYear()).toBe(2020);

      ruling.rulingDate = new Date('2015-12-31');
      expect(ruling.getRulingYear()).toBe(2015);
    });
  });

  describe('isFromHigherCourt', () => {
    it('should return true for Supreme Court', () => {
      const ruling = new LegalRuling();
      ruling.courtType = CourtType.SUPREME_COURT;

      expect(ruling.isFromHigherCourt()).toBe(true);
    });

    it('should return true for Appellate Court', () => {
      const ruling = new LegalRuling();
      ruling.courtType = CourtType.APPELLATE_COURT;

      expect(ruling.isFromHigherCourt()).toBe(true);
    });

    it('should return true for Constitutional Tribunal', () => {
      const ruling = new LegalRuling();
      ruling.courtType = CourtType.CONSTITUTIONAL_TRIBUNAL;

      expect(ruling.isFromHigherCourt()).toBe(true);
    });

    it('should return false for Regional Court', () => {
      const ruling = new LegalRuling();
      ruling.courtType = CourtType.REGIONAL_COURT;

      expect(ruling.isFromHigherCourt()).toBe(false);
    });

    it('should return false for District Court', () => {
      const ruling = new LegalRuling();
      ruling.courtType = CourtType.DISTRICT_COURT;

      expect(ruling.isFromHigherCourt()).toBe(false);
    });

    it('should return false for Administrative Court', () => {
      const ruling = new LegalRuling();
      ruling.courtType = CourtType.ADMINISTRATIVE_COURT;

      expect(ruling.isFromHigherCourt()).toBe(false);
    });

    it('should return false for Other', () => {
      const ruling = new LegalRuling();
      ruling.courtType = CourtType.OTHER;

      expect(ruling.isFromHigherCourt()).toBe(false);
    });
  });

  describe('getKeywords', () => {
    it('should return keywords from metadata', () => {
      const ruling = new LegalRuling();
      ruling.metadata = {
        keywords: ['contract', 'breach', 'damages'],
      };

      expect(ruling.getKeywords()).toEqual(['contract', 'breach', 'damages']);
    });

    it('should return empty array when metadata is null', () => {
      const ruling = new LegalRuling();
      ruling.metadata = null;

      expect(ruling.getKeywords()).toEqual([]);
    });

    it('should return empty array when keywords are not set', () => {
      const ruling = new LegalRuling();
      ruling.metadata = { legalArea: 'civil' };

      expect(ruling.getKeywords()).toEqual([]);
    });
  });

  describe('getLegalArea', () => {
    it('should return legal area from metadata', () => {
      const ruling = new LegalRuling();
      ruling.metadata = {
        legalArea: 'civil',
      };

      expect(ruling.getLegalArea()).toBe('civil');
    });

    it('should return null when metadata is null', () => {
      const ruling = new LegalRuling();
      ruling.metadata = null;

      expect(ruling.getLegalArea()).toBeNull();
    });

    it('should return null when legal area is not set', () => {
      const ruling = new LegalRuling();
      ruling.metadata = { keywords: ['test'] };

      expect(ruling.getLegalArea()).toBeNull();
    });
  });

  describe('addKeyword', () => {
    it('should add keyword to existing keywords', () => {
      const ruling = new LegalRuling();
      ruling.metadata = {
        keywords: ['existing'],
      };

      ruling.addKeyword('newKeyword');

      expect(ruling.metadata.keywords).toContain('existing');
      expect(ruling.metadata.keywords).toContain('newKeyword');
    });

    it('should initialize metadata and keywords if null', () => {
      const ruling = new LegalRuling();
      ruling.metadata = null;

      ruling.addKeyword('firstKeyword');

      expect(ruling.metadata).not.toBeNull();
      expect(ruling.metadata?.keywords).toEqual(['firstKeyword']);
    });

    it('should initialize keywords array if metadata exists but keywords is null', () => {
      const ruling = new LegalRuling();
      ruling.metadata = { legalArea: 'civil' };

      ruling.addKeyword('newKeyword');

      expect(ruling.metadata.keywords).toEqual(['newKeyword']);
    });

    it('should not add duplicate keywords', () => {
      const ruling = new LegalRuling();
      ruling.metadata = {
        keywords: ['existing'],
      };

      ruling.addKeyword('existing');

      expect(ruling.metadata.keywords).toEqual(['existing']);
    });
  });

  describe('addRelatedCase', () => {
    it('should add related case to existing cases', () => {
      const ruling = new LegalRuling();
      ruling.metadata = {
        relatedCases: ['III CZP 1/20'],
      };

      ruling.addRelatedCase('III CZP 2/20');

      expect(ruling.metadata.relatedCases).toContain('III CZP 1/20');
      expect(ruling.metadata.relatedCases).toContain('III CZP 2/20');
    });

    it('should initialize metadata and relatedCases if null', () => {
      const ruling = new LegalRuling();
      ruling.metadata = null;

      ruling.addRelatedCase('III CZP 1/20');

      expect(ruling.metadata).not.toBeNull();
      expect(ruling.metadata?.relatedCases).toEqual(['III CZP 1/20']);
    });

    it('should initialize relatedCases array if metadata exists but relatedCases is null', () => {
      const ruling = new LegalRuling();
      ruling.metadata = { legalArea: 'civil' };

      ruling.addRelatedCase('III CZP 1/20');

      expect(ruling.metadata.relatedCases).toEqual(['III CZP 1/20']);
    });

    it('should not add duplicate related cases', () => {
      const ruling = new LegalRuling();
      ruling.metadata = {
        relatedCases: ['III CZP 1/20'],
      };

      ruling.addRelatedCase('III CZP 1/20');

      expect(ruling.metadata.relatedCases).toEqual(['III CZP 1/20']);
    });
  });

  describe('metadata', () => {
    it('should allow setting metadata with all fields', () => {
      const ruling = new LegalRuling();
      ruling.metadata = {
        legalArea: 'civil',
        relatedCases: ['III CZP 1/20', 'III CZP 2/20'],
        keywords: ['contract', 'breach'],
        sourceReference: 'https://example.com/ruling',
      };

      expect(ruling.metadata.legalArea).toBe('civil');
      expect(ruling.metadata.relatedCases).toEqual([
        'III CZP 1/20',
        'III CZP 2/20',
      ]);
      expect(ruling.metadata.keywords).toEqual(['contract', 'breach']);
      expect(ruling.metadata.sourceReference).toBe(
        'https://example.com/ruling',
      );
    });

    it('should allow null metadata', () => {
      const ruling = new LegalRuling();
      ruling.metadata = null;

      expect(ruling.metadata).toBeNull();
    });
  });
});
