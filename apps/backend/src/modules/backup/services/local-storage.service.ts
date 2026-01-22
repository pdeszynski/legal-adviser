import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join, basename } from 'path';
import { Readable } from 'stream';
import { BackupStorage, BackupFileInfo } from './backup-storage.interface';

@Injectable()
export class LocalStorageService implements BackupStorage {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly backupDir: string;

  constructor(private configService: ConfigService) {
    this.backupDir = this.configService.get<string>(
      'BACKUP_LOCAL_PATH',
      join(process.cwd(), 'backups'),
    );

    this.ensureBackupDir();
  }

  private async ensureBackupDir(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      this.logger.log(`Local backup directory ensured: ${this.backupDir}`);
    } catch (error) {
      this.logger.error(
        `Failed to create backup directory: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async upload(
    key: string,
    stream: Readable,
    metadata?: Record<string, any>,
  ): Promise<string> {
    const filePath = this.getFullPath(key);

    try {
      await this.ensureBackupDir();

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      await fs.writeFile(filePath, buffer);

      // Store metadata in a separate file
      if (metadata) {
        const metadataPath = `${filePath}.metadata.json`;
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      }

      this.logger.log(
        `Uploaded backup to local storage: ${filePath} (${buffer.length} bytes)`,
      );
      return key;
    } catch (error) {
      this.logger.error(
        `Failed to upload backup to local storage: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async download(key: string): Promise<Buffer> {
    const filePath = this.getFullPath(key);

    try {
      const buffer = await fs.readFile(filePath);
      this.logger.log(`Downloaded backup from local storage: ${filePath}`);
      return buffer;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`Backup not found: ${key}`);
      }
      this.logger.error(
        `Failed to download backup from local storage: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFullPath(key);
    const metadataPath = `${filePath}.metadata.json`;

    try {
      await fs.unlink(filePath);

      // Try to delete metadata file if it exists
      try {
        await fs.unlink(metadataPath);
      } catch {
        // Ignore if metadata file doesn't exist
      }

      this.logger.log(`Deleted backup from local storage: ${filePath}`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        this.logger.error(
          `Failed to delete backup from local storage: ${error.message}`,
          error.stack,
        );
        throw error;
      }
    }
  }

  async list(prefix?: string): Promise<BackupFileInfo[]> {
    const searchDir = prefix ? this.getFullPath(prefix) : this.backupDir;

    try {
      const files = await fs.readdir(searchDir, { withFileTypes: true });

      const backups: BackupFileInfo[] = [];

      for (const file of files) {
        if (file.isDirectory()) {
          continue;
        }

        // Skip metadata files
        if (file.name.endsWith('.metadata.json')) {
          continue;
        }

        const filePath = join(searchDir, file.name);
        const stats = await fs.stat(filePath);

        backups.push({
          key: prefix ? `${prefix}/${file.name}` : file.name,
          size: stats.size,
          lastModified: stats.mtime,
        });
      }

      return backups;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      this.logger.error(
        `Failed to list backups from local storage: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getFullPath(key);

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(key: string): Promise<Record<string, any> | null> {
    const metadataPath = `${this.getFullPath(key)}.metadata.json`;

    try {
      const content = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  private getFullPath(key: string): string {
    return join(this.backupDir, key);
  }
}
