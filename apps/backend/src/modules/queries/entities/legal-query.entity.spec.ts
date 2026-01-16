import { LegalQuery, Citation } from './legal-query.entity';

describe('LegalQuery Entity', () => {
  describe('properties', () => {
    it('should have all required properties defined', () => {
      const query = new LegalQuery();
      expect(query).toHaveProperty('id');
      expect(query).toHaveProperty('sessionId');
      expect(query).toHaveProperty('session');
      expect(query).toHaveProperty('question');
      expect(query).toHaveProperty('answerMarkdown');
      expect(query).toHaveProperty('citations');
      expect(query).toHaveProperty('createdAt');
      expect(query).toHaveProperty('updatedAt');
    });
  });

  describe('hasAnswer', () => {
    it('should return true when answerMarkdown has content', () => {
      const query = new LegalQuery();
      query.answerMarkdown = 'This is a legal answer with explanation.';

      expect(query.hasAnswer()).toBe(true);
    });

    it('should return false when answerMarkdown is null', () => {
      const query = new LegalQuery();
      query.answerMarkdown = null;

      expect(query.hasAnswer()).toBe(false);
    });

    it('should return false when answerMarkdown is empty string', () => {
      const query = new LegalQuery();
      query.answerMarkdown = '';

      expect(query.hasAnswer()).toBe(false);
    });

    it('should return false when answerMarkdown is only whitespace', () => {
      const query = new LegalQuery();
      query.answerMarkdown = '   \n\t  ';

      expect(query.hasAnswer()).toBe(false);
    });
  });

  describe('hasCitations', () => {
    it('should return true when citations array has items', () => {
      const query = new LegalQuery();
      query.citations = [{ source: 'Kodeks Cywilny', article: 'Art. 415' }];

      expect(query.hasCitations()).toBe(true);
    });

    it('should return false when citations is null', () => {
      const query = new LegalQuery();
      query.citations = null;

      expect(query.hasCitations()).toBe(false);
    });

    it('should return false when citations is empty array', () => {
      const query = new LegalQuery();
      query.citations = [];

      expect(query.hasCitations()).toBe(false);
    });
  });

  describe('getCitationCount', () => {
    it('should return correct count when citations exist', () => {
      const query = new LegalQuery();
      query.citations = [
        { source: 'Kodeks Cywilny', article: 'Art. 415' },
        { source: 'Kodeks Karny', article: 'Art. 177' },
        { source: 'Supreme Court', url: 'https://example.com/ruling' },
      ];

      expect(query.getCitationCount()).toBe(3);
    });

    it('should return 0 when citations is null', () => {
      const query = new LegalQuery();
      query.citations = null;

      expect(query.getCitationCount()).toBe(0);
    });

    it('should return 0 when citations is empty', () => {
      const query = new LegalQuery();
      query.citations = [];

      expect(query.getCitationCount()).toBe(0);
    });
  });

  describe('setAnswer', () => {
    it('should set answer without citations', () => {
      const query = new LegalQuery();
      query.setAnswer('This is the legal answer.');

      expect(query.answerMarkdown).toBe('This is the legal answer.');
    });

    it('should set answer with citations', () => {
      const query = new LegalQuery();
      const citations: Citation[] = [
        { source: 'Kodeks Cywilny', article: 'Art. 415' },
      ];

      query.setAnswer('This is the legal answer.', citations);

      expect(query.answerMarkdown).toBe('This is the legal answer.');
      expect(query.citations).toEqual(citations);
    });

    it('should not override existing citations when not provided', () => {
      const query = new LegalQuery();
      query.citations = [{ source: 'Existing Source' }];

      query.setAnswer('New answer without citations');

      expect(query.answerMarkdown).toBe('New answer without citations');
      expect(query.citations).toEqual([{ source: 'Existing Source' }]);
    });
  });

  describe('addCitation', () => {
    it('should add citation to empty citations array', () => {
      const query = new LegalQuery();
      query.citations = null;

      query.addCitation({ source: 'Kodeks Cywilny', article: 'Art. 415' });

      expect(query.citations).toHaveLength(1);
      expect(query.citations![0].source).toBe('Kodeks Cywilny');
    });

    it('should add citation to existing citations array', () => {
      const query = new LegalQuery();
      query.citations = [{ source: 'Existing Source' }];

      query.addCitation({ source: 'Kodeks Cywilny', article: 'Art. 415' });

      expect(query.citations).toHaveLength(2);
      expect(query.citations[1].source).toBe('Kodeks Cywilny');
    });

    it('should add citation with all fields', () => {
      const query = new LegalQuery();
      query.citations = [];

      const citation: Citation = {
        source: 'Supreme Court',
        article: 'III CZP 25/21',
        url: 'https://example.com/ruling',
        excerpt: 'Key excerpt from the ruling...',
      };

      query.addCitation(citation);

      expect(query.citations).toHaveLength(1);
      expect(query.citations[0]).toEqual(citation);
    });
  });

  describe('Citation interface', () => {
    it('should allow citation with only source', () => {
      const citation: Citation = {
        source: 'Kodeks Cywilny',
      };

      expect(citation.source).toBe('Kodeks Cywilny');
      expect(citation.article).toBeUndefined();
      expect(citation.url).toBeUndefined();
      expect(citation.excerpt).toBeUndefined();
    });

    it('should allow citation with all optional fields', () => {
      const citation: Citation = {
        source: 'Supreme Court of Poland',
        article: 'III CZP 25/21',
        url: 'https://sip.lex.pl/ruling/123',
        excerpt: 'The court ruled that...',
      };

      expect(citation.source).toBe('Supreme Court of Poland');
      expect(citation.article).toBe('III CZP 25/21');
      expect(citation.url).toBe('https://sip.lex.pl/ruling/123');
      expect(citation.excerpt).toBe('The court ruled that...');
    });
  });
});
