import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEventBus } from './domain-event-bus.service';
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
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomainEventBus,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DomainEventBus>(DomainEventBus);
    eventEmitter = module.get<EventEmitter2>(
      EventEmitter2,
    ) as jest.Mocked<EventEmitter2>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publish', () => {
    it('should publish event to EventEmitter2', async () => {
      const event = new TestDomainEvent('test-data');

      await service.publish(event);

      // Verify EventEmitter2 was called
      expect(eventEmitter.emit).toHaveBeenCalledWith('test.event', event);
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
    });

    it('should handle empty batch', async () => {
      await service.publishBatch([]);

      expect(eventEmitter.emit).not.toHaveBeenCalled();
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
      expect(mockAggregate.clearDomainEvents).toHaveBeenCalled();
    });

    it('should handle aggregates with no events', async () => {
      const mockAggregate = {
        domainEvents: [],
        clearDomainEvents: jest.fn().mockReturnValue([]),
      };

      await service.publishAggregateEvents(mockAggregate);

      expect(eventEmitter.emit).not.toHaveBeenCalled();
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
      expect(result).toEqual(transactionResult);
    });
  });
});
