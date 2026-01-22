import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiClientService } from './ai-client.service';
import { UsageTrackingModule } from '../../modules/usage-tracking/usage-tracking.module';

/**
 * AI Client Module
 *
 * Provides integration with the AI Engine (FastAPI service).
 * This module handles all communication with the AI service including:
 * - Document generation
 * - Legal Q&A
 * - Case law search
 *
 * Integrates with UsageTrackingModule for automatic usage tracking.
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000, // 30 seconds for AI operations
      maxRedirects: 5,
    }),
    ConfigModule,
    UsageTrackingModule,
  ],
  providers: [AiClientService],
  exports: [AiClientService],
})
export class AiClientModule {}
