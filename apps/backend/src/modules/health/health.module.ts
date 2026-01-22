import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { BullModule } from '@nestjs/bull';
import { AiClientModule } from '../../shared/ai-client/ai-client.module';
import { QUEUE_NAMES } from '../../shared/queues/base/queue-names';

@Module({
  imports: [
    // TypeOrmModule.forRoot() removed - database is now configured globally in DatabaseModule
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
