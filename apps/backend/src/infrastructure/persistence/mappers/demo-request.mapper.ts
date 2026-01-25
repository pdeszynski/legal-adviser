import { DemoRequestAggregate } from '../../../domain/demo-request/aggregates';
import { DemoRequestOrmEntity } from '../entities';

/**
 * Mapper for converting between Domain Aggregate and ORM Entity
 *
 * This mapper handles the translation between the rich domain model
 * and the flat persistence model, maintaining clean separation.
 */
export class DemoRequestMapper {
  /**
   * Convert ORM Entity to Domain Aggregate
   */
  static toDomain(entity: DemoRequestOrmEntity): DemoRequestAggregate {
    return DemoRequestAggregate.reconstitute(
      entity.id,
      entity.fullName,
      entity.email,
      entity.company,
      entity.companySize,
      entity.industry,
      entity.useCase,
      entity.timeline,
      entity.budget,
      entity.preferredDemoTime,
      entity.status,
      entity.hubspotContactId,
      entity.submittedAt,
      entity.contactedAt,
      entity.createdAt,
      entity.updatedAt,
      entity.metadata ?? undefined,
    );
  }

  /**
   * Convert Domain Aggregate to ORM Entity
   */
  static toPersistence(aggregate: DemoRequestAggregate): DemoRequestOrmEntity {
    const entity = new DemoRequestOrmEntity();
    entity.id = aggregate.id;
    entity.fullName = aggregate.fullName.toValue();
    entity.email = aggregate.email.toValue();
    entity.company = aggregate.company?.toValue() ?? null;
    entity.companySize = aggregate.companySize;
    entity.industry = aggregate.industry;
    entity.useCase = aggregate.useCase.toValue();
    entity.timeline = aggregate.timeline;
    entity.budget = aggregate.budget;
    entity.preferredDemoTime = aggregate.preferredDemoTime;
    entity.status = aggregate.status.toValue();
    entity.hubspotContactId = aggregate.hubspotContactId;
    entity.submittedAt = aggregate.createdAt;
    entity.contactedAt = aggregate.contactedAt;
    entity.metadata = aggregate.metadata;
    entity.createdAt = aggregate.createdAt;
    entity.updatedAt = aggregate.updatedAt;
    return entity;
  }

  /**
   * Convert array of ORM Entities to Domain Aggregates
   */
  static toDomainList(
    entities: DemoRequestOrmEntity[],
  ): DemoRequestAggregate[] {
    return entities.map((entity) => DemoRequestMapper.toDomain(entity));
  }
}
