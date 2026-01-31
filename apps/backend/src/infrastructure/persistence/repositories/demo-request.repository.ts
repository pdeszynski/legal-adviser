import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DemoRequestAggregate } from '../../../domain/demo-request/aggregates';
import { IDemoRequestRepository } from '../../../domain/demo-request/repositories';
import { DemoRequestStatusEnum } from '../../../domain/demo-request/value-objects';
import { DemoRequest } from '../entities';

/**
 * TypeORM implementation of IDemoRequestRepository
 *
 * Uses the DemoRequest entity directly (CQRS Read Model also used for persistence).
 * This is a simplified DDD approach where TypeORM annotations are acceptable on entities.
 *
 * Maps between DemoRequest entity and DemoRequestAggregate for write operations.
 */
@Injectable()
export class DemoRequestRepository implements IDemoRequestRepository {
  constructor(
    @InjectRepository(DemoRequest)
    private readonly repository: Repository<DemoRequest>,
  ) {}

  async findById(id: string): Promise<DemoRequestAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(aggregate: DemoRequestAggregate): Promise<void> {
    const entity = this.toEntity(aggregate);
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
    return entity ? this.toDomain(entity) : null;
  }

  async findByStatus(
    status: DemoRequestStatusEnum,
  ): Promise<DemoRequestAggregate[]> {
    const entities = await this.repository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
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
    return entities.map((e) => this.toDomain(e));
  }

  async findByHubspotContactId(
    contactId: string,
  ): Promise<DemoRequestAggregate | null> {
    const entity = await this.repository.findOne({
      where: { hubspotContactId: contactId },
    });
    return entity ? this.toDomain(entity) : null;
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
    return entities.map((e) => this.toDomain(e));
  }

  /**
   * Map DemoRequest entity to DemoRequestAggregate (for write operations)
   * This is the CQRS write side transformation
   */
  private toDomain(entity: DemoRequest): DemoRequestAggregate {
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
   * Map DemoRequestAggregate to DemoRequest entity (for persistence)
   * This is the CQRS write side transformation
   */
  private toEntity(aggregate: DemoRequestAggregate): DemoRequest {
    const entity = new DemoRequest();
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
}
