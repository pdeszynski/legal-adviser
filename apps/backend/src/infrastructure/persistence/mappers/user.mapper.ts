import { UserAggregate } from '../../../domain/user-management/aggregates';
import {
  UserRoleEnum,
  UserStatusEnum,
} from '../../../domain/user-management/value-objects';
import { UserOrmEntity } from '../entities/user.orm-entity';

/**
 * User Mapper
 *
 * Maps between UserAggregate (domain) and UserOrmEntity (persistence).
 *
 * Infrastructure Layer Pattern:
 * - Converts value objects to primitive types for storage
 * - Reconstitutes aggregates from database records
 * - Handles mapping of complex domain models to flat database schema
 */
export class UserMapper {
  /**
   * Map ORM entity to Domain aggregate
   */
  static toDomain(entity: UserOrmEntity): UserAggregate {
    // Map isActive boolean to UserStatusEnum
    const status = entity.isActive
      ? UserStatusEnum.ACTIVE
      : UserStatusEnum.DEACTIVATED;

    // Default role is CLIENT - this is a simplified mapping
    // In a full implementation, you would have a role column in the database
    const role = UserRoleEnum.CLIENT;

    return UserAggregate.reconstitute(
      entity.id,
      entity.email,
      entity.firstName || '',
      entity.lastName || '',
      role,
      status,
      entity.createdAt,
      entity.updatedAt,
      entity.passwordHash || undefined,
      undefined, // lastLoginAt not tracked in current entity
    );
  }

  /**
   * Map Domain aggregate to ORM entity
   */
  static toPersistence(aggregate: UserAggregate): UserOrmEntity {
    const entity = new UserOrmEntity();

    entity.id = aggregate.id;
    entity.email = aggregate.email.toValue();
    entity.firstName = aggregate.fullName.firstName;
    entity.lastName = aggregate.fullName.lastName;
    entity.isActive = aggregate.status.canLogin();
    entity.passwordHash = aggregate.passwordHash || null;
    entity.createdAt = aggregate.createdAt;
    entity.updatedAt = aggregate.updatedAt;

    // Fields not present in UserAggregate - keep defaults
    entity.username = null;
    entity.disclaimerAccepted = false;
    entity.disclaimerAcceptedAt = null;

    return entity;
  }

  /**
   * Map list of ORM entities to list of Domain aggregates
   */
  static toDomainList(entities: UserOrmEntity[]): UserAggregate[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
