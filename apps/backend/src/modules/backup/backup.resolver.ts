import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { BackupService } from './services/backup.service';
import {
  BackupDTO,
  BackupStatsDTO,
  CreateBackupInput,
  RestoreBackupInput,
  UpdateRetentionPolicyInput,
} from './dto/backup.dto';
import { Backup } from './entities/backup.entity';
import { Logger } from '@nestjs/common';

@Resolver(() => BackupDTO)
export class BackupResolver {
  private readonly logger = new Logger(BackupResolver.name);

  constructor(private backupService: BackupService) {}

  @Query(() => [BackupDTO], { name: 'backups' })
  async getBackups(
    @Args('limit', { nullable: true, defaultValue: 50 }) limit: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<BackupDTO[]> {
    const backups = await this.backupService.getBackups(limit, offset);
    return backups.map(this.toDTO);
  }

  @Query(() => BackupDTO, { name: 'backup', nullable: true })
  async getBackup(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<BackupDTO | null> {
    const backup = await this.backupService.getBackupById(id);
    return backup ? this.toDTO(backup) : null;
  }

  @Query(() => BackupStatsDTO, { name: 'backupStats' })
  async getBackupStats(): Promise<
    ReturnType<typeof BackupResolver.prototype.toStatsDTO>
  > {
    const stats = await this.backupService.getBackupStats();
    return this.toStatsDTO(stats);
  }

  @Mutation(() => BackupDTO, { name: 'createBackup' })
  async createBackup(
    @Args('input', { nullable: true }) input?: CreateBackupInput,
  ): Promise<BackupDTO> {
    this.logger.log(`Creating backup${input?.name ? `: ${input.name}` : ''}`);

    const backup = await this.backupService.createBackup(input?.name);

    return this.toDTO(backup);
  }

  @Mutation(() => Boolean, { name: 'restoreBackup' })
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

  @Mutation(() => Boolean, { name: 'deleteBackup' })
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
