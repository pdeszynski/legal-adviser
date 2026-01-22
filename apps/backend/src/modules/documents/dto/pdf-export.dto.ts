import {
  Field,
  InputType,
  ObjectType,
  ID,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsUUID,
  IsOptional,
  IsEnum,
  IsString,
  IsBoolean,
} from 'class-validator';
import { PdfPageFormat } from '../queues/pdf-export.job';

// Register enum with GraphQL
registerEnumType(PdfPageFormat, {
  name: 'PdfPageFormat',
  description: 'Page format for PDF export',
});

/**
 * PDF Export Options Input
 *
 * GraphQL input type for PDF export configuration
 */
@InputType('PdfExportOptionsInput')
export class PdfExportOptionsInput {
  @Field(() => PdfPageFormat, {
    nullable: true,
    description: 'Page format (default: A4)',
    defaultValue: PdfPageFormat.A4,
  })
  @IsOptional()
  @IsEnum(PdfPageFormat)
  format?: PdfPageFormat;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Include header with document title and date',
    defaultValue: true,
  })
  @IsOptional()
  @IsBoolean()
  includeHeader?: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Include footer with page numbers',
    defaultValue: true,
  })
  @IsOptional()
  @IsBoolean()
  includeFooter?: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Include table of contents',
    defaultValue: false,
  })
  @IsOptional()
  @IsBoolean()
  includeTableOfContents?: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'Watermark text (e.g., "DRAFT")',
  })
  @IsOptional()
  @IsString()
  watermark?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Language for formatting (default: "pl" for Polish)',
    defaultValue: 'pl',
  })
  @IsOptional()
  @IsString()
  language?: 'pl' | 'en';
}

/**
 * Export Document to PDF Input
 *
 * GraphQL input type for initiating a PDF export job
 */
@InputType('ExportDocumentToPdfInput')
export class ExportDocumentToPdfInput {
  @Field(() => ID, { description: 'ID of the document to export' })
  @IsUUID()
  documentId: string;

  @Field(() => PdfExportOptionsInput, {
    nullable: true,
    description: 'PDF export options',
  })
  @IsOptional()
  options?: PdfExportOptionsInput;
}

/**
 * PDF Export Job Response
 *
 * GraphQL object type returned when a PDF export job is queued
 */
@ObjectType('PdfExportJob')
export class PdfExportJobResponse {
  @Field(() => ID, { description: 'Unique job ID for tracking' })
  jobId: string;

  @Field(() => ID, { description: 'Document ID being exported' })
  documentId: string;

  @Field(() => String, { description: 'Current status of the job' })
  status: string;

  @Field(() => String, { description: 'Message describing current state' })
  message: string;
}

/**
 * PDF Export Result
 *
 * GraphQL object type returned when PDF export is complete
 */
@ObjectType('PdfExportResult')
export class PdfExportResult {
  @Field(() => ID, { description: 'Document ID that was exported' })
  documentId: string;

  @Field(() => String, { description: 'Generated filename for the PDF' })
  filename: string;

  @Field(() => String, { description: 'Base64-encoded PDF content' })
  pdfBase64: string;

  @Field(() => Number, { description: 'Size of the PDF file in bytes' })
  fileSizeBytes: number;

  @Field(() => Number, { description: 'Number of pages in the PDF' })
  pageCount: number;

  @Field(() => Number, {
    description: 'Time taken to generate the PDF in milliseconds',
  })
  generationTimeMs: number;
}

/**
 * Get PDF Export Status Input
 */
@InputType('GetPdfExportStatusInput')
export class GetPdfExportStatusInput {
  @Field(() => ID, { description: 'Job ID to check status for' })
  @IsUUID()
  jobId: string;
}

/**
 * PDF Export Status Response
 */
@ObjectType('PdfExportStatus')
export class PdfExportStatusResponse {
  @Field(() => ID, { description: 'Job ID' })
  jobId: string;

  @Field(() => String, { description: 'Current job status' })
  status:
    | 'waiting'
    | 'active'
    | 'completed'
    | 'failed'
    | 'delayed'
    | 'paused'
    | 'unknown';

  @Field(() => Number, {
    nullable: true,
    description: 'Job progress (0-100)',
  })
  progress?: number;

  @Field(() => PdfExportResult, {
    nullable: true,
    description: 'Result if job is completed',
  })
  result?: PdfExportResult;

  @Field(() => String, {
    nullable: true,
    description: 'Error message if job failed',
  })
  error?: string;
}
