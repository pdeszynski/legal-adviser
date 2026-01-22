# @legal/shared-kernel

Shared kernel package for the Legal AI Platform, containing common Domain-Driven Design (DDD) building blocks used across bounded contexts.

## Purpose

According to DDD principles, the **Shared Kernel** is the part of the domain model that is shared by multiple bounded contexts. It minimizes duplication while maintaining context independence.

## What's Included

### Domain Base Classes

- **`Entity<TId>`** - Base class for entities with identity and lifecycle
- **`AggregateRoot<TId>`** - Base class for aggregate roots with domain events
- **`ValueObject<T>`** - Base class for immutable value objects
- **`SimpleValueObject<T>`** - Base class for primitive-like value objects
- **`DomainEvent`** - Base class for domain events
- **`IntegrationEvent`** - Base class for cross-bounded context events
- **`IRepository<T, TId>`** - Repository interface
- **`IExtendedRepository<T, TId>`** - Extended repository with query methods
- **`IUnitOfWork`** - Unit of Work interface for transactions

### Common Value Objects

- **`Email`** - Email address with validation
- **`Uuid`** - UUID identifier with validation
- **`Money`** - Monetary value with currency support
- **`DateRange`** - Date range with overlap and containment checks

### Functional Types

- **`Result<T, E>`** - Type-safe result pattern for operations that can fail
- **`Option<T>`** - Type-safe option type for nullable/optional values

## Usage

### Importing

```typescript
// Import from the shared-kernel package
import {
  Entity,
  AggregateRoot,
  ValueObject,
  Email,
  Uuid,
  Money,
  Result,
  Option
} from '@legal/shared-kernel';
```

### Example: Creating a Value Object

```typescript
import { ValueObject } from '@legal/shared-kernel';

interface MoneyProps {
  amount: number;
  currency: string;
}

class Money extends ValueObject<MoneyProps> {
  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }
}
```

### Example: Creating an Entity

```typescript
import { Entity, Uuid } from '@legal/shared-kernel';

class User extends Entity<string> {
  constructor(
    id: string,
    private name: string,
    private email: Email
  ) {
    super(id);
  }

  // Business logic methods...
}
```

### Example: Using Result Type

```typescript
import { Result } from '@legal/shared-kernel';

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return Result.failure('Cannot divide by zero');
  }
  return Result.success(a / b);
}

const result = divide(10, 2);

if (result.isSuccess) {
  console.log('Result:', result.value);
} else {
  console.error('Error:', result.error);
}
```

### Example: Using Option Type

```typescript
import { Option } from '@legal/shared-kernel';

function findUser(id: string): Option<User> {
  const user = userRepository.findById(id);
  return Option.fromNullable(user);
}

const userOption = findUser('123');

const userName = userOption
  .map(user => user.name)
  .unwrapOr('Unknown User');
```

## Principles

1. **Minimize Sharing** - Only include truly shared concepts
2. **No Context-Specific Logic** - Keep the shared kernel generic
3. **Immutable Value Objects** - All value objects are immutable
4. **Type Safety** - Strong typing with TypeScript
5. **Functional Patterns** - Result and Option types for error handling

## Migration from Backend's Domain Shared

The backend's `apps/backend/src/domain/shared/base` now re-exports from this package. New code should import directly from `@legal/shared-kernel`.

**Before:**
```typescript
import { Entity, ValueObject } from '@backend/domain/shared/base';
```

**After:**
```typescript
import { Entity, ValueObject } from '@legal/shared-kernel';
```

## Development

### Build

```bash
pnpm build
```

### Watch Mode

```bash
pnpm dev
```

### Type Check

```bash
pnpm typecheck
```

### Lint

```bash
pnpm lint
```

## License

MIT
