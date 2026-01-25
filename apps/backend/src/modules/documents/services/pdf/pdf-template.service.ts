import { Injectable } from '@nestjs/common';
import { DocumentType } from '../../entities/legal-document.entity';
import { PdfPageFormat } from '../../dto/pdf-export.dto';

/**
 * Document Template Context
 *
 * Context data for rendering PDF templates
 */
export interface DocumentTemplateContext {
  title: string;
  content: string;
  documentType: DocumentType;
  createdAt?: Date;
  metadata?: {
    plaintiffName?: string;
    defendantName?: string;
    claimAmount?: number;
    claimCurrency?: string;
    courtName?: string;
    caseNumber?: string;
    [key: string]: unknown;
  };
}

/**
 * PDF Template Service
 *
 * Generates HTML templates for Polish legal documents with proper
 * formatting, fonts, and styling according to Polish legal standards.
 *
 * Features:
 * - Professional legal document formatting
 * - Polish language support with proper date/number formatting
 * - Multiple document type templates
 * - Configurable headers, footers, and watermarks
 */
@Injectable()
export class PdfTemplateService {
  /**
   * Generate HTML template for PDF rendering
   */
  generateHtml(
    context: DocumentTemplateContext,
    options: PdfExportOptions = {},
  ): string {
    const {
      format = PdfPageFormat.A4,
      includeHeader = true,
      includeFooter = true,
      watermark,
      language = 'pl',
    } = options;

    const styles = this.getStyles(format);
    const header = includeHeader ? this.renderHeader(context, language) : '';
    const footer = includeFooter ? this.renderFooter(language) : '';
    const watermarkHtml = watermark ? this.renderWatermark(watermark) : '';
    const content = this.renderContent(context, language);

    return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(context.title)}</title>
  <style>
    ${styles}
  </style>
</head>
<body>
  ${watermarkHtml}
  <div class="document-container">
    ${header}
    <main class="document-content">
      ${content}
    </main>
    ${footer}
  </div>
</body>
</html>`;
  }

  /**
   * Get CSS styles for the document
   */
  private getStyles(format: PdfPageFormat): string {
    const pageSize = this.getPageSize(format);

    return `
      @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Roboto+Mono:wght@400;500&display=swap');

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      @page {
        size: ${pageSize.width} ${pageSize.height};
        margin: 25mm 20mm 25mm 20mm;
      }

      body {
        font-family: 'Roboto', 'Segoe UI', 'Arial', sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #1a1a1a;
        background: white;
      }

      .document-container {
        max-width: 100%;
        margin: 0 auto;
      }

      /* Header Styles */
      .document-header {
        border-bottom: 2px solid #2c3e50;
        padding-bottom: 15px;
        margin-bottom: 25px;
      }

      .header-title {
        font-size: 16pt;
        font-weight: 700;
        color: #2c3e50;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
      }

      .header-subtitle {
        font-size: 10pt;
        color: #7f8c8d;
        font-style: italic;
      }

      .header-meta {
        display: flex;
        justify-content: space-between;
        margin-top: 12px;
        font-size: 9pt;
        color: #555;
      }

      /* Document Type Badge */
      .document-type-badge {
        display: inline-block;
        padding: 4px 12px;
        background: #3498db;
        color: white;
        font-size: 8pt;
        font-weight: 500;
        border-radius: 3px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .document-type-badge.lawsuit {
        background: #e74c3c;
      }

      .document-type-badge.complaint {
        background: #e67e22;
      }

      .document-type-badge.contract {
        background: #27ae60;
      }

      /* Content Styles */
      .document-content {
        text-align: justify;
      }

      .document-content h1 {
        font-size: 14pt;
        font-weight: 700;
        color: #2c3e50;
        margin: 20px 0 12px 0;
        padding-bottom: 5px;
        border-bottom: 1px solid #bdc3c7;
      }

      .document-content h2 {
        font-size: 12pt;
        font-weight: 600;
        color: #34495e;
        margin: 18px 0 10px 0;
      }

      .document-content h3 {
        font-size: 11pt;
        font-weight: 600;
        color: #34495e;
        margin: 15px 0 8px 0;
      }

      .document-content p {
        margin: 10px 0;
        text-indent: 20px;
      }

      .document-content p:first-of-type {
        text-indent: 0;
      }

      .document-content ul, .document-content ol {
        margin: 12px 0;
        padding-left: 30px;
      }

      .document-content li {
        margin: 6px 0;
      }

      .document-content blockquote {
        margin: 15px 0;
        padding: 12px 20px;
        border-left: 4px solid #3498db;
        background: #f8f9fa;
        font-style: italic;
        color: #555;
      }

      .document-content strong {
        font-weight: 600;
        color: #2c3e50;
      }

      .document-content em {
        font-style: italic;
      }

      /* Legal Document Specific Styles */
      .legal-section {
        margin: 20px 0;
        padding: 15px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        background: #fafafa;
      }

      .legal-section-title {
        font-size: 10pt;
        font-weight: 600;
        color: #7f8c8d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 10px;
      }

      .legal-article {
        margin: 15px 0;
      }

      .legal-article-number {
        font-weight: 700;
        color: #2c3e50;
      }

      .signature-block {
        margin-top: 40px;
        text-align: right;
      }

      .signature-line {
        display: inline-block;
        width: 200px;
        border-top: 1px solid #333;
        padding-top: 5px;
        font-size: 9pt;
        color: #555;
      }

      /* Table Styles */
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
      }

