import {
  LegalDocument,
  DocumentType,
  DocumentStatus,
} from './legal-document.entity';

describe('LegalDocument Entity', () => {
  describe('properties', () => {
    it('should have all required properties defined', () => {
      const document = new LegalDocument();
      expect(document).toHaveProperty('id');
      expect(document).toHaveProperty('sessionId');
      expect(document).toHaveProperty('session');
      expect(document).toHaveProperty('title');
      expect(document).toHaveProperty('type');
      expect(document).toHaveProperty('status');
      expect(document).toHaveProperty('contentRaw');
      expect(document).toHaveProperty('metadata');
      expect(document).toHaveProperty('createdAt');
      expect(document).toHaveProperty('updatedAt');
    });
  });

  describe('DocumentType enum', () => {
    it('should have all expected document types', () => {
      expect(DocumentType.LAWSUIT).toBe('LAWSUIT');
      expect(DocumentType.COMPLAINT).toBe('COMPLAINT');
      expect(DocumentType.CONTRACT).toBe('CONTRACT');
      expect(DocumentType.OTHER).toBe('OTHER');
    });
  });

  describe('DocumentStatus enum', () => {
    it('should have all expected document statuses', () => {
      expect(DocumentStatus.DRAFT).toBe('DRAFT');
      expect(DocumentStatus.GENERATING).toBe('GENERATING');
      expect(DocumentStatus.COMPLETED).toBe('COMPLETED');
      expect(DocumentStatus.FAILED).toBe('FAILED');
    });
  });

  describe('canComplete', () => {
    it('should return true when contentRaw has content', () => {
      const document = new LegalDocument();
      document.contentRaw = 'Some legal content here';

      expect(document.canComplete()).toBe(true);
    });

    it('should return false when contentRaw is null', () => {
      const document = new LegalDocument();
      document.contentRaw = null;

      expect(document.canComplete()).toBe(false);
    });

    it('should return false when contentRaw is empty string', () => {
      const document = new LegalDocument();
      document.contentRaw = '';

      expect(document.canComplete()).toBe(false);
    });

    it('should return false when contentRaw is only whitespace', () => {
      const document = new LegalDocument();
      document.contentRaw = '   \n\t  ';

      expect(document.canComplete()).toBe(false);
    });
  });

  describe('markCompleted', () => {
    it('should set status to COMPLETED when content exists', () => {
      const document = new LegalDocument();
      document.contentRaw = 'Legal document content';
      document.status = DocumentStatus.GENERATING;

      document.markCompleted();

      expect(document.status).toBe(DocumentStatus.COMPLETED);
    });

    it('should throw error when trying to complete document without content', () => {
      const document = new LegalDocument();
      document.contentRaw = null;

      expect(() => document.markCompleted()).toThrow(
        'Cannot complete document without content',
      );
    });

    it('should throw error when trying to complete document with empty content', () => {
      const document = new LegalDocument();
      document.contentRaw = '';

      expect(() => document.markCompleted()).toThrow(
        'Cannot complete document without content',
      );
    });
  });

  describe('markGenerating', () => {
    it('should set status to GENERATING', () => {
      const document = new LegalDocument();
      document.status = DocumentStatus.DRAFT;

      document.markGenerating();

      expect(document.status).toBe(DocumentStatus.GENERATING);
    });
  });

  describe('markFailed', () => {
    it('should set status to FAILED', () => {
      const document = new LegalDocument();
      document.status = DocumentStatus.GENERATING;

      document.markFailed();

      expect(document.status).toBe(DocumentStatus.FAILED);
    });
  });

  describe('status check methods', () => {
    it('isCompleted should return true only when status is COMPLETED', () => {
      const document = new LegalDocument();

      document.status = DocumentStatus.COMPLETED;
      expect(document.isCompleted()).toBe(true);

      document.status = DocumentStatus.DRAFT;
      expect(document.isCompleted()).toBe(false);

      document.status = DocumentStatus.GENERATING;
      expect(document.isCompleted()).toBe(false);

      document.status = DocumentStatus.FAILED;
      expect(document.isCompleted()).toBe(false);
    });

    it('isGenerating should return true only when status is GENERATING', () => {
      const document = new LegalDocument();

      document.status = DocumentStatus.GENERATING;
      expect(document.isGenerating()).toBe(true);

      document.status = DocumentStatus.DRAFT;
      expect(document.isGenerating()).toBe(false);

      document.status = DocumentStatus.COMPLETED;
      expect(document.isGenerating()).toBe(false);
    });

    it('hasFailed should return true only when status is FAILED', () => {
      const document = new LegalDocument();

      document.status = DocumentStatus.FAILED;
      expect(document.hasFailed()).toBe(true);

      document.status = DocumentStatus.DRAFT;
      expect(document.hasFailed()).toBe(false);

      document.status = DocumentStatus.COMPLETED;
      expect(document.hasFailed()).toBe(false);
    });
  });

  describe('metadata', () => {
    it('should allow setting metadata with context variables', () => {
      const document = new LegalDocument();
      document.metadata = {
        defendantName: 'John Doe',
        plaintiffName: 'Jane Smith',
        claimAmount: 10000,
        claimCurrency: 'PLN',
        caseNumber: 'XII C 123/24',
      };

      expect(document.metadata.defendantName).toBe('John Doe');
      expect(document.metadata.plaintiffName).toBe('Jane Smith');
      expect(document.metadata.claimAmount).toBe(10000);
      expect(document.metadata.claimCurrency).toBe('PLN');
      expect(document.metadata['caseNumber']).toBe('XII C 123/24');
    });

    it('should allow null metadata', () => {
      const document = new LegalDocument();
      document.metadata = null;

      expect(document.metadata).toBeNull();
    });
  });
});
