/**
 * Temporal Interfaces
 *
 * Defines TypeScript interfaces for Temporal configuration,
 * workflow options, and worker settings.
 */

import type { ModuleMetadata } from '@nestjs/common';

/**
 * Temporal Module Configuration
 *
 * Configuration options for the Temporal module, loaded from environment variables.
 */
export interface TemporalModuleConfig {
  /** Temporal server address (host:port) */
  clusterUrl: string;
  /** Temporal namespace to use */
  namespace: string;
  /** Client connection timeout in milliseconds */
  clientTimeout: number;
  /** Default task queue name */
  taskQueue: string;
  /** Whether TLS is enabled for secure connections */
  tlsEnabled: boolean;
  /** Server name for TLS certificate validation */
  serverName?: string;
  /** Path to server root CA certificate */
  serverRootCaCertPath?: string;
  /** Path to client certificate for mTLS */
  clientCertPath?: string;
  /** Path to client private key for mTLS */
  clientPrivateKeyPath?: string;
}

/**
 * Temporal Module Options (Internal)
 *
 * Extended options used internally by the module.
 */
export type TemporalModuleOptions = TemporalModuleConfig;

/**
 * Temporal Module Async Options
 *
 * Configuration for async module registration using useFactory.
 */
export interface TemporalModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  /** Factory function to create module options */
  useFactory: (
    ...args: unknown[]
  ) => Promise<TemporalModuleConfig> | TemporalModuleConfig;
  /** Dependencies for the factory function */
  inject?: Array<new (...args: unknown[]) => unknown>;
}

/**
 * Workflow Execution Options
 *
 * Options for starting a new workflow execution.
 */
export interface WorkflowExecutionOptions {
  /** Unique identifier for this workflow execution */
  workflowId: string;
  /** Task queue to dispatch the workflow to */
  taskQueue?: string;
  /** How long the workflow is allowed to run */
  workflowExecutionTimeout?: number | string;
  /** How long a single workflow task is allowed to take */
  workflowTaskTimeout?: number | string;
  /** Whether this workflow should follow an existing one */
  followPreviousRuns?: boolean;
}

/**
 * Workflow Start Options
 *
 * Extended options with specific retry and signal handling.
 */
export interface WorkflowStartOptions extends WorkflowExecutionOptions {
  /** Number of seconds before the first retry */
  retryInitialInterval?: number;
  /** Maximum backoff interval between retries */
  retryMaximumInterval?: number;
  /** Maximum number of retry attempts */
  retryMaximumAttempts?: number;
  /** Non-retryable error types */
  retryNonRetryableErrorTypes?: string[];
  /** Additional metadata for observability */
  metadata?: Record<string, unknown>;
}

/**
 * Temporal Client Factory Options
 *
 * Options passed to the Temporal client when creating a connection.
 */
export interface TemporalClientOptions {
  /** Module configuration */
  config: TemporalModuleConfig;
  /** Logger for connection events */
  logger?: Console;
  /** Connection options for the Temporal client */
  connectionOptions?: Record<string, unknown>;
}

/**
 * Worker Pool Options
 *
 * Configuration options for creating a pool of Temporal workers.
 */
export interface WorkerPoolOptions {
  /** Number of workers to create */
  workerCount?: number;
  /** Maximum concurrent workflow tasks per worker */
  maxConcurrentWorkflowTasks?: number;
  /** Maximum concurrent activities per worker */
  maxConcurrentActivities?: number;
  /** Maximum concurrent local activities per worker */
  maxConcurrentLocalActivities?: number;
  /** Task queue name (default to module default) */
  taskQueue?: string;
  /** Enable sticky workflow caching */
  enableStickyWorkflow?: boolean;
  /** Sticky queue schedule to start timeout */
  stickyQueueScheduleToStartTimeout?: number;
  /** Path to workflows directory */
  workflowsPath: string;
  /** Path to activities directory (optional) */
  activitiesPath?: string;
}

/**
 * Workflow Registration Entry
 *
 * Represents a registered workflow with its path and constructor.
 */
export interface WorkflowRegistration {
  /** Workflow name/key */
  name: string;
  /** File path to the workflow implementation */
  path: string;
  /** Workflow constructor function */
  workflow: unknown;
}

