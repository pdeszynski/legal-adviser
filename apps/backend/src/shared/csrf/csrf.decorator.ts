import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for skipping CSRF validation
 */
export const SKIP_CSRF_KEY = 'skipCsrf';

/**
 * Decorator to skip CSRF validation for specific handlers
 *
 * Use this decorator to exclude certain mutations from CSRF protection.
 * Common use cases:
 * - Login mutation (user doesn't have CSRF token yet)
 * - Register mutation (new users don't have session)
 * - Public API endpoints
 *
 * @example
 * ```typescript
 * @Mutation(() => AuthPayload)
 * @SkipCsrf()
 * async login(@Args('input') input: LoginInput) {
 *   // ...
 * }
 * ```
 */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);

/**
 * Metadata key for requiring CSRF validation
 * Can be used to explicitly require CSRF on a query (unusual case)
 */
export const REQUIRE_CSRF_KEY = 'requireCsrf';

/**
 * Decorator to explicitly require CSRF validation
 *
 * Normally not needed since the guard validates all mutations by default.
 * Use this only if you need to require CSRF for a query (unusual case).
 *
 * @example
 * ```typescript
 * @Query(() => SensitiveData)
 * @RequireCsrf()
 * async getSensitiveData() {
 *   // ...
 * }
 * ```
 */
export const RequireCsrf = () => SetMetadata(REQUIRE_CSRF_KEY, true);
