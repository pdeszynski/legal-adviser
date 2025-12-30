/**
 * Event Naming Conventions
 *
 * This file documents the event naming patterns used throughout the application
 * to ensure consistency and discoverability.
 *
 * ## Pattern: `domain.entity.action`
 *
 * - **domain**: The business domain or module (e.g., user, document, chat, search)
 * - **entity**: The specific entity within the domain (optional for simple domains)
 * - **action**: The action that occurred (past tense: created, updated, deleted, etc.)
 *
 * ## Examples:
 *
 * ### User Domain
 * - `user.created` - A new user was created
 * - `user.updated` - User information was updated
 * - `user.deleted` - User was deleted
 * - `user.authenticated` - User successfully authenticated
 * - `user.session.started` - User session started
 * - `user.session.ended` - User session ended
 *
 * ### Document Domain
 * - `document.created` - A new document was created
 * - `document.generation.started` - AI document generation started
 * - `document.generation.completed` - AI document generation completed
 * - `document.generation.failed` - AI document generation failed
 * - `document.exported` - Document was exported to PDF
 * - `document.updated` - Document was updated
 * - `document.deleted` - Document was deleted
 *
 * ### Chat Domain
 * - `chat.query.submitted` - A legal query was submitted
 * - `chat.query.answered` - A legal query was answered
 * - `chat.session.created` - Chat session created
 * - `chat.session.ended` - Chat session ended
 *
 * ### Search Domain
 * - `search.ruling.requested` - Search for legal ruling was requested
 * - `search.ruling.found` - Legal ruling was found
 * - `search.ruling.notfound` - Legal ruling was not found
 *
 * ## Best Practices:
 *
 * 1. **Use lowercase**: All event names should be lowercase
 * 2. **Use dots as separators**: Separate domain, entity, and action with dots
 * 3. **Use past tense for actions**: Events represent things that have happened
 * 4. **Be specific**: Include enough context to understand what happened
 * 5. **Keep it concise**: Avoid overly long event names
 * 6. **Document new patterns**: Add new event patterns to this file
 *
 * ## Inter-Module Communication:
 *
 * Events enable asynchronous, decoupled communication between modules:
 *
 * - **Publisher**: Module that emits the event (doesn't know who listens)
 * - **Subscriber**: Module that listens to the event (doesn't know who publishes)
 *
 * This pattern ensures modules remain independent and can be developed/tested in isolation.
 *
 * ## Example Usage:
 *
 * ```typescript
 * // In a service (publisher)
 * import { EventEmitter2 } from '@nestjs/event-emitter';
 * import { UserCreatedEvent } from './events/user-created.event';
 *
 * class UserService {
 *   constructor(private eventEmitter: EventEmitter2) {}
 *
 *   async createUser(data: CreateUserDto) {
 *     const user = await this.userRepository.save(data);
 *
 *     // Emit event - other modules can react to this
 *     this.eventEmitter.emit(
 *       'user.created',
 *       new UserCreatedEvent(user.id, user.email)
 *     );
 *
 *     return user;
 *   }
 * }
 *
 * // In another module (subscriber)
 * import { OnEvent } from '@nestjs/event-emitter';
 * import { UserCreatedEvent } from '../users/events/user-created.event';
 *
 * class NotificationService {
 *   @OnEvent('user.created')
 *   async handleUserCreated(event: UserCreatedEvent) {
 *     // Send welcome email
 *     await this.emailService.sendWelcomeEmail(event.email);
 *   }
 * }
 * ```
 */

export const EVENT_PATTERNS = {
  // User events
  USER: {
    CREATED: 'user.created',
    UPDATED: 'user.updated',
    DELETED: 'user.deleted',
    AUTHENTICATED: 'user.authenticated',
    SESSION_STARTED: 'user.session.started',
    SESSION_ENDED: 'user.session.ended',
  },

  // Document events
  DOCUMENT: {
    CREATED: 'document.created',
    UPDATED: 'document.updated',
    DELETED: 'document.deleted',
    GENERATION_STARTED: 'document.generation.started',
    GENERATION_COMPLETED: 'document.generation.completed',
    GENERATION_FAILED: 'document.generation.failed',
    EXPORTED: 'document.exported',
  },

  // Chat events
  CHAT: {
    QUERY_SUBMITTED: 'chat.query.submitted',
    QUERY_ANSWERED: 'chat.query.answered',
    SESSION_CREATED: 'chat.session.created',
    SESSION_ENDED: 'chat.session.ended',
  },

  // Search events
  SEARCH: {
    RULING_REQUESTED: 'search.ruling.requested',
    RULING_FOUND: 'search.ruling.found',
    RULING_NOT_FOUND: 'search.ruling.notfound',
  },
} as const;

// Type helper to get all event names
export type EventName =
  (typeof EVENT_PATTERNS)[keyof typeof EVENT_PATTERNS][keyof (typeof EVENT_PATTERNS)[keyof typeof EVENT_PATTERNS]];
