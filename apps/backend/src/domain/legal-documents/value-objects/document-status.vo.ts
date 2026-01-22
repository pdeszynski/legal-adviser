import { SimpleValueObject } from '../../shared/base';

/**
 * Document lifecycle status
 */
export enum DocumentStatusEnum {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

/**
 * Document Status Value Object
 */
export class DocumentStatus extends SimpleValueObject<DocumentStatusEnum> {
  protected validate(value: DocumentStatusEnum): void {
    if (!Object.values(DocumentStatusEnum).includes(value)) {
      throw new Error(`Invalid document status: ${value}`);
    }
  }

  static create(status: DocumentStatusEnum): DocumentStatus {
    return new DocumentStatus(status);
  }

  static draft(): DocumentStatus {
    return new DocumentStatus(DocumentStatusEnum.DRAFT);
  }

  static published(): DocumentStatus {
    return new DocumentStatus(DocumentStatusEnum.PUBLISHED);
  }

  isDraft(): boolean {
    return this.value === DocumentStatusEnum.DRAFT;
  }

  isPublished(): boolean {
    return this.value === DocumentStatusEnum.PUBLISHED;
  }

  isEditable(): boolean {
    return [
      DocumentStatusEnum.DRAFT,
      DocumentStatusEnum.PENDING_REVIEW,
    ].includes(this.value);
  }

  canTransitionTo(newStatus: DocumentStatusEnum): boolean {
    const transitions: Record<DocumentStatusEnum, DocumentStatusEnum[]> = {
      [DocumentStatusEnum.DRAFT]: [
        DocumentStatusEnum.PENDING_REVIEW,
        DocumentStatusEnum.DELETED,
      ],
      [DocumentStatusEnum.PENDING_REVIEW]: [
        DocumentStatusEnum.DRAFT,
        DocumentStatusEnum.APPROVED,
        DocumentStatusEnum.DELETED,
      ],
      [DocumentStatusEnum.APPROVED]: [
        DocumentStatusEnum.PUBLISHED,
        DocumentStatusEnum.DRAFT,
      ],
      [DocumentStatusEnum.PUBLISHED]: [DocumentStatusEnum.ARCHIVED],
      [DocumentStatusEnum.ARCHIVED]: [DocumentStatusEnum.PUBLISHED],
      [DocumentStatusEnum.DELETED]: [],
    };

    return transitions[this.value]?.includes(newStatus) ?? false;
  }
}
