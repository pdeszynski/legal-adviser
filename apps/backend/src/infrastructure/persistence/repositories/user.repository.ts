import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAggregate } from '../../../domain/user-management/aggregates';
import { IUserRepository } from '../../../domain/user-management/repositories';
import {
  UserRoleEnum,
  UserStatusEnum,
} from '../../../domain/user-management/value-objects';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { UserMapper } from '../mappers/user.mapper';

/**
 * TypeORM implementation of IUserRepository
 *
 * This class implements the repository interface defined in the Domain layer,
 * providing the actual persistence logic using TypeORM.
 *
 * Infrastructure Layer Rules:
 * - Implements interfaces defined in Domain layer
 * - Contains all database-specific logic
 * - Uses mappers to convert between domain and persistence models
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  async findById(id: string): Promise<UserAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async save(aggregate: UserAggregate): Promise<void> {
    const entity = UserMapper.toPersistence(aggregate);
    await this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByEmail(email: string): Promise<UserAggregate | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByRole(role: UserRoleEnum): Promise<UserAggregate[]> {
    // Note: Current schema doesn't have a role column
    // This is a simplified implementation that returns all active users
    // In a full implementation, you would add a role column to the database
    const entities = await this.repository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    return UserMapper.toDomainList(entities);
  }

  async findByStatus(status: UserStatusEnum): Promise<UserAggregate[]> {
    // Map UserStatusEnum to isActive boolean
    const isActive = status === UserStatusEnum.ACTIVE;
    const entities = await this.repository.find({
      where: { isActive },
      order: { createdAt: 'DESC' },
    });
    return UserMapper.toDomainList(entities);
  }

  async findActiveUsers(): Promise<UserAggregate[]> {
    const entities = await this.repository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    return UserMapper.toDomainList(entities);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repository.count({ where: { email } });
    return count > 0;
  }
}
