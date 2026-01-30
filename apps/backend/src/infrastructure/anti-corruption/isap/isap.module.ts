import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IsapTransformer } from './isap.transformer';
import { IsapAdapter } from './isap.adapter';

/**
 * ISAP Anti-Corruption Layer Module
 *
 * Provides the ISAP integration with proper isolation and transformation.
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  providers: [IsapTransformer, IsapAdapter],
  exports: [IsapTransformer, IsapAdapter],
})
export class IsapModule {}
