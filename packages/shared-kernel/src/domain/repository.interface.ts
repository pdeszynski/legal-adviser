import { AggregateRoot } from './aggregate-root.base';

/**
 * Generic Repository interface for Domain-Driven Design
 * Repositories provide collection-like interface for accessing aggregates
 */
export interface IRepository<T extends AggregateRoot<TId>, TId> {
  findById(id: TId): Promise<T | null>;
  save(aggregate: T): Promise<void>;
  delete(id: TId): Promise<void>;
}

/**
 * Extended repository interface with common query methods
 */
export interface IExtendedRepository<T extends AggregateRoot<TId>, TId>
  extends IRepository<T, TId> {
  findAll(): Promise<T[]>;
  exists(id: TId): Promise<boolean>;
  count(): Promise<number>;
}

/**
 * Unit of Work interface for transaction management
 */
export interface IUnitOfWork {
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
