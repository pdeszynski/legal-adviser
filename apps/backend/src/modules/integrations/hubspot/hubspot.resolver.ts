import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { HubSpotService } from './hubspot.service';
import {
  CreateHubSpotContactDto,
  HubSpotContactResponse,
  LeadQualificationResponse,
} from './dto/hubspot.dto';
import { Public } from '../../../modules/auth/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { UseGuards, Logger } from '@nestjs/common';
import { GqlThrottlerGuard } from '../../../shared/throttler/gql-throttler.guard';
import { SkipCsrf } from '../../../shared/csrf';
import { EmailSendingStarter } from '../../temporal/workflows/notification/email-sending.starter';
import { EmailTemplateType } from '../../notifications/dto/send-email.input';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

/**
 * HubSpot GraphQL Resolver
 *
 * Provides public mutations for interacting with HubSpot CRM from forms.
 * All mutations are publicly accessible (no authentication required).
 * Rate limited to prevent abuse.
 */
@Resolver(() => Object)
export class HubSpotResolver {
  private readonly logger = new Logger(HubSpotResolver.name);

  constructor(
    private readonly hubspotService: HubSpotService,
    private readonly emailSendingStarter: EmailSendingStarter,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a contact in HubSpot from form submission
   *
   * This mutation creates a new contact in HubSpot with the provided data.
   * Custom properties are mapped to HubSpot contact properties.
   *
   * Note: CSRF skipped - public endpoint for unauthenticated users
   * Rate limited to 5 requests per hour per IP to prevent abuse
   *
   * @param input Contact creation data
   * @returns Created contact with ID
   */
  @Public()
  @Mutation(() => HubSpotContactResponse, {
    description: 'Create a contact in HubSpot from form submission',
    nullable: true,
  })
  @SkipCsrf()
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 requests per hour
  async createHubSpotContact(
    @Args('input', { type: () => CreateHubSpotContactDto })
    input: CreateHubSpotContactDto,
  ): Promise<HubSpotContactResponse | null> {
    this.logger.log(`HubSpot contact creation request from ${input.email}`);

    const result = await this.hubspotService.createContact({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      company: input.company,
      website: input.website,
      phone: input.phone,
      jobTitle: input.jobTitle,
      useCase: input.useCase,
      timeline: input.timeline,
      companySize: input.companySize,
      message: input.message,
      source: input.source,
      gdprConsent: input.gdprConsent,
    });

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      email: result.email,
      createdAt: result.createdAt.toISOString(),
    };
  }

  /**
   * Sync a lead to HubSpot with automatic qualification
   *
   * This mutation:
   * 1. Creates or updates the contact
   * 2. Checks lead qualification
   * 3. Creates a deal if qualified
   * 4. Assigns to appropriate list based on type
   * 5. Sends confirmation email for earlyAccess signups
   *
   * Note: CSRF skipped - public endpoint for unauthenticated users
   * Rate limited to 5 requests per hour per IP to prevent abuse
   *
   * @param input Contact creation data
   * @param listType 'demo', 'waitlist', or 'earlyAccess'
   * @returns Qualification result
   */
  @Public()
  @Mutation(() => LeadQualificationResponse, {
    description: 'Sync a lead to HubSpot with automatic qualification',
  })
  @SkipCsrf()
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 requests per hour
  async syncHubSpotLead(
    @Args('input', { type: () => CreateHubSpotContactDto })
    input: CreateHubSpotContactDto,
    @Args('listType', {
      type: () => String,
      nullable: true,
      defaultValue: 'demo',
    })
    listType: 'demo' | 'waitlist' | 'earlyAccess',
  ): Promise<LeadQualificationResponse> {
    this.logger.log(
      `HubSpot lead sync request from ${input.email} (listType: ${listType})`,
    );

    const result = await this.hubspotService.syncLead(
      {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        company: input.company,
        website: input.website,
        phone: input.phone,
        jobTitle: input.jobTitle,
        useCase: input.useCase,
        timeline: input.timeline,
        companySize: input.companySize,
        message: input.message,
        source: input.source,
        gdprConsent: input.gdprConsent,
      },
      listType,
    );

    // Send confirmation email for early access signups after successful HubSpot sync
    if (listType === 'earlyAccess' && result.contactId) {
      try {
        const referenceId = randomUUID();
        const firstName =
          input.firstName || input.email?.split('@')[0] || 'there';

        await this.emailSendingStarter.queueEmail({
          to: input.email,
          subject: 'Welcome to the Early Access Waitlist - Legal AI Platform',
          template: EmailTemplateType.INTEREST_CONFIRMATION,
          templateData: {
            firstName,
            email: input.email,
            referenceId,
            frontendUrl: this.configService.get<string>(
              'FRONTEND_URL',
              'http://localhost:3000',
            ),
          },
          metadata: {
            eventType: 'interest.submitted',
            referenceId,
            listType,
            contactId: result.contactId,
          },
        });

        this.logger.log(
          `Confirmation email queued for early access signup: ${input.email}`,
        );
      } catch (error) {
        // Log error but don't fail the mutation
        this.logger.error(
          `Failed to queue confirmation email for ${input.email}:`,
          error,
        );
      }
    }

    return {
      qualified: result.qualification.qualified,
      reason: result.qualification.reason,
      score: result.qualification.score,
    };
  }

  /**
   * Check if a lead qualifies for deal creation
   *
   * Returns the qualification score and reason without creating
   * any data in HubSpot. Useful for previewing qualification status.
   *
   * Note: CSRF skipped - public endpoint for unauthenticated users
   * Rate limited to 10 requests per hour per IP to prevent abuse
   *
   * @param input Contact data to evaluate
   * @returns Qualification result
   */
  @Public()
  @Mutation(() => LeadQualificationResponse, {
    description: 'Check if a lead qualifies for deal creation',
  })
  @SkipCsrf()
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 requests per hour
  qualifyHubSpotLead(
    @Args('input', { type: () => CreateHubSpotContactDto })
    input: CreateHubSpotContactDto,
  ): LeadQualificationResponse {
    const result = this.hubspotService.qualifyLead({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      company: input.company,
      website: input.website,
      phone: input.phone,
      jobTitle: input.jobTitle,
      useCase: input.useCase,
      timeline: input.timeline,
      companySize: input.companySize,
      message: input.message,
      source: input.source,
      gdprConsent: input.gdprConsent,
    });

    return {
      qualified: result.qualified,
      reason: result.reason,
      score: result.score,
    };
  }
}
