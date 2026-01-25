import { SetMetadata } from '@nestjs/common';

/**
 * Public key for metadata
 */
export const PUBLIC_KEY = 'isPublic';

/**
 * Public decorator
 *
 * Marks a GraphQL resolver or method as publicly accessible,
 * bypassing authentication guards.
 *
 * Usage:
 * ```typescript
 * @Public()
 * @Query(() => User)
 * async publicQuery() { ... }
 * ```
 *
 * @example
 * ```typescript
 * @Resolver()
 * export class MyResolver {
 *   @Public()
 *   @Query(() => String)
 *   hello() {
 *     return 'Hello, world!';
 *   }
 * }
 * ```
 */
export const Public = () => SetMetadata(PUBLIC_KEY, true);
