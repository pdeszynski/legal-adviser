import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiEngineTransformer } from './ai-engine.transformer';
import { AiEngineAdapter } from './ai-engine.adapter';

/**
 * AI Engine Anti-Corruption Layer Module
 *
 * Provides the AI Engine integration with proper isolation and transformation.
 */
@Module({
  imports: [HttpModule],
  providers: [AiEngineTransformer, AiEngineAdapter],
  exports: [AiEngineTransformer, AiEngineAdapter],
})
export class AiEngineModule {}
