import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAggregate } from '../../../domain/user-management/aggregates';
import { IUserRepository } from '../../../domain/user-management/repositories';
import {
  UserRoleEnum,
  UserStatusEnum,
} from '../../../domain/user-management/value-objects';
import { User } from '../../../modules/users/entities/user.entity';

/**
 * TypeORM implementation of IUserRepository
 *
 * Uses the User entity directly (CQRS Read Model also used for persistence).
 * This is a simplified DDD approach where TypeORM annotations are acceptable on entities.
 *
 * Maps between User entity and UserAggregate for write operations.
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findById(id: string): Promise<UserAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(aggregate: UserAggregate): Promise<void> {
    const entity = this.toEntity(aggregate);
    await this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByEmail(email: string): Promise<UserAggregate | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByRole(role: UserRoleEnum): Promise<UserAggregate[]> {
    const entities = await this.repository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByStatus(status: UserStatusEnum): Promise<UserAggregate[]> {
    const isActive = status === UserStatusEnum.ACTIVE;
    const entities = await this.repository.find({
      where: { isActive },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findActiveUsers(): Promise<UserAggregate[]> {
    const entities = await this.repository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repository.count({ where: { email } });
    return count > 0;
  }

  /**
   * Map User entity to UserAggregate (for write operations)
   * This is the CQRS write side transformation
   */
  private toDomain(entity: User): UserAggregate {
    const status = entity.isActive
      ? UserStatusEnum.ACTIVE
      : UserStatusEnum.DEACTIVATED;

    return UserAggregate.reconstitute(
      entity.id,
      entity.email,
      entity.firstName || '',
      entity.lastName || '',
      UserRoleEnum.CLIENT, // Default - role management handled by authorization module
      status,
      entity.createdAt,
      entity.updatedAt,
      entity.passwordHash || undefined,
      undefined, // lastLoginAt not tracked
    );
  }

  /**
   * Map UserAggregate to User entity (for persistence)
   * This is the CQRS write side transformation
   */
  private toEntity(aggregate: UserAggregate): User {
    const entity = new User();
    entity.id = aggregate.id;
    entity.email = aggregate.email.toValue();
    entity.firstName = aggregate.fullName.firstName;
    entity.lastName = aggregate.fullName.lastName;
    entity.isActive = aggregate.status.canLogin();
    entity.passwordHash = aggregate.passwordHash || null;
    // createdAt/updatedAt managed by TypeORM automatically
    return entity;
  }
}
