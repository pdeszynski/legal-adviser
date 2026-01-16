import { LegalDocumentAggregate } from '../../../domain/legal-documents/aggregates';
import {
  DocumentTypeEnum,
  DocumentStatusEnum,
} from '../../../domain/legal-documents/value-objects';
import { LegalDocumentOrmEntity } from '../entities';

/**
 * Mapper for converting between Domain Aggregate and ORM Entity
 *
 * This mapper handles the translation between the rich domain model
 * and the flat persistence model, maintaining clean separation.
 */
export class LegalDocumentMapper {
  /**
   * Convert ORM Entity to Domain Aggregate
   */
  static toDomain(entity: LegalDocumentOrmEntity): LegalDocumentAggregate {
    return LegalDocumentAggregate.reconstitute(
      entity.id,
      entity.title,
      entity.content,
      entity.documentType as DocumentTypeEnum,
      entity.status as DocumentStatusEnum,
      entity.ownerId,
      entity.createdAt,
      entity.updatedAt,
      entity.metadata,
    );
  }

  /**
   * Convert Domain Aggregate to ORM Entity
   */
  static toPersistence(aggregate: LegalDocumentAggregate): LegalDocumentOrmEntity {
    const entity = new LegalDocumentOrmEntity();
    entity.id = aggregate.id;
    entity.title = aggregate.title.toValue();
    entity.content = aggregate.content.text;
    entity.documentType = aggregate.documentType.toValue();
    entity.status = aggregate.status.toValue();
    entity.ownerId = aggregate.ownerId;
    entity.metadata = aggregate.metadata;
    entity.version = aggregate.version;
    entity.createdAt = aggregate.createdAt;
    entity.updatedAt = aggregate.updatedAt;
    return entity;
  }

  /**
   * Convert array of ORM Entities to Domain Aggregates
   */
  static toDomainList(entities: LegalDocumentOrmEntity[]): LegalDocumentAggregate[] {
    return entities.map(this.toDomain);
  }
}
