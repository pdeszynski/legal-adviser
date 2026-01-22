import { IRepository } from '../../shared/base';
import { LegalDocumentAggregate } from '../aggregates';
import { DocumentStatusEnum, DocumentTypeEnum } from '../value-objects';

/**
 * Repository interface for Legal Document aggregate
 */
export interface ILegalDocumentRepository extends IRepository<
  LegalDocumentAggregate,
  string
> {
  findByOwnerId(ownerId: string): Promise<LegalDocumentAggregate[]>;
  findByStatus(status: DocumentStatusEnum): Promise<LegalDocumentAggregate[]>;
  findByType(type: DocumentTypeEnum): Promise<LegalDocumentAggregate[]>;
  findByOwnerAndStatus(
    ownerId: string,
    status: DocumentStatusEnum,
  ): Promise<LegalDocumentAggregate[]>;
  search(query: string): Promise<LegalDocumentAggregate[]>;
}
