import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';
import { Webhook } from './entities/webhook.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { WebhooksService } from './services/webhooks.service';
import { WebhookDeliveryService } from './services/webhook-delivery.service';
import {
  CreateWebhookInput,
  UpdateWebhookInput,
  CreateWebhookResponse,
  TestWebhookInput,
  TestWebhookResponse,
  WebhookStats,
} from './dto/webhook.dto';

/**
 * Webhooks Resolver
 *
 * Provides GraphQL mutations and queries for webhook management.
 * Uses the CRUD resolver from nestjs-query for standard operations.
 */
@Resolver(() => Webhook)
export class WebhooksResolver {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly webhookDeliveryService: WebhookDeliveryService,
  ) {}

  /**
   * Create a new webhook
   * Returns the secret (only shown once) and the created entity
   */
  @Mutation(() => CreateWebhookResponse, {
    description: 'Create a new webhook. The secret is only shown once.',
  })
  async createWebhook(
    @Args('input') input: CreateWebhookInput,
    @Context() context: { req: { user?: { id: string } } },
  ): Promise<CreateWebhookResponse> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new Error('Authentication required');
    }

    const { webhook, secret } = await this.webhooksService.create(
      userId,
      input,
    );

    return {
      id: webhook.id,
      secret,
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      status: webhook.status,
      description: webhook.description,
      headers: webhook.headers ? JSON.stringify(webhook.headers) : null,
      maxRetries: webhook.maxRetries,
      timeoutMs: webhook.timeoutMs,
      successCount: webhook.successCount,
      failureCount: webhook.failureCount,
      lastSuccessAt: webhook.lastSuccessAt?.toISOString() ?? null,
      lastDeliveryAt: webhook.lastDeliveryAt?.toISOString() ?? null,
      createdAt: webhook.createdAt.toISOString(),
      updatedAt: webhook.updatedAt.toISOString(),
    };
  }

  /**
   * Update a webhook
   */
  @Mutation(() => Webhook, {
    description:
      'Update an existing webhook (name, URL, events, headers, status)',
  })
  async updateWebhook(
    @Args('id', { type: () => String }) id: string,
    @Args('input') input: UpdateWebhookInput,
    @Context() context: { req: { user?: { id: string } } },
  ): Promise<Webhook> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new Error('Authentication required');
    }

    return this.webhooksService.update(id, userId, input);
  }

  /**
   * Delete a webhook
   */
  @Mutation(() => Boolean, {
    description: 'Delete a webhook permanently. This action cannot be undone.',
  })
  async deleteWebhook(
    @Args('id', { type: () => String }) id: string,
    @Context() context: { req: { user?: { id: string } } },
  ): Promise<boolean> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new Error('Authentication required');
    }

    await this.webhooksService.delete(id, userId);
    return true;
  }

  /**
   * Activate a webhook
   */
  @Mutation(() => Webhook, {
    description: 'Activate a webhook',
  })
  async activateWebhook(
    @Args('id', { type: () => String }) id: string,
    @Context() context: { req: { user?: { id: string } } },
  ): Promise<Webhook> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new Error('Authentication required');
    }

    return this.webhooksService.activate(id, userId);
  }

  /**
   * Deactivate a webhook (temporary pause)
   */
  @Mutation(() => Webhook, {
    description: 'Deactivate a webhook (temporary pause)',
  })
  async deactivateWebhook(
    @Args('id', { type: () => String }) id: string,
    @Context() context: { req: { user?: { id: string } } },
  ): Promise<Webhook> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new Error('Authentication required');
    }

    return this.webhooksService.deactivate(id, userId);
  }

  /**
   * Disable a webhook
   */
  @Mutation(() => Webhook, {
    description: 'Disable a webhook',
  })
  async disableWebhook(
    @Args('id', { type: () => String }) id: string,
    @Context() context: { req: { user?: { id: string } } },
  ): Promise<Webhook> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new Error('Authentication required');
    }

    return this.webhooksService.disable(id, userId);
  }

  /**
   * Rotate webhook secret
   */
  @Mutation(() => String, {
    description: 'Rotate webhook secret. The old secret will no longer work.',
  })
  async rotateWebhookSecret(
    @Args('id', { type: () => String }) id: string,
    @Context() context: { req: { user?: { id: string } } },
  ): Promise<string> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new Error('Authentication required');
    }

    return this.webhooksService.rotateSecret(id, userId);
  }

  /**
   * Test a webhook
   */
  @Mutation(() => TestWebhookResponse, {
    description: 'Test a webhook by sending a test event',
  })
  async testWebhook(
    @Args('input') input: TestWebhookInput,
    @Context() context: { req: { user?: { id: string } } },
  ): Promise<TestWebhookResponse> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new Error('Authentication required');
    }

    const result = await this.webhooksService.test(
      input.webhookId,
      userId,
      input.event,
      input.payload ? JSON.parse(input.payload) : undefined,
    );

    return {
      success: result.success,
      statusCode: result.statusCode,
      response: result.response,
      error: result.error,
      durationMs: result.durationMs,
    };
  }

  /**
   * Get a webhook by ID
   */
  @Query(() => Webhook, {
    description: 'Get a webhook by ID',
  })
  async webhook(
    @Args('id', { type: () => String }) id: string,
    @Context() context: { req: { user?: { id: string } } },
  ): Promise<Webhook> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new Error('Authentication required');
    }

    return this.webhooksService.findOneForUser(id, userId);
  }

  /**
   * Get all webhooks for the current user
   */
  @Query(() => [Webhook], {
    description: 'Get all webhooks for the current user',
  })
  async myWebhooks(
    @Context() context: { req: { user?: { id: string } } },
    @Args('status', { type: () => String, nullable: true }) status?: string,
  ): Promise<Webhook[]> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new Error('Authentication required');
    }

    return this.webhooksService.findAllForUser(userId, status as any);
  }

  /**
   * Get webhook statistics
   */
  @Query(() => WebhookStats, {
    description: 'Get webhook statistics for the current user',
  })
  async webhookStats(
    @Context() context: { req: { user?: { id: string } } },
  ): Promise<WebhookStats> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new Error('Authentication required');
    }

    const stats = await this.webhooksService.getStats(userId);
    const deliveryStats =
      await this.webhookDeliveryService.getDeliveryStats();

    return {
      totalWebhooks: stats.total,
      activeWebhooks: stats.active,
      totalDeliveries: deliveryStats.total,
      successfulDeliveries: deliveryStats.success,
      failedDeliveries: deliveryStats.failed,
      pendingDeliveries: deliveryStats.pending,
    };
  }

  /**
   * Get recent deliveries for a webhook
   */
  @Query(() => [WebhookDelivery], {
    description: 'Get recent deliveries for a webhook',
  })
  async webhookDeliveries(
    @Args('webhookId', { type: () => String }) webhookId: string,
    @Context() context: { req: { user?: { id: string } } },
    @Args('limit', { type: () => Number, nullable: true, defaultValue: 50 })
    limit?: number,
  ): Promise<WebhookDelivery[]> {
    const userId = context.req.user?.id;
    if (!userId) {
      throw new Error('Authentication required');
    }

    return this.webhooksService.getRecentDeliveries(webhookId, userId, limit);
  }
}
