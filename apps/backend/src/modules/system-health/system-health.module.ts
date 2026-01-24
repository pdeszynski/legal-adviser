import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SystemHealthResolver } from './system-health.resolver';
import { SystemHealthService } from './system-health.service';
import { AiClientModule } from '../../shared/ai-client/ai-client.module';
import { QUEUE_NAMES } from '../../shared/queues/base/queue-names';
import { SaosModule } from '../../infrastructure/anti-corruption/saos/saos.module';
import { IsapModule } from '../../infrastructure/anti-corruption/isap/isap.module';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.DOCUMENT.GENERATION,
      },
      {
        name: QUEUE_NAMES.EMAIL.SEND,
      },
      {
        name: QUEUE_NAMES.WEBHOOK.DELIVER,
      },
    ),
    AiClientModule,
    SaosModule,
    IsapModule,
  ],
  providers: [SystemHealthResolver, SystemHealthService],
  exports: [SystemHealthService],
})
export class SystemHealthModule {}
