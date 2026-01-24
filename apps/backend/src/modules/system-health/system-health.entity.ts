import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { ServiceStatus } from './system-health.types';
import type {
  ServiceHealth,
  QueueHealth,
  ErrorTrackingStatus,
  ErrorSummary,
} from './system-health.types';

registerEnumType(ServiceStatus, {
  name: 'ServiceStatus',
  description: 'Health status of a service or system component',
});

@ObjectType('ServiceHealth')
export class GraphQLServiceHealth implements ServiceHealth {
  @Field(() => ServiceStatus)
  status: ServiceStatus;

  @Field(() => Number, { nullable: true })
  latency?: number;

  @Field(() => String, { nullable: true })
  error?: string;

  @Field(() => String, { nullable: true })
  lastCheck?: string;
}

@ObjectType('QueueHealth')
export class GraphQLQueueHealth implements QueueHealth {
  @Field()
  depth: number;

  @Field()
  active: number;

  @Field()
  delayed: number;

  @Field()
  failed: number;

  @Field(() => String, { nullable: true })
  lastProcessed?: string;
}

@ObjectType('ErrorSummary')
export class GraphQLErrorSummary implements ErrorSummary {
  @Field()
  message: string;

  @Field()
  type: string;

  @Field()
  timestamp: string;

  @Field()
  count: number;
}

@ObjectType('ErrorTrackingStatus')
export class GraphQLErrorTrackingStatus implements ErrorTrackingStatus {
  @Field()
  totalErrors: number;

  @Field()
  recentErrors: number;

  @Field()
  criticalErrors: number;

  @Field(() => GraphQLErrorSummary, { nullable: true })
  lastError?: ErrorSummary;
}

@ObjectType('ServiceHealthStatus')
export class GraphQLServiceHealthStatus {
  @Field(() => GraphQLServiceHealth)
  database: ServiceHealth;

  @Field(() => GraphQLServiceHealth)
  redis: ServiceHealth;

  @Field(() => GraphQLServiceHealth)
  aiEngine: ServiceHealth;

  @Field(() => GraphQLServiceHealth)
  saosApi: ServiceHealth;

  @Field(() => GraphQLServiceHealth)
  isapApi: ServiceHealth;
}

@ObjectType('QueueHealthStatus')
export class GraphQLQueueHealthStatus {
  @Field(() => GraphQLQueueHealth)
  documentGeneration: QueueHealth;

  @Field(() => GraphQLQueueHealth)
  email: QueueHealth;

  @Field(() => GraphQLQueueHealth)
  webhook: QueueHealth;
}

@ObjectType('SystemHealthResponse')
export class SystemHealthResponse {
  @Field(() => ServiceStatus)
  status: ServiceStatus;

  @Field()
  timestamp: string;

  @Field(() => GraphQLServiceHealthStatus)
  services: any;

  @Field(() => GraphQLQueueHealthStatus)
  queues: any;

  @Field(() => GraphQLErrorTrackingStatus)
  errors: ErrorTrackingStatus;

  @Field()
  uptime: number;
}
