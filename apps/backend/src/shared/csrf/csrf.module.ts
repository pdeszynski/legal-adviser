import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { CsrfService } from './csrf.service';
import { CsrfGuard } from './csrf.guard';
import { CsrfController } from './csrf.controller';

/**
 * CSRF Protection Module
 *
 * Provides CSRF protection for GraphQL mutations using the double-submit cookie pattern.
 *
 * Features:
 * - Automatic CSRF token generation and validation
 * - Global guard for all GraphQL mutations
 * - SameSite cookie protection
 * - Skip decorator for public mutations (login, register)
 *
 * Usage:
 * 1. Import CsrfModule in AppModule
 * 2. Frontend calls GET /api/csrf-token on load
 * 3. Frontend includes token in X-CSRF-Token header for mutations
 * 4. Use @SkipCsrf() decorator on mutations that should be public
 */
@Global()
@Module({
  imports: [ConfigModule],
  controllers: [CsrfController],
  providers: [
    CsrfService,
    CsrfGuard,
    // Register CSRF guard globally
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
  exports: [CsrfService, CsrfGuard],
})
export class CsrfModule {}
