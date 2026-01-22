import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Backup } from './entities/backup.entity';
import { BackupResolver } from './backup.resolver';
import { BackupService } from './services/backup.service';
import { S3StorageService } from './services/s3-storage.service';
import { LocalStorageService } from './services/local-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Backup]), ScheduleModule.forRoot()],
  providers: [
    BackupResolver,
    BackupService,
    S3StorageService,
    LocalStorageService,
  ],
  exports: [BackupService, S3StorageService, LocalStorageService],
})
export class BackupModule {}