      th, td {
        border: 1px solid #ddd;
        padding: 10px 12px;
        text-align: left;
      }

      th {
        background: #f5f6f7;
        font-weight: 600;
        color: #2c3e50;
      }

      tr:nth-child(even) {
        background: #fafafa;
      }

      /* Footer Styles */
      .document-footer {
        margin-top: 30px;
        padding-top: 15px;
        border-top: 1px solid #e0e0e0;
        font-size: 9pt;
        color: #7f8c8d;
        display: flex;
        justify-content: space-between;
      }

      .footer-left {
        text-align: left;
      }

      .footer-right {
        text-align: right;
      }

      /* Watermark */
      .watermark {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 72pt;
        color: rgba(200, 200, 200, 0.3);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 20px;
        white-space: nowrap;
        pointer-events: none;
        z-index: -1;
      }

      /* Polish Legal Standards */
      .court-header {
        text-align: center;
        margin-bottom: 30px;
      }

      .court-name {
        font-size: 12pt;
        font-weight: 700;
        color: #2c3e50;
      }

      .case-number {
        font-size: 10pt;
        color: #555;
        margin-top: 5px;
      }

      .parties-section {
        display: flex;
        justify-content: space-between;
        margin: 20px 0;
        padding: 15px 0;
        border-top: 1px solid #e0e0e0;
        border-bottom: 1px solid #e0e0e0;
      }

      .party-block {
        flex: 1;
        padding: 0 15px;
      }

      .party-block:first-child {
        border-right: 1px solid #e0e0e0;
      }

      .party-label {
        font-size: 9pt;
        color: #7f8c8d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 5px;
      }

      .party-name {
        font-weight: 600;
        color: #2c3e50;
      }

      /* Page break handling */
      .page-break {
        page-break-before: always;
      }

      .no-break {
        page-break-inside: avoid;
      }

