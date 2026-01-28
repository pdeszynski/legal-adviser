import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession as ChatSessionEntity } from '../entities/chat-session.entity';
import {
  IChatSessionRepository,
  CreateChatSessionData,
  ChatSessionQueryOptions,
  SessionSortBy,
  SortOrder,
} from '../../../domain/chat/repositories/chat-session.repository.interface';
import { ChatSessionAggregate } from '../../../domain/chat/aggregates';

/**
 * TypeORM implementation of Chat Session repository
 *
 * Handles persistence and retrieval of ChatSession aggregates.
 */
@Injectable()
export class ChatSessionRepository implements IChatSessionRepository {
  constructor(
    @InjectRepository(ChatSessionEntity)
    private readonly repository: Repository<ChatSessionEntity>,
  ) {}

  async findById(id: string): Promise<ChatSessionAggregate | null> {
    const entity = await this.repository.findOne({
      where: { id, deletedAt: null as unknown as undefined },
    });

    if (!entity) {
      return null;
    }

    return this.entityToAggregate(entity);
  }

  async save(aggregate: ChatSessionAggregate): Promise<void> {
    const entity = this.aggregateToEntity(aggregate);
    await this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async findByUserId(
    userId: string,
    options: ChatSessionQueryOptions = {},
  ): Promise<ChatSessionAggregate[]> {
    const {
      sortBy = SessionSortBy.LAST_MESSAGE_AT,
      sortOrder = SortOrder.DESC,
      limit,
      offset,
      includeDeleted = false,
      pinnedOnly,
      mode,
    } = options;

    const queryBuilder = this.repository.createQueryBuilder('session');

    queryBuilder.where('session.userId = :userId', { userId });

    if (!includeDeleted) {
      queryBuilder.andWhere('session.deletedAt IS NULL');
    }

    if (pinnedOnly) {
      queryBuilder.andWhere('session.isPinned = :isPinned', { isPinned: true });
    }

    if (mode) {
      queryBuilder.andWhere('session.mode = :mode', { mode });
    }

    // Add sorting
    const order = sortOrder === SortOrder.ASC ? 'ASC' : 'DESC';
    switch (sortBy) {
      case SessionSortBy.LAST_MESSAGE_AT:
        queryBuilder
          .orderBy('session.lastMessageAt', order)
          .addOrderBy('session.createdAt', 'DESC');
        break;
      case SessionSortBy.CREATED_AT:
        queryBuilder.orderBy('session.createdAt', order);
        break;
      case SessionSortBy.UPDATED_AT:
        queryBuilder.orderBy('session.updatedAt', order);
        break;
      case SessionSortBy.MESSAGE_COUNT:
        queryBuilder.orderBy('session.messageCount', order);
        break;
      case SessionSortBy.TITLE:
        queryBuilder.orderBy('session.title', order);
        break;
    }

    if (limit) {
      queryBuilder.limit(limit);
    }

    if (offset) {
      queryBuilder.offset(offset);
    }

    const entities = await queryBuilder.getMany();
    return entities.map((e) => this.entityToAggregate(e));
  }

  async findBySessionId(
    sessionId: string,
    includeDeleted = false,
  ): Promise<ChatSessionAggregate | null> {
    const where: any = { id: sessionId };
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    const entity = await this.repository.findOne({ where });
    if (!entity) {
      return null;
    }

    return this.entityToAggregate(entity);
  }

  async findActiveByUserId(
    userId: string,
    options: ChatSessionQueryOptions = {},
  ): Promise<ChatSessionAggregate[]> {
    return this.findByUserId(userId, {
      ...options,
      includeDeleted: false,
    });
  }

  async findPinnedByUserId(
    userId: string,
    options: ChatSessionQueryOptions = {},
  ): Promise<ChatSessionAggregate[]> {
    return this.findByUserId(userId, {
      ...options,
      pinnedOnly: true,
    });
  }

  async findByMode(
    userId: string,
    mode: string,
    options: ChatSessionQueryOptions = {},
  ): Promise<ChatSessionAggregate[]> {
    return this.findByUserId(userId, {
      ...options,
      mode: mode as any,
    });
  }

  async findRecentlyActive(
    userId: string,
    limit = 10,
  ): Promise<ChatSessionAggregate[]> {
    return this.findByUserId(userId, {
      sortBy: SessionSortBy.LAST_MESSAGE_AT,
      sortOrder: SortOrder.DESC,
      limit,
      includeDeleted: false,
    });
  }

  async create(data: CreateChatSessionData): Promise<ChatSessionAggregate> {
    // Generate a new ID (will be done by database, but we need it for the aggregate)
    const entity = this.repository.create({
      userId: data.userId,
      title: data.title ?? null,
      mode: data.mode as any,
      messageCount: 0,
      lastMessageAt: new Date(),
      isPinned: false,
    });

    const savedEntity = await this.repository.save(entity);
    return this.entityToAggregate(savedEntity);
  }

  async incrementMessageCount(sessionId: string): Promise<void> {
    await this.repository.increment({ id: sessionId }, 'messageCount', 1);
    await this.repository.update(sessionId, {
      lastMessageAt: new Date(),
    });
  }

  async updateLastMessageAt(sessionId: string): Promise<void> {
    await this.repository.update(sessionId, {
      lastMessageAt: new Date(),
    });
  }

  async countByUserId(userId: string, includeDeleted = false): Promise<number> {
    const queryBuilder = this.repository.createQueryBuilder('session');
    queryBuilder.where('session.userId = :userId', { userId });

    if (!includeDeleted) {
      queryBuilder.andWhere('session.deletedAt IS NULL');
    }

    return queryBuilder.getCount();
  }

  async exists(sessionId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id: sessionId, deletedAt: null as unknown as undefined },
    });
    return count > 0;
  }

  async findOrCreate(
    userId: string,
    mode: string,
  ): Promise<ChatSessionAggregate> {
    // Try to find an existing active session for this user and mode
    const existing = await this.repository.findOne({
      where: {
        userId,
        mode: mode as any,
        deletedAt: null as unknown as undefined,
      },
      order: { updatedAt: 'DESC' },
    });

    if (existing) {
      return this.entityToAggregate(existing);
    }

    // Create a new session
    return this.create({ userId, mode: mode as any });
  }

  /**
   * Convert entity to aggregate
   */
  private entityToAggregate(entity: ChatSessionEntity): ChatSessionAggregate {
    return ChatSessionAggregate.reconstitute(
      entity.id,
      entity.userId,
      entity.title,
      entity.mode as any,
      entity.messageCount,
      entity.lastMessageAt,
      entity.isPinned,
      entity.deletedAt,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  /**
   * Convert aggregate to entity
   */
  private aggregateToEntity(
    aggregate: ChatSessionAggregate,
  ): ChatSessionEntity {
    const entity = new ChatSessionEntity();
    entity.id = aggregate.id;
    entity.userId = aggregate.userId;
    entity.title = aggregate.title;
    entity.mode = aggregate.mode as any;
    entity.messageCount = aggregate.messageCount;
    entity.lastMessageAt = aggregate.lastMessageAt;
    entity.isPinned = aggregate.isPinned;
    entity.deletedAt = aggregate.deletedAt;
    entity.createdAt = aggregate.createdAt;
    entity.updatedAt = aggregate.updatedAt;
    return entity;
  }
}
