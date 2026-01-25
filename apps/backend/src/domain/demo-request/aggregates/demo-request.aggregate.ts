import { AggregateRoot } from '@legal/shared-kernel';
import {
  DemoRequestFullName,
  DemoRequestEmail,
  CompanyName,
  UseCase,
  DemoRequestStatus,
  DemoRequestStatusEnum,
  CompanySizeEnum,
} from '../value-objects';
import {
  DemoRequestSubmittedEvent,
  DemoRequestContactedEvent,
  DemoRequestStatusChangedEvent,
} from '../events';

interface DemoRequestProps {
  fullName: DemoRequestFullName;
  email: DemoRequestEmail;
  company?: CompanyName | null;
  companySize?: CompanySizeEnum | null;
  industry?: string | null;
  useCase: UseCase;
  timeline?: string | null;
  budget?: string | null;
  preferredDemoTime?: Date | null;
  status: DemoRequestStatus;
  hubspotContactId?: string | null;
  contactedAt?: Date | null;
  metadata?: Record<string, unknown>;
}

/**
 * Demo Request Aggregate Root
 *
 * Manages the lifecycle and business rules for demo requests submitted through the platform.
 * Tracks the entire sales pipeline from initial submission through qualification and closure.
 */
export class DemoRequestAggregate extends AggregateRoot<string> {
  private _fullName: DemoRequestFullName;
  private _email: DemoRequestEmail;
  private _company?: CompanyName | null;
  private _companySize?: CompanySizeEnum | null;
  private _industry?: string | null;
  private _useCase: UseCase;
  private _timeline?: string | null;
  private _budget?: string | null;
  private _preferredDemoTime?: Date | null;
  private _status: DemoRequestStatus;
  private _hubspotContactId?: string | null;
  private _contactedAt?: Date | null;
  private _metadata: Record<string, unknown>;

  private constructor(id: string, props: DemoRequestProps) {
    super(id);
    this._fullName = props.fullName;
    this._email = props.email;
    this._company = props.company;
    this._companySize = props.companySize;
    this._industry = props.industry;
    this._useCase = props.useCase;
    this._timeline = props.timeline;
    this._budget = props.budget;
    this._preferredDemoTime = props.preferredDemoTime;
    this._status = props.status;
    this._hubspotContactId = props.hubspotContactId;
    this._contactedAt = props.contactedAt;
    this._metadata = props.metadata || {};
  }

  // Getters
  get fullName(): DemoRequestFullName {
    return this._fullName;
  }

  get email(): DemoRequestEmail {
    return this._email;
  }

  get company(): CompanyName | null {
    return this._company ?? null;
  }

  get companySize(): CompanySizeEnum | null {
    return this._companySize ?? null;
  }

  get industry(): string | null {
    return this._industry ?? null;
  }

  get useCase(): UseCase {
    return this._useCase;
  }

  get timeline(): string | null {
    return this._timeline ?? null;
  }

  get budget(): string | null {
    return this._budget ?? null;
  }

  get preferredDemoTime(): Date | null {
    return this._preferredDemoTime ?? null;
  }

  get status(): DemoRequestStatus {
    return this._status;
  }

  get hubspotContactId(): string | null {
    return this._hubspotContactId ?? null;
  }

  get contactedAt(): Date | null {
    return this._contactedAt ?? null;
  }

  get metadata(): Record<string, unknown> {
    return { ...this._metadata };
  }

  // Factory method for creating a new demo request
  static create(
    id: string,
    fullName: string,
    email: string,
    useCase: string,
    options?: {
      company?: string;
      companySize?: CompanySizeEnum;
      industry?: string;
      timeline?: string;
      budget?: string;
      preferredDemoTime?: Date;
      metadata?: Record<string, unknown>;
    },
  ): DemoRequestAggregate {
    const demoRequest = new DemoRequestAggregate(id, {
      fullName: DemoRequestFullName.create(fullName),
      email: DemoRequestEmail.create(email),
      company: options?.company ? CompanyName.create(options.company) : null,
      companySize: options?.companySize ?? null,
      industry: options?.industry ?? null,
      useCase: UseCase.create(useCase),
      timeline: options?.timeline ?? null,
      budget: options?.budget ?? null,
      preferredDemoTime: options?.preferredDemoTime ?? null,
      status: DemoRequestStatus.new(),
      hubspotContactId: null,
      contactedAt: null,
      metadata: options?.metadata,
    });

    demoRequest.addDomainEvent(
      new DemoRequestSubmittedEvent({
        demoRequestId: id,
        fullName: demoRequest._fullName.toValue(),
        email: demoRequest._email.toValue(),
        company: demoRequest._company?.toValue(),
        companySize: demoRequest._companySize ?? undefined,
        industry: demoRequest._industry ?? undefined,
        submittedAt: demoRequest.createdAt,
      }),
    );

    return demoRequest;
  }

