import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DemoRequestAggregate } from '../../../domain/demo-request/aggregates';
import { IDemoRequestRepository } from '../../../domain/demo-request/repositories';
import { DemoRequestStatusEnum } from '../../../domain/demo-request/value-objects';
import { DemoRequestOrmEntity } from '../entities';
import { DemoRequestMapper } from '../mappers';

/**
 * TypeORM implementation of IDemoRequestRepository
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
export class DemoRequestRepository implements IDemoRequestRepository {
  constructor(
    @InjectRepository(DemoRequestOrmEntity)
    private readonly repository: Repository<DemoRequestOrmEntity>,
  ) {}

  async findById(id: string): Promise<DemoRequestAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? DemoRequestMapper.toDomain(entity) : null;
  }

  async save(aggregate: DemoRequestAggregate): Promise<void> {
    const entity = DemoRequestMapper.toPersistence(aggregate);
    await this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByEmail(email: string): Promise<DemoRequestAggregate | null> {
    const entity = await this.repository.findOne({
      where: { email: email.toLowerCase() },
      order: { createdAt: 'DESC' },
    });
    return entity ? DemoRequestMapper.toDomain(entity) : null;
  }

  async findByStatus(
    status: DemoRequestStatusEnum,
  ): Promise<DemoRequestAggregate[]> {
    const entities = await this.repository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
    return DemoRequestMapper.toDomainList(entities);
  }

  async findByStatusIn(
    statuses: DemoRequestStatusEnum[],
  ): Promise<DemoRequestAggregate[]> {
    if (statuses.length === 0) {
      return [];
    }
    const entities = await this.repository
      .createQueryBuilder('demoRequest')
      .where('demoRequest.status IN (:...statuses)', { statuses })
      .orderBy('demoRequest.createdAt', 'DESC')
      .getMany();
    return DemoRequestMapper.toDomainList(entities);
  }

  async findByHubspotContactId(
    contactId: string,
  ): Promise<DemoRequestAggregate | null> {
    const entity = await this.repository.findOne({
      where: { hubspotContactId: contactId },
    });
    return entity ? DemoRequestMapper.toDomain(entity) : null;
  }

  async findNewRequests(): Promise<DemoRequestAggregate[]> {
    return this.findByStatus(DemoRequestStatusEnum.NEW);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<DemoRequestAggregate[]> {
    const entities = await this.repository.find({
      where: {
        submittedAt: Between(startDate, endDate),
      },
      order: { submittedAt: 'DESC' },
    });
    return DemoRequestMapper.toDomainList(entities);
  }
}
