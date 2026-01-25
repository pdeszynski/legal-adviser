import { TwoFactorAuthAggregate } from '../../../domain/two-factor-auth/aggregates';
import { TwoFactorAuthOrmEntity } from '../entities/two-factor-auth.orm-entity';

/**
 * TwoFactorAuth Mapper
 *
 * Maps between TwoFactorAuthAggregate (domain) and TwoFactorAuthOrmEntity (persistence).
 *
 * Infrastructure Layer Pattern:
 * - Converts value objects to primitive types for storage
 * - Reconstitutes aggregates from database records
 * - Handles mapping of complex domain models to flat database schema
 */
export class TwoFactorAuthMapper {
  /**
   * Map ORM entity to Domain aggregate
   */
  static toDomain(entity: TwoFactorAuthOrmEntity): TwoFactorAuthAggregate {
    return TwoFactorAuthAggregate.reconstitute(
      entity.id,
      entity.userId,
      entity.secret,
      entity.backupCodes,
      entity.status,
      entity.createdAt,
      entity.updatedAt,
      entity.verifiedAt || undefined,
    );
  }

  /**
   * Map Domain aggregate to ORM entity
   */
  static toPersistence(
    aggregate: TwoFactorAuthAggregate,
  ): TwoFactorAuthOrmEntity {
    const entity = new TwoFactorAuthOrmEntity();

    entity.id = aggregate.id;
    entity.userId = aggregate.userId.toValue();
    entity.secret = aggregate.secret.toValue();
    entity.backupCodes = aggregate.backupCodes.getValues() as string[];
    entity.status = aggregate.status.toValue();
    entity.verifiedAt = aggregate.verifiedAt || null;
    entity.createdAt = aggregate.createdAt;
    entity.updatedAt = aggregate.updatedAt;

    return entity;
  }

  /**
   * Map list of ORM entities to list of Domain aggregates
   */
  static toDomainList(
    entities: TwoFactorAuthOrmEntity[],
  ): TwoFactorAuthAggregate[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
