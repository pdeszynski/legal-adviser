import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiClientService } from './ai-client.service';

/**
 * AI Client Module
 *
 * Provides integration with the AI Engine (FastAPI service).
 * This module handles all communication with the AI service including:
 * - Document generation
 * - Legal Q&A
 * - Case law search
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000, // 30 seconds for AI operations
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [AiClientService],
  exports: [AiClientService],
})
export class AiClientModule {}
