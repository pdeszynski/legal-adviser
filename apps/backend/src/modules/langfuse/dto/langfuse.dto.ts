import {
  Field,
  ObjectType,
  InputType,
  Int,
  Float,
  ID,
  GraphQLTimestamp,
  registerEnumType,
} from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsInt,
  IsBoolean,
} from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

/**
 * Trace status enum
 */
export enum TraceStatus {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  UNKNOWN = 'UNKNOWN',
}

registerEnumType(TraceStatus, {
  name: 'TraceStatus',
  description: 'Status of a Langfuse trace',
});

/**
 * Trace level enum
 */
export enum TraceLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEFAULT = 'DEFAULT',
}

registerEnumType(TraceLevel, {
  name: 'TraceLevel',
  description: 'Level of a Langfuse trace',
});

/**
 * Agent type enum for filtering
 */
export enum AgentType {
  QA_AGENT = 'QA_AGENT',
  CLASSIFIER_AGENT = 'CLASSIFIER_AGENT',
  DRAFTING_AGENT = 'DRAFTING_AGENT',
  CLARIFICATION_AGENT = 'CLARIFICATION_AGENT',
  WORKFLOW = 'WORKFLOW',
  UNKNOWN = 'UNKNOWN',
}

registerEnumType(AgentType, {
  name: 'AgentType',
  description: 'Type of AI agent or workflow',
});

/**
 * Input for fetching traces list
 */
