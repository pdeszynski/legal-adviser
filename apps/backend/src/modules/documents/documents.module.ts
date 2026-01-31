import { Module, forwardRef } from '@nestjs/common';
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalDocument } from './entities/legal-document.entity';
import { LegalAnalysis } from './entities/legal-analysis.entity';
import { LegalRuling } from './entities/legal-ruling.entity';
import { DocumentShare } from './entities/document-share.entity';
import { DocumentTemplate } from './entities/document-template.entity';
import { DocumentVersion } from './entities/document-version.entity';
import { DocumentEmbedding } from './entities/document-embedding.entity';
import { DocumentComment } from './entities/document-comment.entity';
import { DocumentsService } from './services/documents.service';
import { LegalRulingService } from './services/legal-ruling.service';
import { DocumentSharingService } from './services/document-sharing.service';
import { TemplateEngineService } from './services/template-engine.service';
import { DocumentVersioningService } from './services/document-versioning.service';
import { VectorStoreService } from './services/vector-store.service';
import { DocumentsResolver } from './documents.resolver';
import { LegalRulingResolver } from './legal-ruling.resolver';
import { DocumentSubscriptionResolver } from './documents-subscription.resolver';
import { DocumentSharingResolver } from './document-sharing.resolver';
import { DocumentTemplatesResolver } from './document-templates.resolver';
import { DocumentVersioningResolver } from './document-versioning.resolver';
import { LegalAnalysisResolver } from './legal-analysis.resolver';
import { PdfUrlResolver } from './pdf-url.resolver';
import { DocumentModerationResolver } from './document-moderation.resolver';
import { DocumentQueueResolver } from './document-queue.resolver';
import { DocumentsController } from './documents.controller';
import { DocumentStreamController } from './controllers/document-stream.controller';
import { VectorSearchController } from './controllers/vector-search.controller';
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
import {
  CreateDocumentTemplateInput,
  UpdateDocumentTemplateInput,
} from './dto/document-template.dto';
import {
  CreateDocumentVersionInput,
  UpdateDocumentVersionInput,
} from './dto/document-version.dto';
import {
  CreateDocumentCommentInput,
  UpdateDocumentCommentInput,
} from './dto/document-comment.dto';
import { AiClientModule } from '../../shared/ai-client/ai-client.module';
import { PdfTemplateService, PdfGeneratorService } from './services/pdf';
import { PdfExportService } from './services/pdf-export.service';
import { PdfUrlService } from './services/pdf-url.service';
import { DocumentModerationService } from './services/document-moderation.service';
import { UserSession } from '../users/entities/user-session.entity';
import { RulingSearchAggregatorService } from './services/ruling-search-aggregator.service';
import { AdvancedLegalRulingSearchService } from './services/advanced-legal-ruling-search.service';
// Anti-Corruption Layer
import { SaosModule } from '../../infrastructure/anti-corruption/saos/saos.module';
import { IsapModule } from '../../infrastructure/anti-corruption/isap/isap.module';
// Auth Guards
import {
  GqlAuthGuard,
  DocumentPermissionGuard,
  DocumentPermission,
} from '../auth/guards';
// Temporal Module
import { TemporalModule } from '../temporal/temporal.module';
import { DocumentGenerationStarter } from '../temporal/workflows/document/document-generation.starter';
// Audit Log Module
import { AuditLogModule } from '../audit-log/audit-log.module';

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
 * - Temporal workflows: Handles async document generation, PDF export, and ruling indexing
 * - DocumentGenerationStarter: Starts document generation workflows
 * - PdfExportStarter: Starts PDF export workflows
 * - RulingIndexingStarter: Starts ruling indexing workflows
 *
 * Document Moderation:
 * - DocumentModerationService: Handles flag/approve/reject workflow
 * - DocumentModerationResolver: Admin-only mutations for moderation
 */
