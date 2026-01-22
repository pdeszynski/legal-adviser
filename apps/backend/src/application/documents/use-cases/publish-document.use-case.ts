import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IUseCase,
  NotFoundError,
  BusinessRuleViolationError,
} from '../../common';
import { PublishDocumentDto, DocumentDto } from '../dto';
import type { ILegalDocumentRepository } from '../../../domain/legal-documents/repositories';

/**
 * Use Case: Publish a document
 *
 * This use case handles publishing a document:
 * 1. Retrieves the document
 * 2. Validates the document can be published (status transitions)
 * 3. Publishes the document
 * 4. Persists changes
 * 5. Emits domain events
 */
@Injectable()
export class PublishDocumentUseCase implements IUseCase<
  PublishDocumentDto,
  DocumentDto
> {
  constructor(
    @Inject('ILegalDocumentRepository')
    private readonly documentRepository: ILegalDocumentRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: PublishDocumentDto): Promise<DocumentDto> {
    const document = await this.documentRepository.findById(request.documentId);

    if (!document) {
      throw new NotFoundError('Document', request.documentId);
    }

    try {
      // Domain logic - will throw if not allowed
      document.publish(request.publishedBy);
    } catch (error) {
      if (error instanceof Error) {
        throw new BusinessRuleViolationError(error.message);
      }
      throw error;
    }

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
