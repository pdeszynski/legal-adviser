/**
 * PRESENTATION LAYER
 *
 * This layer contains components that handle external communication
 * with the application (HTTP controllers, GraphQL resolvers, etc.)
 *
 * Dependency Rules:
 * - CAN depend on: Application layer (use cases, DTOs)
 * - CANNOT depend on: Domain layer directly, Infrastructure layer
 *
 * Components:
 * - GraphQL: Resolvers, GraphQL DTOs
 * - REST: Controllers, REST DTOs
 */

export * from './graphql';
export * from './rest';
