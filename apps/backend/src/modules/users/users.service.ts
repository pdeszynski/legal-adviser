import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from './entities/user.entity';
import { UserSession, SessionMode } from './entities/user-session.entity';
import {
  UserCreatedEvent,
  UserUpdatedEvent,
} from '../../shared/events/examples/user.events';
import { EVENT_PATTERNS } from '../../shared/events/base/event-patterns';

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
   * Create a new user
   */
  async createUser(data: {
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    const user = this.userRepository.create({
      email: data.email,
      username: data.username || null,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      isActive: true,
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
   */
  async acceptDisclaimer(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.disclaimerAccepted = true;
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
}
