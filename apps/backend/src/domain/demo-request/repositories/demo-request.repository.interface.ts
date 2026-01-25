import { IRepository } from '@legal/shared-kernel';
import { DemoRequestAggregate } from '../aggregates';
import { DemoRequestStatusEnum } from '../value-objects';

/**
 * Repository interface for Demo Request aggregate
 *
 * Defines the contract for demo request persistence operations.
 */
export interface IDemoRequestRepository extends IRepository<
  DemoRequestAggregate,
  string
> {
  findByEmail(email: string): Promise<DemoRequestAggregate | null>;
  findByStatus(status: DemoRequestStatusEnum): Promise<DemoRequestAggregate[]>;
  findByStatusIn(
    statuses: DemoRequestStatusEnum[],
  ): Promise<DemoRequestAggregate[]>;
  findByHubspotContactId(
    contactId: string,
  ): Promise<DemoRequestAggregate | null>;
  findNewRequests(): Promise<DemoRequestAggregate[]>;
  existsByEmail(email: string): Promise<boolean>;
  findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<DemoRequestAggregate[]>;
}
