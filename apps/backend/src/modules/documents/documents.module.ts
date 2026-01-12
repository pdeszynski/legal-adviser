import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalDocument } from './entities/legal-document.entity';
import { DocumentsService } from './services/documents.service';
import { DocumentsResolver } from './documents.resolver';
import { DocumentsController } from './documents.controller';

/**
 * Documents Module
 *
 * Handles legal document generation, storage, and management.
 * Part of User Story 1: AI Document Generation.
 *
 * Primary API: GraphQL (DocumentsResolver) - per constitution
 * Secondary API: REST (DocumentsController) - for internal services
 *
 * This module will be expanded with:
 * - PdfExportService (PDF generation) - T020
 */
@Module({
  imports: [TypeOrmModule.forFeature([LegalDocument])],
  providers: [DocumentsService, DocumentsResolver],
  controllers: [DocumentsController],
  exports: [TypeOrmModule, DocumentsService],
})
export class DocumentsModule {}
