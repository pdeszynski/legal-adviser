import { Logger } from '@nestjs/common';
import { Client as HubSpotApiClient } from '@hubspot/api-client';
import {
  CreateContactRequest,
  CreateContactResponse,
  CreateDealRequest,
  CreateDealResponse,
  AddToListRequest,
} from './dto/hubspot.types';

// Import HubSpot types for proper API usage
import {
  Filter,
  FilterOperatorEnum,
  PublicAssociationsForObject,
  AssociationSpec,
  AssociationSpecAssociationCategoryEnum,
} from '@hubspot/api-client/lib/codegen/crm/contacts';

/**
 * HubSpot API Client
 *
 * Wrapper around @hubspot/api-client with typed methods.
 * Handles direct communication with HubSpot API endpoints.
 */
export class HubSpotClient {
  private readonly logger = new Logger(HubSpotClient.name);
  private readonly client: HubSpotApiClient;

  constructor(private readonly apiKey: string) {
    this.client = new HubSpotApiClient({ apiKey });
  }

  /**
   * Create or update a contact in HubSpot
   *
   * Uses the email as the unique identifier for upsert operations.
   *
   * @param request Contact creation data
   * @returns Created contact response
   */
  async createContact(
    request: CreateContactRequest,
  ): Promise<CreateContactResponse> {
    try {
      // Prepare contact properties
      const properties: Record<string, string> = {
        email: request.email,
      };

      // Add optional properties if provided
      if (request.firstName) properties.firstname = request.firstName;
      if (request.lastName) properties.lastname = request.lastName;
      if (request.company) properties.company = request.company;
      if (request.website) properties.website = request.website;
      if (request.phone) properties.phone = request.phone;

      // Custom properties for lead tracking
      if (request.useCase) properties.use_case = request.useCase;
      if (request.timeline) properties.timeline = request.timeline;
      if (request.companySize) properties.company_size = request.companySize;
      if (request.message) properties.message = request.message;
      if (request.source) properties.hs_lead_source = request.source;

      // Create the contact
      const response = await this.client.crm.contacts.basicApi.create({
        properties,
      });

      this.logger.log(`Contact created in HubSpot: ${response.id}`);

      return {
        id: response.id,
        email: request.email,
        createdAt: new Date(),
      };
    } catch (error) {
      // Check if contact already exists (409 conflict)
      if (this.isConflictError(error)) {
        this.logger.debug(`Contact already exists for email: ${request.email}`);
        // Try to find existing contact by email
        return this.findOrCreateByEmail(request);
      }
      throw new Error(
        `Failed to create HubSpot contact: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Find a contact by email or create if not found
   */
  private async findOrCreateByEmail(
    request: CreateContactRequest,
  ): Promise<CreateContactResponse> {
    try {
      // Search for contact by email using proper types
      const filter = new Filter();
      filter.propertyName = 'email';
      filter.operator = FilterOperatorEnum.Eq;
      filter.value = request.email;

      const searchResponse = await this.client.crm.contacts.searchApi.doSearch({
        filterGroups: [
          {
            filters: [filter],
          },
        ],
        limit: 1,
      });

      if (searchResponse.results && searchResponse.results.length > 0) {
        const existingContact = searchResponse.results[0];
        this.logger.log(
          `Found existing HubSpot contact: ${existingContact.id}`,
        );

        return {
          id: existingContact.id,
          email: request.email,
          createdAt: new Date(existingContact.createdAt || Date.now()),
        };
      }

      // If not found, create new
      return this.createContactForce(request);
    } catch (error) {
      // If search fails, try to create
      this.logger.warn(
        `Search failed, attempting creation: ${this.getErrorMessage(error)}`,
      );
      return this.createContactForce(request);
    }
  }

  /**
   * Force create a new contact (skip conflict handling)
   */
  private async createContactForce(
    request: CreateContactRequest,
  ): Promise<CreateContactResponse> {
    const properties: Record<string, string> = {
      email: request.email,
    };

    if (request.firstName) properties.firstname = request.firstName;
    if (request.lastName) properties.lastname = request.lastName;
    if (request.company) properties.company = request.company;
    if (request.website) properties.website = request.website;
    if (request.phone) properties.phone = request.phone;
    if (request.useCase) properties.use_case = request.useCase;
    if (request.timeline) properties.timeline = request.timeline;
    if (request.companySize) properties.company_size = request.companySize;
    if (request.message) properties.message = request.message;
    if (request.source) properties.hs_lead_source = request.source;

    const response = await this.client.crm.contacts.basicApi.create({
      properties,
    });

    return {
      id: response.id,
      email: request.email,
      createdAt: new Date(),
    };
  }

  /**
   * Create a deal in HubSpot
   *
   * @param request Deal creation data
   * @returns Created deal response
   */
  async createDeal(request: CreateDealRequest): Promise<CreateDealResponse> {
    try {
      const properties: Record<string, string> = {
        dealname: request.dealName,
        dealstage: request.dealStage || 'appointmentscheduled',
        pipeline: request.pipeline || 'default',
      };

      // Add amount if provided (must be string)
      if (request.amount !== undefined) {
        properties.amount = request.amount.toString();
      }

      // Add close date if provided (HubSpot expects timestamp in milliseconds)
      if (request.closeDate) {
        properties.closedate = request.closeDate.getTime().toString();
      }

      // Create association spec for contact-to-deal association
      const associationSpec = new AssociationSpec();
      associationSpec.associationCategory =
        AssociationSpecAssociationCategoryEnum.HubspotDefined;
      associationSpec.associationTypeId = 3; // Contact to Deal association type

      const association = new PublicAssociationsForObject();
      association.to = { id: request.contactId };
      association.types = [associationSpec];

      const response = await this.client.crm.deals.basicApi.create({
        properties,
        associations: [association],
      });

      this.logger.log(`Deal created in HubSpot: ${response.id}`);

      return {
        id: response.id,
        dealId: request.dealName,
        createdAt: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Failed to create HubSpot deal: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Add a contact to a HubSpot list
   *
   * Note: HubSpot API for list membership requires Marketing Hub Professional tier.
   * This is an optional feature and will log a warning if not available.
   *
   * @param request List addition request
   */
  async addToList(request: AddToListRequest): Promise<void> {
    try {
      // HubSpot's lists API is limited and requires specific tier
      // We'll update contact with a list identifier property instead
      const properties: Record<string, string> = {};
      properties.list_membership = request.listId;

      await this.client.crm.contacts.basicApi.update(request.contactId, {
        properties,
      });

      this.logger.log(
        `Contact ${request.contactId} marked for list ${request.listId}`,
      );
    } catch (error) {
      // List membership may not be available in all HubSpot tiers
      // Log warning but don't fail the operation
      this.logger.warn(
        `Could not update contact for list (may require custom property): ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Test API connection by fetching a single contact
   */
  async testConnection(): Promise<void> {
    try {
      // Try to fetch contacts with limit 1 to verify API key
      await this.client.crm.contacts.basicApi.getPage(1);
    } catch (error) {
      throw new Error(
        `HubSpot API connection failed: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Check if error is a conflict (409)
   */
  private isConflictError(error: unknown): boolean {
    if (error && typeof error === 'object') {
      const statusCode = (error as { statusCode?: number }).statusCode;
      return statusCode === 409;
    }
    return false;
  }

  /**
   * Extract error message from error object
   */
  private getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object') {
      const err = error as {
        message?: string;
        response?: { body?: { message?: string } };
      };
      const message = err.message;
      if (message) return message;

      const response = err.response;
      if (response?.body?.message) return response.body.message;
    }
    return 'Unknown error';
  }
}
