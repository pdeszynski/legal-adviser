/**
 * Temporal Schedule Resolver
 *
 * GraphQL resolver for managing Temporal schedules.
 * Provides mutations for schedule lifecycle operations.
 *
 * Operations:
 * - deleteSchedule: Permanently delete a Temporal schedule with confirmation
 * - pauseSchedule: Pause a running schedule
 * - resumeSchedule: Resume a paused schedule
 * - describeSchedule: Get detailed schedule information
 *
 * All mutations require admin authentication and are logged to audit logs.
 */

import {
  Resolver,
  Mutation,
  Query,
  Context,
  Args,
  ID,
  Int,
} from '@nestjs/graphql';
import { UseGuards, Optional } from '@nestjs/common';
import {
  Field,
  ObjectType,
  InputType,
  registerEnumType,
} from '@nestjs/graphql';
import { GqlAuthGuard, AdminGuard } from '../auth/guards';
import { TemporalService } from './temporal.service';
import { TemporalWorkerService } from './temporal.worker';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  AuditActionType,
  AuditResourceType,
} from '../audit-log/entities/audit-log.entity';
import type {
  ScheduleDescription,
  ScheduleOptions,
} from './temporal.interfaces';
import { TemporalError, getUserFriendlyMessage } from './exceptions';

/**
 * Schedule Deletion Result
 *
 * Response returned after deleting a schedule.
 */
@ObjectType('ScheduleDeletionResult')
export class ScheduleDeletionResult {
  @Field(() => ID, { description: 'The ID of the deleted schedule' })
  scheduleId: string;

  @Field(() => Boolean, { description: 'Whether the deletion was successful' })
  success: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'Message describing the deletion result',
  })
  message?: string;
}

/**
 * Delete Schedule Input
 *
 * Input for deleting a schedule with confirmation.
 */
@InputType('DeleteScheduleInput')
export class DeleteScheduleInput {
  @Field(() => String, { description: 'The ID of the schedule to delete' })
  scheduleId: string;

  @Field(() => Boolean, {
    description: 'Confirmation that the user intends to delete the schedule',
    defaultValue: false,
  })
  confirm: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'Optional reason for deletion (logged to audit trail)',
  })
  reason?: string;
}

/**
 * Pause Schedule Input
 *
 * Input for pausing a schedule.
 */
@InputType('PauseScheduleInput')
export class PauseScheduleInput {
  @Field(() => String, { description: 'The ID of the schedule to pause' })
  scheduleId: string;

  @Field(() => String, {
    nullable: true,
    description: 'Optional reason for pausing (logged to audit trail)',
  })
  reason?: string;
}

/**
 * Resume Schedule Input
 *
 * Input for resuming a paused schedule.
 */
@InputType('ResumeScheduleInput')
export class ResumeScheduleInput {
  @Field(() => String, { description: 'The ID of the schedule to resume' })
  scheduleId: string;

  @Field(() => String, {
    nullable: true,
    description: 'Optional reason for resuming (logged to audit trail)',
  })
  reason?: string;
}

/**
 * Schedule Action Input
 *
 * Input for defining what a schedule executes.
 */
@InputType('ScheduleActionInput')
export class ScheduleActionInputGraphQL {
  @Field(() => String, {
    description: 'Type of action (currently only startWorkflow is supported)',
  })
  type: string;

  @Field(() => String, { description: 'Workflow type to execute' })
  workflowType: string;

  @Field(() => String, {
    description: 'Workflow ID template for each execution',
  })
  workflowId: string;

  @Field(() => String, { description: 'Task queue to dispatch workflows to' })
  taskQueue: string;

  @Field(() => String, {
    nullable: true,
    description: 'JSON string of arguments to pass to the workflow',
  })
  args?: string;
}

/**
 * Schedule Spec Input
 *
 * Input for defining when a schedule runs.
 */
@InputType('ScheduleSpecInput')
export class ScheduleSpecInputGraphQL {
  @Field(() => String, {
    nullable: true,
    description:
      'Cron expression for execution schedule (e.g., "0 2 * * *" for daily at 2 AM)',
  })
  cronExpression?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Start time (ISO 8601 string)',
  })
  startTime?: string;

  @Field(() => String, {
    nullable: true,
    description: 'End time (ISO 8601 string)',
  })
  endTime?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Timezone identifier (IANA tz database)',
  })
  timezone?: string;
}

