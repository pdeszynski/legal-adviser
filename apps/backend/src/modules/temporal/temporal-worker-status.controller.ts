/**
 * Temporal Worker Status Controller
 *
 * Provides REST endpoints for checking Temporal worker status.
 * Useful for health checks and monitoring worker connectivity.
 */

import { Controller, Get, Optional } from '@nestjs/common';
import { Public } from '../../modules/auth/decorators/public.decorator';
import { TemporalWorkerService } from './temporal.worker';

/**
 * Worker status response
 */
interface WorkerStatusResponse {
  workers: Array<{
    taskQueue: string;
    running: boolean;
    workerId: string;
    uptimeSeconds: number;
  }>;
  totalWorkers: number;
  runningWorkers: number;
  status: string;
  timestamp: string;
}

/**
 * Temporal Worker Status Controller
 *
 * Provides endpoints for monitoring Temporal worker status.
 */
@Controller('api/temporal')
export class TemporalWorkerStatusController {
  constructor(
    @Optional()
    private readonly workerService?: TemporalWorkerService,
  ) {}

  /**
   * Get worker status
   *
   * Returns the current status of all Temporal workers.
   * Useful for monitoring and debugging worker connectivity.
   *
   * @example
   * ```bash
   * curl http://localhost:3001/api/temporal/worker-status
   * ```
   */
  @Public()
  @Get('worker-status')
  async getWorkerStatus(): Promise<WorkerStatusResponse> {
    if (!this.workerService) {
      return {
        workers: [],
        totalWorkers: 0,
        runningWorkers: 0,
        status: 'Worker service not available',
        timestamp: new Date().toISOString(),
      };
    }

    const workers = this.workerService.getWorkerStatus();
    const runningWorkers = workers.filter((w) => w.running).length;

    let status: string;
    if (workers.length === 0) {
      status = 'No workers configured';
    } else if (runningWorkers === 0) {
      status = 'UNHEALTHY - No workers running';
    } else if (runningWorkers < workers.length) {
      status = 'DEGRADED - Some workers not running';
    } else {
      status = 'HEALTHY - All workers running';
    }

    return {
      workers,
      totalWorkers: workers.length,
      runningWorkers,
      status,
      timestamp: new Date().toISOString(),
    };
  }
}