/**
 * Activity Registration Entry
 *
 * Represents a registered activity with its path and implementation.
 */
export interface ActivityRegistration {
  /** Activity name/key */
  name: string;
  /** File path to the activity implementation */
  path: string;
  /** Activity implementation function */
  activity: unknown;
}

/**
 * Temporal Health Check Result
 *
 * Result of a Temporal connection health check.
 */
export interface TemporalHealthResult {
  /** Whether the connection is healthy */
  healthy: boolean;
  /** Connection latency in milliseconds */
  latency: number;
  /** Error message if unhealthy */
  error?: string;
  /** Connected namespace */
  namespace?: string;
}

/**
 * Schedule Execution Result
 *
 * Result of a scheduled action execution.
 */
export interface ScheduleExecutionResult {
  /** Time that the Action was scheduled for */
  scheduledAt: Date;
  /** Time that the Action was actually taken */
  takenAt: Date;
  /** The workflow that was started */
  workflow?: {
    workflowId: string;
    firstExecutionRunId: string;
  };
}

/**
 * Schedule Action Description
 *
 * Description of the action a schedule takes.
 */
export interface ScheduleActionDescription {
  /** Action type (currently only 'startWorkflow' is supported) */
  type: 'startWorkflow';
  /** Workflow type name */
  workflowType: string;
  /** Workflow ID to use when starting */
  workflowId?: string;
  /** Task queue for the workflow */
  taskQueue?: string;
  /** Arguments to pass to the workflow */
  args?: unknown[];
}

/**
 * Schedule Spec Description
 *
 * Description of when a schedule triggers.
 */
export interface ScheduleSpecDescription {
  /** Cron expressions for the schedule */
  cronExpressions?: string[];
  /** Calendar-based specifications of times */
  calendars?: unknown[];
  /** Interval-based specifications of times */
  intervals?: unknown[];
  /** Any matching times will be skipped */
  skip?: unknown[];
  /** Jitter in milliseconds */
  jitter?: number;
  /** Start time for the schedule */
  startAt?: Date;
  /** End time for the schedule */
  endAt?: Date;
  /** IANA timezone name */
  timezone?: string;
}

/**
 * Schedule State
 *
 * Current state of a schedule.
 */
export interface ScheduleState {
  /** Whether Schedule is currently paused */
  paused: boolean;
  /** Informative human-readable message with contextual notes */
  note?: string;
  /** The Actions remaining in this Schedule */
  remainingActions?: number;
}

/**
 * Schedule Info
 *
 * Runtime information about a schedule.
 */
export interface ScheduleInfo {
  /** Most recent actions started */
  recentActions: ScheduleExecutionResult[];
  /** Next upcoming scheduled times */
  nextActionTimes: Date[];
  /** Number of Actions taken so far */
  numActionsTaken: number;
  /** Number of times a scheduled Action was skipped due to missing catchup window */
  numActionsMissedCatchupWindow: number;
  /** Number of Actions skipped due to overlap */
  numActionsSkippedOverlap: number;
  /** When the schedule was created */
  createdAt: Date;
  /** When the schedule was last updated */
  lastUpdatedAt?: Date;
  /** Currently-running workflows started by this schedule */
  runningActions: Array<{ type: string; workflow?: { workflowId: string } }>;
}

/**
 * Schedule Description
 *
 * Detailed description of a Temporal schedule as returned by describeSchedule.
 */
export interface ScheduleDescription {
  /** The Schedule ID */
  scheduleId: string;
  /** When will Actions be taken */
  spec: ScheduleSpecDescription;
  /** The Action that will be taken */
  action: ScheduleActionDescription;
  /** Schedule policies */
  policies: {
    /** Overlap policy for concurrent actions */
    overlap: string;
    /** Catchup window in milliseconds */
    catchupWindow: number;
    /** Whether to pause on failure */
    pauseOnFailure: boolean;
  };
  /** Additional non-indexed information */
  memo?: Record<string, unknown>;
  /** Additional indexed information */
  searchAttributes?: Record<string, unknown>;
  /** Current state of the schedule */
  state: ScheduleState;
  /** Runtime information */
  info: ScheduleInfo;
}
