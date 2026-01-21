import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DomainEventBus } from './domain-event-bus.service';
import { EventStore } from './entities/event-store.entity';
import { DomainEvent } from '../../domain/shared/base/domain-event.base';

// Test domain event
class TestDomainEvent extends DomainEvent {
  public readonly eventName = 'test.event';
  public readonly aggregateId = 'test-id';
  public readonly aggregateType = 'TestAggregate';

  constructor(public readonly data: string) {
    super();
  }

  toPayload() {
    return { data: this.data };
  }
}

describe('DomainEventBus', () => {
  let service: DomainEventBus;
  let eventEmitter: EventEmitter2;
  let domainEventQueue: any;

  beforeEach(async () => {
    const mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-id' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomainEventBus,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        // Use the InjectQueue decorator's token format
        {
          provide: 'BullQueue_domain-events',
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<DomainEventBus>(DomainEventBus);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    domainEventQueue = module.get('BullQueue_domain-events');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publish', () => {
    it('should publish event to EventEmitter2 and Bull queue', async () => {
      const event = new TestDomainEvent('test-data');

      await service.publish(event);

      // Verify EventEmitter2 was called
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'test.event',
        event,
      );

      // Verify Bull queue was called
      expect(domainEventQueue.add).toHaveBeenCalledWith(
        'test.event',
        expect.objectContaining({
          eventId: event.eventId,
          eventName: 'test.event',
          payload: { data: 'test-data' },
        }),
        expect.objectContaining({
          attempts: 3,
        }),
      );
    });

    it('should handle queue errors gracefully', async () => {
      const event = new TestDomainEvent('test-data');
      domainEventQueue.add.mockRejectedValue(new Error('Queue error'));

      await expect(service.publish(event)).rejects.toThrow('Queue error');
    });
  });

  describe('publishBatch', () => {
    it('should publish multiple events', async () => {
      const events = [
        new TestDomainEvent('data-1'),
        new TestDomainEvent('data-2'),
        new TestDomainEvent('data-3'),
      ];

      await service.publishBatch(events);

      // Verify all events were published
      expect(eventEmitter.emit).toHaveBeenCalledTimes(3);
      expect(domainEventQueue.add).toHaveBeenCalledTimes(3);
    });

    it('should handle empty batch', async () => {
      await service.publishBatch([]);

      expect(eventEmitter.emit).not.toHaveBeenCalled();
      expect(domainEventQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('publishAggregateEvents', () => {
    it('should publish and clear aggregate events', async () => {
      const event1 = new TestDomainEvent('data-1');
      const event2 = new TestDomainEvent('data-2');

      const mockAggregate = {
        domainEvents: [event1, event2],
        clearDomainEvents: jest.fn().mockReturnValue([event1, event2]),
      };

      await service.publishAggregateEvents(mockAggregate);

      expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
      expect(domainEventQueue.add).toHaveBeenCalledTimes(2);
      expect(mockAggregate.clearDomainEvents).toHaveBeenCalled();
    });

    it('should handle aggregates with no events', async () => {
      const mockAggregate = {
        domainEvents: [],
        clearDomainEvents: jest.fn().mockReturnValue([]),
      };

      await service.publishAggregateEvents(mockAggregate);

      expect(eventEmitter.emit).not.toHaveBeenCalled();
      expect(domainEventQueue.add).not.toHaveBeenCalled();
      expect(mockAggregate.clearDomainEvents).not.toHaveBeenCalled();
    });
  });

  describe('publishWithOutbox', () => {
    it('should execute transaction callback and publish events', async () => {
      const events = [new TestDomainEvent('data-1')];
      const transactionResult = { id: 'entity-id', data: 'test' };

      const callback = jest.fn().mockResolvedValue(transactionResult);

      const result = await service.publishWithOutbox(events, callback);

      expect(callback).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('test.event', events[0]);
      expect(domainEventQueue.add).toHaveBeenCalled();
      expect(result).toEqual(transactionResult);
    });
  });
});
