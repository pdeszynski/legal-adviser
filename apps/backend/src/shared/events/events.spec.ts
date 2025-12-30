import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { UserCreatedEvent, DocumentGenerationCompletedEvent } from './examples';

/**
 * Type for received events in tests
 */
type ReceivedEvent =
  | { type: 'user.created'; event: UserCreatedEvent }
  | {
      type: 'document.generation.completed';
      event: DocumentGenerationCompletedEvent;
    };

/**
 * Test listener service to verify event handling
 */
@Injectable()
class TestEventListener {
  public receivedEvents: ReceivedEvent[] = [];

  @OnEvent('user.created')
  handleUserCreated(event: UserCreatedEvent) {
    this.receivedEvents.push({ type: 'user.created', event });
  }

  @OnEvent('document.generation.completed')
  handleDocumentGenerated(event: DocumentGenerationCompletedEvent) {
    this.receivedEvents.push({
      type: 'document.generation.completed',
      event,
    });
  }

  reset() {
    this.receivedEvents = [];
  }
}

describe('EventEmitter Integration', () => {
  let eventEmitter: EventEmitter2;
  let listener: TestEventListener;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot({
          wildcard: true,
          maxListeners: 20,
        }),
      ],
      providers: [TestEventListener],
    }).compile();

    await module.init(); // Initialize the module to register event listeners

    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    listener = module.get<TestEventListener>(TestEventListener);
  });

  afterEach(async () => {
    listener.reset();
    await module.close();
  });

  describe('User Events', () => {
    it('should emit and receive user.created event', () => {
      const event = new UserCreatedEvent(
        'user-123',
        'test@example.com',
        new Date(),
      );

      eventEmitter.emit('user.created', event);

      expect(listener.receivedEvents).toHaveLength(1);
      const receivedEvent = listener.receivedEvents[0];
      expect(receivedEvent.type).toBe('user.created');
      if (receivedEvent.type === 'user.created') {
        expect(receivedEvent.event.userId).toBe('user-123');
        expect(receivedEvent.event.email).toBe('test@example.com');
      }
    });

    it('should include event metadata', () => {
      const event = new UserCreatedEvent('user-123', 'test@example.com');

      expect(event.eventId).toBeDefined();
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.eventName).toBe('user.created');
    });

    it('should serialize event to JSON', () => {
      const event = new UserCreatedEvent('user-123', 'test@example.com');
      const json = event.toJSON();

      expect(json).toHaveProperty('eventId');
      expect(json).toHaveProperty('eventName', 'user.created');
      expect(json).toHaveProperty('timestamp');
      expect(json).toHaveProperty('userId', 'user-123');
      expect(json).toHaveProperty('email', 'test@example.com');
    });
  });

  describe('Document Events', () => {
    it('should emit and receive document.generation.completed event', () => {
      const event = new DocumentGenerationCompletedEvent(
        'doc-456',
        'user-123',
        'lawsuit',
        5000,
      );

      eventEmitter.emit('document.generation.completed', event);

      expect(listener.receivedEvents).toHaveLength(1);
      const receivedEvent = listener.receivedEvents[0];
      expect(receivedEvent.type).toBe('document.generation.completed');
      if (receivedEvent.type === 'document.generation.completed') {
        expect(receivedEvent.event.documentId).toBe('doc-456');
        expect(receivedEvent.event.generationTimeMs).toBe(5000);
      }
    });

    it('should include generation metadata in payload', () => {
      const event = new DocumentGenerationCompletedEvent(
        'doc-456',
        'user-123',
        'lawsuit',
        5000,
      );
      const json = event.toJSON();

      expect(json).toHaveProperty('documentId', 'doc-456');
      expect(json).toHaveProperty('userId', 'user-123');
      expect(json).toHaveProperty('documentType', 'lawsuit');
      expect(json).toHaveProperty('generationTimeMs', 5000);
    });
  });

  describe('Multiple Events', () => {
    it('should handle multiple events independently', () => {
      const userEvent = new UserCreatedEvent('user-123', 'test@example.com');
      const docEvent = new DocumentGenerationCompletedEvent(
        'doc-456',
        'user-123',
        'lawsuit',
        5000,
      );

      eventEmitter.emit('user.created', userEvent);
      eventEmitter.emit('document.generation.completed', docEvent);

      expect(listener.receivedEvents).toHaveLength(2);
      expect(listener.receivedEvents[0].type).toBe('user.created');
      expect(listener.receivedEvents[1].type).toBe(
        'document.generation.completed',
      );
    });
  });

  describe('Event ID Uniqueness', () => {
    it('should generate unique event IDs', () => {
      const event1 = new UserCreatedEvent('user-1', 'test1@example.com');
      const event2 = new UserCreatedEvent('user-2', 'test2@example.com');

      expect(event1.eventId).not.toBe(event2.eventId);
    });
  });
});
