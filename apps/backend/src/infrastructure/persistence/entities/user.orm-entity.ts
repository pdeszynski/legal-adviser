/**
 * User ORM Entity
 *
 * Represents the database schema for users in the infrastructure layer.
 * This is separate from the domain User entity and is used for persistence only.
 *
 * Note: This entity maps to the DDD UserAggregate through the UserMapper.
 * For GraphQL operations, use the User entity in modules/users/entities.
 *
 * IMPORTANT: This is NOT a TypeORM entity - it's a plain TypeScript class
 * that mirrors the User entity structure. The actual User entity is defined
 * in modules/users/entities/user.entity.ts to avoid duplicate entity registration.
 */
export class UserOrmEntity {
  id: string;

  email: string;

  username: string | null;

  firstName: string | null;

  lastName: string | null;

  isActive: boolean;

  disclaimerAccepted: boolean;

  disclaimerAcceptedAt: Date | null;

  passwordHash: string | null;

  createdAt: Date;

  updatedAt: Date;
}
