import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUseCaseNoOutput, NotFoundError, BusinessRuleViolationError } from '../../common';
import { DeleteDocumentDto } from '../dto';
import type { ILegalDocumentRepository } from '../../../domain/legal-documents/repositories';

/**
 * Use Case: Delete a document (soft delete)
 *
 * This use case handles document deletion:
 * 1. Retrieves the document
 * 2. Validates the document can be deleted (status transitions)
 * 3. Marks the document as deleted
 * 4. Persists changes
 * 5. Emits domain events
 */
@Injectable()
export class DeleteDocumentUseCase
  implements IUseCaseNoOutput<DeleteDocumentDto>
{
  constructor(
    @Inject('ILegalDocumentRepository')
    private readonly documentRepository: ILegalDocumentRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: DeleteDocumentDto): Promise<void> {
    const document = await this.documentRepository.findById(request.documentId);

    if (!document) {
      throw new NotFoundError('Document', request.documentId);
    }

    try {
      // Domain logic - will throw if not allowed
      document.delete(request.deletedBy, request.reason);
    } catch (error) {
      if (error instanceof Error) {
        throw new BusinessRuleViolationError(error.message);
      }
      throw error;
    }

    // Persist changes (soft delete by updating status)
    await this.documentRepository.save(document);

    // Publish domain events
    const domainEvents = document.clearDomainEvents();
    for (const event of domainEvents) {
      this.eventEmitter.emit(event.eventName, event);
    }
  }
}
