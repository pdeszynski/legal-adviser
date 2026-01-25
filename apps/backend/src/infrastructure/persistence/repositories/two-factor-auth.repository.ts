import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TwoFactorAuthAggregate } from '../../../domain/two-factor-auth/aggregates';
import {
  ITwoFactorAuthRepository,
  TotpStatusEnum,
} from '../../../domain/two-factor-auth';
import { TwoFactorAuthOrmEntity } from '../entities/two-factor-auth.orm-entity';
import { TwoFactorAuthMapper } from '../mappers/two-factor-auth.mapper';

/**
 * TypeORM implementation of ITwoFactorAuthRepository
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
export class TwoFactorAuthRepository implements ITwoFactorAuthRepository {
  constructor(
    @InjectRepository(TwoFactorAuthOrmEntity)
    private readonly repository: Repository<TwoFactorAuthOrmEntity>,
  ) {}

  async findById(id: string): Promise<TwoFactorAuthAggregate | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });
    return entity ? TwoFactorAuthMapper.toDomain(entity) : null;
  }

  async save(aggregate: TwoFactorAuthAggregate): Promise<void> {
    const entity = TwoFactorAuthMapper.toPersistence(aggregate);
    await this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByUserId(userId: string): Promise<TwoFactorAuthAggregate | null> {
    const entity = await this.repository.findOne({
      where: { userId },
    });
    return entity ? TwoFactorAuthMapper.toDomain(entity) : null;
  }

  async findByStatus(
    status: TotpStatusEnum,
  ): Promise<TwoFactorAuthAggregate[]> {
    const entities = await this.repository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
    return TwoFactorAuthMapper.toDomainList(entities);
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.repository.count({ where: { userId } });
    return count > 0;
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.repository.delete({ userId });
  }

  /**
   * Find by user ID with secret included
   * Use this when you need access to the encrypted TOTP secret
   */
  async findByUserIdWithSecret(
    userId: string,
  ): Promise<TwoFactorAuthAggregate | null> {
    const entity = await this.repository.findOne({
      where: { userId },
      select: [
        'id',
        'userId',
        'secret',
        'backupCodes',
        'status',
        'verifiedAt',
        'createdAt',
        'updatedAt',
      ],
    });
    return entity ? TwoFactorAuthMapper.toDomain(entity) : null;
  }
}
