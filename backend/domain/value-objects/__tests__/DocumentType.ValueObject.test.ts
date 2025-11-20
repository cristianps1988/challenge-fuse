import { DocumentType } from '@/backend/domain/value-objects/DocumentType.ValueObject';
import { DocumentType as DocumentTypeConstants } from '@/backend/domain/document-types.constants';
import { InvalidDocumentTypeError } from '@/backend/domain/errors/Domain.Error';

describe('DocumentType Value Object', () => {
  describe('fromString', () => {
    it('should create DocumentType from valid string', () => {
      const docType = DocumentType.fromString('bank_statement');
      expect(docType.getValue()).toBe(DocumentTypeConstants.BANK_STATEMENT);
    });

    it('should create DocumentType for all valid types', () => {
      expect(DocumentType.fromString('bank_statement').getValue()).toBe('bank_statement');
      expect(DocumentType.fromString('government_id').getValue()).toBe('government_id');
      expect(DocumentType.fromString('w9').getValue()).toBe('w9');
      expect(DocumentType.fromString('certificate_of_insurance').getValue()).toBe('certificate_of_insurance');
      expect(DocumentType.fromString('articles_of_incorporation').getValue()).toBe('articles_of_incorporation');
    });

    it('should throw error for invalid document type', () => {
      expect(() => DocumentType.fromString('invalid_type')).toThrow(InvalidDocumentTypeError);
    });

    it('should throw error for empty string', () => {
      expect(() => DocumentType.fromString('')).toThrow(InvalidDocumentTypeError);
    });
  });

  describe('factory methods', () => {
    it('should create bank statement type', () => {
      const docType = DocumentType.bankStatement();
      expect(docType.getValue()).toBe(DocumentTypeConstants.BANK_STATEMENT);
    });

    it('should create government ID type', () => {
      const docType = DocumentType.governmentId();
      expect(docType.getValue()).toBe(DocumentTypeConstants.GOVERNMENT_ID);
    });

    it('should create W9 type', () => {
      const docType = DocumentType.w9();
      expect(docType.getValue()).toBe(DocumentTypeConstants.W9);
    });

    it('should create certificate of insurance type', () => {
      const docType = DocumentType.certificateOfInsurance();
      expect(docType.getValue()).toBe(DocumentTypeConstants.CERTIFICATE_OF_INSURANCE);
    });

    it('should create articles of incorporation type', () => {
      const docType = DocumentType.articlesOfIncorporation();
      expect(docType.getValue()).toBe(DocumentTypeConstants.ARTICLES_OF_INCORPORATION);
    });
  });

  describe('equals', () => {
    it('should return true for equal types', () => {
      const type1 = DocumentType.bankStatement();
      const type2 = DocumentType.bankStatement();
      expect(type1.equals(type2)).toBe(true);
    });

    it('should return false for different types', () => {
      const type1 = DocumentType.bankStatement();
      const type2 = DocumentType.governmentId();
      expect(type1.equals(type2)).toBe(false);
    });
  });

  describe('type checking methods', () => {
    it('should correctly identify bank statement', () => {
      const docType = DocumentType.bankStatement();
      expect(docType.isBankStatement()).toBe(true);
      expect(docType.isGovernmentId()).toBe(false);
      expect(docType.isW9()).toBe(false);
      expect(docType.isCertificateOfInsurance()).toBe(false);
      expect(docType.isArticlesOfIncorporation()).toBe(false);
    });

    it('should correctly identify government ID', () => {
      const docType = DocumentType.governmentId();
      expect(docType.isBankStatement()).toBe(false);
      expect(docType.isGovernmentId()).toBe(true);
      expect(docType.isW9()).toBe(false);
      expect(docType.isCertificateOfInsurance()).toBe(false);
      expect(docType.isArticlesOfIncorporation()).toBe(false);
    });

    it('should correctly identify W9', () => {
      const docType = DocumentType.w9();
      expect(docType.isBankStatement()).toBe(false);
      expect(docType.isGovernmentId()).toBe(false);
      expect(docType.isW9()).toBe(true);
      expect(docType.isCertificateOfInsurance()).toBe(false);
      expect(docType.isArticlesOfIncorporation()).toBe(false);
    });

    it('should correctly identify certificate of insurance', () => {
      const docType = DocumentType.certificateOfInsurance();
      expect(docType.isBankStatement()).toBe(false);
      expect(docType.isGovernmentId()).toBe(false);
      expect(docType.isW9()).toBe(false);
      expect(docType.isCertificateOfInsurance()).toBe(true);
      expect(docType.isArticlesOfIncorporation()).toBe(false);
    });

    it('should correctly identify articles of incorporation', () => {
      const docType = DocumentType.articlesOfIncorporation();
      expect(docType.isBankStatement()).toBe(false);
      expect(docType.isGovernmentId()).toBe(false);
      expect(docType.isW9()).toBe(false);
      expect(docType.isCertificateOfInsurance()).toBe(false);
      expect(docType.isArticlesOfIncorporation()).toBe(true);
    });
  });
});
