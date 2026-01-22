import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { IUseCase } from '../../common';
import { CreateDocumentDto, CreateDocumentResultDto } from '../dto';
import { LegalDocumentAggregate } from '../../../domain/legal-documents/aggregates';
import type { ILegalDocumentRepository } from '../../../domain/legal-documents/repositories';

/**
 * Use Case: Create a new legal document
 *
 * This use case orchestrates the creation of a new legal document:
 * 1. Validates input data
 * 2. Creates the domain aggregate
 * 3. Persists the aggregate via repository
 * 4. Publishes domain events
 */
@Injectable()
export class CreateDocumentUseCase implements IUseCase<
  CreateDocumentDto,
  CreateDocumentResultDto
> {
  constructor(
    @Inject('ILegalDocumentRepository')
    private readonly documentRepository: ILegalDocumentRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: CreateDocumentDto): Promise<CreateDocumentResultDto> {
    // Generate unique ID for the document
    const documentId = uuidv4();

    // Create the domain aggregate (business rules are enforced here)
    const document = LegalDocumentAggregate.create(
      documentId,
      request.title,
      request.content,
      request.documentType,
      request.ownerId,
      request.metadata,
    );

    // Persist the aggregate
    await this.documentRepository.save(document);

    // Publish domain events
    const domainEvents = document.clearDomainEvents();
    for (const event of domainEvents) {
      this.eventEmitter.emit(event.eventName, event);
    }

    // Return result DTO
    return {
      id: document.id,
      title: document.title.toValue(),
      documentType: document.documentType.toValue(),
      ownerId: document.ownerId,
      createdAt: document.createdAt,
    };
  }
}
