#!/usr/bin/env ts-node
/**
 * Temporal Worker Script
 *
 * Runs Temporal workers for processing workflows.
 *
 * Usage:
 *   npm run temporal:worker
 *   npm run temporal:worker -- --task-queue email-processing
 *   npm run temporal:worker -- --dry-run
 */

import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { promises as fs } from 'node:fs';

interface WorkerOptions {
  taskQueue?: string;
  maxConsecutiveWorkflowTaskExecutions?: number;
  maxConcurrentActivityTaskExecutions?: number;
  maxConcurrentWorkflowTaskExecutions?: number;
  dryRun?: boolean;
}

async function runWorker(): Promise<void> {
  const logger = new Logger('TemporalWorker');
  const config = new ConfigService();

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: WorkerOptions = {
    taskQueue:
      getArgValue(args, '--task-queue') ||
      config.get<string>('TEMPORAL_TASK_QUEUE') ||
      'legal-ai-task-queue',
    maxConcurrentActivityTaskExecutions: parseInt(
      getArgValue(args, '--max-activities') ||
        config.get<string>('TEMPORAL_MAX_CONCURRENT_ACTIVITIES') ||
        '100',
      10,
    ),
    maxConcurrentWorkflowTaskExecutions: parseInt(
      getArgValue(args, '--max-workflows') ||
        config.get<string>('TEMPORAL_MAX_CONCURRENT_WORKFLOW_TASKS') ||
        '200',
      10,
    ),
    dryRun: args.includes('--dry-run'),
  };

  if (options.dryRun) {
    logger.log('Dry run mode: Worker will not connect to Temporal server');
    logger.log(`Would connect to task queue: ${options.taskQueue}`);
    logger.log(
      `Max concurrent activities: ${options.maxConcurrentActivityTaskExecutions}`,
    );
    logger.log(
      `Max concurrent workflows: ${options.maxConcurrentWorkflowTaskExecutions}`,
    );
    process.exit(0);
  }

  const clusterUrl =
    config.get<string>('TEMPORAL_CLUSTER_URL') || 'localhost:7233';
  const namespace = config.get<string>('TEMPORAL_NAMESPACE') || 'default';
  const tlsEnabled = config.get<boolean>('TEMPORAL_TLS_ENABLED') || false;

  logger.log(`Starting Temporal worker...`);
  logger.log(`Cluster: ${clusterUrl}`);
  logger.log(`Namespace: ${namespace}`);
  logger.log(`Task queue: ${options.taskQueue}`);

  try {
    // Dynamic import for temporalio (ESM-only package)
    const workerModule = await import('@temporalio/worker');
    const { Worker } = workerModule;

    const connectionOptions: Record<string, unknown> = {
      address: clusterUrl,
    };

    if (tlsEnabled) {
      connectionOptions.tls = {
        serverName: config.get<string>('TEMPORAL_SERVER_NAME'),
        serverRootCACertificate: await fs.readFile(
          config.get<string>('TEMPORAL_SERVER_ROOT_CA_CERT_PATH', ''),
          'utf-8',
        ),
        clientCertPair: {
          crt: await fs.readFile(
            config.get<string>('TEMPORAL_CLIENT_CERT_PATH', ''),
            'utf-8',
          ),
          key: await fs.readFile(
            config.get<string>('TEMPORAL_CLIENT_PRIVATE_KEY_PATH', ''),
            'utf-8',
          ),
        },
      };
    }

    const worker = await Worker.create({
      ...connectionOptions,
      namespace,
      taskQueue: options.taskQueue!,
      maxConcurrentActivityTaskExecutions:
        options.maxConcurrentActivityTaskExecutions,
      maxConcurrentWorkflowTaskExecutions:
        options.maxConcurrentWorkflowTaskExecutions,
    });

    logger.log('Worker started successfully');
    logger.log(`Listening on task queue: ${options.taskQueue}`);

    // Run worker until interrupted
    await worker.run();

    logger.log('Worker stopped');
  } catch (error) {
    logger.error('Worker failed:', error);
    process.exit(1);
  }
}

function getArgValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index >= 0 && index + 1 < args.length) {
    return args[index + 1];
  }
  return undefined;
}

runWorker().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
