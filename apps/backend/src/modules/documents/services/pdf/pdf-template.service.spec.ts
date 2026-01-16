/**
 * PDF Template Service Unit Tests
 *
 * Tests the HTML template generation for Polish legal documents.
 */

import { PdfTemplateService, DocumentTemplateContext } from './pdf-template.service';
import { DocumentType } from '../../entities/legal-document.entity';
import { PdfPageFormat } from '../../queues/pdf-export.job';

describe('PdfTemplateService', () => {
  let service: PdfTemplateService;

  beforeEach(() => {
    service = new PdfTemplateService();
  });

  describe('generateHtml', () => {
    it('should generate HTML template for a Polish lawsuit document', () => {
      const context: DocumentTemplateContext = {
        title: 'Pozew o zapłatę',
        content: `
# Żądanie pozwu

Wnoszę o:

1. Zasądzenie od pozwanego na rzecz powoda kwoty 10 000 zł.

2. Zasądzenie od pozwanego kosztów postępowania.

## Uzasadnienie

Powód zawarł z pozwanym umowę o dzieło.
        `,
        documentType: DocumentType.LAWSUIT,
        createdAt: new Date('2024-01-15'),
        metadata: {
          plaintiffName: 'Jan Kowalski',
          defendantName: 'ABC Sp. z o.o.',
          claimAmount: 10000,
          claimCurrency: 'PLN',
        },
      };

      const html = service.generateHtml(context, {
        format: PdfPageFormat.A4,
        includeHeader: true,
        includeFooter: true,
        language: 'pl',
      });

      // Verify HTML structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="pl">');
      expect(html).toContain('Pozew o zapłatę');
      expect(html).toContain('Jan Kowalski');
      expect(html).toContain('ABC Sp. z o.o.');
      expect(html).toContain('Powód');
      expect(html).toContain('Pozwany');
      expect(html).toContain('lawsuit'); // Badge class
      expect(html).toContain('Legal AI Platform');
    });

    it('should generate HTML template for a contract document', () => {
      const context: DocumentTemplateContext = {
        title: 'Umowa o świadczenie usług',
        content: `
# Umowa o świadczenie usług

zawarta w dniu 1 lutego 2024 r. w Warszawie

## § 1 Przedmiot umowy

Zleceniodawca zleca, a Zleceniobiorca przyjmuje do wykonania usługi.
        `,
        documentType: DocumentType.CONTRACT,
        createdAt: new Date('2024-02-01'),
      };

      const html = service.generateHtml(context, {
        format: PdfPageFormat.A4,
        language: 'pl',
      });

      expect(html).toContain('Umowa o świadczenie usług');
      expect(html).toContain('contract'); // Badge class
      expect(html).toContain('Umowa'); // Polish document type label
    });

    it('should include watermark when specified', () => {
      const context: DocumentTemplateContext = {
        title: 'Test Document',
        content: 'Test content',
        documentType: DocumentType.OTHER,
      };

      const html = service.generateHtml(context, {
        watermark: 'DRAFT',
      });

      expect(html).toContain('class="watermark"');
      expect(html).toContain('DRAFT');
    });

    it('should not include watermark when not specified', () => {
      const context: DocumentTemplateContext = {
        title: 'Test Document',
        content: 'Test content',
        documentType: DocumentType.OTHER,
      };

      const html = service.generateHtml(context, {});

      expect(html).not.toContain('class="watermark"');
    });

    it('should generate English labels when language is set to en', () => {
      const context: DocumentTemplateContext = {
        title: 'Legal Complaint',
        content: 'Complaint content...',
        documentType: DocumentType.COMPLAINT,
        metadata: {
          plaintiffName: 'John Smith',
          defendantName: 'XYZ Corp.',
        },
      };

      const html = service.generateHtml(context, {
        language: 'en',
      });

      expect(html).toContain('<html lang="en">');
      expect(html).toContain('Plaintiff');
      expect(html).toContain('Defendant');
      expect(html).toContain('Complaint'); // English document type label
    });

    it('should escape HTML characters in title and content', () => {
      const context: DocumentTemplateContext = {
        title: '<script>alert("XSS")</script>',
        content: '<img src="x" onerror="alert(1)">',
        documentType: DocumentType.OTHER,
      };

      const html = service.generateHtml(context, {});

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should convert markdown-like content to HTML', () => {
      const context: DocumentTemplateContext = {
        title: 'Markdown Test',
        content: `
# Heading 1
## Heading 2
### Heading 3

This is **bold** and this is *italic*.

> This is a blockquote

- List item 1
- List item 2
        `,
        documentType: DocumentType.OTHER,
      };

      const html = service.generateHtml(context, {});

      expect(html).toContain('<h1>Heading 1</h1>');
      expect(html).toContain('<h2>Heading 2</h2>');
      expect(html).toContain('<h3>Heading 3</h3>');
      expect(html).toContain('<strong>bold</strong>');
      expect(html).toContain('<em>italic</em>');
      expect(html).toContain('<blockquote>');
    });

    it('should include proper CSS styles for A4 format', () => {
      const context: DocumentTemplateContext = {
        title: 'A4 Document',
        content: 'Test content',
        documentType: DocumentType.OTHER,
      };

      const html = service.generateHtml(context, {
        format: PdfPageFormat.A4,
      });

      expect(html).toContain('210mm');
      expect(html).toContain('297mm');
    });

    it('should include proper CSS styles for Letter format', () => {
      const context: DocumentTemplateContext = {
        title: 'Letter Document',
        content: 'Test content',
        documentType: DocumentType.OTHER,
      };

      const html = service.generateHtml(context, {
        format: PdfPageFormat.LETTER,
      });

      expect(html).toContain('8.5in');
      expect(html).toContain('11in');
    });

    it('should include parties section for lawsuit documents with metadata', () => {
      const context: DocumentTemplateContext = {
        title: 'Test Lawsuit',
        content: 'Content',
        documentType: DocumentType.LAWSUIT,
        metadata: {
          plaintiffName: 'Powód Test',
          defendantName: 'Pozwany Test',
        },
      };

      const html = service.generateHtml(context, { language: 'pl' });

      expect(html).toContain('parties-section');
      expect(html).toContain('Powód Test');
      expect(html).toContain('Pozwany Test');
    });

    it('should not render parties section HTML for documents without metadata', () => {
      const context: DocumentTemplateContext = {
        title: 'Test Document',
        content: 'Content',
        documentType: DocumentType.OTHER,
      };

      const html = service.generateHtml(context, {});

      // The CSS class is always included, but the actual section HTML should not be rendered
      // Check that there's no actual party names being displayed
      expect(html).not.toContain('class="party-name"');
    });

    it('should handle date formatting correctly in Polish', () => {
      const context: DocumentTemplateContext = {
        title: 'Test Document',
        content: 'Content',
        documentType: DocumentType.OTHER,
        createdAt: new Date('2024-03-15'),
      };

      const html = service.generateHtml(context, { language: 'pl' });

      // Should contain Polish date format
      expect(html).toMatch(/15\s+(marca|marzec)/i); // Polish month name
    });

    it('should handle date formatting correctly in English', () => {
      const context: DocumentTemplateContext = {
        title: 'Test Document',
        content: 'Content',
        documentType: DocumentType.OTHER,
        createdAt: new Date('2024-03-15'),
      };

      const html = service.generateHtml(context, { language: 'en' });

      // Should contain English date format
      expect(html).toMatch(/March\s+15/i);
    });
  });
});
