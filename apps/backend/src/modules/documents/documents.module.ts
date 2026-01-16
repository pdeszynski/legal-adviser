import { Module } from '@nestjs/common';
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalDocument } from './entities/legal-document.entity';
import { LegalAnalysis } from './entities/legal-analysis.entity';
import { LegalRuling } from './entities/legal-ruling.entity';
import { DocumentsService } from './services/documents.service';
import { LegalRulingService } from './services/legal-ruling.service';
import { DocumentsResolver } from './documents.resolver';
import { LegalRulingResolver } from './legal-ruling.resolver';
import { DocumentSubscriptionResolver } from './documents-subscription.resolver';
import { DocumentsController } from './documents.controller';
import { DocumentStreamController } from './controllers/document-stream.controller';
import {
  CreateLegalDocumentInput,
  UpdateLegalDocumentInput,
} from './dto/legal-document.dto';
import {
  CreateLegalAnalysisInput,
  UpdateLegalAnalysisInput,
} from './dto/legal-analysis.dto';
import {
  CreateLegalRulingInput,
  UpdateLegalRulingInput,
} from './dto/legal-ruling.dto';
import { BullModule } from '@nestjs/bull';
import { QUEUE_NAMES } from '../../shared/queues';
import { AiClientModule } from '../../shared/ai-client/ai-client.module';
import { DocumentGenerationProcessor } from './queues/document-generation.processor';
import { DocumentGenerationProducer } from './queues/document-generation.producer';
// PDF Export Services
import { PdfExportProcessor } from './queues/pdf-export.processor';
import { PdfExportProducer } from './queues/pdf-export.producer';
import { PdfTemplateService, PdfGeneratorService } from './services/pdf';

/**
 * Documents Module
 *
 * Handles legal document generation, storage, and management.
 * Part of User Story 1: AI Document Generation.
 *
 * Primary API: GraphQL (auto-generated CRUD + custom resolvers) - per constitution
 * Secondary API: REST (DocumentsController) - for internal services
 *
 * Uses nestjs-query for auto-generated CRUD operations:
 * - legalDocuments: Query all documents with filtering, sorting, paging
 * - legalDocument: Query single document by ID
 * - createOneLegalDocument: Create a new document
 * - updateOneLegalDocument: Update a document
 * - deleteOneLegalDocument: Delete a document
 *
 * Custom mutations (via DocumentsResolver):
 * - generateDocument: Create and start AI generation
 *
 * Queue Processing:
 * - DocumentGenerationProcessor: Handles async document generation via Bull queue
 * - DocumentGenerationProducer: Adds document generation jobs to the queue
 *
 * This module will be expanded with:
 * - PdfExportService (PDF generation) - T020
 */
@Module({
  imports: [
    // Register document generation queue
    BullModule.registerQueue({
      name: QUEUE_NAMES.DOCUMENT.GENERATION,
    }),
    // Register PDF export queue
    BullModule.registerQueue({
      name: QUEUE_NAMES.DOCUMENT.EXPORT_PDF,
    }),
    // AI client for communication with AI engine
    AiClientModule,
    // TypeORM for direct repository access (needed for LegalRulingService full-text search)
    TypeOrmModule.forFeature([LegalRuling]),
    NestjsQueryGraphQLModule.forFeature({
      imports: [
        NestjsQueryTypeOrmModule.forFeature([
          LegalDocument,
          LegalAnalysis,
          LegalRuling,
        ]),
      ],
      resolvers: [
        {
          DTOClass: LegalDocument,
          EntityClass: LegalDocument,
          CreateDTOClass: CreateLegalDocumentInput,
          UpdateDTOClass: UpdateLegalDocumentInput,
          enableTotalCount: true,
          enableAggregate: true,
          read: {
            // Enable standard read operations
            many: { name: 'legalDocuments' },
            one: { name: 'legalDocument' },
          },
          create: {
            // Enable create mutation
            one: { name: 'createOneLegalDocument' },
            many: { disabled: true },
          },
          update: {
            // Enable update mutation
            one: { name: 'updateOneLegalDocument' },
            many: { disabled: true },
          },
          delete: {
            // Enable delete mutation
            one: { name: 'deleteOneLegalDocument' },
            many: { disabled: true },
          },
        },
        {
          DTOClass: LegalAnalysis,
          EntityClass: LegalAnalysis,
          CreateDTOClass: CreateLegalAnalysisInput,
          UpdateDTOClass: UpdateLegalAnalysisInput,
          enableTotalCount: true,
          enableAggregate: true,
          read: {
            // Enable standard read operations
            many: { name: 'legalAnalyses' },
            one: { name: 'legalAnalysis' },
          },
          create: {
            // Enable create mutation
            one: { name: 'createOneLegalAnalysis' },
            many: { disabled: true },
          },
          update: {
            // Enable update mutation
            one: { name: 'updateOneLegalAnalysis' },
            many: { disabled: true },
          },
          delete: {
            // Enable delete mutation
            one: { name: 'deleteOneLegalAnalysis' },
            many: { disabled: true },
          },
        },
        {
          DTOClass: LegalRuling,
          EntityClass: LegalRuling,
          CreateDTOClass: CreateLegalRulingInput,
          UpdateDTOClass: UpdateLegalRulingInput,
          enableTotalCount: true,
          enableAggregate: true,
          read: {
            // Enable standard read operations
            many: { name: 'legalRulings' },
            one: { name: 'legalRuling' },
          },
          create: {
            // Enable create mutation
            one: { name: 'createOneLegalRuling' },
            many: { disabled: true },
          },
          update: {
            // Enable update mutation
            one: { name: 'updateOneLegalRuling' },
            many: { disabled: true },
          },
          delete: {
            // Enable delete mutation
            one: { name: 'deleteOneLegalRuling' },
            many: { disabled: true },
          },
        },
      ],
    }),
  ],
  providers: [
    DocumentsService,
    LegalRulingService,
    DocumentsResolver,
    LegalRulingResolver,
    DocumentSubscriptionResolver,
    // Document Generation Queue
    DocumentGenerationProcessor,
    DocumentGenerationProducer,
    // PDF Export Queue
    PdfTemplateService,
    PdfGeneratorService,
    PdfExportProcessor,
    PdfExportProducer,
  ],
  controllers: [DocumentsController, DocumentStreamController],
  exports: [
    DocumentsService,
    LegalRulingService,
    DocumentGenerationProducer,
    PdfExportProducer,
    PdfGeneratorService,
  ],
})
export class DocumentsModule {}
