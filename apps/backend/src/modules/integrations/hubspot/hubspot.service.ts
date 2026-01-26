import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HubSpotClient } from './hubspot-client';
import {
  CreateContactRequest,
  CreateContactResponse,
  CreateDealRequest,
  CreateDealResponse,
  AddToListRequest,
  LeadTimeline,
  QualificationResult,
  HubSpotConfig,
} from './dto/hubspot.types';

/**
 * HubSpot Integration Service
 *
 * Handles lead synchronization with HubSpot CRM including:
 * - Contact creation from form submissions
 * - Deal creation for qualified leads
 * - List assignment for segmentation
 * - Lead qualification logic
 *
 * Features:
 * - Automatic retry logic with exponential backoff
 * - Graceful degradation when HubSpot is unavailable
 * - Comprehensive error logging
 */
@Injectable()
export class HubSpotService {
  private readonly logger = new Logger(HubSpotService.name);
  private readonly config: HubSpotConfig;
  private readonly client: HubSpotClient;

  // Retry configuration
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second
  private readonly RETRY_MULTIPLIER = 2;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get<string>('HUBSPOT_API_KEY') || '',
      enabled: this.configService.get<string>('HUBSPOT_ENABLED') === 'true',
      demoRequestsListId: this.configService.get<string>(
        'HUBSPOT_DEMO_REQUESTS_LIST_ID',
      ),
      waitlistListId: this.configService.get<string>(
        'HUBSPOT_WAITLIST_LIST_ID',
      ),
      earlyAccessListId: this.configService.get<string>(
        'HUBSPOT_EARLY_ACCESS_LIST_ID',
      ),
      dealPipeline: this.configService.get<string>('HUBSPOT_DEAL_PIPELINE'),
      dealStage: this.configService.get<string>('HUBSPOT_DEAL_STAGE'),
    };

    this.client = new HubSpotClient(this.config.apiKey);

    if (this.config.enabled && this.config.apiKey) {
      this.logger.log('HubSpot integration initialized');
    } else {
      this.logger.warn('HubSpot integration is disabled');
    }
  }

  /**
   * Check if HubSpot integration is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }

  /**
   * Create a contact in HubSpot from form submission
   *
   * @param request Contact creation request
   * @returns Created contact response
   */
  async createContact(
    request: CreateContactRequest,
  ): Promise<CreateContactResponse | null> {
    if (!this.isEnabled()) {
      this.logger.debug(
        'HubSpot integration disabled, skipping contact creation',
      );
      return null;
    }

    return this.withRetry(
      async () => {
        this.logger.log(`Creating HubSpot contact for email: ${request.email}`);
        return await this.client.createContact(request);
      },
      'createContact',
      request.email,
    );
  }

  /**
   * Create a deal in HubSpot for a qualified lead
   *
   * @param request Deal creation request
   * @returns Created deal response
   */
  async createDeal(
    request: CreateDealRequest,
  ): Promise<CreateDealResponse | null> {
    if (!this.isEnabled()) {
      this.logger.debug('HubSpot integration disabled, skipping deal creation');
      return null;
    }

    return this.withRetry(
      async () => {
        this.logger.log(
          `Creating HubSpot deal for contact: ${request.contactId}`,
        );
        return await this.client.createDeal({
          ...request,
          pipeline: request.pipeline || this.config.dealPipeline,
          dealStage: request.dealStage || this.config.dealStage,
        });
      },
      'createDeal',
      request.contactId,
    );
  }

  /**
   * Add a contact to a HubSpot list
   *
   * @param request List addition request
   */
  async addToList(request: AddToListRequest): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.debug('HubSpot integration disabled, skipping list addition');
      return;
    }

    await this.withRetry(
      async () => {
        this.logger.log(
          `Adding contact ${request.contactId} to list ${request.listId}`,
        );
        return await this.client.addToList(request);
      },
      'addToList',
      request.contactId,
    );
  }

  /**
   * Sync a lead to HubSpot with automatic qualification
   *
   * This method:
   * 1. Creates or updates the contact
   * 2. Checks lead qualification
   * 3. Creates a deal if qualified
   * 4. Assignes to appropriate list based on type
   *
   * @param request Contact creation request
   * @param listType 'demo', 'waitlist', or 'earlyAccess'
   * @returns Contact ID and qualification result
   */
  async syncLead(
    request: CreateContactRequest,
    listType: 'demo' | 'waitlist' | 'earlyAccess' = 'demo',
  ): Promise<{ contactId: string | null; qualification: QualificationResult }> {
    if (!this.isEnabled()) {
      this.logger.debug('HubSpot integration disabled, skipping lead sync');
      return {
        contactId: null,
        qualification: {
          qualified: false,
          reason: 'HubSpot disabled',
          score: 0,
        },
      };
    }

    try {
      // Create or update contact
      const contact = await this.createContact(request);
      if (!contact) {
        return {
          contactId: null,
          qualification: {
            qualified: false,
            reason: 'Failed to create contact',
            score: 0,
          },
        };
      }

      // Check qualification
      const qualification = this.qualifyLead(request);

      // Create deal if qualified
      if (qualification.qualified) {
        await this.createDeal({
          contactId: contact.id,
          dealName: `${request.company || request.email} - ${request.useCase || 'New Deal'}`,
          pipeline: this.config.dealPipeline,
          dealStage: this.config.dealStage,
        });
      }

      // Add to appropriate list
      const listId =
        listType === 'demo'
          ? this.config.demoRequestsListId
          : listType === 'waitlist'
            ? this.config.waitlistListId
            : this.config.earlyAccessListId;
      if (listId) {
        await this.addToList({ contactId: contact.id, listId });
      }

      return { contactId: contact.id, qualification };
    } catch (error) {
      this.logger.error('Failed to sync lead to HubSpot', error);
      return {
        contactId: null,
        qualification: { qualified: false, reason: 'Sync failed', score: 0 },
      };
    }
  }

  /**
   * Determine if a lead qualifies for deal creation
   *
   * Qualification criteria:
   * - Timeline is 'immediate' or 'within_month'
   * - Company size indicates potential (50+ employees or 'enterprise' tier)
   * - Has a use case defined
   *
   * @param request Contact data
   * @returns Qualification result with score and reason
   */
  qualifyLead(request: CreateContactRequest): QualificationResult {
    let score = 0;
    const reasons: string[] = [];

    // Timeline scoring (highest weight)
    if (request.timeline === LeadTimeline.IMMEDIATE) {
      score += 50;
      reasons.push('Immediate timeline');
    } else if (request.timeline === LeadTimeline.WITHIN_MONTH) {
      score += 40;
      reasons.push('Within month timeline');
    } else if (request.timeline === LeadTimeline.WITHIN_QUARTER) {
      score += 20;
      reasons.push('Within quarter timeline');
    }

    // Company size scoring
    const companySizeLower = request.companySize?.toLowerCase() || '';
    if (
      companySizeLower.includes('enterprise') ||
      companySizeLower.includes('500+')
    ) {
      score += 30;
      reasons.push('Enterprise company size');
    } else if (
      companySizeLower.includes('100-') ||
      companySizeLower.includes('50-') ||
      companySizeLower.includes('medium')
    ) {
      score += 20;
      reasons.push('Mid-size company');
    } else if (
      companySizeLower.includes('10-') ||
      companySizeLower.includes('startup')
    ) {
      score += 10;
      reasons.push('Small company/startup');
    }

    // Use case indicates intent
    if (request.useCase && request.useCase.length > 20) {
      score += 15;
      reasons.push('Detailed use case provided');
    }

    // Company name indicates legitimacy
    if (request.company && request.company.length > 2) {
      score += 10;
      reasons.push('Company provided');
    }

    // Website indicates legitimacy
    if (request.website && request.website.length > 5) {
      score += 5;
      reasons.push('Website provided');
    }

    const qualified = score >= 50;
    const reason = qualified
      ? reasons.join(', ')
      : 'Lead does not meet qualification threshold';

    return { qualified, reason, score };
  }

  /**
   * Execute an operation with automatic retry logic
   *
   * Implements exponential backoff:
   * - Retry 1: 1 second delay
   * - Retry 2: 2 seconds delay
   * - Retry 3: 4 seconds delay
   *
   * @param operation The async operation to execute
   * @param operationName Name for logging
   * @param identifier Identifying info for logging
   * @returns Operation result or null after all retries exhausted
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    identifier: string,
  ): Promise<T | null> {
    let lastError: Error | null = null;
    let delay = this.INITIAL_RETRY_DELAY;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        const isLastAttempt = attempt === this.MAX_RETRIES;

        if (isLastAttempt) {
          this.logger.error(
            `${operationName} failed after ${attempt} attempts for ${identifier}: ${lastError.message}`,
          );
          return null;
        }

        this.logger.warn(
          `${operationName} attempt ${attempt} failed for ${identifier}, retrying in ${delay}ms: ${lastError.message}`,
        );

        // Wait before retry with exponential backoff
        await this.sleep(delay);
        delay *= this.RETRY_MULTIPLIER;
      }
    }

    return null;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Health check for HubSpot API connectivity
   */
  async healthCheck(): Promise<{ status: string; enabled: boolean }> {
    if (!this.isEnabled()) {
      return { status: 'disabled', enabled: false };
    }

    try {
      // Try to get a single contact to verify API key
      await this.client.testConnection();
      return { status: 'healthy', enabled: true };
    } catch (error) {
      this.logger.error('HubSpot health check failed', error);
      return { status: 'unhealthy', enabled: true };
    }
  }
}
