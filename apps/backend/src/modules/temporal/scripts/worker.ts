#!/usr/bin/env ts-node
/**
 * Temporal Worker Script
 *
 * Runs Temporal workers for processing workflows.
 *
 * Usage:
 *   npm run temporal:worker
 *   npm run temporal:worker -- --task-queue legal-ai-task-queue
 *   npm run temporal:worker -- --dry-run
 *   npm run temporal:worker -- --list-workflows
 *
 * Environment Variables:
 *   TEMPORAL_CLUSTER_URL - Temporal server address (default: localhost:7233)
 *   TEMPORAL_NAMESPACE - Temporal namespace (default: default)
 *   TEMPORAL_TASK_QUEUE - Default task queue (default: legal-ai-task-queue)
 *   TEMPORAL_TLS_ENABLED - Enable TLS (default: false)
 *   TEMPORAL_SERVER_NAME - TLS server name
 *   TEMPORAL_SERVER_ROOT_CA_CERT_PATH - Path to CA certificate
 *   TEMPORAL_CLIENT_CERT_PATH - Path to client certificate
 *   TEMPORAL_CLIENT_PRIVATE_KEY_PATH - Path to client private key
 */

import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';

interface WorkerOptions {
  taskQueue?: string;
  maxConcurrentActivityTaskExecutions?: number;
  maxConcurrentWorkflowTaskExecutions?: number;
  dryRun?: boolean;
  listWorkflows?: boolean;
  workflowsPath?: string;
  // Note: activitiesPath is only used for dry-run logging and path verification
  // The Temporal Worker SDK doesn't support activitiesPath in Worker.create()
  // Activities must be registered via the 'activities' property or embedded in workflows
  activitiesPath?: string;
}

/**
 * Get the absolute path to workflows directory
 *
 * Resolves from the current working directory, supporting both
 * development (src/) and production (dist/) setups.
 */
function getWorkflowsPath(): string {
  // Check if we're in development (src exists) or production (dist exists)
  const srcPath = resolve(__dirname, '../workflows');
  const distPath = resolve(
    __dirname,
    '../../../dist/modules/temporal/workflows',
  );

  // In development, use the source directory with ts-node
  // In production, use the compiled dist directory
  return srcPath;
}

/**
 * Get the absolute path to activities directory
 */
function getActivitiesPath(): string {
  return resolve(__dirname, '../activities');
}

/**
 * List all registered workflows
 */
function listWorkflows(logger: Logger): void {
  logger.log('=== Registered Temporal Workflows ===');
  logger.log('');
  logger.log('Document Workflows:');
  logger.log('  - documentGeneration (task queue: document-processing)');
  logger.log('  - pdfExport (task queue: document-processing)');
  logger.log('');
  logger.log('Notification Workflows:');
  logger.log('  - emailSending (task queue: notification-workflows)');
  logger.log('  - bulkEmailSending (task queue: notification-workflows)');
  logger.log('');
  logger.log('Billing/Ruling Workflows:');
  logger.log('  - rulingIndexing (task queue: billing-workflows)');
  logger.log('  - rulingBackfill (task queue: billing-workflows)');
  logger.log('');
  logger.log('Webhook Workflows:');
  logger.log('  - webhookDelivery (task queue: webhook-workflows)');
  logger.log('  - webhookReplay (task queue: webhook-workflows)');
  logger.log('');
  logger.log('AI Workflows:');
  logger.log('  - aiQueryProcessing (task queue: ai-workflows)');
  logger.log('');
  logger.log('Chat Workflows:');
  logger.log('  - chatCleanup (task queue: legal-ai-task-queue)');
  logger.log('');
  logger.log('=== Total: 10 workflows ===');
  logger.log('');
  logger.log('Task Queues:');
  logger.log('  - legal-ai-task-queue (default)');
  logger.log('  - document-processing');
  logger.log('  - notification-workflows');
  logger.log('  - billing-workflows');
  logger.log('  - webhook-workflows');
  logger.log('  - ai-workflows');
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
        '100',
      10,
    ),
    dryRun: args.includes('--dry-run'),
    listWorkflows: args.includes('--list-workflows'),
    workflowsPath: getArgValue(args, '--workflows-path'),
    activitiesPath: getArgValue(args, '--activities-path'),
  };

  // Handle --list-workflows flag
  if (options.listWorkflows) {
    listWorkflows(logger);
    process.exit(0);
  }

  if (options.dryRun) {
    logger.log('Dry run mode: Worker will not connect to Temporal server');
    logger.log(`Would connect to task queue: ${options.taskQueue}`);
    logger.log(
      `Max concurrent activities: ${options.maxConcurrentActivityTaskExecutions}`,
    );
    logger.log(
      `Max concurrent workflows: ${options.maxConcurrentWorkflowTaskExecutions}`,
    );
    logger.log(
      `Workflows path: ${options.workflowsPath || getWorkflowsPath()}`,
    );
    logger.log(
      `Activities path: ${options.activitiesPath || getActivitiesPath()}`,
    );
    logger.log('');
    logger.log('Run with --list-workflows to see all registered workflows.');
    process.exit(0);
  }

  const clusterUrl =
    config.get<string>('TEMPORAL_CLUSTER_URL') || 'localhost:7233';
  const namespace = config.get<string>('TEMPORAL_NAMESPACE') || 'default';
  const tlsEnabled = config.get<boolean>('TEMPORAL_TLS_ENABLED') || false;
  const workflowsPath = options.workflowsPath || getWorkflowsPath();
  const activitiesPath = options.activitiesPath || getActivitiesPath();

  logger.log('=== Temporal Worker Configuration ===');
  logger.log(`Cluster: ${clusterUrl}`);
  logger.log(`Namespace: ${namespace}`);
  logger.log(`Task queue: ${options.taskQueue}`);
  logger.log(`Workflows path: ${workflowsPath}`);
  logger.log(`Activities path: ${activitiesPath}`);
  logger.log(
    `Max concurrent activities: ${options.maxConcurrentActivityTaskExecutions}`,
  );
  logger.log(
    `Max concurrent workflows: ${options.maxConcurrentWorkflowTaskExecutions}`,
  );
  logger.log(`TLS enabled: ${tlsEnabled}`);
  logger.log('=====================================');

  try {
    // Verify paths exist
    try {
      await fs.access(workflowsPath);
      await fs.access(activitiesPath);
      logger.log('✓ Workflows and activities paths verified');
    } catch (error) {
      logger.error(
        '✗ Failed to access workflows or activities directory:',
        error,
      );
      logger.error(`  Workflows path: ${workflowsPath}`);
      logger.error(`  Activities path: ${activitiesPath}`);
      logger.error('');
      logger.error('Make sure you are running from the correct directory.');
      logger.error(
        'If running from the project root, try: cd apps/backend && npm run temporal:worker',
      );
      process.exit(1);
    }

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

    logger.log('Creating worker...');
    const worker = await Worker.create({
      ...connectionOptions,
      namespace,
      taskQueue: options.taskQueue!,
      workflowsPath,
      maxConcurrentActivityTaskExecutions:
        options.maxConcurrentActivityTaskExecutions,
      maxConcurrentWorkflowTaskExecutions:
        options.maxConcurrentWorkflowTaskExecutions,
    });

    // Log registered workflows and activities
    logger.log('✓ Worker created successfully');
    logger.log(`Listening on task queue: ${options.taskQueue}`);
    logger.log('');
    logger.log('Worker is ready to process workflows.');
    logger.log('Press Ctrl+C to stop.');

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
