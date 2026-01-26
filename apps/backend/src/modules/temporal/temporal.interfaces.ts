/**
 * Temporal Interfaces
 *
 * Defines TypeScript interfaces for Temporal configuration,
 * workflow options, worker settings, and schedule operations.
 */

import type { ModuleMetadata } from '@nestjs/common';

/**
 * Temporal SDK Types
 *
 * Re-exports of key Temporal SDK types for type-safe schedule operations.
 * These types are dynamically imported at runtime due to ESM-only exports.
 */

/**
 * Overlap policy for schedule executions.
 * Determines how to handle overlapping workflow executions.
 */
export type ScheduleOverlapPolicy = 'SKIP' | 'ALLOW_ALL' | 'BUFFER_ONE';

/**
 * Calendar specification for schedule execution times.
 * Based on Temporal SDK's CalendarSpec.
 */
export interface ScheduleCalendarSpec {
  /** Comment describing this calendar spec */
  comment?: string;
  /** Specific minutes (0-59) */
  minute?: number | number[] | string;
  /** Specific hours (0-23) */
  hour?: number | number[] | string;
  /** Specific days of month (1-31) */
  dayOfMonth?: number | number[] | string;
  /** Specific months (1-12) */
  month?: number | number[] | string;
  /** Specific days of week (0-6, 0=Sunday) */
  dayOfWeek?: number | number[] | string;
  /** Specific years */
  year?: number | number[];
  /** Hour of day specification */
  hourOfDay?: number | number[] | string;
  /** Day of month specification */
  dayOfYear?: number | number[];
}

/**
 * Interval specification for schedule execution times.
 * Based on Temporal SDK's IntervalSpec.
 */
export interface ScheduleIntervalSpec {
  /** Interval in seconds */
  seconds: number;
  /** Phase offset in seconds */
  phase?: number;
}

/**
 * Schedule specification (when to run).
 * Based on Temporal SDK's ScheduleSpec.
 */
export interface ScheduleSpecInput {
  /** Calendar-based specifications */
  calendars?: ScheduleCalendarSpec[];
  /** Interval-based specification */
  interval?: ScheduleIntervalSpec;
  /** Cron expressions (parsed to calendar spec) */
  cronExpressions?: Array<{ expression: string; comment?: string }>;
  /** Start time for the schedule (ISO 8601 string) */
  startTime?: string;
  /** End time for the schedule (ISO 8601 string) */
  endTime?: string;
  /** Timezone identifier (IANA tz database) */
  timezone?: string;
  /** Jitter duration to add to scheduled times */
  jitter?: string | number;
}

/**
 * Schedule action input (what to run).
 * Based on Temporal SDK's ScheduleAction.
 */
export interface ScheduleActionInput {
  /** Type of action (currently only startWorkflow is supported) */
  type: 'startWorkflow';
  /** Workflow type to execute */
  workflowType: string;
  /** Workflow ID template for each execution */
  workflowId: string;
  /** Task queue to dispatch workflows to */
  taskQueue: string;
  /** Arguments to pass to the workflow */
  args?: unknown[];
  /** Workflow execution timeout */
  executionTimeout?: string | number;
  /** Workflow task timeout */
  taskTimeout?: string | number;
  /** Memo for the workflow execution */
  memo?: Record<string, unknown>;
  /** Search attributes for the workflow execution */
  searchAttributes?: Record<string, unknown>;
}

/**
 * Schedule policies.
 * Based on Temporal SDK's SchedulePolicies.
 */
export interface SchedulePoliciesInput {
  /** How to handle overlapping executions */
  overlap?: ScheduleOverlapPolicy;
  /** Catchup window for missed runs (duration string or number) */
  catchupWindow?: string | number;
  /** Whether to pause on failure */
  pauseOnFailure?: boolean;
}

/**
 * Schedule creation options.
 * Complete options for creating a new Temporal schedule.
 */
export interface ScheduleOptions {
  /** Unique identifier for the schedule */
  scheduleId: string;
  /** Action the schedule performs */
  action: ScheduleActionInput;
  /** Schedule specification (when it runs) */
  spec: ScheduleSpecInput;
  /** Schedule policies */
  policies?: SchedulePoliciesInput;
  /** Initial paused state */
  paused?: boolean;
  /** Memo for the schedule */
  memo?: Record<string, unknown>;
  /** Search attributes for the schedule */
  searchAttributes?: Record<string, unknown>;
}

/**
 * Schedule update options.
 * Options for updating an existing schedule.
 */
export interface ScheduleUpdateOptions {
  /** New action (optional) */
  action?: ScheduleActionInput;
  /** New spec (optional) */
  spec?: ScheduleSpecInput;
  /** New policies (optional) */
  policies?: SchedulePoliciesInput;
  /** New paused state (optional) */
  paused?: boolean;
}

/**
 * Schedule execution info.
 * Information about a specific schedule execution.
 */
export interface ScheduleExecutionInfo {
  /** Workflow ID for this execution */
  workflowId: string;
  /** Run ID for this execution */
  runId: string;
  /** When the execution started */
  startedAt?: Date;
  /** Current status of the execution */
  status?: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
  /** Execution time in milliseconds */
  durationMs?: number;
}

/**
 * Schedule action details.
 * Extracted action information from a schedule.
 */