@Module({
  imports: [
    // AI client for communication with AI engine
    AiClientModule,
    // Temporal for workflow orchestration
    forwardRef(() => TemporalModule),
    // Anti-corruption layer for external integrations
    SaosModule,
    IsapModule,
    // Audit Log for tracking admin actions
    AuditLogModule,
    // TypeORM for direct repository access (needed for LegalRulingService full-text search and DocumentSharingService)
    TypeOrmModule.forFeature([
      LegalRuling,
      LegalDocument,
      LegalAnalysis,
      DocumentShare,
      DocumentTemplate,
      DocumentVersion,
      DocumentEmbedding,
      DocumentComment,
      UserSession,
    ]),
    NestjsQueryGraphQLModule.forFeature({
      imports: [
        NestjsQueryTypeOrmModule.forFeature([
          LegalDocument,
          LegalAnalysis,
          LegalRuling,
          DocumentShare,
          DocumentTemplate,
          DocumentVersion,
          DocumentComment,
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
          guards: [GqlAuthGuard],
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
        {
          DTOClass: DocumentTemplate,
          EntityClass: DocumentTemplate,
          CreateDTOClass: CreateDocumentTemplateInput,
          UpdateDTOClass: UpdateDocumentTemplateInput,
          enableTotalCount: true,
          enableAggregate: true,
          guards: [GqlAuthGuard],
          read: {
            // Enable standard read operations with filtering, sorting, paging
            many: { name: 'documentTemplates' },
            one: { name: 'documentTemplate' },
          },
          create: {
            // Enable create mutation
            one: { name: 'createOneDocumentTemplate' },
            many: { disabled: true },
          },
          update: {
            // Enable update mutation
            one: { name: 'updateOneDocumentTemplate' },
            many: { disabled: true },
          },
          delete: {
            // Enable delete mutation
            one: { name: 'deleteOneDocumentTemplate' },
            many: { disabled: true },
          },
        },
        {
          DTOClass: DocumentVersion,
          EntityClass: DocumentVersion,
          CreateDTOClass: CreateDocumentVersionInput,
          UpdateDTOClass: UpdateDocumentVersionInput,
          enableTotalCount: true,
          enableAggregate: true,
          read: {
            // Enable standard read operations
            many: { name: 'documentVersions' },
            one: { name: 'documentVersion' },
          },
          create: {
            // Enable create mutation
            one: { name: 'createOneDocumentVersion' },
            many: { disabled: true },
          },
          update: {
            // Enable update mutation (only for changeDescription)
            one: { name: 'updateOneDocumentVersion' },
            many: { disabled: true },
          },
          delete: {
            // Disable delete - versions are immutable
            one: { disabled: true },
            many: { disabled: true },
          },
        },
        {
          DTOClass: DocumentComment,
          EntityClass: DocumentComment,
          CreateDTOClass: CreateDocumentCommentInput,
          UpdateDTOClass: UpdateDocumentCommentInput,
          enableTotalCount: true,
          enableAggregate: true,
          guards: [GqlAuthGuard],
          read: {
            // Enable standard read operations with filtering, sorting, paging
            many: { name: 'documentComments' },
            one: { name: 'documentComment' },
          },
          create: {
            // Enable create mutation
            one: { name: 'createOneDocumentComment' },
            many: { disabled: true },
          },
          update: {
            // Enable update mutation
            one: { name: 'updateOneDocumentComment' },
            many: { disabled: true },
          },
          delete: {
            // Enable delete mutation
            one: { name: 'deleteOneDocumentComment' },
            many: { disabled: true },
          },
        },
      ],
    }),
  ],
  providers: [
    DocumentsService,
    LegalRulingService,
    DocumentSharingService,
    TemplateEngineService,
    DocumentVersioningService,
    VectorStoreService,
    PdfExportService,
    PdfUrlService,
    DocumentModerationService,
    RulingSearchAggregatorService,
    AdvancedLegalRulingSearchService,
    DocumentsResolver,
    LegalRulingResolver,
    DocumentSubscriptionResolver,
    PdfUrlResolver,
    DocumentSharingResolver,
    DocumentTemplatesResolver,
    DocumentVersioningResolver,
    LegalAnalysisResolver,
    DocumentModerationResolver,
    DocumentQueueResolver,
    // PDF Export Services
    PdfTemplateService,
    PdfGeneratorService,
    // Temporal Workflow Starters
    DocumentGenerationStarter,
  ],
  controllers: [
    DocumentsController,
    DocumentStreamController,
    VectorSearchController,
  ],
  exports: [
    DocumentsService,
    LegalRulingService,
    DocumentSharingService,
    TemplateEngineService,
    DocumentVersioningService,
    VectorStoreService,
    PdfExportService,
    PdfUrlService,
    DocumentModerationService,
    RulingSearchAggregatorService,
    AdvancedLegalRulingSearchService,
    // Export Temporal starter for workflow initiation
    DocumentGenerationStarter,
    PdfExportService,
    PdfGeneratorService,
  ],
})
export class DocumentsModule {}
