/**
 * APPLICATION LAYER
 *
 * This layer contains the application's use cases (business workflows)
 * and application services that orchestrate domain objects.
 *
 * Dependency Rules:
 * - CAN depend on: Domain layer
 * - CANNOT depend on: Infrastructure layer, Presentation layer
 *
 * Components:
 * - Use Cases: Application-specific business rules
 * - DTOs: Data Transfer Objects for input/output
 * - Application Services: Orchestrators that coordinate between
 *   domain models, repositories, and external services
 *
 * Application Services:
 * - DocumentApplicationService: Document management operations
 * - UserApplicationService: User management operations
 * - QueryApplicationService: AI-powered legal query operations
 * - BillingApplicationService: Subscription and billing operations
 */

export * from './common';
export * from './documents';
export * from './users';
export * from './queries';
export * from './billing';
