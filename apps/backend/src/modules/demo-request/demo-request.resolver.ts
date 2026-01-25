import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';
import { DemoRequestService } from './demo-request.service';
import {
  DemoRequestInput,
  DemoRequestResponse,
} from './dto/demo-request.graphql-dto';
import { GqlThrottlerGuard } from '../../shared/throttler/gql-throttler.guard';
import { UseGuards } from '@nestjs/common';
import { SkipCsrf } from '../../shared/csrf';
import { Logger } from '@nestjs/common';

/**
 * GraphQL Resolver for Demo Requests
 *
 * Public mutations for submitting demo requests without authentication.
 * Features:
 * - Public access (no authentication required)
 * - Rate limiting to prevent abuse
 * - Lead synchronization with HubSpot
 * - Email notifications to internal team
 */
@Resolver()
export class DemoRequestResolver {
  private readonly logger = new Logger(DemoRequestResolver.name);

  constructor(private readonly demoRequestService: DemoRequestService) {}

  /**
   * Mutation: Submit a demo request
   *
   * Public mutation that allows anyone to request a demo without authentication.
   * Submits the request to HubSpot CRM and sends an email notification to the
   * internal sales team.
   *
   * Note: CSRF skipped - public endpoint for unauthenticated users
   * Rate limited to 3 requests per hour per IP to prevent abuse
   *
   * @param input Demo request data
   * @returns Success response with confirmation message and reference ID
   */
  @Mutation(() => DemoRequestResponse, {
    name: 'submitDemoRequest',
    description:
      'Submit a demo request. No authentication required. The request will be synced to HubSpot and the sales team will be notified via email.',
  })
  @SkipCsrf()
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  async submitDemoRequest(
    @Args('input') input: DemoRequestInput,
  ): Promise<DemoRequestResponse> {
    this.logger.log(
      `Demo request submission received from ${input.email} (${input.company})`,
    );

    try {
      const result = await this.demoRequestService.submitDemoRequest(input);

      return {
        success: result.success,
        message: result.message,
        referenceId: result.referenceId,
        qualified: result.qualified,
      };
    } catch (error) {
      this.logger.error('Failed to process demo request:', error);
      throw error;
    }
  }
}
