import { Field, InputType, ObjectType, ID, Int } from '@nestjs/graphql';
import { WebhookEvent, WebhookStatus } from '../entities/webhook.entity';

/**
 * Input for creating a new webhook
 */
@InputType('CreateWebhookInput')
export class CreateWebhookInput {
  @Field(() => String)
  name: string;

  @Field(() => String)
  url: string;

  @Field(() => [WebhookEvent])
  events: WebhookEvent[];

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  headers?: string | null;

  @Field(() => Int, { nullable: true, defaultValue: 3 })
  maxRetries?: number;

  @Field(() => Int, { nullable: true, defaultValue: 30000 })
  timeoutMs?: number;
}

/**
 * Input for updating a webhook
 */
@InputType('UpdateWebhookInput')
export class UpdateWebhookInput {
  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field(() => String, { nullable: true })
  url?: string | null;

  @Field(() => [WebhookEvent], { nullable: true })
  events?: WebhookEvent[] | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  headers?: string | null;

  @Field(() => WebhookStatus, { nullable: true })
  status?: WebhookStatus | null;

  @Field(() => Int, { nullable: true })
  maxRetries?: number | null;

  @Field(() => Int, { nullable: true })
  timeoutMs?: number | null;
}

/**
 * Response when creating a new webhook
 * Contains the secret key (only shown once) and the created entity
 */
@ObjectType('CreateWebhookResponse')
export class CreateWebhookResponse {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  url: string;

  @Field(() => [WebhookEvent])
  events: WebhookEvent[];

  @Field(() => String)
  secret: string;

  @Field(() => WebhookStatus)
  status: WebhookStatus;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String, { nullable: true })
  headers: string | null;

  @Field(() => Int)
  maxRetries: number;

  @Field(() => Int)
  timeoutMs: number;

  @Field(() => Int)
  successCount: number;

  @Field(() => Int)
  failureCount: number;

  @Field(() => String, { nullable: true })
  lastSuccessAt: string | null;

  @Field(() => String, { nullable: true })
  lastDeliveryAt: string | null;

  @Field(() => String)
  createdAt: string;

  @Field(() => String)
  updatedAt: string;
}

/**
 * Input for testing a webhook
 */
@InputType('TestWebhookInput')
export class TestWebhookInput {
  @Field(() => String)
  webhookId: string;

  @Field(() => String, { nullable: true, defaultValue: 'test.event' })
  event?: string;

  @Field(() => String, { nullable: true })
  payload?: string | null;
}

/**
 * Result of webhook test
 */
@ObjectType('TestWebhookResponse')
export class TestWebhookResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => Int, { nullable: true })
  statusCode: number | null;

  @Field(() => String, { nullable: true })
  response: string | null;

  @Field(() => String, { nullable: true })
  error: string | null;

  @Field(() => Int)
  durationMs: number;
}

/**
 * Webhook statistics
 */
@ObjectType('WebhookStats')
export class WebhookStats {
  @Field(() => Int)
  totalWebhooks: number;

  @Field(() => Int)
  activeWebhooks: number;

  @Field(() => Int)
  totalDeliveries: number;

  @Field(() => Int)
  successfulDeliveries: number;

  @Field(() => Int)
  failedDeliveries: number;

  @Field(() => Int)
  pendingDeliveries: number;
}

/**
 * Input for querying webhook deliveries
 */
@InputType('WebhookDeliveryQueryInput')
export class WebhookDeliveryQueryInput {
  @Field(() => ID, { nullable: true })
  webhookId?: string | null;

  @Field(() => String, { nullable: true })
  event?: string | null;

  @Field(() => String, { nullable: true })
  status?: string | null;

  @Field(() => String, { nullable: true })
  fromDate?: string | null;

  @Field(() => String, { nullable: true })
  toDate?: string | null;

  @Field(() => Int, { nullable: true })
  limit?: number | null;

  @Field(() => Int, { nullable: true })
  offset?: number | null;
}
