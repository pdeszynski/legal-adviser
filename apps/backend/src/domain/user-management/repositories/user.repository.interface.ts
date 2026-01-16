import { IRepository } from '../../shared/base';
import { UserAggregate } from '../aggregates';
import { UserRoleEnum, UserStatusEnum } from '../value-objects';

/**
 * Repository interface for User aggregate
 */
export interface IUserRepository extends IRepository<UserAggregate, string> {
  findByEmail(email: string): Promise<UserAggregate | null>;
  findByRole(role: UserRoleEnum): Promise<UserAggregate[]>;
  findByStatus(status: UserStatusEnum): Promise<UserAggregate[]>;
  findActiveUsers(): Promise<UserAggregate[]>;
  existsByEmail(email: string): Promise<boolean>;
}
