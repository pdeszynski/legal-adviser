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
  // ===========================================
  // CORE DOMAIN EVENTS
  // ===========================================

  // User events (Users Context)
  USER: {
    CREATED: 'user.created',
    UPDATED: 'user.updated',
    DELETED: 'user.deleted',
    AUTHENTICATED: 'user.authenticated',
    PREFERENCES_UPDATED: 'user.preferences.updated',
    SESSION_STARTED: 'user.session.started',
    SESSION_ENDED: 'user.session.ended',
  },

  // Document events (Documents Context)
  DOCUMENT: {
    CREATED: 'document.created',
    UPDATED: 'document.updated',
    DELETED: 'document.deleted',
    GENERATION_STARTED: 'document.generation.started',
    GENERATION_COMPLETED: 'document.generation.completed',
    GENERATION_FAILED: 'document.generation.failed',
    EXPORTED: 'document.exported',
    SHARED: 'document.shared',
    PERMISSION_GRANTED: 'document.permission.granted',
    PERMISSION_REVOKED: 'document.permission.revoked',
    COMMENTED: 'document.commented',
    VERSION_CREATED: 'document.version.created',
  },

  // Legal Query events (Q&A Context)
  QUERY: {
    ASKED: 'query.asked',
    ANSWERED: 'query.answered',
    FAILED: 'query.failed',
  },

  // Chat events (Q&A Context - Session management)
  CHAT: {
    QUERY_SUBMITTED: 'chat.query.submitted',
    QUERY_ANSWERED: 'chat.query.answered',
    SESSION_CREATED: 'chat.session.created',
    SESSION_ENDED: 'chat.session.ended',
  },

  // Legal Ruling events (Case Law Context)
  RULING: {
    INDEXED: 'ruling.indexed',
    SEARCH_PERFORMED: 'ruling.search.performed',
    FOUND: 'ruling.found',
    NOT_FOUND: 'ruling.notfound',
  },

  // Search events (Case Law Context - legacy, use RULING instead)
  SEARCH: {
    RULING_REQUESTED: 'search.ruling.requested',
    RULING_FOUND: 'search.ruling.found',
    RULING_NOT_FOUND: 'search.ruling.notfound',
  },

  // Legal Analysis events (Analysis Context)
  ANALYSIS: {
    STARTED: 'analysis.started',
    COMPLETED: 'analysis.completed',
    FAILED: 'analysis.failed',
    GROUNDS_IDENTIFIED: 'analysis.grounds.identified',
  },

  // ===========================================
  // SUPPORTING DOMAIN EVENTS
  // ===========================================

  // Subscription events (Billing Context)
  SUBSCRIPTION: {
    CREATED: 'subscription.created',
    UPGRADED: 'subscription.upgraded',
    DOWNGRADED: 'subscription.downgraded',
    CANCELLED: 'subscription.cancelled',
    RENEWED: 'subscription.renewed',
    PAYMENT_FAILED: 'subscription.payment.failed',
  },

  // Usage events (Billing Context)
  USAGE: {
    RECORDED: 'usage.recorded',
    QUOTA_WARNING: 'usage.quota.warning',
    QUOTA_EXCEEDED: 'usage.quota.exceeded',
  },

  // API Key events (API Access Context)
  API_KEY: {
    CREATED: 'api_key.created',
    REVOKED: 'api_key.revoked',
    USED: 'api_key.used',
    RATE_LIMITED: 'api_key.rate_limited',
  },

  // Webhook events (Webhooks Context)
  WEBHOOK: {
    REGISTERED: 'webhook.registered',
    UNREGISTERED: 'webhook.unregistered',
    DELIVERED: 'webhook.delivered',
    DELIVERY_FAILED: 'webhook.delivery.failed',
  },

  // Notification events (Notifications Context)
  NOTIFICATION: {
    CREATED: 'notification.created',
    READ: 'notification.read',
    DISMISSED: 'notification.dismissed',
    EMAIL_SENT: 'notification.email.sent',
  },

  // Audit log events (Audit Context - listens to all, emits sparingly)
  AUDIT_LOG: {
    CREATED: 'audit_log.created',
  },

  // ===========================================
  // INFRASTRUCTURE EVENTS
  // ===========================================

  // Email events (Email Infrastructure)
  EMAIL: {
    QUEUED: 'email.queued',
    SENT: 'email.sent',
    FAILED: 'email.failed',
    BOUNCED: 'email.bounced',
  },

  // Queue events (Queue Infrastructure)
  QUEUE: {
    JOB_STARTED: 'queue.job.started',
    JOB_COMPLETED: 'queue.job.completed',
    JOB_FAILED: 'queue.job.failed',
  },
} as const;

// Type helper to get all event names
export type EventName =
  (typeof EVENT_PATTERNS)[keyof typeof EVENT_PATTERNS][keyof (typeof EVENT_PATTERNS)[keyof typeof EVENT_PATTERNS]];
