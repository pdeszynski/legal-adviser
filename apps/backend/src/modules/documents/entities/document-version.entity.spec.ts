import { DocumentVersion } from './document-version.entity';

describe('DocumentVersion Entity', () => {
  describe('properties', () => {
    it('should have all required properties defined', () => {
      const version = new DocumentVersion();
      expect(version).toHaveProperty('id');
      expect(version).toHaveProperty('documentId');
      expect(version).toHaveProperty('document');
      expect(version).toHaveProperty('sessionId');
      expect(version).toHaveProperty('session');
      expect(version).toHaveProperty('versionNumber');
      expect(version).toHaveProperty('contentSnapshot');
      expect(version).toHaveProperty('changeDescription');
      expect(version).toHaveProperty('authorUserId');
      expect(version).toHaveProperty('createdAt');
    });
  });

  describe('hasContent', () => {
    it('should return true when contentSnapshot has content', () => {
      const version = new DocumentVersion();
      version.contentSnapshot = 'Some document content here';

      expect(version.hasContent()).toBe(true);
    });

    it('should return false when contentSnapshot is empty string', () => {
      const version = new DocumentVersion();
      version.contentSnapshot = '';

      expect(version.hasContent()).toBe(false);
    });

    it('should return false when contentSnapshot is only whitespace', () => {
      const version = new DocumentVersion();
      version.contentSnapshot = '   \n\t  ';

      expect(version.hasContent()).toBe(false);
    });
  });

  describe('isFirstVersion', () => {
    it('should return true when version number is 1', () => {
      const version = new DocumentVersion();
      version.versionNumber = 1;

      expect(version.isFirstVersion()).toBe(true);
    });

    it('should return false when version number is greater than 1', () => {
      const version = new DocumentVersion();
      version.versionNumber = 2;

      expect(version.isFirstVersion()).toBe(false);

      version.versionNumber = 10;
      expect(version.isFirstVersion()).toBe(false);
    });

    it('should return false when version number is 0', () => {
      const version = new DocumentVersion();
      version.versionNumber = 0;

      expect(version.isFirstVersion()).toBe(false);
    });
  });

  describe('validate', () => {
    it('should not throw when version has content and positive version number', () => {
      const version = new DocumentVersion();
      version.contentSnapshot = 'Valid content';
      version.versionNumber = 1;

      expect(() => version.validate()).not.toThrow();
    });

    it('should throw error when version has no content', () => {
      const version = new DocumentVersion();
      version.contentSnapshot = '';
      version.versionNumber = 1;

      expect(() => version.validate()).toThrow(
        'Document version must have content',
      );
    });

    it('should throw error when version has only whitespace content', () => {
      const version = new DocumentVersion();
      version.contentSnapshot = '   ';
      version.versionNumber = 1;

      expect(() => version.validate()).toThrow(
        'Document version must have content',
      );
    });

    it('should throw error when version number is 0', () => {
      const version = new DocumentVersion();
      version.contentSnapshot = 'Valid content';
      version.versionNumber = 0;

      expect(() => version.validate()).toThrow(
        'Version number must be positive',
      );
    });

    it('should throw error when version number is negative', () => {
      const version = new DocumentVersion();
      version.contentSnapshot = 'Valid content';
      version.versionNumber = -1;

      expect(() => version.validate()).toThrow(
        'Version number must be positive',
      );
    });
  });

  describe('changeDescription', () => {
    it('should allow setting change description', () => {
      const version = new DocumentVersion();
      version.changeDescription = 'Initial version';

      expect(version.changeDescription).toBe('Initial version');
    });

    it('should allow null change description', () => {
      const version = new DocumentVersion();
      version.changeDescription = null;

      expect(version.changeDescription).toBeNull();
    });
  });

  describe('authorUserId', () => {
    it('should allow setting author user ID', () => {
      const version = new DocumentVersion();
      version.authorUserId = 'user-123';

      expect(version.authorUserId).toBe('user-123');
    });

    it('should allow null author user ID', () => {
      const version = new DocumentVersion();
      version.authorUserId = null;

      expect(version.authorUserId).toBeNull();
    });
  });

  describe('versioning scenario', () => {
    it('should support multiple versions of a document', () => {
      const doc1v1 = new DocumentVersion();
      doc1v1.documentId = 'doc-1';
      doc1v1.sessionId = 'session-1';
      doc1v1.versionNumber = 1;
      doc1v1.contentSnapshot = 'First version content';
      doc1v1.changeDescription = 'Initial version';
      doc1v1.authorUserId = 'user-1';

      const doc1v2 = new DocumentVersion();
      doc1v2.documentId = 'doc-1';
      doc1v2.sessionId = 'session-1';
      doc1v2.versionNumber = 2;
      doc1v2.contentSnapshot = 'Updated content';
      doc1v2.changeDescription = 'Fixed typos';
      doc1v2.authorUserId = 'user-1';

      const doc1v3 = new DocumentVersion();
      doc1v3.documentId = 'doc-1';
      doc1v3.sessionId = 'session-1';
      doc1v3.versionNumber = 3;
      doc1v3.contentSnapshot = 'Further updated content';
      doc1v3.changeDescription = 'Added new section';
      doc1v3.authorUserId = 'user-2';

      expect(doc1v1.isFirstVersion()).toBe(true);
      expect(doc1v2.isFirstVersion()).toBe(false);
      expect(doc1v3.isFirstVersion()).toBe(false);

      expect(() => doc1v1.validate()).not.toThrow();
      expect(() => doc1v2.validate()).not.toThrow();
      expect(() => doc1v3.validate()).not.toThrow();
    });
  });
});
