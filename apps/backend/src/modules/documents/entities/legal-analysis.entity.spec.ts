import {
  LegalAnalysis,
  AnalysisStatus,
  LegalGround,
  RelatedDocumentLink,
} from './legal-analysis.entity';

describe('LegalAnalysis Entity', () => {
  describe('properties', () => {
    it('should have all required properties defined', () => {
      const analysis = new LegalAnalysis();
      expect(analysis).toHaveProperty('id');
      expect(analysis).toHaveProperty('sessionId');
      expect(analysis).toHaveProperty('session');
      expect(analysis).toHaveProperty('title');
      expect(analysis).toHaveProperty('inputDescription');
      expect(analysis).toHaveProperty('status');
      expect(analysis).toHaveProperty('overallConfidenceScore');
      expect(analysis).toHaveProperty('identifiedGrounds');
      expect(analysis).toHaveProperty('relatedDocumentLinks');
      expect(analysis).toHaveProperty('summary');
      expect(analysis).toHaveProperty('recommendations');
      expect(analysis).toHaveProperty('errorMessage');
      expect(analysis).toHaveProperty('metadata');
      expect(analysis).toHaveProperty('createdAt');
      expect(analysis).toHaveProperty('updatedAt');
    });
  });

  describe('AnalysisStatus enum', () => {
    it('should have all expected analysis statuses', () => {
      expect(AnalysisStatus.PENDING).toBe('PENDING');
      expect(AnalysisStatus.PROCESSING).toBe('PROCESSING');
      expect(AnalysisStatus.COMPLETED).toBe('COMPLETED');
      expect(AnalysisStatus.FAILED).toBe('FAILED');
    });
  });

  describe('canComplete', () => {
    it('should return true when identifiedGrounds has items', () => {
      const analysis = new LegalAnalysis();
      analysis.identifiedGrounds = [
        { name: 'Test Ground', description: 'Test', confidenceScore: 0.8 },
      ];

      expect(analysis.canComplete()).toBe(true);
    });

    it('should return false when identifiedGrounds is null', () => {
      const analysis = new LegalAnalysis();
      analysis.identifiedGrounds = null;

      expect(analysis.canComplete()).toBe(false);
    });

    it('should return false when identifiedGrounds is empty array', () => {
      const analysis = new LegalAnalysis();
      analysis.identifiedGrounds = [];

      expect(analysis.canComplete()).toBe(false);
    });
  });

  describe('markCompleted', () => {
    it('should set status to COMPLETED when grounds exist', () => {
      const analysis = new LegalAnalysis();
      analysis.identifiedGrounds = [
        { name: 'Test Ground', description: 'Test', confidenceScore: 0.8 },
      ];
      analysis.status = AnalysisStatus.PROCESSING;

      analysis.markCompleted();

      expect(analysis.status).toBe(AnalysisStatus.COMPLETED);
    });

    it('should throw error when trying to complete analysis without grounds', () => {
      const analysis = new LegalAnalysis();
      analysis.identifiedGrounds = null;

      expect(() => analysis.markCompleted()).toThrow(
        'Cannot complete analysis without identified grounds',
      );
    });

    it('should throw error when trying to complete analysis with empty grounds', () => {
      const analysis = new LegalAnalysis();
      analysis.identifiedGrounds = [];

      expect(() => analysis.markCompleted()).toThrow(
        'Cannot complete analysis without identified grounds',
      );
    });
  });

  describe('markProcessing', () => {
    it('should set status to PROCESSING', () => {
      const analysis = new LegalAnalysis();
      analysis.status = AnalysisStatus.PENDING;

      analysis.markProcessing();

      expect(analysis.status).toBe(AnalysisStatus.PROCESSING);
    });
  });

  describe('markFailed', () => {
    it('should set status to FAILED and set error message', () => {
      const analysis = new LegalAnalysis();
      analysis.status = AnalysisStatus.PROCESSING;

      analysis.markFailed('AI service unavailable');

      expect(analysis.status).toBe(AnalysisStatus.FAILED);
      expect(analysis.errorMessage).toBe('AI service unavailable');
    });
  });

  describe('status check methods', () => {
    it('isCompleted should return true only when status is COMPLETED', () => {
      const analysis = new LegalAnalysis();

      analysis.status = AnalysisStatus.COMPLETED;
      expect(analysis.isCompleted()).toBe(true);

      analysis.status = AnalysisStatus.PENDING;
      expect(analysis.isCompleted()).toBe(false);

      analysis.status = AnalysisStatus.PROCESSING;
      expect(analysis.isCompleted()).toBe(false);

      analysis.status = AnalysisStatus.FAILED;
      expect(analysis.isCompleted()).toBe(false);
    });

    it('isProcessing should return true only when status is PROCESSING', () => {
      const analysis = new LegalAnalysis();

      analysis.status = AnalysisStatus.PROCESSING;
      expect(analysis.isProcessing()).toBe(true);

      analysis.status = AnalysisStatus.PENDING;
      expect(analysis.isProcessing()).toBe(false);

      analysis.status = AnalysisStatus.COMPLETED;
      expect(analysis.isProcessing()).toBe(false);
    });

    it('hasFailed should return true only when status is FAILED', () => {
      const analysis = new LegalAnalysis();

      analysis.status = AnalysisStatus.FAILED;
      expect(analysis.hasFailed()).toBe(true);

      analysis.status = AnalysisStatus.PENDING;
      expect(analysis.hasFailed()).toBe(false);

      analysis.status = AnalysisStatus.COMPLETED;
      expect(analysis.hasFailed()).toBe(false);
    });

    it('isPending should return true only when status is PENDING', () => {
      const analysis = new LegalAnalysis();

      analysis.status = AnalysisStatus.PENDING;
      expect(analysis.isPending()).toBe(true);

      analysis.status = AnalysisStatus.PROCESSING;
      expect(analysis.isPending()).toBe(false);

      analysis.status = AnalysisStatus.COMPLETED;
      expect(analysis.isPending()).toBe(false);
    });
  });

  describe('getHighestConfidenceGround', () => {
    it('should return the ground with highest confidence', () => {
      const analysis = new LegalAnalysis();
      analysis.identifiedGrounds = [
        { name: 'Low', description: 'Low confidence', confidenceScore: 0.3 },
        { name: 'High', description: 'High confidence', confidenceScore: 0.9 },
        {
          name: 'Medium',
          description: 'Medium confidence',
          confidenceScore: 0.6,
        },
      ];

      const highest = analysis.getHighestConfidenceGround();

      expect(highest).not.toBeNull();
      expect(highest!.name).toBe('High');
      expect(highest!.confidenceScore).toBe(0.9);
    });

    it('should return null when identifiedGrounds is null', () => {
      const analysis = new LegalAnalysis();
      analysis.identifiedGrounds = null;

      expect(analysis.getHighestConfidenceGround()).toBeNull();
    });

    it('should return null when identifiedGrounds is empty', () => {
      const analysis = new LegalAnalysis();
      analysis.identifiedGrounds = [];

      expect(analysis.getHighestConfidenceGround()).toBeNull();
    });
  });

  describe('getGroundsAboveThreshold', () => {
    it('should return only grounds above the threshold', () => {
      const analysis = new LegalAnalysis();
      analysis.identifiedGrounds = [
        { name: 'Low', description: 'Low', confidenceScore: 0.3 },
        { name: 'High', description: 'High', confidenceScore: 0.9 },
        { name: 'Medium', description: 'Medium', confidenceScore: 0.6 },
      ];

      const aboveThreshold = analysis.getGroundsAboveThreshold(0.5);

      expect(aboveThreshold).toHaveLength(2);
      expect(aboveThreshold.map((g) => g.name)).toContain('High');
      expect(aboveThreshold.map((g) => g.name)).toContain('Medium');
    });

    it('should return empty array when no grounds above threshold', () => {
      const analysis = new LegalAnalysis();
      analysis.identifiedGrounds = [
        { name: 'Low', description: 'Low', confidenceScore: 0.3 },
      ];

      expect(analysis.getGroundsAboveThreshold(0.5)).toHaveLength(0);
    });

    it('should return empty array when identifiedGrounds is null', () => {
      const analysis = new LegalAnalysis();
      analysis.identifiedGrounds = null;

      expect(analysis.getGroundsAboveThreshold(0.5)).toEqual([]);
    });
  });

  describe('addRelatedDocumentLink', () => {
    it('should add a link to existing array', () => {
      const analysis = new LegalAnalysis();
      analysis.relatedDocumentLinks = [
        { documentId: 'doc-1', relationshipType: 'reference' },
      ];

      const newLink: RelatedDocumentLink = {
        documentId: 'doc-2',
        relationshipType: 'precedent',
        relevanceScore: 0.8,
      };

      analysis.addRelatedDocumentLink(newLink);

      expect(analysis.relatedDocumentLinks).toHaveLength(2);
      expect(analysis.relatedDocumentLinks[1].documentId).toBe('doc-2');
    });

    it('should initialize array and add link when null', () => {
      const analysis = new LegalAnalysis();
      analysis.relatedDocumentLinks = null;

      const newLink: RelatedDocumentLink = {
        documentId: 'doc-1',
        relationshipType: 'reference',
      };

      analysis.addRelatedDocumentLink(newLink);

      expect(analysis.relatedDocumentLinks).toHaveLength(1);
      expect(analysis.relatedDocumentLinks![0].documentId).toBe('doc-1');
    });
  });

  describe('getAverageConfidenceScore', () => {
    it('should calculate average confidence correctly', () => {
      const analysis = new LegalAnalysis();
      analysis.identifiedGrounds = [
        { name: 'A', description: 'A', confidenceScore: 0.4 },
        { name: 'B', description: 'B', confidenceScore: 0.6 },
        { name: 'C', description: 'C', confidenceScore: 0.8 },
      ];

      expect(analysis.getAverageConfidenceScore()).toBe(0.6);
    });

    it('should return null when identifiedGrounds is null', () => {
      const analysis = new LegalAnalysis();
      analysis.identifiedGrounds = null;

      expect(analysis.getAverageConfidenceScore()).toBeNull();
    });

    it('should return null when identifiedGrounds is empty', () => {
      const analysis = new LegalAnalysis();
      analysis.identifiedGrounds = [];

      expect(analysis.getAverageConfidenceScore()).toBeNull();
    });
  });

  describe('identifiedGrounds', () => {
    it('should allow setting grounds with all properties', () => {
      const analysis = new LegalAnalysis();
      const grounds: LegalGround[] = [
        {
          name: 'Breach of Contract',
          description: 'Defendant failed to fulfill contractual obligations',
          confidenceScore: 0.85,
          legalBasis: ['Art. 471 KC', 'Art. 472 KC'],
          notes: 'Strong evidence of breach',
        },
      ];

      analysis.identifiedGrounds = grounds;

      expect(analysis.identifiedGrounds[0].name).toBe('Breach of Contract');
      expect(analysis.identifiedGrounds[0].confidenceScore).toBe(0.85);
      expect(analysis.identifiedGrounds[0].legalBasis).toContain('Art. 471 KC');
    });

    it('should allow null identifiedGrounds', () => {
      const analysis = new LegalAnalysis();
      analysis.identifiedGrounds = null;

      expect(analysis.identifiedGrounds).toBeNull();
    });
  });

  describe('relatedDocumentLinks', () => {
    it('should allow setting document links with all properties', () => {
      const analysis = new LegalAnalysis();
      const links: RelatedDocumentLink[] = [
        {
          documentId: '550e8400-e29b-41d4-a716-446655440000',
          relationshipType: 'precedent',
          relevanceScore: 0.9,
          description: 'Similar case from 2023',
        },
      ];

      analysis.relatedDocumentLinks = links;

      expect(analysis.relatedDocumentLinks[0].documentId).toBe(
        '550e8400-e29b-41d4-a716-446655440000',
      );
      expect(analysis.relatedDocumentLinks[0].relationshipType).toBe(
        'precedent',
      );
      expect(analysis.relatedDocumentLinks[0].relevanceScore).toBe(0.9);
    });

    it('should allow null relatedDocumentLinks', () => {
      const analysis = new LegalAnalysis();
      analysis.relatedDocumentLinks = null;

      expect(analysis.relatedDocumentLinks).toBeNull();
    });
  });

  describe('metadata', () => {
    it('should allow setting metadata with analysis context', () => {
      const analysis = new LegalAnalysis();
      analysis.metadata = {
        modelUsed: 'gpt-4',
        processingTimeMs: 1500,
        analysisVersion: '1.0.0',
        customField: 'custom value',
      };

      expect(analysis.metadata.modelUsed).toBe('gpt-4');
      expect(analysis.metadata.processingTimeMs).toBe(1500);
      expect(analysis.metadata.analysisVersion).toBe('1.0.0');
      expect(analysis.metadata['customField']).toBe('custom value');
    });

    it('should allow null metadata', () => {
      const analysis = new LegalAnalysis();
      analysis.metadata = null;

      expect(analysis.metadata).toBeNull();
    });
  });
});
