import {
  Field,
  ObjectType,
  InputType,
  ID,
  GraphQLTimestamp,
  Int,
  Float,
} from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  IsBoolean,
  IsDateString,
} from 'class-validator';

@ObjectType('Backup')
export class BackupDTO {
  @Field(() => ID)
  id: string;

  @Field()
  filename: string;

  @Field()
  storageType: string;

  @Field(() => Int)
  sizeBytes: number;

  @Field(() => Float, { description: 'Size in human-readable format (MB)' })
  sizeMB: number;

  @Field(() => GraphQLTimestamp, { nullable: true })
  createdAt: Date;

  @Field(() => GraphQLTimestamp, { nullable: true })
  expiresAt: Date;

  @Field()
  status: string;

  @Field(() => GraphQLTimestamp, { nullable: true })
  restoreDate: Date;

  @Field({ nullable: true })
  storagePath: string;

  @Field(() => BackupMetadata, { nullable: true })
  metadata: {
    database: string;
    host: string;
    pgVersion?: string;
    compression?: string;
  };

  @Field()
  isRestored: boolean;
}

@ObjectType('BackupMetadata')
class BackupMetadata {
  @Field()
  database: string;

  @Field()
  host: string;

  @Field({ nullable: true })
  pgVersion: string;

  @Field({ nullable: true })
  compression: string;
}

@ObjectType('BackupStats')
export class BackupStatsDTO {
  @Field(() => Int)
  totalBackups: number;

  @Field(() => Int)
  activeBackups: number;

  @Field(() => Float)
  totalSizeMB: number;

  @Field(() => Int)
  successfulBackups: number;

  @Field(() => Int)
  failedBackups: number;

  @Field(() => GraphQLTimestamp, { nullable: true })
  lastBackupDate: Date;

  @Field(() => GraphQLTimestamp, { nullable: true })
  lastSuccessfulBackupDate: Date;
}

@InputType('CreateBackupInput')
export class CreateBackupInput {
  @Field({ nullable: true, description: 'Optional custom name for the backup' })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true, description: 'Description of the backup' })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => [String], { nullable: true, description: 'Tags for the backup' })
  @IsOptional()
  tags?: string[];
}

@InputType('RestoreBackupInput')
export class RestoreBackupInput {
  @Field(() => ID)
  id: string;

  @Field({
    nullable: true,
    description: 'Target database name (defaults to current)',
  })
  @IsOptional()
  @IsString()
  targetDatabase?: string;

  @Field({
    nullable: true,
    description: 'Create a new database instead of overwriting',
  })
  @IsOptional()
  @IsBoolean()
  createNewDatabase?: boolean;

  @Field({
    nullable: true,
    description: 'New database name if createNewDatabase is true',
  })
  @IsOptional()
  @IsString()
  newDatabaseName?: string;
}

@InputType('UpdateRetentionPolicyInput')
export class UpdateRetentionPolicyInput {
  @Field(() => Int, {
    nullable: true,
    description: 'Number of daily backups to keep',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyCount?: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Number of weekly backups to keep',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weeklyCount?: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Number of monthly backups to keep',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyCount?: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Maximum retention days for any backup',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  retentionDays?: number;
}
