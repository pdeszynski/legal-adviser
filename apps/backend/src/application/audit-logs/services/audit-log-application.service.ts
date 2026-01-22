import { Injectable } from '@nestjs/common';
import { CreateAuditLogUseCase } from '../use-cases/create-audit-log.use-case';
import {
  CreateAuditLogDto,
  CreateAuditLogResultDto,
} from '../dto/create-audit-log.dto';

/**
 * Audit Log Application Service
 *
 * Orchestrates use cases for audit logging functionality.
 * Acts as a facade for the presentation layer (interceptors, controllers, resolvers)
 * to interact with audit log use cases.
 *
 * Following the Application Service pattern:
 * - Coordinates multiple use cases if needed
 * - Handles application-level error handling
 * - Provides a clean API for the presentation layer
 */
@Injectable()
export class AuditLogApplicationService {
  constructor(private readonly createAuditLogUseCase: CreateAuditLogUseCase) {}

  /**
   * Create a new audit log entry
   *
   * @param dto - Audit log data to persist
   * @returns The created audit log with ID and timestamp
   */
  async createAuditLog(
    dto: CreateAuditLogDto,
  ): Promise<CreateAuditLogResultDto> {
    return this.createAuditLogUseCase.execute(dto);
  }
}
