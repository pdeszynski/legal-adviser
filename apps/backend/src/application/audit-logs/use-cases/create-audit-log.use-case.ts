import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUseCase } from '../../common';
import {
  CreateAuditLogDto,
  CreateAuditLogResultDto,
} from '../dto/create-audit-log.dto';
import { AuditLog } from '../../../modules/audit-log/entities/audit-log.entity';
import { AuditLogCreatedEvent } from '../events/audit-log-created.event';

/**
 * Use Case: Create Audit Log
 *
 * This use case orchestrates the creation of a new audit log entry:
 * 1. Validates input data (action, resourceType are required)
 * 2. Creates the audit log entity
 * 3. Persists the entity via repository
 * 4. Publishes domain events for inter-module communication
 *
 * Following the layered architecture pattern:
 * - Presentation Layer (Interceptor) → captures GraphQL mutations
 * - Application Layer (This Use Case) → orchestrates the business logic
 * - Infrastructure Layer (Repository) → persists to database
 */
@Injectable()
export class CreateAuditLogUseCase implements IUseCase<
  CreateAuditLogDto,
  CreateAuditLogResultDto
> {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: CreateAuditLogDto): Promise<CreateAuditLogResultDto> {
    // Create the audit log entity
    const auditLog = this.auditLogRepository.create({
      action: request.action,
      resourceType: request.resourceType,
      resourceId: request.resourceId ?? null,
      userId: request.userId ?? null,
      ipAddress: request.ipAddress ?? null,
      userAgent: request.userAgent ?? null,
      statusCode: request.statusCode ?? null,
      errorMessage: request.errorMessage ?? null,
      changeDetails: request.changeDetails ?? null,
    });

    // Persist the entity
    const savedAuditLog = await this.auditLogRepository.save(auditLog);

    // Publish domain event for inter-module communication
    const event = new AuditLogCreatedEvent(
      savedAuditLog.id,
      savedAuditLog.action,
      savedAuditLog.resourceType,
      savedAuditLog.resourceId,
      savedAuditLog.userId,
      savedAuditLog.createdAt,
    );

    this.eventEmitter.emit(event.eventName, event);

    // Return result DTO
    return {
      id: savedAuditLog.id,
      action: savedAuditLog.action,
      resourceType: savedAuditLog.resourceType,
      resourceId: savedAuditLog.resourceId,
      userId: savedAuditLog.userId,
      createdAt: savedAuditLog.createdAt,
    };
  }
}
