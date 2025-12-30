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

    for (const queueName of queueNames) {
      try {
        const queue = app.get<Queue>(getQueueToken(queueName), {
          strict: false,
        });
        if (queue) {
          queues.push(queue);
        }
      } catch {
        // Queue not registered yet, skip it
        // This is expected for queues that haven't been registered in any module
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
  } catch (error: unknown) {
    // Silently fail if Bull Board setup fails (e.g., queues not registered yet)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.warn('Bull Board setup skipped:', errorMessage);
  }
}
