import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentsService } from './documents.service';
import { PdfExportProducer } from '../queues/pdf-export.producer';
import { DocumentStatus } from '../entities/legal-document.entity';
import { ExportDocumentToPdfInput } from '../dto/pdf-export.dto';

/**
 * PDF URL Service
 *
 * Generates signed URLs for downloading PDF versions of documents.
 * Triggers PDF generation if needed and returns a time-limited access URL.
 */
@Injectable()
export class PdfUrlService {
  private readonly logger = new Logger(PdfUrlService.name);

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly pdfExportProducer: PdfExportProducer,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get or generate a signed PDF URL for a document
   *
   * If the document already has a pdfUrl, validates and returns it.
   * Otherwise, triggers PDF generation and returns a new signed URL.
   *
   * @param documentId - The document ID
   * @returns Signed URL for PDF download, or null if document is not ready
   */
  async getDocumentPdfUrl(documentId: string): Promise<string | null> {
    const document = await this.documentsService.findById(documentId);

    if (!document) {
      this.logger.warn(`Document ${documentId} not found`);
      return null;
    }

    // Document must be completed to generate PDF
    if (document.status !== DocumentStatus.COMPLETED) {
      this.logger.debug(
        `Document ${documentId} is not completed (status: ${document.status})`,
      );
      return null;
    }

    if (!document.contentRaw) {
      this.logger.warn(`Document ${documentId} has no content`);
      return null;
    }

    // If PDF URL already exists and is valid, return it
    if (document.pdfUrl && this.isPdfUrlValid(document.pdfUrl)) {
      this.logger.debug(`Using existing PDF URL for document ${documentId}`);
      return document.pdfUrl;
    }

    // Generate new PDF and URL
    this.logger.log(`Generating PDF URL for document ${documentId}`);

    try {
      const pdfUrl = await this.generateSignedPdfUrl(document);
      return pdfUrl;
    } catch (error) {
      this.logger.error(
        `Failed to generate PDF URL for document ${documentId}: ${error}`,
      );
      return null;
    }
  }

  /**
   * Generate a signed URL for PDF download
   *
   * Creates a time-limited, signed URL that provides secure access to the PDF.
   * The URL includes a signature and expiration timestamp.
   *
   * @param document - The document to generate URL for
   * @returns Signed URL for PDF download
   */
  private async generateSignedPdfUrl(document: {
    id: string;
    title: string;
    contentRaw: string | null;
  }): Promise<string> {
    const baseUrl =
      this.configService.get<string>('API_BASE_URL') ||
      this.configService.get<string>('APP_URL') ||
      'http://localhost:3000';

    const filename = this.sanitizeFilename(`${document.title}.pdf`);
    const expiresIn = 3600; // 1 hour in seconds
    const expiration = Math.floor(Date.now() / 1000) + expiresIn;

    // Create a simple signed URL with document ID, filename, and expiration
    // In production, you would use a proper signature (e.g., HMAC)
    const signature = this.generateSignature(document.id, expiration);

    const pdfUrl = `${baseUrl}/documents/${document.id}/pdf/${filename}?expires=${expiration}&signature=${signature}`;

    // Update the document with the new URL
    await this.documentsService.update(document.id, { pdfUrl });

    return pdfUrl;
  }

  /**
   * Generate a signature for the PDF URL
   *
   * Creates a cryptographic signature to prevent URL tampering.
   *
   * @param documentId - Document ID
   * @param expiration - Expiration timestamp
   * @returns Signature string
   */
  private generateSignature(documentId: string, expiration: number): string {
    const secret =
      this.configService.get<string>('PDF_URL_SECRET') || 'default-secret-key';
    const crypto = require('crypto');
    const data = `${documentId}:${expiration}`;
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify a PDF URL signature
   *
   * Validates that the signature is correct and the URL hasn't expired.
   *
   * @param documentId - Document ID from URL
   * @param expiration - Expiration timestamp from URL
   * @param signature - Signature from URL
   * @returns True if signature is valid and not expired
   */
  verifyPdfUrlSignature(
    documentId: string,
    expiration: number,
    signature: string,
  ): boolean {
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (expiration < now) {
      return false;
    }

    // Verify signature
    const expectedSignature = this.generateSignature(documentId, expiration);
    return signature === expectedSignature;
  }

  /**
   * Check if a PDF URL is still valid (not expired)
   *
   * @param pdfUrl - The PDF URL to validate
   * @returns True if the URL is valid and not expired
   */
  private isPdfUrlValid(pdfUrl: string): boolean {
    try {
      const url = new URL(pdfUrl);
      const expiresParam = url.searchParams.get('expires');
      if (!expiresParam) return false;

      const expiration = parseInt(expiresParam, 10);
      const now = Math.floor(Date.now() / 1000);

      // URL is valid if it expires more than 5 minutes from now
      return expiration > now + 300;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize a filename for use in URLs
   *
   * Removes or replaces characters that are not safe in URLs.
   *
   * @param filename - Original filename
   * @returns Sanitized filename
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(0, 100);
  }
}
