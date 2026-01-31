import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { LegalDocumentAggregate } from '../../../domain/legal-documents/aggregates';
import { ILegalDocumentRepository } from '../../../domain/legal-documents/repositories';
import {
  DocumentStatusEnum,
  DocumentTypeEnum,
} from '../../../domain/legal-documents/value-objects';
import { LegalDocument } from '../../../modules/documents/entities/legal-document.entity';

/**
 * TypeORM implementation of ILegalDocumentRepository
 *
 * Uses the main LegalDocument entity (CQRS Read Model also used for persistence).
 * This is a simplified DDD approach where TypeORM annotations are acceptable on entities.
 *
 * Maps between LegalDocument entity and LegalDocumentAggregate for write operations.
 *
 * Note: Maps sessionId → ownerId for the DDD layer's domain model.
 */
@Injectable()
export class LegalDocumentRepository implements ILegalDocumentRepository {
  constructor(
    @InjectRepository(LegalDocument)
    private readonly repository: Repository<LegalDocument>,
  ) {}

  async findById(id: string): Promise<LegalDocumentAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(aggregate: LegalDocumentAggregate): Promise<void> {
    const entity = this.toEntity(aggregate);
    await this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findByOwnerId(ownerId: string): Promise<LegalDocumentAggregate[]> {
    // Note: ownerId in DDD layer maps to sessionId in the main entity
    const entities = await this.repository.find({
      where: { sessionId: ownerId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByStatus(
    status: DocumentStatusEnum,
  ): Promise<LegalDocumentAggregate[]> {
    const entities = await this.repository.find({
      where: { status: status as any },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByType(type: DocumentTypeEnum): Promise<LegalDocumentAggregate[]> {
    const entities = await this.repository.find({
      where: { type: type as any },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByOwnerAndStatus(
    ownerId: string,
    status: DocumentStatusEnum,
  ): Promise<LegalDocumentAggregate[]> {
    // Note: ownerId in DDD layer maps to sessionId in the main entity
    const entities = await this.repository.find({
      where: { sessionId: ownerId, status: status as any },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async search(query: string): Promise<LegalDocumentAggregate[]> {
    const entities = await this.repository.find({
      where: [
        { title: Like(`%${query}%`) },
        { contentRaw: Like(`%${query}%`) },
      ],
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return entities.map((e) => this.toDomain(e));
  }

  /**
   * Map LegalDocument entity to LegalDocumentAggregate (for write operations)
   * This is the CQRS write side transformation
   *
   * Note: sessionId → ownerId mapping for DDD layer
   */
  private toDomain(entity: LegalDocument): LegalDocumentAggregate {
    return LegalDocumentAggregate.reconstitute(
      entity.id,
      entity.title,
      entity.contentRaw || '',
      entity.type as unknown as DocumentTypeEnum,
      entity.status as unknown as DocumentStatusEnum,
      entity.sessionId, // sessionId → ownerId for DDD layer
      entity.createdAt,
      entity.updatedAt,
      (entity.metadata as Record<string, unknown>) || undefined,
    );
  }

  /**
   * Map LegalDocumentAggregate to LegalDocument entity (for persistence)
   * This is the CQRS write side transformation
   *
   * Note: ownerId → sessionId mapping for main entity
   */
  private toEntity(aggregate: LegalDocumentAggregate): LegalDocument {
    const entity = new LegalDocument();
    entity.id = aggregate.id;
    entity.title = aggregate.title.toValue();
    entity.contentRaw = aggregate.content.text;
    entity.type = aggregate.documentType.toValue() as unknown as any;
    entity.status = aggregate.status.toValue() as unknown as any;
    entity.sessionId = aggregate.ownerId; // ownerId → sessionId for main entity
    entity.metadata = aggregate.metadata as any;
    entity.createdAt = aggregate.createdAt;
    entity.updatedAt = aggregate.updatedAt;
    return entity;
  }
}
