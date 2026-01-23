import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import {
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { GqlThrottlerGuard } from '../../shared/throttler/gql-throttler.guard';
import { AuthService } from './auth.service';
import { SkipCsrf } from '../../shared/csrf';
import {
  LoginInput,
  RegisterInput,
  RefreshTokenInput,
  AuthPayload,
  RefreshTokenPayload,
  AuthUserPayload,
  UpdateProfileInput,
  ChangePasswordInput,
} from './dto/auth.graphql-dto';

/**
 * GraphQL Resolver for Authentication
 *
 * Handles authentication mutations: login, register, refreshToken
 * Following project constitution requirements for GraphQL-only API
 */
@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  /**
   * Mutation: User login
   * Validates credentials and returns JWT tokens
   * Note: CSRF skipped - user doesn't have token before authentication
   * Rate limited to prevent brute force attacks
   */
  @Mutation(() => AuthPayload, {
    name: 'login',
    description: 'Authenticate user with username/email and password',
  })
  @SkipCsrf()
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    const result = await this.authService.loginWithCredentials(
      input.username,
      input.password,
    );

    if (!result) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return result;
  }

  /**
   * Mutation: User registration
   * Creates a new user account and returns JWT tokens
   * Note: CSRF skipped - new users don't have token before registration
   * Rate limited to prevent spam registration
   */
  @Mutation(() => AuthPayload, {
    name: 'register',
    description: 'Register a new user account',
  })
  @SkipCsrf()
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async register(@Args('input') input: RegisterInput): Promise<AuthPayload> {
    try {
      const result = await this.authService.registerUser({
        email: input.email,
        password: input.password,
        username: input.username,
        firstName: input.firstName,
        lastName: input.lastName,
      });

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Registration failed');
    }
  }

  /**
   * Mutation: Refresh access token
   * Validates refresh token and returns new token pair
   * Note: CSRF skipped - refresh token itself provides security
   */
  @Mutation(() => RefreshTokenPayload, {
    name: 'refreshToken',
    description: 'Refresh access token using a valid refresh token',
  })
  @SkipCsrf()
  async refreshToken(
    @Args('input') input: RefreshTokenInput,
  ): Promise<RefreshTokenPayload> {
    try {
      const result = await this.authService.refreshTokens(input.refreshToken);
      return result;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Query: Get current authenticated user
   * Requires valid JWT token in Authorization header
   */
  @Query(() => AuthUserPayload, {
    name: 'me',
    description: 'Get current authenticated user information',
    nullable: true,
  })
  @UseGuards(GqlAuthGuard)
  async me(
    @Context() context: { req: { user: { userId: string } } },
  ): Promise<AuthUserPayload | null> {
    const userId = context.req.user?.userId;
    if (!userId) {
      return null;
    }

    const user = await this.authService.getUserById(userId);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      isActive: user.isActive,
      disclaimerAccepted: user.disclaimerAccepted,
      disclaimerAcceptedAt: user.disclaimerAcceptedAt || undefined,
      role: 'USER', // Default role
    };
  }

  /**
   * Mutation: Accept legal disclaimer
   * Records the user's acceptance of the legal disclaimer with timestamp
   */
  @Mutation(() => AuthUserPayload, {
    name: 'acceptDisclaimer',
    description: 'Accept the legal disclaimer for the current user',
  })
  @UseGuards(GqlAuthGuard)
  async acceptDisclaimer(
    @Context() context: { req: { user: { userId: string } } },
  ): Promise<AuthUserPayload> {
    const userId = context.req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const user = await this.authService.acceptDisclaimer(userId);

    return {
      id: user.id,
      email: user.email,
      username: user.username || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      isActive: user.isActive,
      disclaimerAccepted: user.disclaimerAccepted,
      disclaimerAcceptedAt: user.disclaimerAcceptedAt || undefined,
      role: 'USER', // Default role
    };
  }

  /**
   * Mutation: Update user profile
   * Updates email, username, firstName, or lastName for the current user
   */
  @Mutation(() => AuthUserPayload, {
    name: 'updateProfile',
    description: 'Update profile information for the current user',
  })
  @UseGuards(GqlAuthGuard)
  async updateProfile(
    @Context() context: { req: { user: { userId: string } } },
    @Args('input') input: UpdateProfileInput,
  ): Promise<AuthUserPayload> {
    const userId = context.req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const user = await this.authService.updateProfile(userId, input);

    return {
      id: user.id,
      email: user.email,
      username: user.username || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      isActive: user.isActive,
      disclaimerAccepted: user.disclaimerAccepted,
      disclaimerAcceptedAt: user.disclaimerAcceptedAt || undefined,
      role: 'USER', // Default role
    };
  }

  /**
   * Mutation: Change password
   * Updates the password for the current user after validating current password
   */
  @Mutation(() => Boolean, {
    name: 'changePassword',
    description: 'Change password for the current user',
  })
  @UseGuards(GqlAuthGuard)
  async changePassword(
    @Context() context: { req: { user: { userId: string } } },
    @Args('input') input: ChangePasswordInput,
  ): Promise<boolean> {
    const userId = context.req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    await this.authService.changePassword(userId, input);
    return true;
  }
}
