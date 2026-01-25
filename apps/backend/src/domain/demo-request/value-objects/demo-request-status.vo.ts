/**
 * Demo Request Status Enum
 *
 * Represents the current state of a demo request in the sales pipeline.
 */
export enum DemoRequestStatusEnum {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  SCHEDULED = 'SCHEDULED',
  QUALIFIED = 'QUALIFIED',
  CLOSED = 'CLOSED',
}

/**
 * Company Size Enum
 *
 * Represents the size category of a company.
 */
export enum CompanySizeEnum {
  SOLO = '1-10',
  SMALL = '11-50',
  MEDIUM = '51-200',
  LARGE = '201-500',
  ENTERPRISE = '500+',
}

/**
 * Demo Request Status Value Object
 *
 * Represents the current status of a demo request with state transition validation.
 */
export class DemoRequestStatus {
  private readonly value: DemoRequestStatusEnum;

  private constructor(value: DemoRequestStatusEnum) {
    this.value = value;
  }

  static create(status: DemoRequestStatusEnum): DemoRequestStatus {
    return new DemoRequestStatus(status);
  }

  static new(): DemoRequestStatus {
    return new DemoRequestStatus(DemoRequestStatusEnum.NEW);
  }

  static contacted(): DemoRequestStatus {
    return new DemoRequestStatus(DemoRequestStatusEnum.CONTACTED);
  }

  static scheduled(): DemoRequestStatus {
    return new DemoRequestStatus(DemoRequestStatusEnum.SCHEDULED);
  }

  static qualified(): DemoRequestStatus {
    return new DemoRequestStatus(DemoRequestStatusEnum.QUALIFIED);
  }

  static closed(): DemoRequestStatus {
    return new DemoRequestStatus(DemoRequestStatusEnum.CLOSED);
  }

  toValue(): DemoRequestStatusEnum {
    return this.value;
  }

  isNew(): boolean {
    return this.value === DemoRequestStatusEnum.NEW;
  }

  isContacted(): boolean {
    return this.value === DemoRequestStatusEnum.CONTACTED;
  }

  isScheduled(): boolean {
    return this.value === DemoRequestStatusEnum.SCHEDULED;
  }

  isQualified(): boolean {
    return this.value === DemoRequestStatusEnum.QUALIFIED;
  }

  isClosed(): boolean {
    return this.value === DemoRequestStatusEnum.CLOSED;
  }

  canTransitionTo(newStatus: DemoRequestStatusEnum): boolean {
    const transitions: Record<DemoRequestStatusEnum, DemoRequestStatusEnum[]> =
      {
        [DemoRequestStatusEnum.NEW]: [
          DemoRequestStatusEnum.CONTACTED,
          DemoRequestStatusEnum.CLOSED,
        ],
        [DemoRequestStatusEnum.CONTACTED]: [
          DemoRequestStatusEnum.SCHEDULED,
          DemoRequestStatusEnum.CLOSED,
        ],
        [DemoRequestStatusEnum.SCHEDULED]: [
          DemoRequestStatusEnum.QUALIFIED,
          DemoRequestStatusEnum.CLOSED,
        ],
        [DemoRequestStatusEnum.QUALIFIED]: [DemoRequestStatusEnum.CLOSED],
        [DemoRequestStatusEnum.CLOSED]: [],
      };

    return transitions[this.value]?.includes(newStatus) ?? false;
  }

  equals(other: DemoRequestStatus): boolean {
    return this.value === other.value;
  }
}
