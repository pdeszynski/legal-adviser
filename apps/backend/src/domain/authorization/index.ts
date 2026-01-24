/**
 * Authorization Bounded Context
 *
 * This module implements Role-Based Access Control (RBAC) following DDD principles.
 * It contains:
 * - Role aggregate with enum-based roles and permission system
 * - Permission value objects for granular access control
 * - Domain events for role changes
 * - Role hierarchy and permission inheritance
 */

export * from './aggregates';
export * from './value-objects';
export * from './events';
export * from './repositories';