export interface ScheduleActionDetails {
  /** Workflow type being executed */
  workflowType: string;
  /** Workflow ID template */
  workflowId: string;
  /** Task queue for executions */
  taskQueue: string;
  /** Arguments passed to workflow */
  args: unknown[];
}

/**
 * Schedule spec details.
 * Extracted specification information from a schedule.
 */
export interface ScheduleSpecDetails {
  /** Cron expression (if calendar-based) */
  cronExpression?: string;
  /** Interval in seconds (if interval-based) */
  intervalSeconds?: number;
  /** Start time */
  startTime?: string;
  /** End time */
  endTime?: string;
  /** Timezone */
  timezone?: string;
}

/**
 * Schedule state information.
 */
export interface ScheduleStateInfo {
  /** Number of missed actions */
  missedActions?: number;
  /** Total number of actions */
  totalActions?: number;
  /** Number of successful actions */
  successfulActions?: number;
  /** Number of failed actions */
  failedActions?: number;
  /** Number of currently running actions */
  runningActions?: number;
}

/**
 * Schedule description.
 * Complete information about a Temporal schedule.
 */
export interface ScheduleDescription {
  /** Schedule ID */
  scheduleId: string;
  /** Whether the schedule exists */
  exists: boolean;
  /** Action the schedule performs */
  action?: ScheduleActionDetails;
  /** Schedule specification (when it runs) */
  spec?: ScheduleSpecDetails;
  /** Schedule policies */
  policies?: SchedulePoliciesInput;
  /** Whether the schedule is currently paused */
  paused?: boolean;
  /** Recent successful action executions */
  recentActions?: ScheduleExecutionInfo[];
  /** Next scheduled run times */
  nextRunTimes?: Date[];
  /** Number of missed actions */
  missedActions?: number;
  /** Total number of actions taken */
  totalActions?: number;
  /** Number of successful actions */
  successfulActions?: number;
  /** Number of failed actions */
  failedActions?: number;
  /** Last run time */
  lastRunAt?: Date;
  /** Next run time */
  nextRunAt?: Date;
  /** Schedule state information */
  state?: ScheduleStateInfo;
  /** Memo associated with the schedule */
  memo?: Record<string, unknown>;
  /** Search attributes associated with the schedule */
  searchAttributes?: Record<string, unknown>;
}

/**
 * Schedule list result.
 */
export interface ScheduleListResult {
  /** List of schedule IDs */
  scheduleIds: string[];
  /** Continuation token for pagination */
  nextPageToken?: string;
}

/**
 * Schedule list options.
 */
export interface ScheduleListOptions {
  /** Maximum number of results to return */
  pageSize?: number;
  /** Continuation token from previous page */
  pageToken?: string;
}

/**
 * Schedule backfill options.
 * Options for backfilling missed schedule executions.
 */
export interface ScheduleBackfillOptions {
  /** Start of backfill period (ISO 8601 string) */
  startAt: string;
  /** End of backfill period (ISO 8601 string) */
  endAt: string;
  /** Override overlap policy for backfill */
  overlap?: ScheduleOverlapPolicy;
}

/**
 * Schedule trigger options.
 * Options for immediately triggering a schedule action.
 */
export interface ScheduleTriggerOptions {
  /** Override overlap policy for this trigger */
  overlap?: ScheduleOverlapPolicy;
}

/**
 * Cron expression parts.
 * Standard 5-field cron expression components.
 */
export interface CronExpressionParts {
  /** Minute field (0-59) */
  minute: string;
  /** Hour field (0-23) */
  hour: string;
  /** Day of month field (1-31) */
  day: string;
  /** Month field (1-12) */
  month: string;
  /** Day of week field (0-7, 0 and 7 are Sunday) */
  weekday: string;
}

/**
 * Parsed cron expression result.
 */
export interface ParsedCronExpression {
  /** Original expression */
  expression: string;
  /** Parsed parts */
  parts: CronExpressionParts;
  /** Comment/description */
  comment?: string;
}

/**
 * Schedule validation result.
 */
export interface ScheduleValidationResult {
  /** Whether the schedule is valid */
  valid: boolean;
  /** Validation errors (if any) */
  errors?: string[];
  /** Validation warnings (if any) */
  warnings?: string[];
}

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
 * @deprecated Use ScheduleActionInput instead for type safety
 * Schedule Action
 *
 * Describes the action a schedule performs.
 */
export interface ScheduleAction {
  /** Workflow type to execute */
  workflowType: string;
  /** Workflow ID template for executions */
  workflowId: string;
  /** Task queue to dispatch workflows to */
  taskQueue: string;
  /** Arguments to pass to the workflow */
  args: unknown[];
}

/**
 * @deprecated Use ScheduleSpecInput instead for type safety
 * Schedule Spec
 *
 * Defines when a schedule runs.
 */
export interface ScheduleSpec {
  /** Cron expression for execution schedule */
  cronExpression: string;
  /** Optional start time for the schedule */
  startTime?: string;
  /** Optional end time for the schedule */
  endTime?: string;
  /** Optional timezone for the schedule */
  timezone?: string;
}

/**
 * @deprecated Use SchedulePoliciesInput instead for type safety
 * Schedule Policies
 *
 * Defines behavior policies for schedule executions.
 */
export interface SchedulePolicies {
  /** How to handle overlapping executions */
  overlap?: 'SKIP' | 'ALLOW_ALL' | 'BUFFER_ONE';
  /** Whether to catch up on missed runs */
  catchupWindow?: string;
}
