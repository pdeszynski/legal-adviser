import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { HubSpotService } from './hubspot.service';
import {
  CreateHubSpotContactDto,
  HubSpotContactResponse,
  LeadQualificationResponse,
} from './dto/hubspot.dto';

/**
 * HubSpot GraphQL Resolver
 *
 * Provides mutations for interacting with HubSpot CRM.
 * All mutations are protected by authentication guards.
 */
@Resolver(() => Object)
export class HubSpotResolver {
  constructor(private readonly hubspotService: HubSpotService) {}

  /**
   * Create a contact in HubSpot from form submission
   *
   * This mutation creates a new contact in HubSpot with the provided data.
   * Custom properties are mapped to HubSpot contact properties.
   *
   * @param input Contact creation data
   * @returns Created contact with ID
   */
  @Mutation(() => HubSpotContactResponse, {
    description: 'Create a contact in HubSpot from form submission',
    nullable: true,
  })
  async createHubSpotContact(
    @Args('input', { type: () => CreateHubSpotContactDto })
    input: CreateHubSpotContactDto,
  ): Promise<HubSpotContactResponse | null> {
    const result = await this.hubspotService.createContact({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      company: input.company,
      website: input.website,
      phone: input.phone,
      useCase: input.useCase,
      timeline: input.timeline,
      companySize: input.companySize,
      message: input.message,
      source: input.source,
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
   *
   * @param input Contact creation data
   * @param listType 'demo' or 'waitlist'
   * @returns Qualification result
   */
  @Mutation(() => LeadQualificationResponse, {
    description: 'Sync a lead to HubSpot with automatic qualification',
  })
  async syncHubSpotLead(
    @Args('input', { type: () => CreateHubSpotContactDto })
    input: CreateHubSpotContactDto,
    @Args('listType', {
      type: () => String,
      nullable: true,
      defaultValue: 'demo',
    })
    listType: 'demo' | 'waitlist',
  ): Promise<LeadQualificationResponse> {
    const result = await this.hubspotService.syncLead(
      {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        company: input.company,
        website: input.website,
        phone: input.phone,
        useCase: input.useCase,
        timeline: input.timeline,
        companySize: input.companySize,
        message: input.message,
        source: input.source,
      },
      listType,
    );

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
   * @param input Contact data to evaluate
   * @returns Qualification result
   */
  @Mutation(() => LeadQualificationResponse, {
    description: 'Check if a lead qualifies for deal creation',
  })
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
      useCase: input.useCase,
      timeline: input.timeline,
      companySize: input.companySize,
      message: input.message,
      source: input.source,
    });

    return {
      qualified: result.qualified,
      reason: result.reason,
      score: result.score,
    };
  }
}