/**
 * Schedule Policies Input
 *
 * Input for schedule behavior policies.
 */
@InputType('SchedulePoliciesInput')
export class SchedulePoliciesInputGraphQL {
  @Field(() => ScheduleOverlapPolicy, {
    nullable: true,
    description: 'How to handle overlapping executions',
  })
  overlap?: ScheduleOverlapPolicy;

  @Field(() => String, {
    nullable: true,
    description:
      'Catchup window for missed runs (duration string, e.g., "1 day")',
  })
  catchupWindow?: string;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether to pause on failure',
  })
  pauseOnFailure?: boolean;
}

/**
 * Create Schedule Input
 *
 * Input for creating a new Temporal schedule.
 */
@InputType('CreateScheduleInput')
export class CreateScheduleInputGraphQL {
  @Field(() => String, { description: 'Unique identifier for the schedule' })
  scheduleId: string;

  @Field(() => ScheduleActionInputGraphQL, {
    description: 'Action the schedule performs',
  })
  action: ScheduleActionInputGraphQL;

  @Field(() => ScheduleSpecInputGraphQL, {
    description: 'Schedule specification (when it runs)',
  })
  spec: ScheduleSpecInputGraphQL;

  @Field(() => SchedulePoliciesInputGraphQL, {
    nullable: true,
    description: 'Schedule behavior policies',
  })
  policies?: SchedulePoliciesInputGraphQL;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Initial paused state',
    defaultValue: false,
  })
  paused?: boolean;
}

/**
 * Create Schedule Result
 *
 * Response returned after creating a schedule.
 */
@ObjectType('CreateScheduleResult')
export class CreateScheduleResult {
  @Field(() => ID, { description: 'The ID of the created schedule' })
  scheduleId: string;

  @Field(() => Boolean, { description: 'Whether the creation was successful' })
  success: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'Message describing the creation result',
  })
  message?: string;
}

/**
 * Schedule List Result
 *
 * Response returned when listing schedules.
 */
@ObjectType('ScheduleListResult')
export class ScheduleListResultGraphQL {
  @Field(() => [String], { description: 'List of schedule IDs' })
  scheduleIds: string[];

  @Field(() => Int, { description: 'Total number of schedules' })
  totalCount: number;

  @Field(() => String, {
    nullable: true,
    description: 'Continuation token for pagination',
  })
  nextPageToken?: string;
}

/**
 * Schedule List Input
 *
 * Input for listing schedules with pagination.
 */
@InputType('ScheduleListInput')
export class ScheduleListInputGraphQL {
  @Field(() => Int, {
    nullable: true,
    description: 'Maximum number of results to return',
    defaultValue: 100,
  })
  pageSize?: number;

  @Field(() => String, {
    nullable: true,
    description: 'Continuation token from previous page',
  })
  pageToken?: string;
}

/**
 * Schedule Overlap Policy Enum
 */
export enum ScheduleOverlapPolicy {
  SKIP = 'SKIP',
  ALLOW_ALL = 'ALLOW_ALL',
  BUFFER_ONE = 'BUFFER_ONE',
}

registerEnumType(ScheduleOverlapPolicy, {
  name: 'ScheduleOverlapPolicy',
  description: 'How to handle overlapping schedule executions',
});

/**
 * Schedule Action Details
 *
 * Information about what a schedule executes.
 */
@ObjectType('ScheduleActionDetails')
export class ScheduleActionDetailsGraphQL {
  @Field(() => String, { description: 'Workflow type being executed' })
  workflowType: string;

  @Field(() => String, { description: 'Workflow ID template' })
  workflowId: string;

  @Field(() => String, { description: 'Task queue for executions' })
  taskQueue: string;

  @Field(() => String, {
    description: 'JSON string of arguments passed to workflow',
    nullable: true,
  })
  args?: string;
}

/**
 * Schedule Spec Details
 *
 * Information about when a schedule runs.
 */
