import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalDocument } from './entities/legal-document.entity';

/**
 * Documents Module
 *
 * Handles legal document generation, storage, and management.
 * Part of User Story 1: AI Document Generation.
 *
 * This module will be expanded with:
 * - DocumentService (CRUD operations)
 * - DocumentController (API endpoints)
 * - PdfExportService (PDF generation)
 */
@Module({
  imports: [TypeOrmModule.forFeature([LegalDocument])],
  providers: [],
  controllers: [],
  exports: [TypeOrmModule],
})
export class DocumentsModule {}
