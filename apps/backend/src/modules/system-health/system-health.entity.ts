import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { ServiceStatus } from './system-health.types';
import type {
  ServiceHealth,
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

@ObjectType('SystemHealthResponse')
export class SystemHealthResponse {
  @Field(() => ServiceStatus)
  status: ServiceStatus;

  @Field()
  timestamp: string;

  @Field(() => [GraphQLServiceHealth], { nullable: true })
  services?: Record<string, ServiceHealth>;

  @Field(() => GraphQLErrorTrackingStatus)
  errors: ErrorTrackingStatus;

  @Field()
  uptime: number;
}
