import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('backups')
export class Backup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  filename: string;

  @Column()
  @Index()
  storageType: 's3' | 'local' | 'gcs';

  @Column({ type: 'bigint' })
  sizeBytes: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    database: string;
    host: string;
    pgVersion?: string;
    compression?: string;
  };

  @Column({ default: false })
  isRestored: boolean;

  @Column({ nullable: true })
  restoreDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  restoreMetadata: {
    restoredBy?: string;
    restoreTime?: number;
    targetDatabase?: string;
  };

  @Column({ default: 'active' })
  status: 'active' | 'expired' | 'failed';

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  retentionPolicy: {
    dailyCount?: number;
    weeklyCount?: number;
    monthlyCount?: number;
    retentionDays?: number;
  };

  @Column({ nullable: true })
  storagePath: string;

  @Column({ type: 'jsonb', nullable: true })
  checksums: {
    algorithm: string;
    value: string;
  }[];

  @CreateDateColumn()
  createdAt: Date;
}
