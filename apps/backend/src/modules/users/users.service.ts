import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserSession, SessionMode } from './entities/user-session.entity';
import { UserRole, LEGACY_ROLE_MAP } from '../auth/enums/user-role.enum';
import {
  UserCreatedEvent,
  UserUpdatedEvent,
} from '../../shared/events/examples/user.events';
import { EVENT_PATTERNS } from '../../shared/events/base/event-patterns';

/**
 * Number of salt rounds for bcrypt hashing
 * 10 is a good balance between security and performance
 */
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Users Service
 *
 * Provides CRUD operations for User and UserSession entities.
 * Emits domain events for inter-module communication.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Hash a plain text password using bcrypt
   */
  async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
  }

  /**
   * Compare a plain text password with a hashed password
   */
  async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Create a new user
   */
  async createUser(data: {
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
  }): Promise<User> {
    const user = this.userRepository.create({
      email: data.email,
      username: data.username || null,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      isActive: true,
      passwordHash: data.password
        ? await this.hashPassword(data.password)
        : null,
    });

    const savedUser = await this.userRepository.save(user);

    // Emit domain event
    this.eventEmitter.emit(
      EVENT_PATTERNS.USER.CREATED,
      new UserCreatedEvent(savedUser.id, savedUser.email, savedUser.createdAt),
    );

    return savedUser;
  }

  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * Find a user by ID with 2FA fields included
   * Includes twoFactorSecret and twoFactorBackupCodes which are normally excluded
   */
  async findByIdWith2FA(id: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.twoFactorSecret')
      .addSelect('user.twoFactorBackupCodes')
      .addSelect('user.twoFactorEnabled')
      .addSelect('user.twoFactorVerifiedAt')
      .addSelect('user.failed2faAttempts')
      .addSelect('user.lockedUntil')
      .where('user.id = :id', { id })
      .getOne();
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Find a user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  /**
   * Find a user by username or email for authentication
   * Includes the passwordHash field which is normally excluded
   */
  async findByUsernameOrEmailForAuth(
    usernameOrEmail: string,
  ): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.username = :usernameOrEmail', { usernameOrEmail })
      .orWhere('user.email = :usernameOrEmail', { usernameOrEmail })
      .getOne();
  }

  /**
   * Validate user credentials
   * Returns the user if credentials are valid, null otherwise
   */
  async validateUserCredentials(
    usernameOrEmail: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.findByUsernameOrEmailForAuth(usernameOrEmail);

    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await this.comparePassword(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return null;
    }

    // Check if user is active
    if (!user.isActive) {
      return null;
    }

    return user;
  }

  /**
   * Update user's password
   */
  async updatePassword(userId: string, newPassword: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const passwordHash = await this.hashPassword(newPassword);
    user.passwordHash = passwordHash;

    return this.userRepository.save(user);
  }

  /**
   * Find all users
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update a user
   */
  async updateUser(
    id: string,
    data: Partial<{
      email: string;
      username: string;
      firstName: string;
      lastName: string;
      isActive: boolean;
      disclaimerAccepted: boolean;
      twoFactorSecret: string | null;
      twoFactorBackupCodes: string | null;
      twoFactorEnabled: boolean;
      twoFactorVerifiedAt: Date | null;
      failed2faAttempts: number;
      lockedUntil: Date | null;
      tokenVersion: number;
    }>,
  ): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    type UpdateableFields = keyof typeof data;
    const updatedFields: string[] = [];

    (Object.keys(data) as UpdateableFields[]).forEach((key) => {
      if (data[key] !== undefined && user[key] !== data[key]) {
        // Type assertion is safe here as we know the key exists in both objects
        (user as unknown as Record<string, unknown>)[key] = data[key];
        updatedFields.push(key);
      }
    });

    const savedUser = await this.userRepository.save(user);

    // Emit domain event if any fields were updated
    if (updatedFields.length > 0) {
      this.eventEmitter.emit(
        EVENT_PATTERNS.USER.UPDATED,
        new UserUpdatedEvent(savedUser.id, updatedFields),
      );
    }

    return savedUser;
  }

  /**
   * Create a new user session
   */
  async createSession(
    userId: string,
    mode: SessionMode = SessionMode.SIMPLE,
  ): Promise<UserSession> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const session = this.sessionRepository.create({
      userId,
      mode,
      startedAt: new Date(),
      endedAt: null,
    });

    return this.sessionRepository.save(session);
  }

  /**
   * Find a session by ID
   */
  async findSessionById(id: string): Promise<UserSession | null> {
    return this.sessionRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  /**
   * Find active sessions for a user
   */
  async findActiveSessionsByUserId(userId: string): Promise<UserSession[]> {
    return this.sessionRepository.find({
      where: {
        userId,
        endedAt: IsNull(),
      },
      order: {
        startedAt: 'DESC',
      },
    });
  }

  /**
   * Accept disclaimer for a user
   * Sets disclaimerAccepted to true and records the acceptance timestamp
   */
  async acceptDisclaimer(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.disclaimerAccepted = true;
    user.disclaimerAcceptedAt = new Date();
    return this.userRepository.save(user);
  }

  /**
   * Update session mode
   */
  async updateSessionMode(
    sessionId: string,
    mode: SessionMode,
  ): Promise<UserSession> {
    const session = await this.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    session.mode = mode;
    return this.sessionRepository.save(session);
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<UserSession> {
    const session = await this.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    session.end();
    return this.sessionRepository.save(session);
  }

  /**
   * Suspend a user account (admin only)
   * Sets isActive to false
   */
  async suspendUser(
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reason: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    suspendedBy: string,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.isActive = false;
    const savedUser = await this.userRepository.save(user);

    // Emit domain event for suspension
    this.eventEmitter.emit(
      EVENT_PATTERNS.USER.UPDATED,
      new UserUpdatedEvent(userId, ['isActive', 'suspension']),
    );

    return savedUser;
  }

  /**
   * Activate a user account (admin only)
   * Sets isActive to true
   */
  async activateUser(
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    activatedBy: string,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.isActive = true;
    const savedUser = await this.userRepository.save(user);

    // Emit domain event for activation
    this.eventEmitter.emit(
      EVENT_PATTERNS.USER.UPDATED,
      new UserUpdatedEvent(userId, ['isActive']),
    );

    return savedUser;
  }

  /**
   * Change user role (admin only)
   * Updates user role to any valid UserRole
   * Supports legacy role names ('user', 'admin') for backwards compatibility
   */
  async changeUserRole(
    userId: string,
    newRole: UserRole | string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    changedBy: string,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Map legacy role names to UserRole enum values
    let normalizedRole: UserRole;
    if (typeof newRole === 'string' && newRole in LEGACY_ROLE_MAP) {
      normalizedRole = LEGACY_ROLE_MAP[newRole];
    } else if (Object.values(UserRole).includes(newRole as UserRole)) {
      normalizedRole = newRole as UserRole;
    } else {
      throw new NotFoundException(`Invalid role: ${newRole}`);
    }

    user.role = normalizedRole;
    const savedUser = await this.userRepository.save(user);

    // Emit domain event for role change
    this.eventEmitter.emit(
      EVENT_PATTERNS.USER.UPDATED,
      new UserUpdatedEvent(userId, ['role']),
    );

    return savedUser;
  }

  /**
   * Reset user password (admin only)
   * Resets the password to a new value
   */
  async resetUserPassword(
    userId: string,
    newPassword: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    resetBy: string,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const passwordHash = await this.hashPassword(newPassword);
    user.passwordHash = passwordHash;
    const savedUser = await this.userRepository.save(user);

    // Emit domain event for password reset
    this.eventEmitter.emit(
      EVENT_PATTERNS.USER.UPDATED,
      new UserUpdatedEvent(userId, ['password']),
    );

    return savedUser;
  }

  /**
   * Bulk operation result type
   */
  bulkResult<T>(): {
    success: T[];
    failed: Array<{ id: string; error: string }>;
  } {
    return { success: [], failed: [] };
  }

  /**
   * Bulk suspend users (admin only)
   */
  async bulkSuspendUsers(
    userIds: string[],
    reason: string,
    suspendedBy: string,
  ): Promise<{
    success: User[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const result = this.bulkResult<User>();

    for (const userId of userIds) {
      try {
        const user = await this.suspendUser(userId, reason, suspendedBy);
        result.success.push(user);
      } catch (error) {
        result.failed.push({
          id: userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Bulk activate users (admin only)
   */
  async bulkActivateUsers(
    userIds: string[],
    activatedBy: string,
  ): Promise<{
    success: User[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const result = this.bulkResult<User>();

    for (const userId of userIds) {
      try {
        const user = await this.activateUser(userId, activatedBy);
        result.success.push(user);
      } catch (error) {
        result.failed.push({
          id: userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Bulk change user roles (admin only)
   */
  async bulkChangeUserRoles(
    userIds: string[],
    newRole: UserRole | string,
    changedBy: string,
  ): Promise<{
    success: User[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const result = this.bulkResult<User>();

    for (const userId of userIds) {
      try {
        const user = await this.changeUserRole(userId, newRole, changedBy);
        result.success.push(user);
      } catch (error) {
        result.failed.push({
          id: userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Bulk delete users (admin only)
   */
  async bulkDeleteUsers(
    userIds: string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    deletedBy: string,
  ): Promise<{
    success: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const result: {
      success: string[];
      failed: Array<{ id: string; error: string }>;
    } = {
      success: [],
      failed: [],
    };

    for (const userId of userIds) {
      try {
        await this.userRepository.delete(userId);
        result.success.push(userId);
      } catch (error) {
        result.failed.push({
          id: userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Increment failed 2FA attempt counter
   * After 10 failed attempts, lock the account for 30 minutes
   */
  async incrementFailed2faAttempts(userId: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.failed2faAttempts')
      .addSelect('user.lockedUntil')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const MAX_FAILED_ATTEMPTS = 10;
    const LOCKOUT_DURATION_MINUTES = 30;

    user.failed2faAttempts = (user.failed2faAttempts || 0) + 1;

    if (user.failed2faAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(
        Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
      );
    }

    return this.userRepository.save(user);
  }

  /**
   * Reset failed 2FA attempt counter
   * Called after successful 2FA verification or admin reset
   */
  async resetFailed2faAttempts(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.updateUser(userId, {
      failed2faAttempts: 0,
      lockedUntil: null,
    });
  }

  /**
   * Check if user account is locked due to failed 2FA attempts
   */
  async is2faLocked(userId: string): Promise<boolean> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.lockedUntil')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user || !user.lockedUntil) {
      return false;
    }

    // Check if lockout has expired
    if (user.lockedUntil < new Date()) {
      // Reset if lockout has expired
      await this.resetFailed2faAttempts(userId);
      return false;
    }

    return true;
  }

  /**
   * Increment token version to invalidate all existing JWT tokens
   * Called when 2FA is disabled or security-sensitive changes occur
   */
  async incrementTokenVersion(userId: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.tokenVersion')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    return this.userRepository.save(user);
  }

  /**
   * Hash a backup code using bcrypt
   */
  async hashBackupCode(code: string): Promise<string> {
    return bcrypt.hash(
      code.toUpperCase().replace(/-/g, ''),
      BCRYPT_SALT_ROUNDS,
    );
  }

  /**
   * Verify a backup code against its hash
   */
  async verifyBackupCodeHash(
    plainCode: string,
    hashedCode: string,
  ): Promise<boolean> {
    return bcrypt.compare(
      plainCode.toUpperCase().replace(/-/g, ''),
      hashedCode,
    );
  }
}
