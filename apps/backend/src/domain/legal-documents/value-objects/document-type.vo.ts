import { SimpleValueObject } from '../../shared/base';

/**
 * Supported document types in the legal domain
 */
export enum DocumentTypeEnum {
  CONTRACT = 'contract',
  AGREEMENT = 'agreement',
  POLICY = 'policy',
  REGULATION = 'regulation',
  COURT_RULING = 'court_ruling',
  LEGAL_OPINION = 'legal_opinion',
  STATUTE = 'statute',
  OTHER = 'other',
}

/**
 * Document Type Value Object
 */
export class DocumentType extends SimpleValueObject<DocumentTypeEnum> {
  protected validate(value: DocumentTypeEnum): void {
    if (!Object.values(DocumentTypeEnum).includes(value)) {
      throw new Error(`Invalid document type: ${value}`);
    }
  }

  static create(type: DocumentTypeEnum): DocumentType {
    return new DocumentType(type);
  }

  static fromString(type: string): DocumentType {
    const enumValue = type as DocumentTypeEnum;
    if (!Object.values(DocumentTypeEnum).includes(enumValue)) {
      throw new Error(`Invalid document type: ${type}`);
    }
    return new DocumentType(enumValue);
  }

  isContract(): boolean {
    return this.value === DocumentTypeEnum.CONTRACT;
  }

  isRegulatory(): boolean {
    return [DocumentTypeEnum.REGULATION, DocumentTypeEnum.STATUTE].includes(
      this.value,
    );
  }
}
