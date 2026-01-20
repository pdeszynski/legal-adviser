import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { AuthPayload, RefreshTokenPayload, AuthUserPayload } from './dto/auth.graphql-dto';

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
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

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
    // Default role is 'user', can be extended with a roles table in the future
    return {
      userId: user.id,
      username: user.username || user.email,
      email: user.email,
      roles: ['user'], // Default role, can be extended with user roles from DB
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
      roles: ['user'], // Default role
    };

    // Use type assertion to work around JwtService generic type issues
    const accessToken = this.jwtService.sign(
      { ...basePayload, type: 'access' as const },
    );

    const refreshToken = this.jwtService.sign(
      { ...basePayload, type: 'refresh' as const },
    );

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
}