@InputType()
export class TracesListInput {
  @Field({ nullable: true, description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @Field({ nullable: true, description: 'Filter by session ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @Field(() => TraceStatus, {
    nullable: true,
    description: 'Filter by trace status',
  })
  @IsOptional()
  @IsEnum(TraceStatus)
  status?: TraceStatus;

  @Field(() => AgentType, {
    nullable: true,
    description: 'Filter by agent type',
  })
  @IsOptional()
  @IsEnum(AgentType)
  agentType?: AgentType;

  @Field({ nullable: true, description: 'Start date for filtering (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Field({ nullable: true, description: 'End date for filtering (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Field({ nullable: true, description: 'Search term for filtering' })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 20,
    description: 'Number of items per page',
  })
  @IsOptional()
  @IsInt()
  limit?: number;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 1,
    description: 'Page number (1-indexed)',
  })
  @IsOptional()
  @IsInt()
  page?: number;

  @Field({
    nullable: true,
    defaultValue: 'createdAt',
    description: 'Sort field',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @Field({
    nullable: true,
    defaultValue: 'DESC',
    description: 'Sort order (ASC or DESC)',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Token usage breakdown
 */
@ObjectType()
export class TokenUsage {
  @Field(() => Int, { description: 'Total tokens used' })
  totalTokens!: number;

  @Field(() => Int, { description: 'Prompt tokens used' })
  promptTokens!: number;

  @Field(() => Int, { description: 'Completion tokens used' })
  completionTokens!: number;

  @Field(() => Float, { description: 'Estimated cost in USD' })
  totalCost!: number;
}

/**
 * Langfuse trace summary
 */
@ObjectType()
export class LangfuseTrace {
  @Field(() => ID, { description: 'Unique trace ID' })
  id!: string;

  @Field({ description: 'Trace name (operation name)' })
  name!: string;

  @Field(() => GraphQLTimestamp, {
    description: 'Timestamp when trace was created',
  })
  timestamp!: Date;

  @Field(() => GraphQLTimestamp, {
    nullable: true,
    description: 'Timestamp when trace started',
  })
  startTime?: Date;

  @Field(() => GraphQLTimestamp, {
    nullable: true,
    description: 'Timestamp when trace ended',
  })
  endTime?: Date;

  @Field(() => Float, {
    nullable: true,
    description: 'Duration in milliseconds',
  })
  duration?: number;

  @Field(() => TraceStatus, { description: 'Trace status' })
  status!: TraceStatus;

  @Field(() => TraceLevel, { nullable: true, description: 'Trace level' })
  level?: TraceLevel;

  @Field({ description: 'User ID associated with the trace' })
  userId?: string;

  @Field({ description: 'Session ID associated with the trace' })
  sessionId?: string;

  @Field({ description: 'Model used for the trace' })
  model?: string;

  @Field(() => TokenUsage, {
    nullable: true,
    description: 'Token usage details',
  })
  usage?: TokenUsage;

  @Field(() => GraphQLJSON, {
    nullable: true,
    description: 'Metadata associated with the trace',
  })
  metadata?: Record<string, any>;

  @Field(() => Int, {
    description: 'Number of observations (spans/generations) in the trace',
  })
  observationCount!: number;

  @Field(() => AgentType, { description: 'Type of agent or workflow' })
  agentType!: AgentType;
}

/**
 * Paginated traces list response
 */
@ObjectType()
export class TracesListResponse {
  @Field(() => [LangfuseTrace], { description: 'List of traces' })
  traces!: LangfuseTrace[];

  @Field(() => Int, {
    description: 'Total number of traces matching the filter',
  })
  totalCount!: number;

  @Field(() => Int, { description: 'Current page number (1-indexed)' })
  page!: number;

  @Field(() => Int, { description: 'Number of items per page' })
  limit!: number;

  @Field(() => Int, { description: 'Total number of pages' })
  totalPages!: number;

  @Field(() => GraphQLTimestamp, { description: 'When this data was fetched' })
  fetchedAt!: Date;
}

/**
 * Trace observation types
 */
export enum ObservationType {
  SPAN = 'SPAN',
  GENERATION = 'GENERATION',
  EVENT = 'EVENT',
}

registerEnumType(ObservationType, {
  name: 'ObservationType',
  description: 'Type of observation within a trace',
});

/**
 * Single observation (span/generation) within a trace
 */
@ObjectType()
export class TraceObservation {
  @Field(() => ID, { description: 'Unique observation ID' })
  id!: string;

  @Field(() => ObservationType, { description: 'Type of observation' })
  type!: ObservationType;

  @Field({ description: 'Observation name' })
  name!: string;

  @Field(() => GraphQLTimestamp, {
    description: 'Timestamp when observation started',
  })
  startTime!: Date;

  @Field(() => GraphQLTimestamp, {
    nullable: true,
    description: 'Timestamp when observation ended',
  })
  endTime?: Date;

  @Field(() => Float, {
    nullable: true,
    description: 'Duration in milliseconds',
  })
  duration?: number;

  @Field(() => TraceLevel, { nullable: true, description: 'Observation level' })
  level?: TraceLevel;

  @Field(() => TraceStatus, {
    nullable: true,
    description: 'Observation status',
  })
  status?: TraceStatus;

  @Field({ nullable: true, description: 'Parent observation ID if nested' })
  parentObservationId?: string;

  @Field(() => TokenUsage, {
    nullable: true,
    description: 'Token usage (for generations)',
  })
  usage?: TokenUsage;

  @Field({ nullable: true, description: 'Model used (for generations)' })
  model?: string;

  @Field(() => [String], { nullable: true, description: 'Input prompt(s)' })
  input?: string[];

  @Field(() => [String], {
    nullable: true,
    description: 'Output completion(s)',
  })
  output?: string[];

  @Field({ nullable: true, description: 'Error message if failed' })
  errorMessage?: string;

  @Field({ nullable: true, description: 'Stack trace if failed' })
  stackTrace?: string;

  @Field(() => GraphQLJSON, {
    nullable: true,
    description: 'Metadata associated with the observation',
  })
  metadata?: Record<string, any>;
}

/**
 * Detailed trace with all observations
 */
@ObjectType()
export class LangfuseTraceDetail {
  @Field(() => ID, { description: 'Unique trace ID' })
  id!: string;

  @Field({ description: 'Trace name (operation name)' })
  name!: string;

  @Field(() => GraphQLTimestamp, {
    description: 'Timestamp when trace was created',
  })
  timestamp!: Date;

  @Field(() => GraphQLTimestamp, {
    nullable: true,
    description: 'Timestamp when trace started',
  })
  startTime?: Date;

  @Field(() => GraphQLTimestamp, {
    nullable: true,
    description: 'Timestamp when trace ended',
  })
  endTime?: Date;

  @Field(() => Float, {
    nullable: true,
    description: 'Duration in milliseconds',
  })
  duration?: number;

  @Field(() => TraceStatus, { description: 'Trace status' })
  status!: TraceStatus;

  @Field(() => TraceLevel, { nullable: true, description: 'Trace level' })
  level?: TraceLevel;

  @Field({ description: 'User ID associated with the trace' })
  userId?: string;

  @Field({ description: 'User email if available' })
  userEmail?: string;

  @Field({ description: 'Session ID associated with the trace' })
  sessionId?: string;

  @Field({ description: 'Model used for the trace' })
  model?: string;

  @Field(() => TokenUsage, {
    nullable: true,
    description: 'Aggregated token usage',
  })
  usage?: TokenUsage;

  @Field(() => GraphQLJSON, {
    nullable: true,
    description: 'Metadata associated with the trace',
  })
  metadata?: Record<string, any>;

  @Field(() => [TraceObservation], {
    description: 'All observations within the trace',
  })
  observations!: TraceObservation[];

  @Field({ description: 'Error message if trace failed' })
  errorMessage?: string;

  @Field({ description: 'Stack trace if trace failed' })
  stackTrace?: string;

  @Field(() => GraphQLTimestamp, { description: 'When this data was fetched' })
  fetchedAt!: Date;

  @Field(() => AgentType, { description: 'Type of agent or workflow' })
  agentType!: AgentType;
}

/**
 * Token usage breakdown by agent/operation
 */
@ObjectType()
export class TokenUsageByAgent {
  @Field(() => AgentType, { description: 'Agent type' })
  agentType!: AgentType;

  @Field(() => Int, { description: 'Total tokens used' })
  totalTokens!: number;

  @Field(() => Int, { description: 'Total request count' })
  requestCount!: number;

  @Field(() => Float, { description: 'Total cost in USD' })
  totalCost!: number;

  @Field(() => Float, { description: 'Percentage of total tokens' })
  tokenPercentage!: number;

  @Field(() => Int, { description: 'Average tokens per request' })
  avgTokensPerRequest!: number;
}

/**
 * Latency metrics for agent/operation
 */
@ObjectType()
export class AgentLatencyMetrics {
  @Field(() => AgentType, { description: 'Agent type' })
  agentType!: AgentType;

  @Field(() => Float, { description: 'Average latency in milliseconds' })
  avgLatency!: number;

  @Field(() => Float, { description: 'Minimum latency in milliseconds' })
  minLatency!: number;

  @Field(() => Float, { description: 'Maximum latency in milliseconds' })
  maxLatency!: number;

  @Field(() => Float, { description: 'Median latency in milliseconds' })
  medianLatency!: number;

  @Field(() => Int, { description: 'P95 latency in milliseconds' })
  p95Latency!: number;

  @Field(() => Int, { description: 'Total request count' })
  requestCount!: number;
}

/**
 * User trace attribution
 */
@ObjectType()
export class UserTraceAttribution {
  @Field({ description: 'User ID' })
  userId!: string;

  @Field({ nullable: true, description: 'User email' })
  userEmail?: string;

  @Field(() => Int, { description: 'Total trace count' })
  traceCount!: number;

  @Field(() => Int, { description: 'Total tokens used' })
  totalTokens!: number;

  @Field(() => Float, { description: 'Total cost in USD' })
  totalCost!: number;

  @Field(() => GraphQLTimestamp, { description: 'First trace timestamp' })
  firstTraceAt!: Date;

  @Field(() => GraphQLTimestamp, { description: 'Last trace timestamp' })
  lastTraceAt!: Date;
}

/**
 * Langfuse debug configuration
 * Provides URLs and configuration for the Langfuse dashboard
 */
@ObjectType()
export class LangfuseDebugConfig {
  @Field({ description: 'Whether Langfuse integration is enabled' })
  enabled!: boolean;

  @Field({ nullable: true, description: 'Langfuse host URL' })
  hostUrl?: string;

  @Field({ nullable: true, description: 'Langfuse trace URL template (use {traceId} as placeholder)' })
  traceUrlTemplate?: string;

  @Field({ nullable: true, description: 'Base URL for Langfuse dashboard' })
  dashboardUrl?: string;
}
