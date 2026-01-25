import { IRepository } from '../../shared/base';
import { TwoFactorAuthAggregate } from '../aggregates';
import { TotpStatusEnum } from '../value-objects';

/**
 * Repository interface for TwoFactorAuth aggregate
 */
export interface ITwoFactorAuthRepository extends IRepository<
  TwoFactorAuthAggregate,
  string
> {
  findByUserId(userId: string): Promise<TwoFactorAuthAggregate | null>;
  findByStatus(status: TotpStatusEnum): Promise<TwoFactorAuthAggregate[]>;
  existsByUserId(userId: string): Promise<boolean>;
  deleteByUserId(userId: string): Promise<void>;
}
