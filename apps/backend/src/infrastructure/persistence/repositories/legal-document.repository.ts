import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { LegalDocumentAggregate } from '../../../domain/legal-documents/aggregates';
import { ILegalDocumentRepository } from '../../../domain/legal-documents/repositories';
import {
  DocumentStatusEnum,
  DocumentTypeEnum,
} from '../../../domain/legal-documents/value-objects';
import { LegalDocumentOrmEntity } from '../entities';
import { LegalDocumentMapper } from '../mappers';

/**
 * TypeORM implementation of ILegalDocumentRepository
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
export class LegalDocumentRepository implements ILegalDocumentRepository {
  constructor(
    @InjectRepository(LegalDocumentOrmEntity)
    private readonly repository: Repository<LegalDocumentOrmEntity>,
  ) {}

  async findById(id: string): Promise<LegalDocumentAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? LegalDocumentMapper.toDomain(entity) : null;
  }

  async save(aggregate: LegalDocumentAggregate): Promise<void> {
    const entity = LegalDocumentMapper.toPersistence(aggregate);
    await this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByOwnerId(ownerId: string): Promise<LegalDocumentAggregate[]> {
    const entities = await this.repository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
    return LegalDocumentMapper.toDomainList(entities);
  }

  async findByStatus(status: DocumentStatusEnum): Promise<LegalDocumentAggregate[]> {
    const entities = await this.repository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
    return LegalDocumentMapper.toDomainList(entities);
  }

  async findByType(type: DocumentTypeEnum): Promise<LegalDocumentAggregate[]> {
    const entities = await this.repository.find({
      where: { documentType: type },
      order: { createdAt: 'DESC' },
    });
    return LegalDocumentMapper.toDomainList(entities);
  }

  async findByOwnerAndStatus(
    ownerId: string,
    status: DocumentStatusEnum,
  ): Promise<LegalDocumentAggregate[]> {
    const entities = await this.repository.find({
      where: { ownerId, status },
      order: { createdAt: 'DESC' },
    });
    return LegalDocumentMapper.toDomainList(entities);
  }

  async search(query: string): Promise<LegalDocumentAggregate[]> {
    const entities = await this.repository.find({
      where: [
        { title: Like(`%${query}%`) },
        { content: Like(`%${query}%`) },
      ],
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return LegalDocumentMapper.toDomainList(entities);
  }
}
