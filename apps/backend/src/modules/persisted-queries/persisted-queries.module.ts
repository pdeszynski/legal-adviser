import { Module, Global } from '@nestjs/common';
import { PersistedQueriesService } from './persisted-queries.service';

/**
 * Persisted Queries Module
 *
 * Provides global access to persisted query validation.
 * This module is decorated with @Global to make its providers
 * available throughout the application without needing to import
 * it in every module.
 */
@Global()
@Module({
  providers: [PersistedQueriesService],
  exports: [PersistedQueriesService],
})
export class PersistedQueriesModule {}
