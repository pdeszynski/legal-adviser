import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserSession, SessionMode } from './entities/user-session.entity';
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
    reason: string,
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
  async activateUser(userId: string, activatedBy: string): Promise<User> {
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
   * Updates user role to 'user' or 'admin'
   */
  async changeUserRole(
    userId: string,
    newRole: 'user' | 'admin',
    changedBy: string,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.role = newRole;
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
}
