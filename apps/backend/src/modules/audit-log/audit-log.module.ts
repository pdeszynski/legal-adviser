import { Module } from '@nestjs/common';
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogInput } from './dto/audit-log.types';

/**
 * Audit Log Module
 *
 * Provides audit logging functionality for tracking user actions.
 * Exposes GraphQL queries for reading audit logs (read-only operations).
 *
 * Uses nestjs-query for auto-generated CRUD operations:
 * - auditLogs: Query all audit logs with filtering, sorting, paging
 * - auditLog: Query single audit log by ID
 *
 * Mutations are disabled as audit logs should only be created internally.
 * Use AuditLogService for creating new audit log entries.
 */
@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypeOrmModule.forFeature([AuditLog])],
      resolvers: [
        {
          DTOClass: AuditLog,
          EntityClass: AuditLog,
          CreateDTOClass: CreateAuditLogInput,
          enableTotalCount: true,
          enableAggregate: true,
          read: {
            // Enable read operations for querying audit logs
            many: { name: 'auditLogs' },
            one: { name: 'auditLog' },
          },
          create: {
            // Disable create mutations - audit logs created via service only
            one: { disabled: true },
            many: { disabled: true },
          },
          update: {
            // Disable update mutations - audit logs are immutable
            one: { disabled: true },
            many: { disabled: true },
          },
          delete: {
            // Disable delete mutations - audit logs should not be deleted
            one: { disabled: true },
            many: { disabled: true },
          },
        },
      ],
    }),
  ],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
