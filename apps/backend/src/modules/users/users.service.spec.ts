import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserSession, SessionMode } from './entities/user-session.entity';
import {
  UserCreatedEvent,
  UserUpdatedEvent,
} from '../../shared/events/examples/user.events';
import { EVENT_PATTERNS } from '../../shared/events/base/event-patterns';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockSessionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserSession),
          useValue: mockSessionRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    sessionRepository = module.get<Repository<UserSession>>(
      getRepositoryToken(UserSession),
    );
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user and emit UserCreatedEvent', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      };

      const createdUser = {
        id: 'user-123',
        ...userData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessions: [],
      };

      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);

      const result = await service.createUser(userData);

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: userData.email,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: true,
        passwordHash: null,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(createdUser);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        EVENT_PATTERNS.USER.CREATED,
        expect.any(UserCreatedEvent),
      );
      expect(result).toEqual(createdUser);
    });

    it('should handle nullable fields', async () => {
      const userData = {
        email: 'test@example.com',
      };

      const createdUser = {
        id: 'user-123',
        email: userData.email,
        username: null,
        firstName: null,
        lastName: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessions: [],
      };

      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);

      const result = await service.createUser(userData);

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: userData.email,
        username: null,
        firstName: null,
        lastName: null,
        isActive: true,
        passwordHash: null,
      });
      expect(result).toEqual(createdUser);
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findById('user-123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('test@example.com');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(user);
    });
  });

  describe('findByUsername', () => {
    it('should return a user by username', async () => {
      const user = {
        id: 'user-123',
        username: 'testuser',
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findByUsername('testuser');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(result).toEqual(user);
    });
  });

  describe('updateUser', () => {
    it('should update a user and emit UserUpdatedEvent', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'old@example.com',
        firstName: 'Old',
        lastName: 'Name',
      };

      const updatedUser = {
        ...existingUser,
        email: 'new@example.com',
        firstName: 'New',
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUser('user-123', {
        email: 'new@example.com',
        firstName: 'New',
      });

      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        EVENT_PATTERNS.USER.UPDATED,
        expect.any(UserUpdatedEvent),
      );
      expect(result.email).toBe('new@example.com');
      expect(result.firstName).toBe('New');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateUser('non-existent', { email: 'new@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not emit event if no fields changed', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue(existingUser);

      await service.updateUser('user-123', {
        email: 'test@example.com', // same value
      });

      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('createSession', () => {
    it('should create a session', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const session = {
        id: 'session-123',
        userId: 'user-123',
        mode: SessionMode.SIMPLE,
        startedAt: new Date(),
        endedAt: null,
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockSessionRepository.create.mockReturnValue(session);
      mockSessionRepository.save.mockResolvedValue(session);

      const result = await service.createSession(
        'user-123',
        SessionMode.SIMPLE,
      );

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(mockSessionRepository.create).toHaveBeenCalled();
      expect(mockSessionRepository.save).toHaveBeenCalled();
      expect(result).toEqual(session);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createSession('non-existent', SessionMode.SIMPLE),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findSessionById', () => {
    it('should return a session by id', async () => {
      const session = {
        id: 'session-123',
        userId: 'user-123',
      };

      mockSessionRepository.findOne.mockResolvedValue(session);

      const result = await service.findSessionById('session-123');

      expect(mockSessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        relations: ['user'],
      });
      expect(result).toEqual(session);
    });
  });

  describe('findActiveSessionsByUserId', () => {
    it('should return active sessions for a user', async () => {
      const sessions = [
        {
          id: 'session-1',
          userId: 'user-123',
          endedAt: null,
        },
        {
          id: 'session-2',
          userId: 'user-123',
          endedAt: null,
        },
      ];

      mockSessionRepository.find.mockResolvedValue(sessions);

      const result = await service.findActiveSessionsByUserId('user-123');

      expect(mockSessionRepository.find).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          endedAt: expect.objectContaining({ _type: 'isNull' }),
        },
        order: {
          startedAt: 'DESC',
        },
      });
      expect(result).toEqual(sessions);
    });
  });

  describe('acceptDisclaimer', () => {
    it('should accept disclaimer for a user', async () => {
      const user = {
        id: 'user-123',
        disclaimerAccepted: false,
      };

      const updatedUser = {
        ...user,
        disclaimerAccepted: true,
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.acceptDisclaimer('user-123');

      expect(user.disclaimerAccepted).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.acceptDisclaimer('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSessionMode', () => {
    it('should update session mode', async () => {
      const session = {
        id: 'session-123',
        mode: SessionMode.SIMPLE,
      };

      const updatedSession = {
        ...session,
        mode: SessionMode.LAWYER,
      };

      mockSessionRepository.findOne.mockResolvedValue(session);
      mockSessionRepository.save.mockResolvedValue(updatedSession);

      const result = await service.updateSessionMode(
        'session-123',
        SessionMode.LAWYER,
      );

      expect(session.mode).toBe(SessionMode.LAWYER);
      expect(mockSessionRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedSession);
    });

    it('should throw NotFoundException if session not found', async () => {
      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateSessionMode('non-existent', SessionMode.LAWYER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('endSession', () => {
    it('should end a session', async () => {
      const session = new UserSession();
      session.id = 'session-123';
      session.startedAt = new Date();
      session.endedAt = null;

      const updatedSession = {
        ...session,
        endedAt: new Date(),
      };

      mockSessionRepository.findOne.mockResolvedValue(session);
      mockSessionRepository.save.mockResolvedValue(updatedSession);

      const result = await service.endSession('session-123');

      expect(session.endedAt).toBeInstanceOf(Date);
      expect(mockSessionRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedSession);
    });

    it('should throw NotFoundException if session not found', async () => {
      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(service.endSession('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
