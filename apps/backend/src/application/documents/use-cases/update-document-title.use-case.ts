import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUseCase, NotFoundError } from '../../common';
import { UpdateDocumentTitleDto, DocumentDto } from '../dto';
import type { ILegalDocumentRepository } from '../../../domain/legal-documents/repositories';

/**
 * Use Case: Update document title
 *
 * This use case handles updating a document's title:
 * 1. Retrieves the document
 * 2. Validates the operation is allowed (domain rules)
 * 3. Updates the title
 * 4. Persists changes
 * 5. Publishes domain events
 */
@Injectable()
export class UpdateDocumentTitleUseCase implements IUseCase<
  UpdateDocumentTitleDto,
  DocumentDto
> {
  constructor(
    @Inject('ILegalDocumentRepository')
    private readonly documentRepository: ILegalDocumentRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: UpdateDocumentTitleDto): Promise<DocumentDto> {
    const document = await this.documentRepository.findById(request.documentId);

    if (!document) {
      throw new NotFoundError('Document', request.documentId);
    }

    // Domain logic - will throw if not allowed
    document.updateTitle(request.title, request.updatedBy);

    // Persist changes
    await this.documentRepository.save(document);

    // Publish domain events
    const domainEvents = document.clearDomainEvents();
    for (const event of domainEvents) {
      this.eventEmitter.emit(event.eventName, event);
    }

    return {
      id: document.id,
      title: document.title.toValue(),
      content: document.content.text,
      documentType: document.documentType.toValue(),
      status: document.status.toValue(),
      ownerId: document.ownerId,
      metadata: document.metadata,
      version: document.version,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}
