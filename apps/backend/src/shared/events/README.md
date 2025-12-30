# Event-Driven Architecture Guide

This directory contains the event infrastructure for the Legal AI Platform backend. Events enable **asynchronous, decoupled communication** between modules in our modular monolith architecture.

## 📋 Table of Contents

- [Overview](#overview)
- [Event Naming Conventions](#event-naming-conventions)
- [Creating Events](#creating-events)
- [Emitting Events](#emitting-events)
- [Listening to Events](#listening-to-events)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Testing Events](#testing-events)

## 🎯 Overview

### Why Events?

In a **modular monolith**, we want to maintain strict boundaries between modules while still allowing them to communicate. Events provide:

1. **Decoupling**: Modules don't need to know about each other
2. **Flexibility**: Easy to add new listeners without modifying publishers
3. **Testability**: Modules can be tested in isolation
4. **Scalability**: Easy to extract modules to microservices later

### Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Module A  │────────▶│  EventEmitter2   │────────▶│   Module B  │
│ (Publisher) │  emit   │  (Event Bus)     │ listen  │ (Subscriber)│
└─────────────┘         └──────────────────┘         └─────────────┘
```

## 📝 Event Naming Conventions

All events follow the pattern: **`domain.entity.action`**

- **domain**: Business domain or module (e.g., `user`, `document`, `chat`)
- **entity**: Specific entity (optional for simple domains)
- **action**: Past tense action (e.g., `created`, `updated`, `deleted`)

### Examples

- `user.created` - A new user was created
- `document.generation.completed` - AI document generation completed
- `chat.query.submitted` - Legal query was submitted
- `search.ruling.found` - Legal ruling was found

See [`base/event-patterns.ts`](./base/event-patterns.ts) for the complete list.

## 🏗️ Creating Events

### Step 1: Define Your Event Class

All events should extend `BaseEvent`:

```typescript
import { BaseEvent, EVENT_PATTERNS } from '@/shared/events';

export class UserCreatedEvent extends BaseEvent {
  // Event name from patterns (or define custom)
  public readonly eventName = EVENT_PATTERNS.USER.CREATED;

  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    super(); // Initializes timestamp and eventId
  }

  // Include event-specific data in payload
  protected getPayload(): Record<string, any> {
    return {
      userId: this.userId,
      email: this.email,
    };
  }
}
```

### Step 2: Add to Event Patterns (if new domain)

If you're creating events for a new domain, add the pattern to `base/event-patterns.ts`:

```typescript
export const EVENT_PATTERNS = {
  // ... existing patterns ...

  MY_DOMAIN: {
    ACTION_HAPPENED: 'mydomain.action.happened',
  },
} as const;
```

## 📤 Emitting Events

### In Services

Inject `EventEmitter2` and emit events after state changes:

```typescript
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserCreatedEvent } from './events/user-created.event';

@Injectable()
export class UserService {
  constructor(private eventEmitter: EventEmitter2) {}

  async createUser(data: CreateUserDto) {
    // 1. Perform the action
    const user = await this.userRepository.save(data);

    // 2. Emit the event
    this.eventEmitter.emit(
      'user.created',
      new UserCreatedEvent(user.id, user.email),
    );

    return user;
  }
}
```

### Synchronous vs Asynchronous

- **Synchronous** (default): Listeners execute immediately in order
- **Asynchronous**: Use `emitAsync()` for parallel execution

```typescript
// Synchronous (blocks until all listeners complete)
this.eventEmitter.emit('user.created', event);

// Asynchronous (doesn't wait for listeners)
await this.eventEmitter.emitAsync('user.created', event);
```

## 📥 Listening to Events

### Using @OnEvent Decorator

The simplest way to listen to events:

```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../users/events/user-created.event';

@Injectable()
export class NotificationService {
  @OnEvent('user.created')
  async handleUserCreated(event: UserCreatedEvent) {
    console.log(`New user created: ${event.email}`);
    await this.sendWelcomeEmail(event.email);
  }

  @OnEvent('user.created', { async: true })
  async logUserCreation(event: UserCreatedEvent) {
    // This runs asynchronously
    await this.auditLog.log('User created', event.toJSON());
  }
}
```

### Listener Options

```typescript
@OnEvent('event.name', {
  async: true,           // Run asynchronously
  suppressErrors: false, // Don't suppress errors
  priority: 10,          // Higher priority = runs first
})
async handleEvent(event: MyEvent) {
  // ...
}
```

## ✅ Best Practices

### 1. **Event Naming**

- ✅ Use lowercase: `user.created`
- ✅ Use past tense: `document.generated` (not `document.generate`)
- ✅ Be specific: `document.generation.failed` (not just `document.failed`)
- ❌ Avoid: `UserCreated`, `user_created`, `createUser`

### 2. **Event Payload**

- ✅ Include IDs, not full entities: `userId: string`
- ✅ Keep payload small and serializable
- ✅ Include timestamp (automatic via `BaseEvent`)
- ❌ Avoid: Large objects, circular references, functions

### 3. **Event Handlers**

- ✅ Keep handlers focused (single responsibility)
- ✅ Handle errors gracefully
- ✅ Make handlers idempotent (safe to run multiple times)
- ❌ Avoid: Long-running operations, blocking calls

### 4. **Module Boundaries**

- ✅ Emit events for significant state changes
- ✅ Listen to events from other modules
- ❌ **Never** directly import services from other modules
- ❌ **Never** emit events for internal module operations

### 5. **Testing**

- ✅ Test that events are emitted correctly
- ✅ Test event handlers in isolation
- ✅ Mock `EventEmitter2` in unit tests
- ✅ Use real events in integration tests

## 📚 Examples

### Example 1: User Registration Flow

```typescript
// users/user.service.ts
@Injectable()
export class UserService {
  constructor(private eventEmitter: EventEmitter2) {}

  async register(data: RegisterDto) {
    const user = await this.userRepository.save(data);

    // Emit event - other modules can react
    this.eventEmitter.emit(
      'user.created',
      new UserCreatedEvent(user.id, user.email),
    );

    return user;
  }
}

// notifications/notification.service.ts
@Injectable()
export class NotificationService {
  @OnEvent('user.created')
  async sendWelcomeEmail(event: UserCreatedEvent) {
    await this.emailService.send({
      to: event.email,
      subject: 'Welcome to Legal AI Platform',
      template: 'welcome',
    });
  }
}

// analytics/analytics.service.ts
@Injectable()
export class AnalyticsService {
  @OnEvent('user.created')
  async trackUserRegistration(event: UserCreatedEvent) {
    await this.analytics.track('User Registered', {
      userId: event.userId,
      timestamp: event.timestamp,
    });
  }
}
```

### Example 2: Document Generation Flow

```typescript
// documents/document.service.ts
@Injectable()
export class DocumentService {
  constructor(private eventEmitter: EventEmitter2) {}

  async generateDocument(userId: string, type: string) {
    const doc = await this.documentRepository.create({ userId, type });

    // Emit start event
    this.eventEmitter.emit(
      'document.generation.started',
      new DocumentGenerationStartedEvent(doc.id, userId, type),
    );

    try {
      const startTime = Date.now();
      const content = await this.aiClient.generateDocument(type);
      const duration = Date.now() - startTime;

      await this.documentRepository.update(doc.id, { content });

      // Emit success event
      this.eventEmitter.emit(
        'document.generation.completed',
        new DocumentGenerationCompletedEvent(doc.id, userId, type, duration),
      );
    } catch (error) {
      // Emit failure event
      this.eventEmitter.emit(
        'document.generation.failed',
        new DocumentGenerationFailedEvent(doc.id, userId, error.message),
      );
      throw error;
    }

    return doc;
  }
}

// notifications/notification.service.ts
@Injectable()
export class NotificationService {
  @OnEvent('document.generation.completed')
  async notifyDocumentReady(event: DocumentGenerationCompletedEvent) {
    // Notify user their document is ready
    await this.pushNotification(event.userId, 'Your document is ready!');
  }
}

// analytics/analytics.service.ts
@Injectable()
export class AnalyticsService {
  @OnEvent('document.generation.completed')
  async trackGenerationTime(event: DocumentGenerationCompletedEvent) {
    await this.metrics.recordTiming(
      'document.generation.duration',
      event.generationTimeMs,
      { type: event.documentType },
    );
  }
}
```

## 🧪 Testing Events

### Unit Testing Event Emission

```typescript
describe('UserService', () => {
  let service: UserService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should emit user.created event', async () => {
    const user = await service.createUser({ email: 'test@example.com' });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'user.created',
      expect.objectContaining({
        userId: user.id,
        email: user.email,
      }),
    );
  });
});
```

### Unit Testing Event Handlers

```typescript
describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [NotificationService],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should send welcome email on user.created', async () => {
    const event = new UserCreatedEvent('user-123', 'test@example.com');

    await service.handleUserCreated(event);

    // Assert email was sent
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
      }),
    );
  });
});
```

## 📖 Further Reading

- [NestJS Event Emitter Documentation](https://docs.nestjs.com/techniques/events)
- [EventEmitter2 Library](https://github.com/EventEmitter2/EventEmitter2)
- [Domain Events Pattern](https://martinfowler.com/eaaDev/DomainEvent.html)
- [Modular Monolith Architecture](https://www.kamilgrzybek.com/design/modular-monolith-primer/)

---

**Questions?** Check the [examples](./examples/) directory or reach out to the team.