@ObjectType('ScheduleSpecDetails')
export class ScheduleSpecDetailsGraphQL {
  @Field(() => String, {
    nullable: true,
    description: 'Cron expression (if calendar-based)',
  })
  cronExpression?: string;

  @Field(() => Number, {
    nullable: true,
    description: 'Interval in seconds (if interval-based)',
  })
  intervalSeconds?: number;

  @Field(() => String, { nullable: true, description: 'Start time' })
  startTime?: string;

  @Field(() => String, { nullable: true, description: 'End time' })
  endTime?: string;

  @Field(() => String, { nullable: true, description: 'Timezone' })
  timezone?: string;
}

/**
 * Schedule State Info
 *
 * Current state information for a schedule.
 */
@ObjectType('ScheduleStateInfo')
export class ScheduleStateInfoGraphQL {
  @Field(() => Number, {
    nullable: true,
    description: 'Number of missed actions',
  })
  missedActions?: number;

  @Field(() => Number, {
    nullable: true,
    description: 'Total number of actions',
  })
  totalActions?: number;

  @Field(() => Number, {
    nullable: true,
    description: 'Number of successful actions',
  })
  successfulActions?: number;

  @Field(() => Number, {
    nullable: true,
    description: 'Number of failed actions',
  })
  failedActions?: number;

  @Field(() => Number, {
    nullable: true,
    description: 'Number of currently running actions',
  })
  runningActions?: number;
}

/**
 * Schedule Details
 *
 * Complete information about a Temporal schedule.
 */
@ObjectType('ScheduleDetails')
export class ScheduleDetailsGraphQL {
  @Field(() => ID, { description: 'Schedule ID' })
  scheduleId: string;

  @Field(() => Boolean, { description: 'Whether the schedule exists' })
  exists: boolean;

  @Field(() => ScheduleActionDetailsGraphQL, {
    nullable: true,
    description: 'Action the schedule performs',
  })
  action?: ScheduleActionDetailsGraphQL;

  @Field(() => ScheduleSpecDetailsGraphQL, {
    nullable: true,
    description: 'Schedule specification',
  })
  spec?: ScheduleSpecDetailsGraphQL;

  @Field(() => ScheduleOverlapPolicy, {
    nullable: true,
    description: 'Overlap policy',
  })
  overlap?: ScheduleOverlapPolicy;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether the schedule is currently paused',
  })
  paused?: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'Number of missed actions',
  })
  missedActions?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Total number of actions taken',
  })
  totalActions?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Number of successful actions',
  })
  successfulActions?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Number of failed actions',
  })
  failedActions?: string;

  @Field(() => String, {
    nullable: true,
    description: 'ISO datetime of last run',
  })
  lastRunAt?: string;

  @Field(() => String, {
    nullable: true,
    description: 'ISO datetime of next run',
  })
  nextRunAt?: string;

  @Field(() => ScheduleStateInfoGraphQL, {
    nullable: true,
    description: 'Schedule state information',
  })
  state?: ScheduleStateInfoGraphQL;
}

/**
 * Worker Status Entry
 *
 * Represents the status of a single Temporal worker.
 */
@ObjectType('WorkerStatusEntry')
export class WorkerStatusEntry {
  @Field(() => String, { description: 'Task queue this worker processes' })
  taskQueue: string;

  @Field(() => Boolean, { description: 'Whether the worker is running' })
  running: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'Worker ID for tracking',
  })
  workerId?: string;

  @Field(() => Int, {
    nullable: true,
    description: 'Worker uptime in seconds',
  })
  uptimeSeconds?: number;
}

/**
 * Worker Status Result
 *
 * Response containing status of all Temporal workers.
 */
@ObjectType('WorkerStatusResult')
export class WorkerStatusResult {
  @Field(() => [WorkerStatusEntry], {
    description: 'List of worker status entries',
  })
  workers: WorkerStatusEntry[];

  @Field(() => Int, { description: 'Total number of workers' })
  totalWorkers: number;

  @Field(() => Int, {
    description: 'Number of workers currently running',
  })
  runningWorkers: number;

  @Field(() => String, {
    nullable: true,
    description: 'Overall health status',
  })
  status: string;
}

/**
 * Temporal Schedule Resolver
 *
 * Handles GraphQL mutations for managing Temporal schedules.
 * All operations require admin authentication.
 */
