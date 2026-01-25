import { Module } from '@nestjs/common';
import { SystemHealthResolver } from './system-health.resolver';
import { SystemHealthService } from './system-health.service';
import { AiClientModule } from '../../shared/ai-client/ai-client.module';
import { SaosModule } from '../../infrastructure/anti-corruption/saos/saos.module';
import { IsapModule } from '../../infrastructure/anti-corruption/isap/isap.module';

@Module({
  imports: [AiClientModule, SaosModule, IsapModule],
  providers: [SystemHealthResolver, SystemHealthService],
  exports: [SystemHealthService],
})
export class SystemHealthModule {}
