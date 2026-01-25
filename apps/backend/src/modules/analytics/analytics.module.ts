import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { LegalDocument } from '../documents/entities/legal-document.entity';
import { LegalQuery } from '../queries/entities/legal-query.entity';
import { AiUsageRecord } from '../usage-tracking/entities/ai-usage-record.entity';
import { DemoRequestOrmEntity } from '../../infrastructure/persistence/entities/demo-request.orm-entity';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsResolver } from './analytics.resolver';

/**
 * Analytics Module
 *
 * Provides platform-wide analytics and dashboard metrics.
 * Aggregates data from multiple modules for admin monitoring.
 *
 * Bounded Context: Analytics
 * - Dependencies: Users, Documents, Queries, Usage Tracking
 * - Services: AnalyticsService
 * - Resolvers: AnalyticsResolver
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      LegalDocument,
      LegalQuery,
      AiUsageRecord,
      DemoRequestOrmEntity,
    ]),
  ],
  providers: [AnalyticsService, AnalyticsResolver],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
