import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
  MoreThanOrEqual,
  Between,
} from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AuditLog,
  AuditActionType,
  AuditResourceType,
  ChangeDetails,
} from './entities/audit-log.entity';
import {
  CreateAuditLogDto,
  QueryAuditLogsDto,
} from './dto/create-audit-log.dto';
import { EVENT_PATTERNS } from '../../shared/events/base/event-patterns';

/**
 * Audit Log Created Event
 *
 * Emitted when a new audit log entry is created.
 */
export class AuditLogCreatedEvent {
  constructor(
    public readonly auditLogId: string,
    public readonly action: AuditActionType,
    public readonly resourceType: AuditResourceType,
    public readonly resourceId: string | null,
    public readonly userId: string | null,
    public readonly createdAt: Date,
  ) {}
}

/**
 * Audit Log Service
 *
 * Provides operations for creating and querying audit log entries.
 * Emits domain events for inter-module communication.
 */
@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new audit log entry
   */
  async create(dto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      action: dto.action,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId || null,
      userId: dto.userId || null,
      ipAddress: dto.ipAddress || null,
      userAgent: dto.userAgent || null,
      statusCode: dto.statusCode || null,
      errorMessage: dto.errorMessage || null,
      changeDetails: dto.changeDetails || null,
    });

    const savedAuditLog = await this.auditLogRepository.save(auditLog);

    // Emit domain event
    this.eventEmitter.emit(
      EVENT_PATTERNS.AUDIT_LOG.CREATED,
      new AuditLogCreatedEvent(
        savedAuditLog.id,
        savedAuditLog.action,
        savedAuditLog.resourceType,
        savedAuditLog.resourceId,
        savedAuditLog.userId,
        savedAuditLog.createdAt,
      ),
    );

    return savedAuditLog;
  }

  /**
   * Log a user action with simplified parameters
   */
  async logAction(
    action: AuditActionType,
    resourceType: AuditResourceType,
    options?: {
      resourceId?: string;
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      statusCode?: number;
      errorMessage?: string;
      changeDetails?: ChangeDetails;
    },
  ): Promise<AuditLog> {
    return this.create({
      action,
      resourceType,
      ...options,
    });
  }

  /**
   * Find an audit log entry by ID
   */
  async findById(id: string): Promise<AuditLog | null> {
    return this.auditLogRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  /**
   * Find an audit log entry by ID or throw
   */
  async findByIdOrFail(id: string): Promise<AuditLog> {
    const auditLog = await this.findById(id);
    if (!auditLog) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }
    return auditLog;
  }

  /**
   * Query audit logs with filters
   */
  async findAll(query?: QueryAuditLogsDto): Promise<AuditLog[]> {
    const where: FindOptionsWhere<AuditLog> = {};

    if (query?.userId) {
      where.userId = query.userId;
    }
    if (query?.action) {
      where.action = query.action;
    }
    if (query?.resourceType) {
      where.resourceType = query.resourceType;
    }
    if (query?.resourceId) {
      where.resourceId = query.resourceId;
    }
    if (query?.ipAddress) {
      where.ipAddress = query.ipAddress;
    }

    return this.auditLogRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: query?.limit || 50,
      skip: query?.offset || 0,
    });
  }

  /**
   * Find audit logs by user ID
   */
  async findByUserId(userId: string, limit = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Find audit logs by resource
   */
  async findByResource(
    resourceType: AuditResourceType,
    resourceId: string,
    limit = 50,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { resourceType, resourceId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Find audit logs by action type
   */
  async findByAction(action: AuditActionType, limit = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { action },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Find audit logs within a time range
   */
  async findByTimeRange(
    startDate: Date,
    endDate: Date,
    limit = 100,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Find recent audit logs
   */
  async findRecent(limit = 20): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Find failed operations
   */
  async findFailedOperations(limit = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        statusCode: MoreThanOrEqual(400),
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Count audit logs by action type
   */
  async countByAction(action: AuditActionType): Promise<number> {
    return this.auditLogRepository.count({ where: { action } });
  }

  /**
   * Count audit logs by resource type
   */
  async countByResourceType(resourceType: AuditResourceType): Promise<number> {
    return this.auditLogRepository.count({ where: { resourceType } });
  }

  /**
   * Count audit logs by user
   */
  async countByUser(userId: string): Promise<number> {
    return this.auditLogRepository.count({ where: { userId } });
  }
}
