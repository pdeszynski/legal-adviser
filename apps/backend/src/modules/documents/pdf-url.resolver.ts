import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { LegalDocument } from './entities/legal-document.entity';
import { PdfUrlService } from './services/pdf-url.service';

/**
 * PDF URL Resolver
 *
 * Handles the resolution of the pdfUrl field on LegalDocument.
 * This field resolver generates a signed URL on-demand when requested.
 *
 * When a client queries the pdfUrl field on a LegalDocument:
 * 1. Checks if document is in COMPLETED status
 * 2. Validates existing PDF URL if present
 * 3. Generates new signed URL if needed
 * 4. Returns the signed URL for PDF download
 */
@Resolver(() => LegalDocument)
export class PdfUrlResolver {
  constructor(private readonly pdfUrlService: PdfUrlService) {}

  /**
   * Resolve the pdfUrl field for a LegalDocument
   *
   * This resolver is called automatically whenever the pdfUrl field
   * is requested in a GraphQL query. It generates or validates
   * a signed URL for downloading the PDF version of the document.
   *
   * @param document - The parent LegalDocument entity
   * @returns Signed URL for PDF download, or null if document is not ready
   *
   * @example
   * ```graphql
   * query GetDocumentWithPdfUrl {
   *   legalDocument(id: "123") {
   *     id
   *     title
   *     status
   *     pdfUrl
   *   }
   * }
   * ```
   */
  @ResolveField('pdfUrl', () => String, { nullable: true })
  async getPdfUrl(@Parent() document: LegalDocument): Promise<string | null> {
    return this.pdfUrlService.getDocumentPdfUrl(document.id);
  }
}
