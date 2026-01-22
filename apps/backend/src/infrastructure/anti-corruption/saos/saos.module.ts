import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SaosTransformer } from './saos.transformer';
import { SaosAdapter } from './saos.adapter';

/**
 * SAOS Anti-Corruption Layer Module
 *
 * Provides the SAOS integration with proper isolation and transformation.
 */
@Module({
  imports: [HttpModule],
  providers: [SaosTransformer, SaosAdapter],
  exports: [SaosTransformer, SaosAdapter],
})
export class SaosModule {}
