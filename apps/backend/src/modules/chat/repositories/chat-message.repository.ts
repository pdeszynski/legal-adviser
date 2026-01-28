import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { ChatMessage as ChatMessageEntity } from '../entities/chat-message.entity';
import {
  IChatMessageRepository,
  ChatMessage,
  CreateChatMessageData,
  ChatMessageListResult,
  ChatMessagePagination,
} from '../../../domain/chat/repositories/chat-message.repository.interface';

/**
 * Chat Message Repository Implementation
 *
 * Infrastructure layer implementation of the chat message repository.
 * Bridges between domain models and database persistence using TypeORM.
 */
@Injectable()
export class ChatMessageRepository implements IChatMessageRepository {
  constructor(
    @InjectRepository(ChatMessageEntity)
    private readonly ormRepository: TypeOrmRepository<ChatMessageEntity>,
  ) {}

  async findById(id: string): Promise<ChatMessage | null> {
    const entity = await this.ormRepository.findOne({
      where: { messageId: id },
    });

    if (!entity) {
      return null;
    }

    return this.toDomain(entity);
  }

  async findBySessionId(
    sessionId: string,
    pagination: ChatMessagePagination = {},
  ): Promise<ChatMessageListResult> {
    const { limit = 50, offset = 0, startFrom, role } = pagination;

    // Build query conditions
    const where: Record<string, unknown> = { sessionId };
    if (role !== undefined) {
      where.role = role;
    }

    // Build the query with sequence order filter if startFrom is provided
    const queryBuilder = this.ormRepository
      .createQueryBuilder('message')
      .where('message.sessionId = :sessionId', { sessionId });

    if (role !== undefined) {
      queryBuilder.andWhere('message.role = :role', { role });
    }

    if (startFrom !== undefined) {
      queryBuilder.andWhere('message.sequenceOrder >= :startFrom', {
        startFrom,
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const entities = await queryBuilder
      .orderBy('message.sequenceOrder', 'ASC')
      .skip(offset)
      .take(limit)
      .getMany();

    return {
      messages: entities.map((e) => this.toDomain(e)),
      total,
      hasMore: offset + entities.length < total,
    };
  }

  async findBySessionAndSequence(
    sessionId: string,
    sequenceOrder: number,
  ): Promise<ChatMessage | null> {
    const entity = await this.ormRepository.findOne({
      where: { sessionId, sequenceOrder },
    });

    if (!entity) {
      return null;
    }

    return this.toDomain(entity);
  }

  async findLatestBySessionId(sessionId: string): Promise<ChatMessage | null> {
    const entity = await this.ormRepository.findOne({
      where: { sessionId },
      order: { sequenceOrder: 'DESC' },
    });

    if (!entity) {
      return null;
    }

    return this.toDomain(entity);
  }

  async getNextSequenceOrder(sessionId: string): Promise<number> {
    const result = await this.ormRepository
      .createQueryBuilder('message')
      .select('MAX(message.sequenceOrder)', 'maxOrder')
      .where('message.sessionId = :sessionId', { sessionId })
      .getRawOne();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return (result?.maxOrder ?? -1) + 1;
  }

  async create(messageData: CreateChatMessageData): Promise<ChatMessage> {
    const entity = this.ormRepository.create({
      sessionId: messageData.sessionId,
      role: messageData.role,
      content: messageData.content,
      rawContent: messageData.rawContent ?? null,
      citations: messageData.citations ?? null,
      metadata: messageData.metadata ?? null,
      sequenceOrder: messageData.sequenceOrder,
    });

    const saved = await this.ormRepository.save(entity);
    return this.toDomain(saved);
  }

  async save(aggregate: ChatMessage): Promise<void> {
    const entity = this.toEntity(aggregate);

    // Check if entity exists
    const existing = await this.ormRepository.findOne({
      where: { messageId: entity.messageId },
    });

    if (existing) {
      await this.ormRepository.save({ ...existing, ...entity });
    } else {
      await this.ormRepository.save(entity);
    }
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete({ messageId: id });
  }

  async deleteBySessionId(sessionId: string): Promise<number> {
    const result = await this.ormRepository.delete({ sessionId });
    return result.affected || 0;
  }

  async countBySessionId(sessionId: string): Promise<number> {
    return this.ormRepository.count({ where: { sessionId } });
  }

  async countBySessionIdAndRole(
    sessionId: string,
    role: string,
  ): Promise<number> {
    return this.ormRepository.count({
      where: { sessionId, role: role as any },
    });
  }

  /**
   * Convert persistence entity to domain model
   */
  private toDomain(entity: ChatMessageEntity): ChatMessage {
    return {
      messageId: entity.messageId,
      sessionId: entity.sessionId,
      role: entity.role,
      content: entity.content,
      rawContent: entity.rawContent,
      citations: entity.citations,
      metadata: entity.metadata,
      sequenceOrder: entity.sequenceOrder,
      createdAt: entity.createdAt,
    };
  }

  /**
   * Convert domain model to persistence entity
   */
  private toEntity(domain: ChatMessage): Partial<ChatMessageEntity> {
    return {
      messageId: domain.messageId,
      sessionId: domain.sessionId,
      role: domain.role,
      content: domain.content,
      rawContent: domain.rawContent,
      citations: domain.citations,
      metadata: domain.metadata,
      sequenceOrder: domain.sequenceOrder,
    };
  }
}
