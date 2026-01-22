import { IRepository } from '../../shared/base';
import { LegalQueryAggregate } from '../aggregates';
import { QueryStatusEnum } from '../value-objects';

/**
 * Repository interface for Legal Query aggregate
 */
export interface ILegalQueryRepository extends IRepository<
  LegalQueryAggregate,
  string
> {
  findByUserId(userId: string): Promise<LegalQueryAggregate[]>;
  findByStatus(status: QueryStatusEnum): Promise<LegalQueryAggregate[]>;
  findByUserAndStatus(
    userId: string,
    status: QueryStatusEnum,
  ): Promise<LegalQueryAggregate[]>;
  findPendingQueries(): Promise<LegalQueryAggregate[]>;
  countByUserId(userId: string): Promise<number>;
  findRecentByUserId(
    userId: string,
    limit: number,
  ): Promise<LegalQueryAggregate[]>;
}
