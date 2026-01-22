import { ValueObject } from '../value-object.base';

interface DateRangeProps {
  startDate: Date;
  endDate: Date;
}

/**
 * DateRange Value Object
 * Represents a range between two dates
 */
export class DateRange extends ValueObject<DateRangeProps> {
  constructor(startDate: Date, endDate: Date) {
    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }
    super({ startDate, endDate });
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  get durationInDays(): number {
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const diffInMillis = this.endDate.getTime() - this.startDate.getTime();
    return Math.floor(diffInMillis / millisecondsPerDay);
  }

  overlaps(other: DateRange): boolean {
    return this.startDate <= other.endDate && this.endDate >= other.startDate;
  }

  contains(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate;
  }

  isPast(): boolean {
    return this.endDate < new Date();
  }

  isFuture(): boolean {
    return this.startDate > new Date();
  }

  isActive(): boolean {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }

  static fromNow(days: number): DateRange {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return new DateRange(now, futureDate);
  }
}
