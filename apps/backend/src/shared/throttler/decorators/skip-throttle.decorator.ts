import { SkipThrottle as NestSkipThrottle } from '@nestjs/throttler';

/**
 * Decorator to skip rate limiting for specific resolvers or controllers
 *
 * Usage:
 * @SkipThrottle()
 * @Query(() => String)
 * publicQuery() {
 *   return 'This query is not rate limited';
 * }
 */
export const SkipThrottle = NestSkipThrottle;
