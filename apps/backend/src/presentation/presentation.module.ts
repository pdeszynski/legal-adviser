import { Module } from '@nestjs/common';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import {
  CreateDocumentUseCase,
  GetDocumentUseCase,
  ListDocumentsByOwnerUseCase,
  UpdateDocumentTitleUseCase,
  PublishDocumentUseCase,
  DeleteDocumentUseCase,
} from '../application/documents';
import { DocumentsResolverV2 } from './graphql/resolvers';
import { DocumentsControllerV2 } from './rest/controllers';

/**
 * Presentation Module
 *
 * Wires up the Presentation layer components (controllers, resolvers)
 * with the Application layer use cases.
 *
 * This module follows the dependency inversion principle by importing
 * PersistenceModule which provides repository implementations.
 */
@Module({
  imports: [PersistenceModule],
  providers: [
    // Use Cases (Application Layer)
    CreateDocumentUseCase,
    GetDocumentUseCase,
    ListDocumentsByOwnerUseCase,
    UpdateDocumentTitleUseCase,
    PublishDocumentUseCase,
    DeleteDocumentUseCase,
    // GraphQL Resolvers
    DocumentsResolverV2,
  ],
  controllers: [DocumentsControllerV2],
  exports: [],
})
export class PresentationModule {}
