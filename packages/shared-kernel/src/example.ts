/**
 * Example usage of shared-kernel package
 * This file demonstrates how to use the shared-kernel DDD building blocks
 */

import {
  Entity,
  AggregateRoot,
  ValueObject,
  Email,
  Uuid,
  Money,
  DateRange,
  Result,
  Option,
} from './index';

// Example: Email value object
const email = new Email('user@example.com');
console.log('Email valid:', email.toValue());
console.log('Email domain:', email.getDomain());

// Example: UUID value object
const uuid = new Uuid();
console.log('Generated UUID:', uuid.toValue());
console.log('UUID is valid:', Uuid.isValid(uuid.toValue()));

// Example: Money value object
const money1 = new Money(100, 'USD');
const money2 = new Money(50, 'USD');
const total = money1.add(money2);
console.log('Total money:', total.format());

// Example: DateRange value object
const dateRange = new DateRange(new Date('2024-01-01'), new Date('2024-12-31'));
console.log('Duration in days:', dateRange.durationInDays);
console.log('Is active:', dateRange.isActive());

// Example: Result type
const divideResult = (a: number, b: number): Result<number, string> => {
  if (b === 0) {
    return Result.failure('Cannot divide by zero');
  }
  return Result.success(a / b);
};

const result1 = divideResult(10, 2);
console.log(
  'Division result:',
  result1.match({
    success: (value) => `Success: ${value}`,
    failure: (error) => `Error: ${error}`,
  }),
);

const result2 = divideResult(10, 0);
console.log(
  'Division by zero:',
  result2.match({
    success: (value) => `Success: ${value}`,
    failure: (error) => `Error: ${error}`,
  }),
);

// Example: Option type
const findUser = (id: string): Option<{ name: string }> => {
  if (id === '123') {
    return Option.some({ name: 'John Doe' });
  }
  return Option.none();
};

const user = findUser('123');
console.log(
  'User found:',
  user.match({
    some: (u) => `Found: ${u.name}`,
    none: () => 'Not found',
  }),
);

console.log('Shared kernel examples completed successfully!');
