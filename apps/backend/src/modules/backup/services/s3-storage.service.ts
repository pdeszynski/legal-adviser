import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { BackupStorage, BackupFileInfo } from './backup-storage.interface';

@Injectable()
export class S3StorageService implements BackupStorage {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly prefix: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>(
      'BACKUP_S3_BUCKET',
      'legal-backups',
    );
    this.prefix = this.configService.get<string>(
      'BACKUP_S3_PREFIX',
      'database-backups',
    );

    const region = this.configService.get<string>(
      'BACKUP_S3_REGION',
      'us-east-1',
    );
    const endpoint = this.configService.get<string>('BACKUP_S3_ENDPOINT');

    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      credentials: {
        accessKeyId: this.configService.get<string>(
          'BACKUP_S3_ACCESS_KEY_ID',
          '',
        ),
        secretAccessKey: this.configService.get<string>(
          'BACKUP_S3_SECRET_ACCESS_KEY',
          '',
        ),
      },
      forcePathStyle: !!endpoint, // Required for MinIO and other S3-compatible services
    });

    this.logger.log(
      `S3 Storage initialized with bucket: ${this.bucketName}, prefix: ${this.prefix}`,
    );
  }

  async upload(
    key: string,
    stream: Readable,
    metadata?: Record<string, any>,
  ): Promise<string> {
    const fullKey = this.getFullKey(key);

    try {
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fullKey,
        Body: buffer,
        Metadata: metadata,
      });

      await this.client.send(command);
      this.logger.log(
        `Uploaded backup to S3: ${fullKey} (${buffer.length} bytes)`,
      );

      return fullKey;
    } catch (error) {
      this.logger.error(
        `Failed to upload backup to S3: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async download(key: string): Promise<Buffer> {
    const fullKey = this.getFullKey(key);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fullKey,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        throw new Error('Empty response body from S3');
      }

      const chunks: Buffer[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }

      this.logger.log(`Downloaded backup from S3: ${fullKey}`);
      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error(
        `Failed to download backup from S3: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.getFullKey(key);

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fullKey,
      });

      await this.client.send(command);
      this.logger.log(`Deleted backup from S3: ${fullKey}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete backup from S3: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async list(prefix?: string): Promise<BackupFileInfo[]> {
    const searchPrefix = prefix ? this.getFullKey(prefix) : `${this.prefix}/`;

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: searchPrefix,
      });

      const response = await this.client.send(command);

      return (response.Contents || []).map((item: any) => ({
        key: item.Key!.replace(`${this.prefix}/`, ''),
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
        etag: item.ETag,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to list backups from S3: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fullKey,
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw error;
    }
  }

  async getMetadata(key: string): Promise<Record<string, any> | null> {
    const fullKey = this.getFullKey(key);

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fullKey,
      });

      const response = await this.client.send(command);

      return {
        size: response.ContentLength,
        lastModified: response.LastModified,
        contentType: response.ContentType,
        metadata: response.Metadata,
        etag: response.ETag,
      };
    } catch (error: any) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  private getFullKey(key: string): string {
    return `${this.prefix}/${key}`.replace(/\/+/g, '/');
  }
}
