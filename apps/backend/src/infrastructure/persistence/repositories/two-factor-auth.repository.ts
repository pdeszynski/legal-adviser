import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TwoFactorAuthAggregate } from '../../../domain/two-factor-auth/aggregates';
import {
  ITwoFactorAuthRepository,
  TotpStatusEnum,
} from '../../../domain/two-factor-auth';
import { TwoFactorAuth } from '../entities/two-factor-auth.entity';

/**
 * TypeORM implementation of ITwoFactorAuthRepository
 *
 * Uses the TwoFactorAuth entity directly (CQRS Read Model also used for persistence).
 * This is a simplified DDD approach where TypeORM annotations are acceptable on entities.
 *
 * Maps between TwoFactorAuth entity and TwoFactorAuthAggregate for write operations.
 */
@Injectable()
export class TwoFactorAuthRepository implements ITwoFactorAuthRepository {
  constructor(
    @InjectRepository(TwoFactorAuth)
    private readonly repository: Repository<TwoFactorAuth>,
  ) {}

  async findById(id: string): Promise<TwoFactorAuthAggregate | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async save(aggregate: TwoFactorAuthAggregate): Promise<void> {
    const entity = this.toEntity(aggregate);
    await this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByUserId(userId: string): Promise<TwoFactorAuthAggregate | null> {
    const entity = await this.repository.findOne({
      where: { userId },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByStatus(
    status: TotpStatusEnum,
  ): Promise<TwoFactorAuthAggregate[]> {
    const entities = await this.repository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
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
    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Map TwoFactorAuth entity to TwoFactorAuthAggregate (for write operations)
   * This is the CQRS write side transformation
   */
  private toDomain(entity: TwoFactorAuth): TwoFactorAuthAggregate {
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
   * Map TwoFactorAuthAggregate to TwoFactorAuth entity (for persistence)
   * This is the CQRS write side transformation
   */
  private toEntity(aggregate: TwoFactorAuthAggregate): TwoFactorAuth {
    const entity = new TwoFactorAuth();
    entity.id = aggregate.id;
    entity.userId = aggregate.userId.toValue();
    entity.secret = aggregate.secret.toValue();
    entity.backupCodes = aggregate.backupCodes.getValues() as string[];
    entity.status = aggregate.status.toValue();
    entity.verifiedAt = aggregate.verifiedAt || null;
    // createdAt/updatedAt managed by TypeORM automatically
    return entity;
  }
}
