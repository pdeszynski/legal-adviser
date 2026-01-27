import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LangfuseService } from './services/langfuse.service';
import { LangfuseResolver } from './langfuse.resolver';

/**
 * Langfuse Module
 *
 * Provides integration with Langfuse for AI trace visualization.
 * Fetches trace data from Langfuse API for admin dashboard.
 *
 * Bounded Context: AI Observability
 * - Dependencies: External Langfuse API
 * - Services: LangfuseService
 * - Resolvers: LangfuseResolver
 */
@Module({
  imports: [HttpModule],
  providers: [LangfuseService, LangfuseResolver],
  exports: [LangfuseService],
})
export class LangfuseModule {}
