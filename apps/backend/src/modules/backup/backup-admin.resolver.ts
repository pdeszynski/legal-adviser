import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { BackupService } from './services/backup.service';
import {
  BackupDTO,
  BackupStatsDTO,
  CreateBackupInput,
  RestoreBackupInput,
} from './dto/backup.dto';
import { Backup } from './entities/backup.entity';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RequireAdmin } from '../auth/guards/role.guard';

/**
 * Backup Admin Resolver
 *
 * Admin-only operations for backup management.
 * All methods require both authentication and admin role.
 *
 * @example
 * @UseGuards(GqlAuthGuard, RoleGuard)
 * @RequireAdmin()
 */
@Resolver(() => BackupDTO)
@UseGuards(GqlAuthGuard)
@RequireAdmin()
export class BackupAdminResolver {
  private readonly logger = new Logger(BackupAdminResolver.name);

  constructor(private backupService: BackupService) {}

  @Query(() => [BackupDTO], {
    name: 'adminBackups',
    description: 'Get all backups (admin only)',
  })
  async getBackups(
    @Args('limit', { nullable: true, defaultValue: 50 }) limit: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<BackupDTO[]> {
    const backups = await this.backupService.getBackups(limit, offset);
    return backups.map((backup) => this.toDTO(backup));
  }

  @Query(() => BackupDTO, {
    name: 'adminBackup',
    nullable: true,
    description: 'Get a backup by ID (admin only)',
  })
  async getBackup(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<BackupDTO | null> {
    const backup = await this.backupService.getBackupById(id);
    return backup ? this.toDTO(backup) : null;
  }

  @Query(() => BackupStatsDTO, {
    name: 'adminBackupStats',
    description: 'Get backup statistics (admin only)',
  })
  async getBackupStats(): Promise<
    ReturnType<typeof BackupAdminResolver.prototype.toStatsDTO>
  > {
    const stats = await this.backupService.getBackupStats();
    return this.toStatsDTO(stats);
  }

  @Mutation(() => BackupDTO, {
    name: 'adminCreateBackup',
    description: 'Create a backup (admin only)',
  })
  async createBackup(
    @Args('input', { nullable: true }) input?: CreateBackupInput,
  ): Promise<BackupDTO> {
    this.logger.log(`Creating backup${input?.name ? `: ${input.name}` : ''}`);

    const backup = await this.backupService.createBackup(input?.name);

    return this.toDTO(backup);
  }

  @Mutation(() => Boolean, {
    name: 'adminRestoreBackup',
    description: 'Restore a backup (admin only)',
  })
  async restoreBackup(
    @Args('input') input: RestoreBackupInput,
  ): Promise<boolean> {
    this.logger.log(`Restoring backup: ${input.id}`);

    await this.backupService.restoreBackup(input.id, {
      targetDatabase: input.targetDatabase,
      createNewDatabase: input.createNewDatabase,
      newDatabaseName: input.newDatabaseName,
    });

    return true;
  }

  @Mutation(() => Boolean, {
    name: 'adminDeleteBackup',
    description: 'Delete a backup (admin only)',
  })
  async deleteBackup(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    this.logger.log(`Deleting backup: ${id}`);

    await this.backupService.deleteBackup(id);

    return true;
  }

  private toDTO(backup: Backup): BackupDTO {
    return {
      id: backup.id,
      filename: backup.filename,
      storageType: backup.storageType,
      sizeBytes: backup.sizeBytes,
      sizeMB: backup.sizeBytes / (1024 * 1024),
      createdAt: backup.createdAt,
      expiresAt: backup.expiresAt,
      status: backup.status,
      restoreDate: backup.restoreDate,
      storagePath: backup.storagePath,
      metadata: backup.metadata,
      isRestored: backup.isRestored,
    };
  }

  private toStatsDTO(stats: {
    totalBackups: number;
    activeBackups: number;
    totalSizeMB: number;
    successfulBackups: number;
    failedBackups: number;
    lastBackupDate: Date | null;
    lastSuccessfulBackupDate: Date | null;
  }) {
    return {
      totalBackups: stats.totalBackups,
      activeBackups: stats.activeBackups,
      totalSizeMB: stats.totalSizeMB,
      successfulBackups: stats.successfulBackups,
      failedBackups: stats.failedBackups,
      lastBackupDate: stats.lastBackupDate,
      lastSuccessfulBackupDate: stats.lastSuccessfulBackupDate,
    };
  }
}
