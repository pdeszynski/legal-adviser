import { SimpleValueObject } from '../../shared/base';

/**
 * Query processing status
 */
export enum QueryStatusEnum {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Query Status Value Object
 */
export class QueryStatus extends SimpleValueObject<QueryStatusEnum> {
  protected validate(value: QueryStatusEnum): void {
    if (!Object.values(QueryStatusEnum).includes(value)) {
      throw new Error(`Invalid query status: ${value}`);
    }
  }

  static create(status: QueryStatusEnum): QueryStatus {
    return new QueryStatus(status);
  }

  static pending(): QueryStatus {
    return new QueryStatus(QueryStatusEnum.PENDING);
  }

  static processing(): QueryStatus {
    return new QueryStatus(QueryStatusEnum.PROCESSING);
  }

  static completed(): QueryStatus {
    return new QueryStatus(QueryStatusEnum.COMPLETED);
  }

  static failed(): QueryStatus {
    return new QueryStatus(QueryStatusEnum.FAILED);
  }

  isPending(): boolean {
    return this.value === QueryStatusEnum.PENDING;
  }

  isProcessing(): boolean {
    return this.value === QueryStatusEnum.PROCESSING;
  }

  isCompleted(): boolean {
    return this.value === QueryStatusEnum.COMPLETED;
  }

  isFailed(): boolean {
    return this.value === QueryStatusEnum.FAILED;
  }

  isTerminal(): boolean {
    return [
      QueryStatusEnum.COMPLETED,
      QueryStatusEnum.FAILED,
      QueryStatusEnum.CANCELLED,
    ].includes(this.value);
  }

  canTransitionTo(newStatus: QueryStatusEnum): boolean {
    const transitions: Record<QueryStatusEnum, QueryStatusEnum[]> = {
      [QueryStatusEnum.PENDING]: [
        QueryStatusEnum.PROCESSING,
        QueryStatusEnum.CANCELLED,
      ],
      [QueryStatusEnum.PROCESSING]: [
        QueryStatusEnum.COMPLETED,
        QueryStatusEnum.FAILED,
        QueryStatusEnum.CANCELLED,
      ],
      [QueryStatusEnum.COMPLETED]: [],
      [QueryStatusEnum.FAILED]: [QueryStatusEnum.PENDING], // Allow retry
      [QueryStatusEnum.CANCELLED]: [],
    };

    return transitions[this.value]?.includes(newStatus) ?? false;
  }
}
