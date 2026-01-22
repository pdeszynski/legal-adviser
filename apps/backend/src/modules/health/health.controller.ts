import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { HealthService, HealthCheckResult } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async check(): Promise<HealthCheckResult> {
    return this.healthService.getHealth();
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  liveness(): { status: string } {
    return { status: 'alive' };
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async readiness(): Promise<{ status: string }> {
    const health = await this.healthService.getHealth();

    if (health.status === 'unhealthy') {
      throw new Error('Service not ready');
    }

    return { status: 'ready' };
  }
}
