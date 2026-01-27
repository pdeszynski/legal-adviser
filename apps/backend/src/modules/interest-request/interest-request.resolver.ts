import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';
import { InterestRequestService } from './interest-request.service';
import {
  InterestRequestInput,
  InterestRequestResponse,
} from './dto/interest-request.graphql-dto';
import { GqlThrottlerGuard } from '../../shared/throttler/gql-throttler.guard';
import { UseGuards } from '@nestjs/common';
import { SkipCsrf } from '../../shared/csrf';
import { Logger } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

/**
 * GraphQL Resolver for Early Access Interest Requests
 *
 * Public mutations for submitting early access interest requests without authentication.
 * Features:
 * - Public access (no authentication required)
 * - Rate limiting to prevent abuse (3 submissions per hour per email/IP)
 * - Lead synchronization with HubSpot Early Access list
 * - GDPR consent validation
 * - No local database storage (HubSpot only)
 */
@Resolver()
export class InterestRequestResolver {
  private readonly logger = new Logger(InterestRequestResolver.name);

  constructor(
    private readonly interestRequestService: InterestRequestService,
  ) {}

  /**
   * Mutation: Submit an early access interest request
   *
   * Public mutation that allows anyone to request early access without authentication.
   * Submits the request to HubSpot CRM Early Access list.
   *
   * Note: CSRF skipped - public endpoint for unauthenticated users
   * Rate limited to 3 requests per hour per IP to prevent abuse
   *
   * @param input Interest request data
   * @returns Success response with confirmation message and reference ID
   */
  @Public()
  @Mutation(() => InterestRequestResponse, {
    name: 'submitInterestRequest',
    description:
      'Submit an early access interest request. No authentication required. The request will be synced to HubSpot Early Access list. GDPR consent is required.',
  })
  @SkipCsrf()
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  async submitInterestRequest(
    @Args('input') input: InterestRequestInput,
  ): Promise<InterestRequestResponse> {
    this.logger.log(
      `Interest request submission received from ${input.email}${input.company ? ` (${input.company})` : ''}`,
    );

    try {
      const result =
        await this.interestRequestService.submitInterestRequest(input);

      return {
        success: result.success,
        message: result.message,
        referenceId: result.referenceId,
      };
    } catch (error) {
      this.logger.error('Failed to process interest request:', error);
      throw error;
    }
  }
}
