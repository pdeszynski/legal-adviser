/**
 * Anti-Corruption Layer
 *
 * Provides isolation between the domain model and external APIs.
 * Changes in external APIs should not propagate into the domain layer.
 *
 * Architecture:
 * - Domain Layer: Pure business models (LegalRulingDto, AIAnswerResponse, etc.)
 * - Transformer: Converts between domain and external API models
 * - Adapter: Executes HTTP requests with retry logic and error handling
 * - External Types: Exact representations of external API contracts
 */

export * from './base/interfaces';
export * from './ai-engine';
export * from './saos';
export * from './isap';
