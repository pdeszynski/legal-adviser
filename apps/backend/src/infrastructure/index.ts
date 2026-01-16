/**
 * INFRASTRUCTURE LAYER
 *
 * This layer contains implementations of interfaces defined in the Domain layer.
 * It handles all external concerns like databases, APIs, file systems, etc.
 *
 * Dependency Rules:
 * - CAN depend on: Domain layer (for interfaces), Application layer
 * - CANNOT depend on: Presentation layer
 *
 * Components:
 * - Persistence: Database repositories, ORM entities, mappers
 * - External: External API clients, third-party service adapters
 * - Messaging: Message queue implementations
 */

export * from './persistence';