  // Reconstitute from persistence
  static reconstitute(
    id: string,
    fullName: string,
    email: string,
    company: string | null,
    companySize: CompanySizeEnum | null,
    industry: string | null,
    useCase: string,
    timeline: string | null,
    budget: string | null,
    preferredDemoTime: Date | null,
    status: DemoRequestStatusEnum,
    hubspotContactId: string | null,
    submittedAt: Date,
    contactedAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
    metadata?: Record<string, unknown>,
  ): DemoRequestAggregate {
    const demoRequest = new DemoRequestAggregate(id, {
      fullName: DemoRequestFullName.create(fullName),
      email: DemoRequestEmail.create(email),
      company: company ? CompanyName.create(company) : null,
      companySize,
      industry,
      useCase: UseCase.create(useCase),
      timeline,
      budget,
      preferredDemoTime,
      status: DemoRequestStatus.create(status),
      hubspotContactId,
      contactedAt,
      metadata,
    });
    demoRequest._createdAt = createdAt;
    demoRequest._updatedAt = updatedAt;
    demoRequest._contactedAt = contactedAt;
    return demoRequest;
  }

  // Business methods

  /**
   * Mark the demo request as contacted
   */
  markAsContacted(hubspotContactId?: string): void {
    if (!this._status.isNew()) {
      throw new Error('Can only mark new requests as contacted');
    }

    const oldStatus = this._status.toValue();
    this._status = DemoRequestStatus.contacted();
    this._contactedAt = new Date();
    if (hubspotContactId) {
      this._hubspotContactId = hubspotContactId;
    }
    this.incrementVersion();

    this.addDomainEvent(
      new DemoRequestContactedEvent({
        demoRequestId: this.id,
        email: this._email.toValue(),
        contactedAt: this._contactedAt,
      }),
    );

    this.addDomainEvent(
      new DemoRequestStatusChangedEvent({
        demoRequestId: this.id,
        email: this._email.toValue(),
        oldStatus,
        newStatus: this._status.toValue(),
        changedAt: this.updatedAt,
      }),
    );
  }

  /**
   * Change the status of the demo request
   */
  changeStatus(newStatus: DemoRequestStatusEnum): void {
    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot transition from ${this._status.toValue()} to ${newStatus}`,
      );
    }

    const oldStatus = this._status.toValue();
    this._status = DemoRequestStatus.create(newStatus);
    this.incrementVersion();

    this.addDomainEvent(
      new DemoRequestStatusChangedEvent({
        demoRequestId: this.id,
        email: this._email.toValue(),
        oldStatus,
        newStatus,
        changedAt: this.updatedAt,
      }),
    );
  }

  /**
   * Update HubSpot contact ID
   */
  updateHubspotContactId(contactId: string): void {
    this._hubspotContactId = contactId;
    this.touch();
  }

  /**
   * Update metadata
   */
  setMetadata(key: string, value: unknown): void {
    this._metadata[key] = value;
    this.touch();
  }

  /**
   * Schedule a demo time
   */
  scheduleDemo(scheduledTime: Date): void {
    if (!this._status.canTransitionTo(DemoRequestStatusEnum.SCHEDULED)) {
      throw new Error('Cannot schedule demo in current status');
    }

    const oldStatus = this._status.toValue();
    this._preferredDemoTime = scheduledTime;
    this._status = DemoRequestStatus.scheduled();
    this._metadata['scheduledAt'] = new Date().toISOString();
    this.incrementVersion();

    this.addDomainEvent(
      new DemoRequestStatusChangedEvent({
        demoRequestId: this.id,
        email: this._email.toValue(),
        oldStatus,
        newStatus: this._status.toValue(),
        changedAt: this.updatedAt,
      }),
    );
  }
}
