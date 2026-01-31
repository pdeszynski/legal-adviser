import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { UserRoleEntity } from '../authorization/entities';
import { LegalDocument } from '../documents/entities/legal-document.entity';
import { LegalRuling } from '../documents/entities/legal-ruling.entity';
import { LegalQuery } from '../queries/entities/legal-query.entity';
import { AiUsageRecord } from '../usage-tracking/entities/ai-usage-record.entity';
import { DemoRequest } from '../../infrastructure/persistence/entities/demo-request.entity';
import { ChatSession } from '../chat/entities/chat-session.entity';
import { AnalyticsService } from './services/analytics.service';
import { SaosIndexingAnalyticsService } from './services/saos-indexing-analytics.service';
import { AnalyticsResolver } from './analytics.resolver';
import { AuthorizationModule } from '../authorization/authorization.module';

/**
 * Analytics Module
 *
 * Provides platform-wide analytics and dashboard metrics.
 * Aggregates data from multiple modules for admin monitoring.
 *
 * Bounded Context: Analytics
 * - Dependencies: Users, Documents, Queries, Usage Tracking
 * - Services: AnalyticsService, SaosIndexingAnalyticsService
 * - Resolvers: AnalyticsResolver
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      LegalDocument,
      LegalRuling,
      LegalQuery,
      AiUsageRecord,
      DemoRequest,
      UserRoleEntity,
      ChatSession,
    ]),
  ],
  providers: [
    AnalyticsService,
    SaosIndexingAnalyticsService,
    AnalyticsResolver,
  ],
  exports: [AnalyticsService, SaosIndexingAnalyticsService],
})
export class AnalyticsModule {}
