import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Readable } from 'stream';
import { createHash } from 'crypto';
import { Backup } from '../entities/backup.entity';
import { BackupStorage } from './backup-storage.interface';
import { S3StorageService } from './s3-storage.service';
import { LocalStorageService } from './local-storage.service';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly storage: BackupStorage;
  private readonly dbHost: string;
  private readonly dbPort: number;
  private readonly dbUser: string;
  private readonly dbPassword: string;
  private readonly dbName: string;
  private readonly retentionPolicy: {
    dailyCount: number;
    weeklyCount: number;
    monthlyCount: number;
    retentionDays: number;
  };

  constructor(
    @InjectRepository(Backup)
    private backupRepository: Repository<Backup>,
    private s3Storage: S3StorageService,
    private localStorage: LocalStorageService,
    private configService: ConfigService,
  ) {
    const storageType = this.configService.get<string>(
      'BACKUP_STORAGE_TYPE',
      'local',
    );

    this.storage = storageType === 's3' ? this.s3Storage : this.localStorage;

    this.dbHost = this.configService.get<string>('DB_HOST', 'localhost');
    this.dbPort = this.configService.get<number>('DB_PORT', 5432);
    this.dbUser = this.configService.get<string>('DB_USERNAME', 'postgres');
    this.dbPassword = this.configService.get<string>('DB_PASSWORD', 'postgres');
    this.dbName = this.configService.get<string>('DB_DATABASE', 'legal');

    this.retentionPolicy = {
      dailyCount: this.configService.get<number>('BACKUP_RETENTION_DAILY', 7),
      weeklyCount: this.configService.get<number>('BACKUP_RETENTION_WEEKLY', 4),
      monthlyCount: this.configService.get<number>(
        'BACKUP_RETENTION_MONTHLY',
        12,
      ),
      retentionDays: this.configService.get<number>(
        'BACKUP_RETENTION_DAYS',
        90,
      ),
    };

    this.logger.log(`Backup service initialized with storage: ${storageType}`);
  }

  async createBackup(name?: string): Promise<Backup> {
    const timestamp = new Date();
    const filename = name
      ? `${name}_${timestamp.toISOString()}.dump`
      : `backup_${timestamp.toISOString()}.dump`;
    const key = `${timestamp.getFullYear()}/${String(timestamp.getMonth() + 1).padStart(4, '0')}/${filename}`;

    this.logger.log(`Starting backup: ${filename}`);

    try {
      // Create PostgreSQL dump
      const dumpBuffer = await this.createPostgresDump();

      // Calculate checksum
      const checksum = createHash('sha256').update(dumpBuffer).digest('hex');

      // Upload to storage
      const stream = Readable.from(dumpBuffer);
      const storagePath = await this.storage.upload(key, stream, {
        filename,
        timestamp: timestamp.toISOString(),
        checksum,
      });

      // Get PostgreSQL version
      const pgVersion = await this.getPgVersion();

      // Create backup record
      const backup = new Backup();
      backup.filename = filename;
      backup.storageType = this.configService.get<string>(
        'BACKUP_STORAGE_TYPE',
        'local',
      ) as 's3' | 'local' | 'gcs';
      backup.sizeBytes = dumpBuffer.length;
      backup.metadata = {
        database: this.dbName,
        host: this.dbHost,
        pgVersion,
        compression: 'gzip',
      };
      backup.storagePath = storagePath;
      backup.checksums = [
        {
          algorithm: 'sha256',
          value: checksum,
        },
      ];
      backup.retentionPolicy = this.retentionPolicy;
      backup.status = 'active';
      backup.expiresAt = this.calculateExpiryDate(timestamp);

      await this.backupRepository.save(backup);

      this.logger.log(
        `Backup completed successfully: ${filename} (${dumpBuffer.length} bytes)`,
      );

      // Apply retention policy after backup
      await this.applyRetentionPolicy();

      return backup;
    } catch (error) {
      this.logger.error(`Backup failed: ${error.message}`, error.stack);

      // Record failed backup
      const backup = new Backup();
      backup.filename = filename;
      backup.storageType = this.configService.get<string>(
        'BACKUP_STORAGE_TYPE',
        'local',
      ) as 's3' | 'local' | 'gcs';
      backup.sizeBytes = 0;
      backup.metadata = {
        database: this.dbName,
        host: this.dbHost,
      };
      backup.status = 'failed';

      await this.backupRepository.save(backup);

      throw error;
    }
  }

  async restoreBackup(
    id: string,
    options?: {
      targetDatabase?: string;
      createNewDatabase?: boolean;
      newDatabaseName?: string;
    },
  ): Promise<void> {
    const backup = await this.backupRepository.findOne({ where: { id } });

    if (!backup) {
      throw new Error(`Backup not found: ${id}`);
    }

    if (backup.status !== 'active') {
      throw new Error(`Cannot restore backup with status: ${backup.status}`);
    }

    const targetDb =
      options?.newDatabaseName || options?.targetDatabase || this.dbName;

    this.logger.log(
      `Starting restore from backup: ${backup.filename} to database: ${targetDb}`,
    );

    try {
      // Download backup from storage
      const dumpBuffer = await this.storage.download(backup.storagePath);

      // Create new database if requested
      if (options?.createNewDatabase && options?.newDatabaseName) {
        await this.createDatabase(options.newDatabaseName);
      }

      // Restore PostgreSQL dump
      await this.restorePostgresDump(dumpBuffer, targetDb);

      // Update backup record
      backup.isRestored = true;
      backup.restoreDate = new Date();
      backup.restoreMetadata = {
        targetDatabase: targetDb,
        restoreTime: Date.now(),
      };

      await this.backupRepository.save(backup);

      this.logger.log(
        `Restore completed successfully from backup: ${backup.filename}`,
      );
    } catch (error) {
      this.logger.error(`Restore failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getBackups(limit: number = 50, offset: number = 0): Promise<Backup[]> {
    return this.backupRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getBackupById(id: string): Promise<Backup | null> {
    return this.backupRepository.findOne({ where: { id } });
  }

  async deleteBackup(id: string): Promise<void> {
    const backup = await this.backupRepository.findOne({ where: { id } });

    if (!backup) {
      throw new Error(`Backup not found: ${id}`);
    }

    // Delete from storage
    try {
      await this.storage.delete(backup.storagePath);
    } catch (error) {
      this.logger.warn(
        `Failed to delete backup from storage: ${error.message}`,
      );
    }

    // Delete from database
    await this.backupRepository.remove(backup);

    this.logger.log(`Backup deleted: ${backup.filename}`);
  }

  async getBackupStats(): Promise<{
    totalBackups: number;
    activeBackups: number;
    totalSizeMB: number;
    successfulBackups: number;
    failedBackups: number;
    lastBackupDate: Date | null;
    lastSuccessfulBackupDate: Date | null;
  }> {
    const backups = await this.backupRepository.find();

    const activeBackups = backups.filter((b) => b.status === 'active');
    const failedBackups = backups.filter((b) => b.status === 'failed');
    const totalSizeBytes = activeBackups.reduce(
      (sum, b) => sum + b.sizeBytes,
      0,
    );

    const lastBackup = backups[0];
    const lastSuccessfulBackup = activeBackups.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0];

    return {
      totalBackups: backups.length,
      activeBackups: activeBackups.length,
      totalSizeMB: totalSizeBytes / (1024 * 1024),
      successfulBackups: activeBackups.length,
      failedBackups: failedBackups.length,
      lastBackupDate: lastBackup?.createdAt || null,
      lastSuccessfulBackupDate: lastSuccessfulBackup?.createdAt || null,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledBackup(): Promise<void> {
    this.logger.log('Starting scheduled backup');

    try {
      await this.createBackup('scheduled');
    } catch (error) {
      this.logger.error(
        `Scheduled backup failed: ${error.message}`,
        error.stack,
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async scheduledRetentionCleanup(): Promise<void> {
    this.logger.log('Starting retention policy cleanup');

    try {
      await this.applyRetentionPolicy();
    } catch (error) {
      this.logger.error(
        `Retention cleanup failed: ${error.message}`,
        error.stack,
      );
    }
  }

  private async createPostgresDump(): Promise<Buffer> {
    const pgDumpPath = this.configService.get<string>(
      'PG_DUMP_PATH',
      'pg_dump',
    );

    const command = [
      `PGPASSWORD='${this.dbPassword}'`,
      `${pgDumpPath}`,
      `-h ${this.dbHost}`,
      `-p ${this.dbPort}`,
      `-U ${this.dbUser}`,
      `-d ${this.dbName}`,
      `-F c`, // Custom format
      `-Z 9`, // Maximum compression
      `--no-owner`,
      `--no-acl`,
    ].join(' ');

    const { stdout } = await execAsync(command);

    return Buffer.from(stdout);
  }

  private async restorePostgresDump(
    dumpBuffer: Buffer,
    targetDatabase: string,
  ): Promise<void> {
    const pgRestorePath = this.configService.get<string>(
      'PG_RESTORE_PATH',
      'pg_restore',
    );

    const command = [
      `PGPASSWORD='${this.dbPassword}'`,
      `${pgRestorePath}`,
      `-h ${this.dbHost}`,
      `-p ${this.dbPort}`,
      `-U ${this.dbUser}`,
      `-d ${targetDatabase}`,
      `-c`, // Clean existing database objects
      `--if-exists`,
      `--no-owner`,
      `--no-acl`,
    ].join(' ');

    const { spawn } = require('child_process');

    return new Promise<void>((resolve, reject) => {
      const args = [
        '-h',
        this.dbHost,
        '-p',
        this.dbPort.toString(),
        '-U',
        this.dbUser,
        '-d',
        targetDatabase,
        '-c',
        '--if-exists',
        '--no-owner',
        '--no-acl',
      ];

      const child = spawn(pgRestorePath, args, {
        env: {
          ...process.env,
          PGPASSWORD: this.dbPassword,
        },
      });

      child.stdin.write(dumpBuffer);
      child.stdin.end();

      let stderr = '';

      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('close', (code: number) => {
        if (code !== 0) {
          reject(new Error(`pg_restore failed with code ${code}: ${stderr}`));
        } else {
          resolve();
        }
      });

      child.on('error', (err: Error) => {
        reject(err);
      });
    });
  }

  private async createDatabase(databaseName: string): Promise<void> {
    const { Client } = require('pg');

    const client = new Client({
      host: this.dbHost,
      port: this.dbPort,
      user: this.dbUser,
      password: this.dbPassword,
      database: 'postgres',
    });

    try {
      await client.connect();

      // Terminate existing connections
      await client.query(
        `
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 AND pid <> pg_backend_pid()
      `,
        [databaseName],
      );

      // Drop database if exists
      await client.query(`DROP DATABASE IF EXISTS ${databaseName}`);

      // Create database
      await client.query(`CREATE DATABASE ${databaseName}`);

      this.logger.log(`Database created: ${databaseName}`);
    } finally {
      await client.end();
    }
  }

  private async getPgVersion(): Promise<string> {
    try {
      const { stdout } = await execAsync('pg_dump --version');
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }

  private calculateExpiryDate(backupDate: Date): Date {
    const expiryDate = new Date(backupDate);
    expiryDate.setDate(
      expiryDate.getDate() + this.retentionPolicy.retentionDays,
    );
    return expiryDate;
  }

  private async applyRetentionPolicy(): Promise<void> {
    this.logger.log('Applying retention policy');

    const backups = await this.backupRepository.find({
      where: { status: 'active' },
      order: { createdAt: 'DESC' },
    });

    const now = new Date();
    const toDelete: Backup[] = [];

    // Group by period
    const daily: Backup[] = [];
    const weekly: Backup[] = [];
    const monthly: Backup[] = [];

    for (const backup of backups) {
      const ageInDays = Math.floor(
        (now.getTime() - backup.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Check if expired by max retention
      if (backup.expiresAt && backup.expiresAt < now) {
        toDelete.push(backup);
        continue;
      }

      // Categorize by age
      if (ageInDays < 7) {
        daily.push(backup);
      } else if (ageInDays < 30) {
        weekly.push(backup);
      } else {
        monthly.push(backup);
      }
    }

    // Mark excess backups for deletion
    if (daily.length > this.retentionPolicy.dailyCount) {
      toDelete.push(...daily.slice(this.retentionPolicy.dailyCount));
    }

    if (weekly.length > this.retentionPolicy.weeklyCount) {
      toDelete.push(...weekly.slice(this.retentionPolicy.weeklyCount));
    }

    if (monthly.length > this.retentionPolicy.monthlyCount) {
      toDelete.push(...monthly.slice(this.retentionPolicy.monthlyCount));
    }

    // Delete expired backups
    for (const backup of toDelete) {
      try {
        await this.deleteBackup(backup.id);
        this.logger.log(`Deleted expired backup: ${backup.filename}`);
      } catch (error) {
        this.logger.error(
          `Failed to delete expired backup: ${backup.filename} - ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Retention policy applied: ${toDelete.length} backups deleted`,
    );
  }
}
