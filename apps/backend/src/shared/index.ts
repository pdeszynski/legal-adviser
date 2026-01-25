/**
 * Shared modules for the backend application
 */

export * from './ai-client/ai-client.module';
export * from './ai-client/ai-client.service';
export * from './ai-client/ai-client.types';

// Event-driven architecture
export * from './events';

// Structured logging
export * from './logger';

// Two-factor authentication
export * from './totp';

// Encryption for sensitive data
export * from './encryption';

export * from '../modules/billing';
