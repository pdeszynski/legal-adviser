import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '../../common';
import { DocumentSummaryDto } from '../dto';
import type { ILegalDocumentRepository } from '../../../domain/legal-documents/repositories';
import { DocumentStatusEnum } from '../../../domain/legal-documents/value-objects';

/**
 * Input for listing documents by owner
 */
export interface ListDocumentsByOwnerInput {
  readonly ownerId: string;
  readonly status?: DocumentStatusEnum;
}

/**
 * Use Case: List documents by owner
 *
 * This use case retrieves all documents belonging to a specific owner,
 * optionally filtered by status.
 */
@Injectable()
export class ListDocumentsByOwnerUseCase implements IUseCase<
  ListDocumentsByOwnerInput,
  DocumentSummaryDto[]
> {
  constructor(
    @Inject('ILegalDocumentRepository')
    private readonly documentRepository: ILegalDocumentRepository,
  ) {}

  async execute(
    request: ListDocumentsByOwnerInput,
  ): Promise<DocumentSummaryDto[]> {
    let documents;

    if (request.status) {
      documents = await this.documentRepository.findByOwnerAndStatus(
        request.ownerId,
        request.status,
      );
    } else {
      documents = await this.documentRepository.findByOwnerId(request.ownerId);
    }

    return documents.map((doc) => ({
      id: doc.id,
      title: doc.title.toValue(),
      documentType: doc.documentType.toValue(),
      status: doc.status.toValue(),
      ownerId: doc.ownerId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }
}
