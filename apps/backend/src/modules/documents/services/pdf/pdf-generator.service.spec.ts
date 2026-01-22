/**
 * PDF Generator Service Unit Tests
 *
 * Tests the Puppeteer-based PDF generation for legal documents.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PdfGeneratorService } from './pdf-generator.service';
import {
  PdfTemplateService,
  DocumentTemplateContext,
} from './pdf-template.service';
import { DocumentType } from '../../entities/legal-document.entity';
import { PdfPageFormat } from '../../queues/pdf-export.job';

describe('PdfGeneratorService', () => {
  let generatorService: PdfGeneratorService;
  let templateService: PdfTemplateService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfGeneratorService, PdfTemplateService],
    }).compile();

    generatorService = module.get<PdfGeneratorService>(PdfGeneratorService);
    templateService = module.get<PdfTemplateService>(PdfTemplateService);
  });

  afterAll(async () => {
    // Clean up Puppeteer browser
    await generatorService.onModuleDestroy();
  });

  describe('generateFilename', () => {
    it('should generate a valid filename from title and document ID', () => {
      const filename = generatorService.generateFilename(
        'Pozew o zapłatę',
        '123e4567-e89b-12d3-a456-426614174000',
      );

      expect(filename).toMatch(
        /^pozew-o-zapłatę-123e4567-\d{4}-\d{2}-\d{2}\.pdf$/,
      );
    });

    it('should handle special characters in title', () => {
      const filename = generatorService.generateFilename(
        'Umowa: §1 & §2 (test) [draft]',
        'abc12345-e89b-12d3-a456-426614174000',
      );

      expect(filename).toContain('.pdf');
      expect(filename).not.toContain(':');
      expect(filename).not.toContain('&');
      expect(filename).not.toContain('[');
      expect(filename).not.toContain(']');
    });

    it('should truncate long titles', () => {
      const longTitle = 'A'.repeat(100);
      const filename = generatorService.generateFilename(
        longTitle,
        '123e4567-e89b-12d3-a456-426614174000',
      );

      // Should truncate title to 50 chars + id + date + .pdf
      expect(filename.length).toBeLessThan(80);
    });

    it('should preserve Polish characters', () => {
      const filename = generatorService.generateFilename(
        'Żądanie ąćęłńóśźż',
        '123e4567-e89b-12d3-a456-426614174000',
      );

      expect(filename).toContain('ż');
      expect(filename).toContain('ą');
    });
  });

  describe('generatePdf', () => {
    it('should generate a valid PDF buffer', async () => {
      const context: DocumentTemplateContext = {
        title: 'Test PDF',
        content: 'This is a test document for PDF generation.',
        documentType: DocumentType.OTHER,
        createdAt: new Date(),
      };

      const result = await generatorService.generatePdf(context, {
        format: PdfPageFormat.A4,
      });

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.sizeBytes).toBeGreaterThan(0);
      expect(result.pageCount).toBeGreaterThanOrEqual(1);

      // Verify PDF header magic bytes
      const pdfHeader = result.buffer.toString('ascii', 0, 5);
      expect(pdfHeader).toBe('%PDF-');
    }, 30000);

    it('should generate PDF with Polish legal content', async () => {
      const context: DocumentTemplateContext = {
        title: 'Pozew o zapłatę wynagrodzenia',
        content: `
# POZEW
o zapłatę wynagrodzenia z umowy o pracę

Powód wnosi o zasądzenie od pozwanego kwoty **15 000 PLN**.

## Uzasadnienie

Zgodnie z art. 85 § 1 Kodeksu pracy, wypłata wynagrodzenia powinna być dokonywana w terminie.

Znaki specjalne: ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ
        `,
        documentType: DocumentType.LAWSUIT,
        createdAt: new Date('2024-01-20'),
        metadata: {
          plaintiffName: 'Jan Kowalski',
          defendantName: 'ABC Sp. z o.o.',
          claimAmount: 15000,
          claimCurrency: 'PLN',
        },
      };

      const result = await generatorService.generatePdf(context, {
        format: PdfPageFormat.A4,
        includeHeader: true,
        includeFooter: true,
        language: 'pl',
      });

      expect(result.sizeBytes).toBeGreaterThan(5000);
      expect(result.pageCount).toBeGreaterThanOrEqual(1);
    }, 30000);

    it('should handle watermark option', async () => {
      const context: DocumentTemplateContext = {
        title: 'Draft Document',
        content: 'This is a draft.',
        documentType: DocumentType.OTHER,
      };

      const result = await generatorService.generatePdf(context, {
        watermark: 'DRAFT',
      });

      expect(result.buffer).toBeDefined();
      expect(result.sizeBytes).toBeGreaterThan(0);
    }, 30000);

    it('should convert result to base64', async () => {
      const context: DocumentTemplateContext = {
        title: 'Base64 Test',
        content: 'Testing base64 conversion.',
        documentType: DocumentType.OTHER,
      };

      const result = await generatorService.generatePdf(context, {});
      const base64 = result.buffer.toString('base64');

      expect(base64).toBeDefined();
      expect(base64.length).toBeGreaterThan(0);

      // Should be valid base64
      const decoded = Buffer.from(base64, 'base64');
      expect(decoded.toString('ascii', 0, 5)).toBe('%PDF-');
    }, 30000);

    it('should handle different page formats', async () => {
      const context: DocumentTemplateContext = {
        title: 'Letter Format',
        content: 'Testing Letter format.',
        documentType: DocumentType.OTHER,
      };

      const result = await generatorService.generatePdf(context, {
        format: PdfPageFormat.LETTER,
      });

      expect(result.buffer).toBeDefined();
      expect(result.sizeBytes).toBeGreaterThan(0);
    }, 30000);
  });
});
