import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InterestRequestService } from './interest-request.service';
import { InterestRequestResolver } from './interest-request.resolver';
import { HubSpotModule } from '../integrations/hubspot/hubspot.module';

/**
 * Interest Request Module
 *
 * Handles public early access interest request submissions.
 *
 * Features:
 * - Public GraphQL mutation for interest requests (no auth required)
 * - Lead synchronization with HubSpot CRM Early Access list
 * - Rate limiting to prevent abuse (3 submissions per hour)
 * - GDPR consent validation
 * - No local database storage (HubSpot only)
 *
 * Environment Variables:
 * - HUBSPOT_EARLY_ACCESS_LIST_ID: HubSpot list ID for early access signups
 *
 * Dependencies:
 * - HubSpotModule: For CRM integration
 */
@Module({
  imports: [
    ConfigModule,
    HubSpotModule,
  ],
  providers: [
    InterestRequestService,
    InterestRequestResolver,
  ],
  exports: [InterestRequestService],
})
export class InterestRequestModule {}
