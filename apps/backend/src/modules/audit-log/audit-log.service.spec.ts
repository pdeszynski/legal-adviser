import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditLogService, AuditLogCreatedEvent } from './audit-log.service';
import {
  AuditLog,
  AuditActionType,
  AuditResourceType,
} from './entities/audit-log.entity';
import { EVENT_PATTERNS } from '../../shared/events/base/event-patterns';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let repository: jest.Mocked<Repository<AuditLog>>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockAuditLog: AuditLog = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    action: AuditActionType.CREATE,
    resourceType: AuditResourceType.DOCUMENT,
    resourceId: '123e4567-e89b-12d3-a456-426614174001',
    userId: '123e4567-e89b-12d3-a456-426614174002',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    statusCode: 200,
    errorMessage: null,
    changeDetails: null,
    user: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isSuccessful: jest.fn().mockReturnValue(true),
    isFailed: jest.fn().mockReturnValue(false),
    isWriteOperation: jest.fn().mockReturnValue(true),
    getActionDescription: jest.fn().mockReturnValue('CREATE on DOCUMENT'),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    repository = module.get(getRepositoryToken(AuditLog));
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an audit log entry', async () => {
      const createDto = {
        action: AuditActionType.CREATE,
        resourceType: AuditResourceType.DOCUMENT,
        resourceId: '123e4567-e89b-12d3-a456-426614174001',
        userId: '123e4567-e89b-12d3-a456-426614174002',
        ipAddress: '192.168.1.1',
        statusCode: 200,
      };

      repository.create.mockReturnValue(mockAuditLog);
      repository.save.mockResolvedValue(mockAuditLog);

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith({
        action: createDto.action,
        resourceType: createDto.resourceType,
        resourceId: createDto.resourceId,
        userId: createDto.userId,
        ipAddress: createDto.ipAddress,
        userAgent: null,
        statusCode: createDto.statusCode,
        errorMessage: null,
        changeDetails: null,
      });
      expect(repository.save).toHaveBeenCalledWith(mockAuditLog);
      expect(result).toEqual(mockAuditLog);
    });

    it('should emit AuditLogCreatedEvent after creation', async () => {
      const createDto = {
        action: AuditActionType.CREATE,
        resourceType: AuditResourceType.DOCUMENT,
      };

      repository.create.mockReturnValue(mockAuditLog);
      repository.save.mockResolvedValue(mockAuditLog);

      await service.create(createDto);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EVENT_PATTERNS.AUDIT_LOG.CREATED,
        expect.any(AuditLogCreatedEvent),
      );
    });
  });

  describe('logAction', () => {
    it('should create an audit log with simplified parameters', async () => {
      repository.create.mockReturnValue(mockAuditLog);
      repository.save.mockResolvedValue(mockAuditLog);

      const result = await service.logAction(
        AuditActionType.UPDATE,
        AuditResourceType.USER,
        {
          resourceId: '123e4567-e89b-12d3-a456-426614174001',
          userId: '123e4567-e89b-12d3-a456-426614174002',
          ipAddress: '10.0.0.1',
        },
      );

      expect(repository.create).toHaveBeenCalled();
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('findById', () => {
    it('should find an audit log by ID', async () => {
      repository.findOne.mockResolvedValue(mockAuditLog);

      const result = await service.findById(mockAuditLog.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockAuditLog.id },
        relations: ['user'],
      });
      expect(result).toEqual(mockAuditLog);
    });

    it('should return null if audit log not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find audit logs by user ID', async () => {
      repository.find.mockResolvedValue([mockAuditLog]);

      const result = await service.findByUserId(mockAuditLog.userId!);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: mockAuditLog.userId },
        relations: ['user'],
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual([mockAuditLog]);
    });
  });

  describe('findByResource', () => {
    it('should find audit logs by resource type and ID', async () => {
      repository.find.mockResolvedValue([mockAuditLog]);

      const result = await service.findByResource(
        AuditResourceType.DOCUMENT,
        mockAuditLog.resourceId!,
      );

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          resourceType: AuditResourceType.DOCUMENT,
          resourceId: mockAuditLog.resourceId,
        },
        relations: ['user'],
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual([mockAuditLog]);
    });
  });

  describe('findByAction', () => {
    it('should find audit logs by action type', async () => {
      repository.find.mockResolvedValue([mockAuditLog]);

      const result = await service.findByAction(AuditActionType.CREATE);

      expect(repository.find).toHaveBeenCalledWith({
        where: { action: AuditActionType.CREATE },
        relations: ['user'],
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual([mockAuditLog]);
    });
  });

  describe('countByAction', () => {
    it('should count audit logs by action type', async () => {
      repository.count.mockResolvedValue(5);

      const result = await service.countByAction(AuditActionType.CREATE);

      expect(repository.count).toHaveBeenCalledWith({
        where: { action: AuditActionType.CREATE },
      });
      expect(result).toBe(5);
    });
  });

  describe('countByUser', () => {
    it('should count audit logs by user ID', async () => {
      repository.count.mockResolvedValue(10);

      const result = await service.countByUser(mockAuditLog.userId!);

      expect(repository.count).toHaveBeenCalledWith({
        where: { userId: mockAuditLog.userId },
      });
      expect(result).toBe(10);
    });
  });
});
