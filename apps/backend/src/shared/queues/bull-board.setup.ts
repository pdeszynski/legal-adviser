import { NestExpressApplication } from '@nestjs/platform-express';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { QUEUE_NAMES } from './base/queue-names';

/**
 * Setup Bull Board for queue monitoring
 *
 * This function sets up a web UI for monitoring Bull queues.
 * Only enabled in development environment.
 *
 * Access the board at: http://localhost:PORT/admin/queues
 *
 * @param app - NestJS Express application instance
 */
export function setupBullBoard(app: NestExpressApplication) {
  // Temporarily disabled until queues are registered in modules
  // TODO: Re-enable when queue modules are implemented
  console.debug('Bull Board setup skipped - no queues registered yet');
  void app;
  return;

  // Only enable Bull Board in development
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  try {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    // Get all registered queues from the application context
    const queues: Queue[] = [];
    const queueNames = [
      QUEUE_NAMES.DOCUMENT.GENERATION,
      QUEUE_NAMES.DOCUMENT.EXPORT_PDF,
      QUEUE_NAMES.EMAIL.SEND,
      QUEUE_NAMES.NOTIFICATION.PUSH,
      QUEUE_NAMES.AI.PROCESS_QUERY,
      QUEUE_NAMES.AI.GENERATE_DOCUMENT,
    ];

    // Try to get queues, but skip any that aren't registered
    // Note: We use resolve() which returns undefined instead of throwing
    for (const queueName of queueNames) {
      try {
        const queueToken = getQueueToken(queueName);
        const queue = app.get<Queue>(queueToken, { strict: false });
        if (queue) {
          queues.push(queue);
        }
      } catch (e) {
        // Queue not registered yet, skip it silently
        // This is expected for queues that haven't been registered in any module
        void e;
      }
    }

    if (queues.length === 0) {
      // No queues registered yet, skip Bull Board setup
      return;
    }

    createBullBoard({
      queues: queues.map((queue) => new BullAdapter(queue)),
      serverAdapter,
    });

    app.use('/admin/queues', serverAdapter.getRouter());

    console.log(
      `📊 Bull Board available at http://localhost:${process.env.PORT ?? 3000}/admin/queues`,
    );
  } catch (err) {
    // Silently fail if Bull Board setup fails (e.g., queues not registered yet)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.warn('Bull Board setup skipped:', errorMessage);
  }
}
