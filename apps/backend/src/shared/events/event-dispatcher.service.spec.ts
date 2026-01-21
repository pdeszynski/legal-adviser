import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventDispatcherService } from './event-dispatcher.service';
import { EventStore } from './entities/event-store.entity';

describe('EventDispatcherService', () => {
  let service: EventDispatcherService;
  let eventStoreRepository: jest.Mocked<Repository<EventStore>>;
  let domainEventQueue: any;

  beforeEach(async () => {
    const mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-id' }),
    };

    const mockRepository = {
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventDispatcherService,
        {
          provide: getRepositoryToken(EventStore),
          useValue: mockRepository,
        },
        // Use the InjectQueue decorator's token format
        {
          provide: 'BullQueue_domain-events',
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<EventDispatcherService>(EventDispatcherService);
    eventStoreRepository = module.get(getRepositoryToken(EventStore));
    domainEventQueue = module.get('BullQueue_domain-events');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processPendingEvents', () => {
    it('should process pending events', async () => {
      const pendingEvents = [
        {
          id: '1',
          eventId: 'event-1',
          eventName: 'test.event',
          eventVersion: 1,
          occurredAt: new Date(),
          payload: { data: 'test' },
          status: 'PENDING',
          attempts: 0,
          nextRetryAt: null,
        } as EventStore,
      ];

      eventStoreRepository.find.mockResolvedValue(pendingEvents);
      eventStoreRepository.save.mockResolvedValue({ ...pendingEvents[0], status: 'PUBLISHED' });

      await service.processPendingEvents();

      expect(eventStoreRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Array),
          order: { occurredAt: 'ASC' },
          take: 50,
        }),
      );
      expect(domainEventQueue.add).toHaveBeenCalled();
      expect(eventStoreRepository.save).toHaveBeenCalled();
    });

    it('should handle no pending events', async () => {
      eventStoreRepository.find.mockResolvedValue([]);

      await service.processPendingEvents();

      expect(domainEventQueue.add).not.toHaveBeenCalled();
    });

    it('should update event status to FAILED on queue error', async () => {
      const pendingEvent = {
        id: '1',
        eventId: 'event-1',
        eventName: 'test.event',
        eventVersion: 1,
        occurredAt: new Date(),
        payload: { data: 'test' },
        status: 'PENDING' as const,
        attempts: 0,
      } as EventStore;

      eventStoreRepository.find.mockResolvedValue([pendingEvent]);
      domainEventQueue.add.mockRejectedValue(new Error('Queue error'));
      eventStoreRepository.save.mockResolvedValue(pendingEvent);

      await service.processPendingEvents();

      const savedEvent = eventStoreRepository.save.mock.calls[0][0];
      expect(savedEvent.status).toBe('FAILED');
      expect(savedEvent.errorMessage).toBe('Queue error');
    });

    it('should schedule retry for failed events', async () => {
      const failedEvent = {
        id: '1',
        eventId: 'event-1',
        eventName: 'test.event',
        eventVersion: 1,
        occurredAt: new Date(),
        payload: { data: 'test' },
        status: 'FAILED' as const,
        attempts: 1,
        nextRetryAt: new Date(Date.now() - 1000),
      } as EventStore;

      eventStoreRepository.find.mockResolvedValue([failedEvent]);
      eventStoreRepository.save.mockResolvedValue(failedEvent);

      await service.processPendingEvents();

      expect(domainEventQueue.add).toHaveBeenCalled();
    });
  });

  describe('cleanupOldEvents', () => {
    it('should delete old published events', async () => {
      eventStoreRepository.delete.mockResolvedValue({ affected: 100, raw: {} });

      await service.cleanupOldEvents();

      expect(eventStoreRepository.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PUBLISHED',
        }),
      );
    });
  });

  describe('getStats', () => {
    it('should return event statistics', async () => {
      eventStoreRepository.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(2);

      const stats = await service.getStats();

      expect(stats).toEqual({
        pending: 10,
        published: 100,
        failed: 2,
      });

      expect(eventStoreRepository.count).toHaveBeenCalledTimes(3);
    });
  });
});
