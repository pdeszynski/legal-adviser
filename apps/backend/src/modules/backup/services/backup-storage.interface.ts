import { Readable } from 'stream';

export interface BackupStorage {
  /**
   * Upload a backup file
   * @param key Storage key/path for the backup
   * @param stream Readable stream of the backup file
   * @param metadata Optional metadata to attach
   */
  upload(
    key: string,
    stream: Readable,
    metadata?: Record<string, any>,
  ): Promise<string>;

  /**
   * Download a backup file
   * @param key Storage key/path for the backup
   */
  download(key: string): Promise<Buffer>;

  /**
   * Delete a backup file
   * @param key Storage key/path for the backup
   */
  delete(key: string): Promise<void>;

  /**
   * List all backups
   * @param prefix Optional prefix to filter results
   */
  list(prefix?: string): Promise<BackupFileInfo[]>;

  /**
   * Check if a backup exists
   * @param key Storage key/path for the backup
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get backup metadata
   * @param key Storage key/path for the backup
   */
  getMetadata(key: string): Promise<Record<string, any> | null>;
}

export interface BackupFileInfo {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
}
