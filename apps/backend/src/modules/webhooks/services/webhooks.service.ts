import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Webhook,
  WebhookEvent,
  WebhookStatus,
} from '../entities/webhook.entity';
import { CreateWebhookInput, UpdateWebhookInput } from '../dto/webhook.dto';
import { EVENT_PATTERNS } from '../../../shared/events/base/event-patterns';
import { WebhookDeliveryService } from './webhook-delivery.service';

/**
 * Webhooks Service
 *
 * Handles CRUD operations for webhooks.
 *
 * Bounded Context: Webhooks
 * - Aggregates: Webhook
 * - Services: WebhooksService
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
    private readonly eventEmitter: EventEmitter2,
    private readonly deliveryService: WebhookDeliveryService,
  ) {}

  /**
   * Create a new webhook
   *
   * @param userId - The user ID
   * @param input - The webhook creation input
   * @returns The created webhook with secret
   */
  async create(
    userId: string,
    input: CreateWebhookInput,
  ): Promise<{ webhook: Webhook; secret: string }> {
    this.logger.log(`Creating webhook "${input.name}" for user ${userId}`);

    // Parse headers from JSON string if provided
    let headers: Record<string, string> | null = null;
    if (input.headers) {
      try {
        headers = JSON.parse(input.headers);
      } catch (error) {
        throw new Error('Invalid headers JSON format');
      }
    }

    // Validate URL is HTTPS
    if (!input.url.startsWith('https://')) {
      throw new Error('Webhook URL must use HTTPS');
    }

    // Validate events array is not empty
    if (!input.events || input.events.length === 0) {
      throw new Error('At least one event must be specified');
    }

    // Create webhook entity
    const { entity, secret } = Webhook.create(
      userId,
      input.name,
      input.url,
      input.events,
      {
        description: input.description,
        headers,
        maxRetries: input.maxRetries,
        timeoutMs: input.timeoutMs,
      },
    );

    const savedWebhook = await this.webhookRepository.save(entity);

    // Emit webhook registered event
    this.eventEmitter.emit(EVENT_PATTERNS.WEBHOOK.REGISTERED, {
      webhookId: savedWebhook.id,
      userId: savedWebhook.userId,
      events: savedWebhook.events,
    });

    this.logger.log(`Webhook ${savedWebhook.id} created for user ${userId}`);

    return { webhook: savedWebhook, secret };
  }

  /**
   * Update a webhook
   *
   * @param id - The webhook ID
   * @param userId - The user ID (for ownership check)
   * @param input - The webhook update input
   * @returns The updated webhook
   */
  async update(
    id: string,
    userId: string,
    input: UpdateWebhookInput,
  ): Promise<Webhook> {
    this.logger.log(`Updating webhook ${id}`);

    const webhook = await this.findOneForUser(id, userId);

    // Update fields if provided
    if (input.name !== undefined && input.name !== null) {
      webhook.name = input.name;
    }

    if (input.url !== undefined && input.url !== null) {
      if (!input.url.startsWith('https://')) {
        throw new Error('Webhook URL must use HTTPS');
      }
      webhook.url = input.url;
    }

    if (input.events !== undefined && input.events !== null) {
      if (input.events.length === 0) {
        throw new Error('At least one event must be specified');
      }
      webhook.events = input.events;
    }

    if (input.description !== undefined) {
      webhook.description = input.description;
    }

    if (input.headers !== undefined) {
      if (input.headers === null) {
        webhook.headers = null;
      } else {
        try {
          webhook.headers = JSON.parse(input.headers);
        } catch (error) {
          throw new Error('Invalid headers JSON format');
        }
      }
    }

    if (input.status !== undefined) {
      if (input.status !== null) {
        webhook.status = input.status;
      }
    }

    if (input.maxRetries !== undefined) {
      if (input.maxRetries !== null) {
        webhook.maxRetries = input.maxRetries;
      }
    }

    if (input.timeoutMs !== undefined) {
      if (input.timeoutMs !== null) {
        webhook.timeoutMs = input.timeoutMs;
      }
    }

    const updatedWebhook = await this.webhookRepository.save(webhook);

    this.logger.log(`Webhook ${id} updated`);

    return updatedWebhook;
  }

  /**
   * Delete a webhook
   *
   * @param id - The webhook ID
   * @param userId - The user ID (for ownership check)
   */
  async delete(id: string, userId: string): Promise<void> {
    this.logger.log(`Deleting webhook ${id}`);

    const webhook = await this.findOneForUser(id, userId);

    await this.webhookRepository.remove(webhook);

    // Emit webhook unregistered event
    this.eventEmitter.emit(EVENT_PATTERNS.WEBHOOK.UNREGISTERED, {
      webhookId: webhook.id,
      userId: webhook.userId,
      events: webhook.events,
    });

    this.logger.log(`Webhook ${id} deleted`);
  }

  /**
   * Find a webhook by ID
   *
   * @param id - The webhook ID
   * @returns The webhook
   * @throws NotFoundException if webhook not found
   */
  async findOne(id: string): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({
      where: { id },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook ${id} not found`);
    }

    return webhook;
  }

  /**
   * Find a webhook by ID for a specific user
   *
   * @param id - The webhook ID
   * @param userId - The user ID
   * @returns The webhook
   * @throws NotFoundException if webhook not found or doesn't belong to user
   */
  async findOneForUser(id: string, userId: string): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({
      where: { id, userId },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook ${id} not found`);
    }

    return webhook;
  }

  /**
   * Find all webhooks for a user
   *
   * @param userId - The user ID
   * @param status - Optional status filter
   * @returns Array of webhooks
   */
  async findAllForUser(
    userId: string,
    status?: WebhookStatus,
  ): Promise<Webhook[]> {
    const whereClause: any = { userId };

    if (status) {
      whereClause.status = status;
    }

    return this.webhookRepository.find({
      where: whereClause,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get webhook statistics for a user
   *
   * @param userId - The user ID
   * @returns Webhook statistics
   */
  async getStats(userId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    disabled: number;
  }> {
    const [total, active, inactive, disabled] = await Promise.all([
      this.webhookRepository.count({ where: { userId } }),
      this.webhookRepository.count({
        where: { userId, status: WebhookStatus.ACTIVE },
      }),
      this.webhookRepository.count({
        where: { userId, status: WebhookStatus.INACTIVE },
      }),
      this.webhookRepository.count({
        where: { userId, status: WebhookStatus.DISABLED },
      }),
    ]);

    return { total, active, inactive, disabled };
  }

  /**
   * Activate a webhook
   *
   * @param id - The webhook ID
   * @param userId - The user ID
   * @returns The updated webhook
   */
  async activate(id: string, userId: string): Promise<Webhook> {
    const webhook = await this.findOneForUser(id, userId);
    webhook.activate();
    return this.webhookRepository.save(webhook);
  }

  /**
   * Deactivate a webhook
   *
   * @param id - The webhook ID
   * @param userId - The user ID
   * @returns The updated webhook
   */
  async deactivate(id: string, userId: string): Promise<Webhook> {
    const webhook = await this.findOneForUser(id, userId);
    webhook.deactivate();
    return this.webhookRepository.save(webhook);
  }

  /**
   * Disable a webhook
   *
   * @param id - The webhook ID
   * @param userId - The user ID
   * @returns The updated webhook
   */
  async disable(id: string, userId: string): Promise<Webhook> {
    const webhook = await this.findOneForUser(id, userId);
    webhook.disable();
    return this.webhookRepository.save(webhook);
  }

  /**
   * Rotate webhook secret
   *
   * Generates a new secret for the webhook.
   * The old secret will no longer work.
   *
   * @param id - The webhook ID
   * @param userId - The user ID
   * @returns The new secret
   */
  async rotateSecret(id: string, userId: string): Promise<string> {
    this.logger.log(`Rotating secret for webhook ${id}`);

    const webhook = await this.findOneForUser(id, userId);

    const newSecret = Webhook.generateSecret();
    webhook.secret = newSecret;

    await this.webhookRepository.save(webhook);

    this.logger.log(`Secret rotated for webhook ${id}`);

    return newSecret;
  }

  /**
   * Test a webhook
   *
   * @param id - The webhook ID
   * @param userId - The user ID
   * @param event - Optional event type to test
   * @param payload - Optional custom payload
   * @returns Test result
   */
  async test(
    id: string,
    userId: string,
    event?: string,
    payload?: Record<string, unknown>,
  ) {
    await this.findOneForUser(id, userId);

    return this.deliveryService.testWebhook(id, event, payload);
  }

  /**
   * Get webhook delivery statistics
   *
   * @param id - The webhook ID
   * @param userId - The user ID
   * @returns Delivery statistics
   */
  async getDeliveryStats(id: string, userId: string) {
    await this.findOneForUser(id, userId);

    return this.deliveryService.getDeliveryStats(id);
  }

  /**
   * Get recent deliveries for a webhook
   *
   * @param id - The webhook ID
   * @param userId - The user ID
   * @param limit - Maximum number of deliveries
   * @returns Array of recent deliveries
   */
  async getRecentDeliveries(id: string, userId: string, limit?: number) {
    await this.findOneForUser(id, userId);

    return this.deliveryService.getRecentDeliveries(id, limit);
  }
}
