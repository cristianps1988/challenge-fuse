import { DocumentType as DocumentTypeConstants, DocumentTypeValue } from '@/backend/domain/document-types.constants';
import { InvalidDocumentTypeError } from '@/backend/domain/errors/Domain.Error';

export class DocumentType {
  private constructor(private readonly value: DocumentTypeValue) {}

  static fromString(value: string): DocumentType {
    const validTypes = Object.values(DocumentTypeConstants);

    if (!validTypes.includes(value as DocumentTypeValue)) {
      throw new InvalidDocumentTypeError(value);
    }

    return new DocumentType(value as DocumentTypeValue);
  }

  static bankStatement(): DocumentType {
    return new DocumentType(DocumentTypeConstants.BANK_STATEMENT);
  }

  static governmentId(): DocumentType {
    return new DocumentType(DocumentTypeConstants.GOVERNMENT_ID);
  }

  static w9(): DocumentType {
    return new DocumentType(DocumentTypeConstants.W9);
  }

  static certificateOfInsurance(): DocumentType {
    return new DocumentType(DocumentTypeConstants.CERTIFICATE_OF_INSURANCE);
  }

  static articlesOfIncorporation(): DocumentType {
    return new DocumentType(DocumentTypeConstants.ARTICLES_OF_INCORPORATION);
  }

  static unknown(): DocumentType {
    return new DocumentType(DocumentTypeConstants.UNKNOWN);
  }

  getValue(): DocumentTypeValue {
    return this.value;
  }

  equals(other: DocumentType): boolean {
    return this.value === other.value;
  }

  isBankStatement(): boolean {
    return this.value === DocumentTypeConstants.BANK_STATEMENT;
  }

  isGovernmentId(): boolean {
    return this.value === DocumentTypeConstants.GOVERNMENT_ID;
  }

  isW9(): boolean {
    return this.value === DocumentTypeConstants.W9;
  }

  isCertificateOfInsurance(): boolean {
    return this.value === DocumentTypeConstants.CERTIFICATE_OF_INSURANCE;
  }

  isArticlesOfIncorporation(): boolean {
    return this.value === DocumentTypeConstants.ARTICLES_OF_INCORPORATION;
  }

  isUnknown(): boolean {
    return this.value === DocumentTypeConstants.UNKNOWN;
  }
}