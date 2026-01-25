import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TotpService } from './totp.service';

/**
 * TOTP Module
 *
 * Global module providing TOTP (Time-based One-Time Password) functionality
 * for two-factor authentication. Can be imported by any module that needs
 * TOTP operations.
 *
 * @example
 * ```typescript
 * import { TotpModule } from '@legal/backend/shared/totp';
 *
 * @Module({
 *   imports: [TotpModule],
 *   // ...
 * })
 * export class AuthModule {}
 * ```
 */
@Global()
@Module({
  providers: [TotpService, ConfigService],
  exports: [TotpService],
})
export class TotpModule {}
