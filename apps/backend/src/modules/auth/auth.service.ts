import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { TwoFactorService } from './two-factor.service';
import { UserRole } from './enums/user-role.enum';
import {
  AuthPayload,
  RefreshTokenPayload,
  AuthUserPayload,
  UpdateProfileInput,
  ChangePasswordInput,
} from './dto/auth.graphql-dto';
import { AppLogger } from '../../shared/logger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRoleEntity } from '../authorization/entities';

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
  type: 'access' | 'refresh' | '2fa-temp';
}

/**
 * Two-factor temporary token payload
 */
interface TwoFactorTempTokenPayload {
  sub: string;
  username: string;
  email: string;
  type: '2fa-temp';
}

@Injectable()
export class AuthService {
  private readonly logger = new AppLogger({});
  private readonly TWO_FACTOR_TEMP_TOKEN_EXPIRY = '5m'; // 5 minutes

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private twoFactorService: TwoFactorService,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
  ) {
    this.logger.setContext('AuthService');
  }

  /**
   * Load user roles from UserRoleEntity table
   * Returns array of role type strings (e.g., ['admin', 'lawyer'])
   */
  private async getUserRoles(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId, isActive: true },
      relations: ['role'],
      order: { priority: 'ASC' },
    });

    return userRoles.map((ur) => ur.role?.type || 'client').filter(Boolean);
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

    // Load user roles from UserRoleEntity table
    const roles = await this.getUserRoles(user.id);

    // Map User entity to UserPayload
    return {
      userId: user.id,
      username: user.username || user.email,
      email: user.email,
      roles: roles.length > 0 ? roles : ['client'], // Default to client if no roles
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
  private async generateTokenPair(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Load user roles from UserRoleEntity table
    const roles = await this.getUserRoles(user.id);

    const basePayload = {
      sub: user.id,
      username: user.username || user.email,
      email: user.email,
      roles: roles.length > 0 ? roles : ['client'], // Default to client if no roles
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
   * Public method so it can be used by resolvers
   */
  async mapUserToAuthPayload(user: User): Promise<AuthUserPayload> {
    // Load user roles from UserRoleEntity table
    const roles = await this.getUserRoles(user.id);

    return {
      id: user.id,
      email: user.email,
      username: user.username || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      isActive: user.isActive,
      disclaimerAccepted: user.disclaimerAccepted,
      disclaimerAcceptedAt: user.disclaimerAcceptedAt || undefined,
      user_roles: roles.length > 0 ? roles : ['client'], // Default to client if no roles
    };
  }

  /**
   * Login with credentials and return GraphQL AuthPayload
   * Used by GraphQL login mutation
   * Supports two-factor authentication flow
   */
  async loginWithCredentials(
    usernameOrEmail: string,
    password: string,
    twoFactorToken?: string,
    backupCode?: string,
  ): Promise<AuthPayload | null> {
    const user = await this.usersService.validateUserCredentials(
      usernameOrEmail,
      password,
    );

    if (!user) {
      return null;
    }

    // Check if user has 2FA enabled
    if (user.twoFactorEnabled) {
      // If no 2FA token or backup code provided, return requiresTwoFactor response
      if (!twoFactorToken && !backupCode) {
        const tempToken = this.generateTwoFactorTempToken(user);
        return {
          accessToken: null,
          refreshToken: null,
          user: null,
          twoFactorTempToken: tempToken,
          requiresTwoFactor: true,
        };
      }

      // Validate TOTP token if provided
      if (twoFactorToken) {
        const isValid = await this.twoFactorService.verifyToken(
          user.id,
          twoFactorToken,
        );
        if (!isValid) {
          throw new UnauthorizedException('Invalid two-factor token');
        }
      }

      // Validate backup code if provided
      if (backupCode) {
        const isValid = await this.twoFactorService.verifyAndConsumeBackupCode(
          user.id,
          backupCode,
        );
        if (!isValid) {
          throw new UnauthorizedException('Invalid backup code');
        }
      }
    }

    const tokens = await this.generateTokenPair(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: await this.mapUserToAuthPayload(user),
      requiresTwoFactor: false,
    };
  }

  /**
   * Generate a temporary token for completing 2FA
   * Valid for 5 minutes
   */
  private generateTwoFactorTempToken(user: User): string {
    const payload: TwoFactorTempTokenPayload = {
      sub: user.id,
      username: user.username || user.email,
      email: user.email,
      type: '2fa-temp',
    };
    return this.jwtService.sign(payload, {
      expiresIn: this.TWO_FACTOR_TEMP_TOKEN_EXPIRY,
    });
  }

  /**
   * Validate a temporary 2FA token and return user ID
   * Used when completing 2FA login flow
   */
  async validateTwoFactorTempToken(tempToken: string): Promise<string | null> {
    try {
      const payload =
        this.jwtService.verify<TwoFactorTempTokenPayload>(tempToken);

      // Ensure it's a 2FA temp token
      if (payload.type !== '2fa-temp') {
        return null;
      }

      // Verify user still exists and 2FA is enabled
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.twoFactorEnabled) {
        return null;
      }

      return payload.sub;
    } catch {
      return null;
    }
  }

  /**
   * Complete 2FA login with temporary token and TOTP/backup code
   * Called when user submits 2FA token after initial login
   */
  async completeTwoFactorLogin(
    tempToken: string,
    twoFactorToken?: string,
    backupCode?: string,
  ): Promise<AuthPayload> {
    // Validate temp token and get user ID
    const userId = await this.validateTwoFactorTempToken(tempToken);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired temporary token');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Validate TOTP token if provided
    if (twoFactorToken) {
      const isValid = await this.twoFactorService.verifyToken(
        user.id,
        twoFactorToken,
      );
      if (!isValid) {
        throw new UnauthorizedException('Invalid two-factor token');
      }
    }

    // Validate backup code if provided
    if (backupCode) {
      const isValid = await this.twoFactorService.verifyAndConsumeBackupCode(
        user.id,
        backupCode,
      );
      if (!isValid) {
        throw new UnauthorizedException('Invalid backup code');
      }
    }

    const tokens = await this.generateTokenPair(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: await this.mapUserToAuthPayload(user),
      requiresTwoFactor: false,
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

    const tokens = await this.generateTokenPair(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: await this.mapUserToAuthPayload(user),
      requiresTwoFactor: false,
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
    const tokens = await this.generateTokenPair(user);

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