      /* Print optimization */
      @media print {
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .no-print {
          display: none !important;
        }
      }
    `;
  }

  /**
   * Get page dimensions for the specified format
   */
  private getPageSize(format: PdfPageFormat): {
    width: string;
    height: string;
  } {
    switch (format) {
      case PdfPageFormat.A4:
        return { width: '210mm', height: '297mm' };
      case PdfPageFormat.LETTER:
        return { width: '8.5in', height: '11in' };
      case PdfPageFormat.LEGAL:
        return { width: '8.5in', height: '14in' };
      default:
        return { width: '210mm', height: '297mm' };
    }
  }

  /**
   * Render document header
   */
  private renderHeader(
    context: DocumentTemplateContext,
    language: string,
  ): string {
    const typeLabel = this.getDocumentTypeLabel(context.documentType, language);
    const typeBadgeClass = this.getTypeBadgeClass(context.documentType);
    const dateStr = context.createdAt
      ? this.formatDate(context.createdAt, language)
      : this.formatDate(new Date(), language);

    return `
      <header class="document-header">
        <h1 class="header-title">${this.escapeHtml(context.title)}</h1>
        <div class="header-meta">
          <span class="document-type-badge ${typeBadgeClass}">${typeLabel}</span>
          <span>${language === 'pl' ? 'Data utworzenia' : 'Created'}: ${dateStr}</span>
        </div>
      </header>
    `;
  }

  /**
   * Render document footer
   */
  private renderFooter(language: string): string {
    const generatedText =
      language === 'pl'
        ? 'Wygenerowano automatycznie przez Legal AI Platform'
        : 'Automatically generated by Legal AI Platform';

    return `
      <footer class="document-footer">
        <div class="footer-left">${generatedText}</div>
        <div class="footer-right">
          <span class="page-number"></span>
        </div>
      </footer>
    `;
  }

  /**
   * Render watermark overlay
   */
  private renderWatermark(text: string): string {
    return `<div class="watermark">${this.escapeHtml(text)}</div>`;
  }

  /**
   * Render document content
   */
  private renderContent(
    context: DocumentTemplateContext,
    language: string,
  ): string {
    // Add parties section for lawsuits and complaints
    let partiesSection = '';
    if (
      context.metadata &&
      (context.documentType === DocumentType.LAWSUIT ||
        context.documentType === DocumentType.COMPLAINT)
    ) {
      partiesSection = this.renderPartiesSection(context.metadata, language);
    }

    // Convert markdown-like content to HTML if needed
    const htmlContent = this.convertContentToHtml(context.content);

    return `
      ${partiesSection}
      <div class="content-body">
        ${htmlContent}
      </div>
    `;
  }

  /**
   * Render parties section for legal documents
   */
  private renderPartiesSection(
    metadata: NonNullable<DocumentTemplateContext['metadata']>,
    language: string,
  ): string {
    const plaintiffLabel = language === 'pl' ? 'Powód' : 'Plaintiff';
    const defendantLabel = language === 'pl' ? 'Pozwany' : 'Defendant';
    const plaintiffName = metadata.plaintiffName || '—';
    const defendantName = metadata.defendantName || '—';

    return `
      <div class="parties-section">
        <div class="party-block">
          <div class="party-label">${plaintiffLabel}</div>
          <div class="party-name">${this.escapeHtml(plaintiffName)}</div>
        </div>
        <div class="party-block">
          <div class="party-label">${defendantLabel}</div>
          <div class="party-name">${this.escapeHtml(defendantName)}</div>
        </div>
      </div>
    `;
  }

  /**
   * Convert markdown-like content to HTML
   *
   * Simple conversion for common patterns
   */
  private convertContentToHtml(content: string): string {
    // If content already contains HTML tags, return as-is
    if (/<[a-z][\s\S]*>/i.test(content)) {
      return content;
    }

    let html = content;

    // Convert headings
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Convert bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Convert blockquotes
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    // Convert unordered lists
    html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Convert numbered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Convert paragraphs (double newlines)
    html = html.replace(/\n\n/g, '</p><p>');

    // Wrap in paragraph if not already
    if (!html.startsWith('<')) {
      html = `<p>${html}</p>`;
    }

    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
  }

  /**
   * Get document type label in the specified language
   */
  private getDocumentTypeLabel(type: DocumentType, language: string): string {
    const labels: Record<DocumentType, { pl: string; en: string }> = {
      [DocumentType.LAWSUIT]: { pl: 'Pozew', en: 'Lawsuit' },
      [DocumentType.COMPLAINT]: { pl: 'Skarga', en: 'Complaint' },
      [DocumentType.CONTRACT]: { pl: 'Umowa', en: 'Contract' },
      [DocumentType.OTHER]: { pl: 'Dokument', en: 'Document' },
    };

    return (
      labels[type]?.[language as 'pl' | 'en'] ||
      labels[DocumentType.OTHER][language as 'pl' | 'en']
    );
  }

  /**
   * Get CSS class for document type badge
   */
  private getTypeBadgeClass(type: DocumentType): string {
    const classes: Record<DocumentType, string> = {
      [DocumentType.LAWSUIT]: 'lawsuit',
      [DocumentType.COMPLAINT]: 'complaint',
      [DocumentType.CONTRACT]: 'contract',
      [DocumentType.OTHER]: '',
    };

    return classes[type] || '';
  }

  /**
   * Format date according to locale
   */
  private formatDate(date: Date, language: string): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return date.toLocaleDateString(
      language === 'pl' ? 'pl-PL' : 'en-US',
      options,
    );
  }

  /**
   * Escape HTML special characters to prevent XSS
   */
  private escapeHtml(text: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
    };

    return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
  }
}
