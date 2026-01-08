import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalDocument } from './entities/legal-document.entity';
import { DocumentsService } from './services/documents.service';

/**
 * Documents Module
 *
 * Handles legal document generation, storage, and management.
 * Part of User Story 1: AI Document Generation.
 *
 * This module will be expanded with:
 * - DocumentController (API endpoints) - T017
 * - PdfExportService (PDF generation) - T020
 */
@Module({
  imports: [TypeOrmModule.forFeature([LegalDocument])],
  providers: [DocumentsService],
  controllers: [],
  exports: [TypeOrmModule, DocumentsService],
})
export class DocumentsModule {}
