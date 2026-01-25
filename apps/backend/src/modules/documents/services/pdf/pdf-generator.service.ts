import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer';
import { PdfPageFormat } from '../../dto/pdf-export.dto';
import {
  PdfTemplateService,
  DocumentTemplateContext,
} from './pdf-template.service';

// Re-export PdfPageFormat for convenience
export type { PdfPageFormat };

/**
 * PDF Generation Result
 */
export interface PdfGenerationResult {
  /**
   * PDF buffer
   */
  buffer: Buffer;

  /**
   * Number of pages in the generated PDF
   */
  pageCount: number;

  /**
   * Size of the PDF in bytes
   */
  sizeBytes: number;
}

/**
 * PDF Generator Service
 *
 * Uses Puppeteer to convert HTML templates to professional PDF documents.
 * Optimized for Polish legal documents with proper formatting and fonts.
 *
 * Features:
 * - High-quality PDF generation using headless Chrome
 * - Support for multiple page formats (A4, Letter, Legal)
 * - Proper header and footer rendering
 * - Font embedding for consistent display
 * - Page numbering support
 */
@Injectable()
export class PdfGeneratorService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfGeneratorService.name);
  private browser: Browser | null = null;
  private browserPromise: Promise<Browser> | null = null;

  constructor(private readonly templateService: PdfTemplateService) {}

  /**
   * Generate PDF from document context
   */
  async generatePdf(
    context: DocumentTemplateContext,
    options: PdfExportOptions = {},
  ): Promise<PdfGenerationResult> {
    const startTime = Date.now();
    this.logger.debug(`Starting PDF generation for document: ${context.title}`);

    let page: Page | null = null;

    try {
      // Get browser instance
      const browser = await this.getBrowser();

      // Create new page
      page = await browser.newPage();

      // Generate HTML content
      const html = this.templateService.generateHtml(context, options);

      // Set content with proper viewport
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Wait for fonts to load
      await page.evaluateHandle('document.fonts.ready');

      // Configure PDF options
      const pdfOptions = this.getPdfOptions(context, options);

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      // Get page count by parsing the PDF (simplified approach)
      const pageCount = await this.estimatePageCount(page);

      const generationTime = Date.now() - startTime;
      this.logger.debug(
        `PDF generated successfully in ${generationTime}ms, size: ${pdfBuffer.length} bytes, pages: ${pageCount}`,
      );

      return {
        buffer: Buffer.from(pdfBuffer),
        pageCount,
        sizeBytes: pdfBuffer.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `PDF generation failed: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      // Close the page to free resources
      if (page) {
        try {
          await page.close();
        } catch (closeError) {
          this.logger.warn('Failed to close page after PDF generation');
        }
      }
    }
  }

  /**
   * Generate PDF filename
   */
  generateFilename(title: string, documentId: string): string {
    // Sanitize title for filename
    const sanitizedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9ąćęłńóśźżа-яё\s-]/gi, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    const shortId = documentId.substring(0, 8);
    const timestamp = new Date().toISOString().slice(0, 10);

    return `${sanitizedTitle}-${shortId}-${timestamp}.pdf`;
  }

  /**
   * Get browser instance (lazy initialization with singleton pattern)
   */
  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    // If there's already a pending launch, wait for it
    if (this.browserPromise) {
      return this.browserPromise;
    }

    // Launch new browser
    this.browserPromise = this.launchBrowser();

    try {
      this.browser = await this.browserPromise;
      return this.browser;
    } finally {
      this.browserPromise = null;
    }
  }

  /**
   * Launch Puppeteer browser with optimized settings
   */
  private async launchBrowser(): Promise<Browser> {
    this.logger.debug('Launching Puppeteer browser...');

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        // Font rendering optimization
        '--font-render-hinting=none',
      ],
    });

    this.logger.debug('Puppeteer browser launched successfully');

    // Handle browser disconnection
    browser.on('disconnected', () => {
      this.logger.warn('Browser disconnected');
      this.browser = null;
    });

    return browser;
  }

  /**
   * Get PDF generation options
   */
  private getPdfOptions(
    context: DocumentTemplateContext,
    options: PdfExportOptions,
  ): PDFOptions {
    const format = options.format || PdfPageFormat.A4;
    const includeFooter = options.includeFooter !== false;

    const pdfOptions: PDFOptions = {
      format: format as 'A4' | 'Letter' | 'Legal',
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '25mm',
        right: '20mm',
        bottom: includeFooter ? '30mm' : '25mm',
        left: '20mm',
      },
    };

    // Add header template if enabled
    if (options.includeHeader !== false) {
      pdfOptions.displayHeaderFooter = true;
      pdfOptions.headerTemplate = `
        <div style="font-size: 8pt; color: #999; width: 100%; text-align: center; padding: 5mm 0;">
          ${this.escapeHtml(context.title)}
        </div>
      `;
    }

    // Add footer with page numbers if enabled
    if (includeFooter) {
      pdfOptions.displayHeaderFooter = true;
      pdfOptions.footerTemplate = `
        <div style="font-size: 8pt; color: #666; width: 100%; display: flex; justify-content: space-between; padding: 5mm 20mm;">
          <span>${options.language === 'pl' ? 'Legal AI Platform' : 'Legal AI Platform'}</span>
          <span>
            ${options.language === 'pl' ? 'Strona' : 'Page'} <span class="pageNumber"></span> / <span class="totalPages"></span>
          </span>
        </div>
      `;
    }

    return pdfOptions;
  }

  /**
   * Estimate page count based on document height
   */
  private async estimatePageCount(page: Page): Promise<number> {
    try {
      // Get document height
      const documentHeight = await page.evaluate(() => {
        return Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight,
        );
      });

      // A4 page content height approximately 247mm (297mm - 50mm margins)
      // At 96 DPI, 247mm ≈ 932 pixels
      const pageHeightPx = 932;
      const estimatedPages = Math.ceil(documentHeight / pageHeightPx);

      return Math.max(1, estimatedPages);
    } catch {
      return 1;
    }
  }

  /**
   * Escape HTML for templates
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

  /**
   * Cleanup browser on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.browser) {
      this.logger.debug('Closing Puppeteer browser on module destroy');
      try {
        await this.browser.close();
      } catch (error) {
        this.logger.warn('Error closing browser on destroy', error);
      }
      this.browser = null;
    }
  }
}
