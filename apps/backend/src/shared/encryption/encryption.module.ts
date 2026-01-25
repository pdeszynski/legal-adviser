import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

/**
 * Encryption Module
 *
 * Global module providing encryption services for sensitive data.
 * Used for encrypting TOTP secrets and other sensitive information.
 */
@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
