import { Injectable, Inject } from '@nestjs/common';
import { IUseCase, NotFoundError } from '../../common';
import { DocumentDto } from '../dto';
import type { ILegalDocumentRepository } from '../../../domain/legal-documents/repositories';

/**
 * Input for getting a document by ID
 */
export interface GetDocumentInput {
  readonly documentId: string;
}

/**
 * Use Case: Get a legal document by ID
 *
 * This use case retrieves a single document by its unique identifier.
 */
@Injectable()
export class GetDocumentUseCase
  implements IUseCase<GetDocumentInput, DocumentDto>
{
  constructor(
    @Inject('ILegalDocumentRepository')
    private readonly documentRepository: ILegalDocumentRepository,
  ) {}

  async execute(request: GetDocumentInput): Promise<DocumentDto> {
    const document = await this.documentRepository.findById(request.documentId);

    if (!document) {
      throw new NotFoundError('Document', request.documentId);
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
