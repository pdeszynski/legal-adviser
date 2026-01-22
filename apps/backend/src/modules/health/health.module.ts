import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AiClientModule } from '../../shared/ai-client/ai-client.module';
import { QUEUE_NAMES } from '../../shared/queues/base/queue-names';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    BullModule.registerQueue({
      name: QUEUE_NAMES.DOCUMENT.GENERATION,
    }),
    AiClientModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