@Resolver()
@UseGuards(GqlAuthGuard, AdminGuard)
export class TemporalResolver {
  constructor(
    private readonly temporalService: TemporalService,
    private readonly auditLogService: AuditLogService,
    @Optional()
    private readonly workerService?: TemporalWorkerService,
  ) {}

  /**
   * Get current user ID from request context
   */
  private getCurrentUserId(context: any): string {
    const user = context.req?.user;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.sub || user.id || user.userId;
  }

  /**
   * Extract user-friendly error message from error
   */
  private getUserFriendlyErrorMessage(error: unknown): string {
    if (error instanceof TemporalError) {
      return getUserFriendlyMessage(error.code, error.message);
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unknown error occurred';
  }

  /**
   * Extract error code from error
   */
  private getErrorCode(error: unknown): string {
    if (error instanceof TemporalError) {
      return error.code;
    }
    if (error instanceof Error && 'code' in error) {
      return String((error as Record<string, unknown>).code);
    }
    return 'UNKNOWN_ERROR';
  }

  /**
   * Extract IP address from GraphQL context
   * Handles proxy headers (X-Forwarded-For, X-Real-IP)
   */
  private extractIpAddress(context: any): string | undefined {
    const headers = context.req?.headers || {};
    const forwarded = headers['x-forwarded-for'];
    if (forwarded) {
      const ips = forwarded.split(',');
      return ips[0].trim();
    }

    const realIp = headers['x-real-ip'];
    if (realIp) {
      return realIp;
    }

    return context.req?.ip;
  }

  /**
   * Extract user agent from GraphQL context
   */
  private extractUserAgent(context: any): string | undefined {
    const headers = context.req?.headers || {};
    return headers['user-agent'];
  }

  /**
   * Convert ScheduleDescription to GraphQL format
   */
  private toGraphQLFormat(
    schedule: ScheduleDescription,
  ): ScheduleDetailsGraphQL {
    return {
      scheduleId: schedule.scheduleId,
      exists: schedule.exists,
      action: schedule.action
        ? {
            workflowType: schedule.action.workflowType,
            workflowId: schedule.action.workflowId,
            taskQueue: schedule.action.taskQueue,
            args: schedule.action.args
              ? JSON.stringify(schedule.action.args)
              : undefined,
          }
        : undefined,
      spec: schedule.spec
        ? {
            cronExpression: schedule.spec.cronExpression,
            intervalSeconds: schedule.spec.intervalSeconds,
            startTime: schedule.spec.startTime,
            endTime: schedule.spec.endTime,
            timezone: schedule.spec.timezone,
          }
        : undefined,
      overlap: schedule.policies?.overlap as ScheduleOverlapPolicy,
      paused: schedule.paused,
      missedActions: schedule.missedActions?.toString(),
      totalActions: schedule.totalActions?.toString(),
      successfulActions: schedule.successfulActions?.toString(),
      failedActions: schedule.failedActions?.toString(),
      lastRunAt: schedule.lastRunAt?.toISOString(),
      nextRunAt: schedule.nextRunAt?.toISOString(),
      state: schedule.state
        ? {
            missedActions: schedule.state.missedActions,
            totalActions: schedule.state.totalActions,
            successfulActions: schedule.state.successfulActions,
            failedActions: schedule.state.failedActions,
            runningActions: schedule.state.runningActions,
          }
        : undefined,
    };
  }

  /**
   * Mutation: Create a Schedule
   *
   * Creates a new Temporal schedule for recurring workflow execution.
   * Logs creation to audit logs with schedule details.
   *
   * @param input - Schedule creation options
   * @returns Creation result with schedule ID and success status
   */
  @Mutation(() => CreateScheduleResult, {
    name: 'createSchedule',
    description:
      'Create a new Temporal schedule for recurring workflow execution',
  })
  async createSchedule(
    @Args('input') input: CreateScheduleInputGraphQL,
    @Context() context: any,
  ): Promise<CreateScheduleResult> {
    const userId = this.getCurrentUserId(context);
    const ipAddress = this.extractIpAddress(context) || undefined;
    const userAgent = this.extractUserAgent(context) || undefined;

    try {
      // Parse JSON args if provided
      let parsedArgs: unknown[] | undefined;
      if (input.action.args) {
        try {
          parsedArgs = JSON.parse(input.action.args) as unknown[];
        } catch {
          return {
            scheduleId: input.scheduleId,
            success: false,
            message: 'Invalid JSON in args field',
          };
        }
      }

      // Build schedule options
      const scheduleOptions: ScheduleOptions = {
        scheduleId: input.scheduleId,
        action: {
          type: input.action.type as 'startWorkflow',
          workflowType: input.action.workflowType,
          workflowId: input.action.workflowId,
          taskQueue: input.action.taskQueue,
          args: parsedArgs,
        },
        spec: {
          cronExpressions: input.spec.cronExpression
            ? [{ expression: input.spec.cronExpression }]
            : undefined,
          startTime: input.spec.startTime,
          endTime: input.spec.endTime,
          timezone: input.spec.timezone,
        },
        policies: input.policies
          ? {
              overlap: input.policies.overlap,
              catchupWindow: input.policies.catchupWindow,
              pauseOnFailure: input.policies.pauseOnFailure,
            }
          : undefined,
        paused: input.paused,
      };

      // Create the schedule
      const createdScheduleId =
        await this.temporalService.createSchedule(scheduleOptions);

      // Log successful creation to audit
      await this.auditLogService.logAction(
        AuditActionType.CREATE,
        AuditResourceType.SCHEDULE,
        {
          resourceId: createdScheduleId,
          userId,
          ipAddress,
          userAgent,
          statusCode: 200,
          changeDetails: {
            changedFields: ['created'],
            before: undefined,
            after: {
              scheduleId: createdScheduleId,
              workflowType: input.action.workflowType,
              cronExpression: input.spec.cronExpression,
            },
          },
        },
      );

      return {
        scheduleId: createdScheduleId,
        success: true,
        message: 'Schedule created successfully',
      };
    } catch (error) {
      const errorMessage = this.getUserFriendlyErrorMessage(error);

      // Log failed creation attempt
      await this.auditLogService.logAction(
        AuditActionType.CREATE,
        AuditResourceType.SCHEDULE,
        {
          resourceId: input.scheduleId,
          userId,
          ipAddress,
          userAgent,
          statusCode: 400,
          errorMessage,
        },
      );

      return {
        scheduleId: input.scheduleId,
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Query: List All Schedules
   *
   * Returns a paginated list of all Temporal schedule IDs.
   *
   * @param input - List options with pagination
   * @returns List of schedule IDs with pagination info
   */
  @Query(() => ScheduleListResultGraphQL, {
    name: 'temporalSchedules',
    description: 'List all Temporal schedules with pagination',
  })
  async temporalSchedules(
    @Args('input', { nullable: true }) input?: ScheduleListInputGraphQL,
    @Context() context?: any,
  ): Promise<ScheduleListResultGraphQL> {
    const userId = context ? this.getCurrentUserId(context) : 'system';
    const ipAddress = context
      ? this.extractIpAddress(context) || undefined
      : undefined;
    const userAgent = context
      ? this.extractUserAgent(context) || undefined
      : undefined;

    try {
      const listResult = await this.temporalService.listSchedules(
        input
          ? {
              pageSize: input.pageSize ?? 100,
              pageToken: input.pageToken,
            }
          : undefined,
      );

      // Log the list access
      if (this.auditLogService) {
        await this.auditLogService.logAction(
          AuditActionType.READ,
          AuditResourceType.SCHEDULE,
          {
            resourceId: 'all',
            userId,
            ipAddress,
            userAgent,
            statusCode: 200,
          },
        );
      }

      return {
        scheduleIds: listResult.scheduleIds,
        totalCount: listResult.scheduleIds.length,
        nextPageToken: listResult.nextPageToken,
      };
    } catch (error) {
      const errorMessage = this.getUserFriendlyErrorMessage(error);

      // Log failed list attempt
      if (this.auditLogService) {
        await this.auditLogService.logAction(
          AuditActionType.READ,
          AuditResourceType.SCHEDULE,
          {
            resourceId: 'all',
            userId,
            ipAddress,
            userAgent,
            statusCode: 400,
            errorMessage,
          },
        );
      }

      throw error;
    }
  }

  /**
   * Query: Get Schedule by ID
   *
   * Alias for describeSchedule. Returns detailed information about a Temporal schedule.
   *
   * @param scheduleId - The schedule ID to retrieve
   * @returns Schedule details
   */
  @Query(() => ScheduleDetailsGraphQL, {
    name: 'temporalSchedule',
    description: 'Get detailed information about a Temporal schedule by ID',
    nullable: true,
  })
  async temporalSchedule(
    @Args('scheduleId', { type: () => String }) scheduleId: string,
    @Context() context: any,
  ): Promise<ScheduleDetailsGraphQL | null> {
    // Delegate to describeSchedule
    return this.describeSchedule(scheduleId, context);
  }

  /**
   * Mutation: Delete a Schedule
   *
   * Permanently deletes a Temporal schedule.
   * Requires explicit confirmation to prevent accidental deletion.
   * Logs deletion to audit logs with schedule details.
   *
   * @param input - Schedule ID, confirmation flag, and optional reason
   * @returns Deletion result with success status
   */
  @Mutation(() => ScheduleDeletionResult, {
    name: 'deleteSchedule',
    description:
      'Permanently delete a Temporal schedule (requires confirmation)',
  })
  async deleteSchedule(
    @Args('input') input: DeleteScheduleInput,
    @Context() context: any,
  ): Promise<ScheduleDeletionResult> {
    const userId = this.getCurrentUserId(context);
    const ipAddress = this.extractIpAddress(context) || undefined;
    const userAgent = this.extractUserAgent(context) || undefined;

    // Require explicit confirmation
    if (!input.confirm) {
      // Log the attempt without confirmation
      await this.auditLogService.logAction(
        AuditActionType.READ,
        AuditResourceType.SCHEDULE,
        {
          resourceId: input.scheduleId,
          userId,
          ipAddress,
          userAgent,
          changeDetails: {
            context: {
              action: 'delete_attempted',
              reason: input.reason,
              confirmed: false,
            },
          },
        },
      );

      return {
        scheduleId: input.scheduleId,
        success: false,
        message:
          'Confirmation required. Set confirm=true to delete the schedule.',
      };
    }

    try {
      // Get schedule details before deletion for audit log
      const scheduleBefore = await this.temporalService.describeSchedule(
        input.scheduleId,
      );

      // Perform the deletion
      await this.temporalService.deleteSchedule(input.scheduleId);

      // Log successful deletion to audit
      await this.auditLogService.logAction(
        AuditActionType.DELETE,
        AuditResourceType.SCHEDULE,
        {
          resourceId: input.scheduleId,
          userId,
          ipAddress,
          userAgent,
          statusCode: 200,
          changeDetails: {
            changedFields: ['deleted'],
            before: {
              scheduleId: input.scheduleId,
              existed: scheduleBefore.exists,
              action: scheduleBefore.action,
              spec: scheduleBefore.spec,
              paused: scheduleBefore.paused,
            },
            after: undefined,
            context: input.reason ? { reason: input.reason } : undefined,
          },
        },
      );

      return {
        scheduleId: input.scheduleId,
        success: true,
        message: 'Schedule deleted successfully',
      };
    } catch (error) {
      const errorMessage = this.getUserFriendlyErrorMessage(error);

      // Log failed deletion attempt
      await this.auditLogService.logAction(
        AuditActionType.DELETE,
        AuditResourceType.SCHEDULE,
        {
          resourceId: input.scheduleId,
          userId,
          ipAddress,
          userAgent,
          statusCode: 400,
          errorMessage,
        },
      );

      return {
        scheduleId: input.scheduleId,
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Mutation: Pause a Schedule
   *
   * Pauses a running schedule, preventing future executions until resumed.
   * The service layer handles validation and audit logging.
   *
   * @param input - Schedule ID and optional reason
   * @returns Success status
   */
  @Mutation(() => Boolean, {
    name: 'pauseSchedule',
    description: 'Pause a running Temporal schedule',
  })
  async pauseSchedule(
    @Args('input') input: PauseScheduleInput,
    @Context() context: any,
  ): Promise<boolean> {
    const userId = this.getCurrentUserId(context);
    const ipAddress = this.extractIpAddress(context) || undefined;
    const userAgent = this.extractUserAgent(context) || undefined;

    try {
      await this.temporalService.pauseSchedule(
        input.scheduleId,
        userId,
        ipAddress,
        userAgent,
      );
      return true;
    } catch (error) {
      // Log the error with context
      const errorMessage = this.getUserFriendlyErrorMessage(error);

      await this.auditLogService.logAction(
        AuditActionType.PAUSE,
        AuditResourceType.SCHEDULE,
        {
          resourceId: input.scheduleId,
          userId,
          ipAddress,
          userAgent,
          statusCode: 400,
          errorMessage,
        },
      );

      // Re-throw for GraphQL to handle
      throw error;
    }
  }

  /**
   * Mutation: Resume a Schedule
   *
   * Resumes a paused schedule, allowing future executions.
   * The service layer handles validation and audit logging.
   *
   * @param input - Schedule ID and optional reason
   * @returns Success status
   */
  @Mutation(() => Boolean, {
    name: 'resumeSchedule',
    description: 'Resume a paused Temporal schedule',
  })
  async resumeSchedule(
    @Args('input') input: ResumeScheduleInput,
    @Context() context: any,
  ): Promise<boolean> {
    const userId = this.getCurrentUserId(context);
    const ipAddress = this.extractIpAddress(context) || undefined;
    const userAgent = this.extractUserAgent(context) || undefined;

    try {
      await this.temporalService.resumeSchedule(
        input.scheduleId,
        userId,
        ipAddress,
        userAgent,
      );
      return true;
    } catch (error) {
      // Log the error with context
      const errorMessage = this.getUserFriendlyErrorMessage(error);

      await this.auditLogService.logAction(
        AuditActionType.RESUME,
        AuditResourceType.SCHEDULE,
        {
          resourceId: input.scheduleId,
          userId,
          ipAddress,
          userAgent,
          statusCode: 400,
          errorMessage,
        },
      );

      // Re-throw for GraphQL to handle
      throw error;
    }
  }

  /**
   * Query: Describe a Schedule
   *
   * Returns detailed information about a Temporal schedule.
   *
   * @param scheduleId - The schedule ID to describe
   * @returns Schedule details
   */
  @Query(() => ScheduleDetailsGraphQL, {
    name: 'describeSchedule',
    description: 'Get detailed information about a Temporal schedule',
    nullable: true,
  })
  async describeSchedule(
    @Args('scheduleId', { type: () => String }) scheduleId: string,
    @Context() context: any,
  ): Promise<ScheduleDetailsGraphQL | null> {
    const userId = this.getCurrentUserId(context);
    const ipAddress = this.extractIpAddress(context) || undefined;
    const userAgent = this.extractUserAgent(context) || undefined;

    try {
      const schedule = await this.temporalService.describeSchedule(scheduleId);

      // Log the read access
      await this.auditLogService.logAction(
        AuditActionType.READ,
        AuditResourceType.SCHEDULE,
        {
          resourceId: scheduleId,
          userId,
          ipAddress,
          userAgent,
          statusCode: 200,
        },
      );

      return this.toGraphQLFormat(schedule);
    } catch (error) {
      const errorMessage = this.getUserFriendlyErrorMessage(error);

      await this.auditLogService.logAction(
        AuditActionType.READ,
        AuditResourceType.SCHEDULE,
        {
          resourceId: scheduleId,
          userId,
          ipAddress,
          userAgent,
          statusCode: 400,
          errorMessage,
        },
      );

      throw error;
    }
  }

  /**
   * Query: Get Temporal Worker Status
   *
   * Returns the current status of all Temporal workers.
   * Useful for monitoring and debugging worker connectivity.
   *
   * @returns Worker status information
   */
  @Query(() => WorkerStatusResult, {
    name: 'temporalWorkerStatus',
    description: 'Get the current status of Temporal workers',
  })
  async temporalWorkerStatus(): Promise<WorkerStatusResult> {
    if (!this.workerService) {
      return {
        workers: [],
        totalWorkers: 0,
        runningWorkers: 0,
        status: 'Worker service not available',
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
    };
  }
}
