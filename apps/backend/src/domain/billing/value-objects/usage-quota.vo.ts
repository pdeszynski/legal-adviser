import { ValueObject } from '../../shared/base';

interface UsageQuotaProps {
  queriesUsed: number;
  queriesLimit: number;
  documentsUsed: number;
  documentsLimit: number;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Usage Quota Value Object
 * Tracks usage against subscription limits
 */
export class UsageQuota extends ValueObject<UsageQuotaProps> {
  private constructor(props: UsageQuotaProps) {
    super(props);
  }

  get queriesUsed(): number {
    return this.props.queriesUsed;
  }

  get queriesLimit(): number {
    return this.props.queriesLimit;
  }

  get documentsUsed(): number {
    return this.props.documentsUsed;
  }

  get documentsLimit(): number {
    return this.props.documentsLimit;
  }

  get periodStart(): Date {
    return this.props.periodStart;
  }

  get periodEnd(): Date {
    return this.props.periodEnd;
  }

  get queriesRemaining(): number {
    if (this.props.queriesLimit === -1) return Infinity;
    return Math.max(0, this.props.queriesLimit - this.props.queriesUsed);
  }

  get documentsRemaining(): number {
    if (this.props.documentsLimit === -1) return Infinity;
    return Math.max(0, this.props.documentsLimit - this.props.documentsUsed);
  }

  get queriesPercentUsed(): number {
    if (this.props.queriesLimit === -1) return 0;
    return (this.props.queriesUsed / this.props.queriesLimit) * 100;
  }

  get documentsPercentUsed(): number {
    if (this.props.documentsLimit === -1) return 0;
    return (this.props.documentsUsed / this.props.documentsLimit) * 100;
  }

  canUseQuery(): boolean {
    return this.props.queriesLimit === -1 || this.queriesRemaining > 0;
  }

  canUseDocument(): boolean {
    return this.props.documentsLimit === -1 || this.documentsRemaining > 0;
  }

  isWithinPeriod(date: Date = new Date()): boolean {
    return date >= this.props.periodStart && date <= this.props.periodEnd;
  }

  static create(
    queriesUsed: number,
    queriesLimit: number,
    documentsUsed: number,
    documentsLimit: number,
    periodStart: Date,
    periodEnd: Date,
  ): UsageQuota {
    if (queriesUsed < 0 || documentsUsed < 0) {
      throw new Error('Usage cannot be negative');
    }

    return new UsageQuota({
      queriesUsed,
      queriesLimit,
      documentsUsed,
      documentsLimit,
      periodStart,
      periodEnd,
    });
  }

  static newPeriod(
    queriesLimit: number,
    documentsLimit: number,
    periodStart: Date,
    periodEnd: Date,
  ): UsageQuota {
    return UsageQuota.create(
      0,
      queriesLimit,
      0,
      documentsLimit,
      periodStart,
      periodEnd,
    );
  }

  incrementQueries(): UsageQuota {
    return UsageQuota.create(
      this.props.queriesUsed + 1,
      this.props.queriesLimit,
      this.props.documentsUsed,
      this.props.documentsLimit,
      this.props.periodStart,
      this.props.periodEnd,
    );
  }

  incrementDocuments(): UsageQuota {
    return UsageQuota.create(
      this.props.queriesUsed,
      this.props.queriesLimit,
      this.props.documentsUsed + 1,
      this.props.documentsLimit,
      this.props.periodStart,
      this.props.periodEnd,
    );
  }
}
