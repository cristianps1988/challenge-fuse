import { Correction } from '@/backend/domain/entities/Correction.Entity';
import { DocumentType } from '@/backend/domain/value-objects/DocumentType.ValueObject';

describe('Correction Entity', () => {
  describe('create', () => {
    it('should create correction with field corrections', () => {
      const fieldCorrections = [
        { fieldName: 'accountNumber', originalValue: '123', correctedValue: '456' },
        { fieldName: 'balance', originalValue: 1000, correctedValue: 2000 },
      ];

      const correction = Correction.create(
        'corr-1',
        'doc-1',
        'ext-1',
        DocumentType.bankStatement(),
        DocumentType.bankStatement(),
        fieldCorrections,
        'user-123',
        'Fixed account number'
      );

      expect(correction.getId()).toBe('corr-1');
      expect(correction.getDocumentId()).toBe('doc-1');
      expect(correction.getExtractionId()).toBe('ext-1');
      expect(correction.getCorrectedBy()).toBe('user-123');
      expect(correction.getNotes()).toBe('Fixed account number');
      expect(correction.getFieldCorrectionCount()).toBe(2);
    });

    it('should create correction without notes', () => {
      const correction = Correction.create(
        'corr-1',
        'doc-1',
        'ext-1',
        DocumentType.bankStatement(),
        DocumentType.governmentId(),
        [],
        'user-123'
      );

      expect(correction.getNotes()).toBeNull();
    });

    it('should set corrected date on creation', () => {
      const beforeCreate = new Date();
      const correction = Correction.create(
        'corr-1',
        'doc-1',
        'ext-1',
        DocumentType.bankStatement(),
        DocumentType.bankStatement(),
        [],
        'user-123'
      );
      const afterCreate = new Date();

      const correctedAt = correction.getCorrectedAt();
      expect(correctedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(correctedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('hasTypeCorrection', () => {
    it('should return true when types are different', () => {
      const correction = Correction.create(
        'corr-1',
        'doc-1',
        'ext-1',
        DocumentType.bankStatement(),
        DocumentType.governmentId(),
        [],
        'user-123'
      );

      expect(correction.hasTypeCorrection()).toBe(true);
    });

    it('should return false when types are the same', () => {
      const correction = Correction.create(
        'corr-1',
        'doc-1',
        'ext-1',
        DocumentType.bankStatement(),
        DocumentType.bankStatement(),
        [],
        'user-123'
      );

      expect(correction.hasTypeCorrection()).toBe(false);
    });

    it('should return false when original type is null', () => {
      const correction = Correction.create(
        'corr-1',
        'doc-1',
        'ext-1',
        null,
        DocumentType.bankStatement(),
        [],
        'user-123'
      );

      expect(correction.hasTypeCorrection()).toBe(false);
    });

    it('should return false when corrected type is null', () => {
      const correction = Correction.create(
        'corr-1',
        'doc-1',
        'ext-1',
        DocumentType.bankStatement(),
        null,
        [],
        'user-123'
      );

      expect(correction.hasTypeCorrection()).toBe(false);
    });
  });

  describe('hasFieldCorrections', () => {
    it('should return true when there are field corrections', () => {
      const fieldCorrections = [
        { fieldName: 'accountNumber', originalValue: '123', correctedValue: '456' },
      ];

      const correction = Correction.create(
        'corr-1',
        'doc-1',
        'ext-1',
        DocumentType.bankStatement(),
        DocumentType.bankStatement(),
        fieldCorrections,
        'user-123'
      );

      expect(correction.hasFieldCorrections()).toBe(true);
    });

    it('should return false when there are no field corrections', () => {
      const correction = Correction.create(
        'corr-1',
        'doc-1',
        'ext-1',
        DocumentType.bankStatement(),
        DocumentType.bankStatement(),
        [],
        'user-123'
      );

      expect(correction.hasFieldCorrections()).toBe(false);
    });
  });

  describe('getFieldCorrectionCount', () => {
    it('should return correct count of field corrections', () => {
      const fieldCorrections = [
        { fieldName: 'field1', originalValue: 'val1', correctedValue: 'val2' },
        { fieldName: 'field2', originalValue: 'val3', correctedValue: 'val4' },
        { fieldName: 'field3', originalValue: 'val5', correctedValue: 'val6' },
      ];

      const correction = Correction.create(
        'corr-1',
        'doc-1',
        'ext-1',
        DocumentType.bankStatement(),
        DocumentType.bankStatement(),
        fieldCorrections,
        'user-123'
      );

      expect(correction.getFieldCorrectionCount()).toBe(3);
    });

    it('should return zero for no corrections', () => {
      const correction = Correction.create(
        'corr-1',
        'doc-1',
        'ext-1',
        DocumentType.bankStatement(),
        DocumentType.bankStatement(),
        [],
        'user-123'
      );

      expect(correction.getFieldCorrectionCount()).toBe(0);
    });
  });

  describe('getCorrectedFields', () => {
    it('should return list of corrected field names', () => {
      const fieldCorrections = [
        { fieldName: 'accountNumber', originalValue: '123', correctedValue: '456' },
        { fieldName: 'balance', originalValue: 1000, correctedValue: 2000 },
      ];

      const correction = Correction.create(
        'corr-1',
        'doc-1',
        'ext-1',
        DocumentType.bankStatement(),
        DocumentType.bankStatement(),
        fieldCorrections,
        'user-123'
      );

      const correctedFields = correction.getCorrectedFields();

      expect(correctedFields).toHaveLength(2);
      expect(correctedFields).toContain('accountNumber');
      expect(correctedFields).toContain('balance');
    });

    it('should return empty array when no corrections', () => {
      const correction = Correction.create(
        'corr-1',
        'doc-1',
        'ext-1',
        DocumentType.bankStatement(),
        DocumentType.bankStatement(),
        [],
        'user-123'
      );

      expect(correction.getCorrectedFields()).toHaveLength(0);
    });
  });

  describe('getFieldCorrection', () => {
    it('should return specific field correction', () => {
      const fieldCorrections = [
        { fieldName: 'accountNumber', originalValue: '123', correctedValue: '456' },
        { fieldName: 'balance', originalValue: 1000, correctedValue: 2000 },
      ];

      const correction = Correction.create(
        'corr-1',
        'doc-1',
        'ext-1',
        DocumentType.bankStatement(),
        DocumentType.bankStatement(),
        fieldCorrections,
        'user-123'
      );

      const fieldCorrection = correction.getFieldCorrection('accountNumber');

      expect(fieldCorrection).toBeDefined();
      expect(fieldCorrection?.fieldName).toBe('accountNumber');
      expect(fieldCorrection?.originalValue).toBe('123');
      expect(fieldCorrection?.correctedValue).toBe('456');
    });

    it('should return undefined for non-existent field', () => {
      const correction = Correction.create(
        'corr-1',
        'doc-1',
        'ext-1',
        DocumentType.bankStatement(),
        DocumentType.bankStatement(),
        [],
        'user-123'
      );

      const fieldCorrection = correction.getFieldCorrection('nonExistent');

      expect(fieldCorrection).toBeUndefined();
    });
  });

  describe('getFieldCorrections', () => {
    it('should return copy of field corrections array', () => {
      const fieldCorrections = [
        { fieldName: 'accountNumber', originalValue: '123', correctedValue: '456' },
      ];

      const correction = Correction.create(
        'corr-1',
        'doc-1',
        'ext-1',
        DocumentType.bankStatement(),
        DocumentType.bankStatement(),
        fieldCorrections,
        'user-123'
      );

      const returnedCorrections = correction.getFieldCorrections();

      expect(returnedCorrections).toHaveLength(1);
      expect(returnedCorrections).not.toBe(fieldCorrections);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute correction from stored data', () => {
      const correctedAt = new Date('2024-01-01');
      const originalType = DocumentType.bankStatement();
      const correctedType = DocumentType.governmentId();
      const fieldCorrections = [
        { fieldName: 'accountNumber', originalValue: '123', correctedValue: '456' },
      ];

      const correction = Correction.reconstitute({
        id: 'corr-1',
        documentId: 'doc-1',
        extractionId: 'ext-1',
        originalType,
        correctedType,
        fieldCorrections,
        correctedBy: 'user-123',
        correctedAt,
        notes: 'Test notes',
      });

      expect(correction.getId()).toBe('corr-1');
      expect(correction.getDocumentId()).toBe('doc-1');
      expect(correction.getExtractionId()).toBe('ext-1');
      expect(correction.getOriginalType()).toBe(originalType);
      expect(correction.getCorrectedType()).toBe(correctedType);
      expect(correction.getCorrectedBy()).toBe('user-123');
      expect(correction.getCorrectedAt()).toBe(correctedAt);
      expect(correction.getNotes()).toBe('Test notes');
      expect(correction.getFieldCorrectionCount()).toBe(1);
    });
  });
});