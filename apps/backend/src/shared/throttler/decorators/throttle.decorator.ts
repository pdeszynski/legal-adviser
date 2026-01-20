import { Throttle } from '@nestjs/throttler';

/**
 * Decorator to apply strict rate limiting (10 requests per minute)
 * Useful for expensive AI operations like document generation
 *
 * Usage:
 * @StrictThrottle()
 * @Mutation(() => Document)
 * async generateDocument() {
 *   // This mutation is limited to 10 requests per minute
 * }
 */
export const StrictThrottle = () =>
  Throttle({ strict: { limit: 10, ttl: 60000 } });

export { Throttle };
