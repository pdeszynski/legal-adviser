import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiUsageRecord } from './entities/ai-usage-record.entity';
import { UsageTrackingService } from './services/usage-tracking.service';
import { UsageTrackingResolver } from './usage-tracking.resolver';

/**
 * Usage Tracking Module
 *
 * Handles tracking and monitoring of AI API usage for billing and analytics.
 * Provides services for recording usage events and querying statistics.
 *
 * Bounded Context: Usage Tracking
 * - Aggregates: AiUsageRecord
 * - Services: UsageTrackingService
 * - Resolvers: UsageTrackingResolver
 */
@Module({
  imports: [TypeOrmModule.forFeature([AiUsageRecord])],
  providers: [UsageTrackingService, UsageTrackingResolver],
  exports: [UsageTrackingService],
})
export class UsageTrackingModule {}
