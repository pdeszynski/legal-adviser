import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import {
  AuthPayload,
  RefreshTokenPayload,
  AuthUserPayload,
  UpdateProfileInput,
  ChangePasswordInput,
} from './dto/auth.graphql-dto';
import { AppLogger } from '../../shared/logger';

export interface UserPayload {
  userId: string;
  username: string;
  email: string;
  roles: string[];
}

export interface LoginResponse {
  access_token: string;
}

/**
 * JWT Token payload structure
 */
interface JwtTokenPayload {
  sub: string;
  username: string;
  email: string;
  roles: string[];
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  private readonly logger = new AppLogger({});
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {
    this.logger.setContext('AuthService');
  }

  /**
   * Validate user credentials against the database
   * Uses bcrypt for secure password comparison
   */
  async validateUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<UserPayload | null> {
    // Use the UsersService to validate credentials
    const user = await this.usersService.validateUserCredentials(
      usernameOrEmail,
      password,
    );

    if (!user) {
      return null;
    }

    // Map User entity to UserPayload
    return {
      userId: user.id,
      username: user.username || user.email,
      email: user.email,
      roles: [user.role || 'user'], // Use role from database
    };
  }

  /**
   * Generate JWT token for authenticated user
   */
  login(user: UserPayload): LoginResponse {
    const payload = {
      username: user.username,
      email: user.email,
      sub: user.userId,
      roles: user.roles,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Register a new user with email, username, and password
   * Password is automatically hashed using bcrypt
   */
  async register(data: {
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    password: string;
  }): Promise<User> {
    return this.usersService.createUser({
      email: data.email,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
    });
  }

  // ============================================
  // GraphQL Authentication Methods
  // ============================================

  /**
   * Generate access and refresh tokens for a user
   */
  private generateTokenPair(user: User): {
    accessToken: string;
    refreshToken: string;
  } {
    const basePayload = {
      sub: user.id,
      username: user.username || user.email,
      email: user.email,
      roles: [user.role || 'user'], // Use role from database
    };

    // Use type assertion to work around JwtService generic type issues
    const accessToken = this.jwtService.sign({
      ...basePayload,
      type: 'access' as const,
    });

    const refreshToken = this.jwtService.sign({
      ...basePayload,
      type: 'refresh' as const,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Map User entity to AuthUserPayload
   */
  private mapUserToAuthPayload(user: User): AuthUserPayload {
    return {
      id: user.id,
      email: user.email,
      username: user.username || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      isActive: user.isActive,
      disclaimerAccepted: user.disclaimerAccepted,
      disclaimerAcceptedAt: user.disclaimerAcceptedAt || undefined,
      role: user.role || 'user',
    };
  }

  /**
   * Login with credentials and return GraphQL AuthPayload
   * Used by GraphQL login mutation
   */
  async loginWithCredentials(
    usernameOrEmail: string,
    password: string,
  ): Promise<AuthPayload | null> {
    const user = await this.usersService.validateUserCredentials(
      usernameOrEmail,
      password,
    );

    if (!user) {
      return null;
    }

    const tokens = this.generateTokenPair(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.mapUserToAuthPayload(user),
    };
  }

  /**
   * Register a new user and return GraphQL AuthPayload
   * Used by GraphQL register mutation
   */
  async registerUser(data: {
    email: string;
    password: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<AuthPayload> {
    // Check if user with email already exists
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if username is taken
    if (data.username) {
      const existingUsername = await this.usersService.findByUsername(
        data.username,
      );
      if (existingUsername) {
        throw new ConflictException('Username is already taken');
      }
    }

    // Create new user
    const user = await this.usersService.createUser({
      email: data.email,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
    });

    const tokens = this.generateTokenPair(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.mapUserToAuthPayload(user),
    };
  }

  /**
   * Refresh tokens using a valid refresh token
   * Used by GraphQL refreshToken mutation
   */
  async refreshTokens(refreshToken: string): Promise<RefreshTokenPayload> {
    // Verify the refresh token
    const payload = this.jwtService.verify<JwtTokenPayload>(refreshToken);

    // Ensure it's a refresh token
    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Get the user
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Generate new token pair
    const tokens = this.generateTokenPair(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Get user by ID
   * Used by GraphQL me query
   */
  async getUserById(userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }

  /**
   * Accept disclaimer for a user
   * Used by GraphQL acceptDisclaimer mutation
   */
  async acceptDisclaimer(userId: string): Promise<User> {
    return this.usersService.acceptDisclaimer(userId);
  }

  /**
   * Update user profile
   * Used by GraphQL updateProfile mutation
   */
  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<User> {
    // Check if email is being changed and if it's already taken
    if (input.email) {
      const existingUser = await this.usersService.findByEmail(input.email);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email is already in use');
      }
    }

    // Check if username is being changed and if it's already taken
    if (input.username) {
      const existingUsername = await this.usersService.findByUsername(
        input.username,
      );
      if (existingUsername && existingUsername.id !== userId) {
        throw new ConflictException('Username is already taken');
      }
    }

    return this.usersService.updateUser(userId, {
      email: input.email,
      username: input.username,
      firstName: input.firstName,
      lastName: input.lastName,
    });
  }

  /**
   * Change user password
   * Used by GraphQL changePassword mutation
   */
  async changePassword(
    userId: string,
    input: ChangePasswordInput,
  ): Promise<void> {
    // Validate current password
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Get user with password hash for validation
    const userWithPassword =
      await this.usersService.findByUsernameOrEmailForAuth(user.email);
    if (!userWithPassword || !userWithPassword.passwordHash) {
      throw new BadRequestException('Unable to validate current password');
    }

    const isCurrentPasswordValid = await this.usersService.comparePassword(
      input.currentPassword,
      userWithPassword.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Update password
    await this.usersService.updatePassword(userId, input.newPassword);
  }
}
