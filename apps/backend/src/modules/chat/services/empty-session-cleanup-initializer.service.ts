import {
  Injectable,
  Logger,
  OnModuleInit,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatDataCleanupService } from './chat-data-cleanup.service';

/**
 * One-Time Empty Session Cleanup Service
 *
 * This service runs a one-time cleanup of empty chat sessions when the application starts.
 * It is controlled by the RUN_EMPTY_SESSION_CLEANUP environment variable.
 *
 * To enable the cleanup on startup:
 * - Set RUN_EMPTY_SESSION_CLEANUP=true in environment variables
 * - The cleanup will run once when the module initializes
 * - Set EMPTY_SESSION_CLEANUP_EXECUTE=true to actually perform the cleanup (default: dry run)
 *
 * Usage:
 * ```bash
 * # Dry run (preview only)
 * RUN_EMPTY_SESSION_CLEANUP=true npm run start:backend
 *
 * # Actual cleanup
 * RUN_EMPTY_SESSION_CLEANUP=true EMPTY_SESSION_CLEANUP_EXECUTE=true npm run start:backend
 * ```
 *
 * After the cleanup runs successfully, you can remove the environment variable to prevent
 * it from running again on subsequent starts.
 */
@Injectable()
export class EmptySessionCleanupInitializerService implements OnModuleInit {
  private readonly logger = new Logger(
    EmptySessionCleanupInitializerService.name,
  );
  private readonly runCleanup: boolean;
  private readonly executeCleanup: boolean;
  private readonly cleanupMarkerKey = 'empty_session_cleanup_completed_at';

  constructor(
    private readonly configService: ConfigService,
    private readonly chatDataCleanupService: ChatDataCleanupService,
  ) {
    this.runCleanup =
      this.configService.get<string>('RUN_EMPTY_SESSION_CLEANUP') === 'true';
    this.executeCleanup =
      this.configService.get<string>('EMPTY_SESSION_CLEANUP_EXECUTE') ===
      'true';
  }

  /**
   * Runs on module initialization if cleanup is enabled
   */
  async onModuleInit(): Promise<void> {
    if (!this.runCleanup) {
      this.logger.log(
        'Empty session cleanup is disabled (set RUN_EMPTY_SESSION_CLEANUP=true to enable)',
      );
      return;
    }

    this.logger.log('Starting empty session cleanup...');
    this.logger.log(
      `Execute mode: ${this.executeCleanup ? 'ENABLED' : 'DISABLED (dry run only)'}`,
    );

    try {
      const result =
        await this.chatDataCleanupService.deleteEmptySessionsBatched(
          this.executeCleanup,
        );

      this.logger.log('=== Empty Session Cleanup Summary ===');
      this.logger.log(
        `Total empty sessions found: ${result.totalEmptySessions}`,
      );
      this.logger.log(`Sessions to delete: ${result.deletedSessions}`);
      this.logger.log(`Sessions skipped: ${result.skippedSessions}`);
      this.logger.log(`Affected users: ${result.affectedUsers}`);

      if (result.errors.length > 0) {
        this.logger.warn(`Errors encountered: ${result.errors.length}`);
        for (const error of result.errors) {
          this.logger.warn(`  - ${error.sessionId}: ${error.error}`);
        }
      }

      if (this.executeCleanup) {
        this.logger.log(
          `Cleanup completed at ${new Date().toISOString()}. Remove RUN_EMPTY_SESSION_CLEANUP=true from environment to prevent running again.`,
        );
      } else {
        this.logger.log(
          'Dry run completed. Set EMPTY_SESSION_CLEANUP_EXECUTE=true to perform actual cleanup.',
        );
      }
    } catch (error) {
      this.logger.error(
        `Empty session cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (this.executeCleanup) {
        throw new BadRequestException(
          'Empty session cleanup failed. Check logs for details.',
        );
      }
    }
  }
}
