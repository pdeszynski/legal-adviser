import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { HubSpotService } from '../../modules/integrations/hubspot/hubspot.service';
import { InterestRequestInput } from './dto/interest-request.graphql-dto';

/**
 * Interest Request Service
 *
 * Handles early access interest request submissions including:
 * - Lead synchronization with HubSpot CRM
 * - GDPR consent tracking
 * - Reference ID generation
 *
 * Features:
 * - Generates unique reference IDs for tracking
 * - Graceful degradation when HubSpot is unavailable
 * - Comprehensive logging for audit trail
 * - No local database storage (HubSpot only)
 */
@Injectable()
export class InterestRequestService {
  private readonly logger = new Logger(InterestRequestService.name);

  constructor(private readonly hubSpotService: HubSpotService) {}

  /**
   * Submit an early access interest request
   *
   * Process:
   * 1. Validate GDPR consent
   * 2. Generate reference ID
   * 3. Sync lead to HubSpot Early Access list
   * 4. Return success response
   *
   * Note: Data is NOT stored locally - only synced to HubSpot
   *
   * @param request Interest request input data
   * @returns Response with success status and confirmation message
   */
  async submitInterestRequest(request: InterestRequestInput): Promise<{
    success: boolean;
    message: string;
    referenceId: string;
  }> {
    // Validate GDPR consent
    if (!request.consent) {
      this.logger.warn(
        `Interest request rejected: GDPR consent not given for ${request.email}`,
      );
      throw new Error('GDPR consent is required to submit an interest request');
    }

    // Generate unique reference ID for tracking
    const referenceId = randomUUID();
    this.logger.log(
      `Interest request submitted: ${referenceId} - ${request.email}${request.company ? ` from ${request.company}` : ''}`,
    );

    // Parse full name into first and last name
    const nameParts = request.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Build message with all details
    const messageParts: string[] = [];

    if (request.role) {
      messageParts.push(`Role: ${request.role}`);
    }

    if (request.company) {
      messageParts.push(`Company: ${request.company}`);
    }

    if (request.useCase) {
      messageParts.push(`Use Case: ${request.useCase}`);
    }

    if (request.leadSource) {
      messageParts.push(`Lead Source: ${request.leadSource}`);
    }

    const message =
      messageParts.length > 0
        ? messageParts.join('\n')
        : 'No additional details provided';

    // Sync to HubSpot
    try {
      const hubSpotResult = await this.hubSpotService.syncLead(
        {
          email: request.email,
          firstName,
          lastName,
          company: request.company,
          jobTitle: request.role,
          useCase: request.useCase,
          source: request.leadSource || 'early_access_form',
          message: message,
          gdprConsent: request.consent,
        },
        'earlyAccess',
      );

      if (hubSpotResult.contactId) {
        this.logger.log(
          `Interest request ${referenceId} synced to HubSpot: ${hubSpotResult.contactId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to sync interest request ${referenceId} to HubSpot:`,
        error,
      );
      // Continue even if HubSpot sync fails - we want to accept the request
    }

    return {
      success: true,
      message:
        'Thank you for your interest in early access! We have received your request and will notify you when early access becomes available.',
      referenceId,
    };
  }
}
