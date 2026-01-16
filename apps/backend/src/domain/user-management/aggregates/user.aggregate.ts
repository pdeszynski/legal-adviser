import { AggregateRoot } from '../../shared/base';
import {
  Email,
  FullName,
  UserRole,
  UserRoleEnum,
  UserStatus,
  UserStatusEnum,
} from '../value-objects';
import {
  UserRegisteredEvent,
  UserActivatedEvent,
  UserSuspendedEvent,
  UserRoleChangedEvent,
} from '../events';

interface UserProps {
  email: Email;
  fullName: FullName;
  role: UserRole;
  status: UserStatus;
  passwordHash?: string;
  lastLoginAt?: Date;
}

/**
 * User Aggregate Root
 * Manages the lifecycle and business rules for user accounts
 */
export class UserAggregate extends AggregateRoot<string> {
  private _email: Email;
  private _fullName: FullName;
  private _role: UserRole;
  private _status: UserStatus;
  private _passwordHash?: string;
  private _lastLoginAt?: Date;

  private constructor(id: string, props: UserProps) {
    super(id);
    this._email = props.email;
    this._fullName = props.fullName;
    this._role = props.role;
    this._status = props.status;
    this._passwordHash = props.passwordHash;
    this._lastLoginAt = props.lastLoginAt;
  }

  // Getters
  get email(): Email {
    return this._email;
  }

  get fullName(): FullName {
    return this._fullName;
  }

  get role(): UserRole {
    return this._role;
  }

  get status(): UserStatus {
    return this._status;
  }

  get lastLoginAt(): Date | undefined {
    return this._lastLoginAt;
  }

  get passwordHash(): string | undefined {
    return this._passwordHash;
  }

  // Factory method
  static register(
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    role: UserRoleEnum = UserRoleEnum.CLIENT,
    passwordHash?: string,
  ): UserAggregate {
    const user = new UserAggregate(id, {
      email: Email.create(email),
      fullName: FullName.create(firstName, lastName),
      role: UserRole.create(role),
      status: UserStatus.pending(),
      passwordHash,
    });

    user.addDomainEvent(
      new UserRegisteredEvent({
        userId: id,
        email,
        firstName,
        lastName,
        role,
        registeredAt: user.createdAt,
      }),
    );

    return user;
  }

  // Reconstitute from persistence
  static reconstitute(
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    role: UserRoleEnum,
    status: UserStatusEnum,
    createdAt: Date,
    updatedAt: Date,
    passwordHash?: string,
    lastLoginAt?: Date,
  ): UserAggregate {
    const user = new UserAggregate(id, {
      email: Email.create(email),
      fullName: FullName.create(firstName, lastName),
      role: UserRole.create(role),
      status: UserStatus.create(status),
      passwordHash,
      lastLoginAt,
    });
    user._createdAt = createdAt;
    user._updatedAt = updatedAt;
    return user;
  }

  // Business methods
  activate(): void {
    if (!this._status.canTransitionTo(UserStatusEnum.ACTIVE)) {
      throw new Error('Cannot activate user in current status');
    }

    this._status = UserStatus.active();
    this.incrementVersion();

    this.addDomainEvent(
      new UserActivatedEvent({
        userId: this.id,
        activatedAt: this.updatedAt,
      }),
    );
  }

  suspend(reason: string, suspendedBy: string): void {
    if (!this._status.canTransitionTo(UserStatusEnum.SUSPENDED)) {
      throw new Error('Cannot suspend user in current status');
    }

    this._status = UserStatus.create(UserStatusEnum.SUSPENDED);
    this.incrementVersion();

    this.addDomainEvent(
      new UserSuspendedEvent({
        userId: this.id,
        reason,
        suspendedBy,
        suspendedAt: this.updatedAt,
      }),
    );
  }

  reactivate(): void {
    if (!this._status.canTransitionTo(UserStatusEnum.ACTIVE)) {
      throw new Error('Cannot reactivate user in current status');
    }

    this._status = UserStatus.active();
    this.incrementVersion();

    this.addDomainEvent(
      new UserActivatedEvent({
        userId: this.id,
        activatedAt: this.updatedAt,
      }),
    );
  }

  deactivate(): void {
    if (!this._status.canTransitionTo(UserStatusEnum.DEACTIVATED)) {
      throw new Error('Cannot deactivate user in current status');
    }

    this._status = UserStatus.create(UserStatusEnum.DEACTIVATED);
    this.incrementVersion();
  }

  changeRole(newRole: UserRoleEnum, changedBy: string): void {
    const previousRole = this._role.toValue();

    if (previousRole === newRole) {
      return; // No change needed
    }

    this._role = UserRole.create(newRole);
    this.incrementVersion();

    this.addDomainEvent(
      new UserRoleChangedEvent({
        userId: this.id,
        previousRole,
        newRole,
        changedBy,
        changedAt: this.updatedAt,
      }),
    );
  }

  updateProfile(firstName: string, lastName: string): void {
    this._fullName = FullName.create(firstName, lastName);
    this.incrementVersion();
  }

  updateEmail(newEmail: string): void {
    this._email = Email.create(newEmail);
    this.incrementVersion();
  }

  recordLogin(): void {
    this._lastLoginAt = new Date();
    this.touch();
  }

  updatePassword(newPasswordHash: string): void {
    this._passwordHash = newPasswordHash;
    this.incrementVersion();
  }

  canPerformAction(action: string): boolean {
    if (!this._status.canLogin()) {
      return false;
    }

    // Role-based access control
    const rolePermissions: Record<UserRoleEnum, string[]> = {
      [UserRoleEnum.ADMIN]: ['*'],
      [UserRoleEnum.LAWYER]: [
        'view_documents',
        'edit_documents',
        'create_documents',
        'delete_documents',
        'view_clients',
      ],
      [UserRoleEnum.CLIENT]: [
        'view_own_documents',
        'create_queries',
        'view_own_profile',
      ],
      [UserRoleEnum.GUEST]: ['view_public_documents'],
    };

    const permissions = rolePermissions[this._role.toValue()];
    return permissions.includes('*') || permissions.includes(action);
  }
}
