import { Extraction } from '@/backend/domain/entities/Extraction.Entity';
import { FieldValue } from '@/backend/domain/value-objects/FieldValue.ValueObject';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import { ValidationError } from '@/backend/domain/errors/Domain.Error';

describe('Extraction Entity', () => {
  const createSampleFields = (): Map<string, FieldValue> => {
    const fields = new Map<string, FieldValue>();
    fields.set('accountNumber', FieldValue.create('accountNumber', '123456', Confidence.create(0.9)));
    fields.set('bankName', FieldValue.create('bankName', 'Bank of Test', Confidence.create(0.95)));
    fields.set('balance', FieldValue.create('balance', 1000.50, Confidence.create(0.85)));
    return fields;
  };

  describe('create', () => {
    it('should create extraction with fields', () => {
      const fields = createSampleFields();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      expect(extraction.getId()).toBe('ext-1');
      expect(extraction.getDocumentId()).toBe('doc-1');
      expect(extraction.getFields().size).toBe(3);
      expect(extraction.getCorrectedAt()).toBeNull();
    });

    it('should calculate overall confidence from fields', () => {
      const fields = createSampleFields();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      const expectedAvg = (0.9 + 0.95 + 0.85) / 3;
      expect(extraction.getOverallConfidence().getValue()).toBeCloseTo(expectedAvg, 5);
    });

    it('should create extraction with zero confidence when no fields', () => {
      const fields = new Map<string, FieldValue>();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      expect(extraction.getOverallConfidence().getValue()).toBe(0);
    });

    it('should set extracted date on creation', () => {
      const beforeCreate = new Date();
      const fields = createSampleFields();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);
      const afterCreate = new Date();

      const extractedAt = extraction.getExtractedAt();
      expect(extractedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(extractedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('updateField', () => {
    it('should update field value', () => {
      const fields = createSampleFields();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      extraction.updateField('accountNumber', '789012');

      const updatedField = extraction.getField('accountNumber');
      expect(updatedField?.getValue()).toBe('789012');
    });

    it('should set corrected date when field is updated', () => {
      const fields = createSampleFields();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);
      const beforeUpdate = new Date();

      extraction.updateField('accountNumber', '789012');
      const afterUpdate = new Date();

      const correctedAt = extraction.getCorrectedAt();
      expect(correctedAt).not.toBeNull();
      expect(correctedAt!.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(correctedAt!.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    });

    it('should recalculate overall confidence after field update', () => {
      const fields = createSampleFields();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);
      const initialConfidence = extraction.getOverallConfidence().getValue();

      extraction.updateField('accountNumber', '789012');

      expect(extraction.getOverallConfidence().getValue()).toBe(initialConfidence);
    });

    it('should throw error when updating non-existent field', () => {
      const fields = createSampleFields();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      expect(() => {
        extraction.updateField('nonExistent', 'value');
      }).toThrow(ValidationError);
    });
  });

  describe('updateFieldConfidence', () => {
    it('should update field confidence', () => {
      const fields = createSampleFields();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);
      const newConfidence = Confidence.create(0.75);

      extraction.updateFieldConfidence('accountNumber', newConfidence);

      const updatedField = extraction.getField('accountNumber');
      expect(updatedField?.getConfidence()).toBe(newConfidence);
    });

    it('should recalculate overall confidence after confidence update', () => {
      const fields = createSampleFields();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);
      const initialConfidence = extraction.getOverallConfidence().getValue();

      extraction.updateFieldConfidence('accountNumber', Confidence.create(0.5));

      const newConfidence = extraction.getOverallConfidence().getValue();
      expect(newConfidence).toBeLessThan(initialConfidence);
    });

    it('should throw error when updating confidence of non-existent field', () => {
      const fields = createSampleFields();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      expect(() => {
        extraction.updateFieldConfidence('nonExistent', Confidence.create(0.9));
      }).toThrow(ValidationError);
    });
  });

  describe('requiresReview', () => {
    it('should return true when overall confidence is below threshold', () => {
      const fields = new Map<string, FieldValue>();
      fields.set('field1', FieldValue.create('field1', 'value', Confidence.create(0.6)));
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      expect(extraction.requiresReview(0.8)).toBe(true);
    });

    it('should return false when overall confidence is above threshold', () => {
      const fields = new Map<string, FieldValue>();
      fields.set('field1', FieldValue.create('field1', 'value', Confidence.create(0.9)));
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      expect(extraction.requiresReview(0.8)).toBe(false);
    });
  });

  describe('hasLowConfidenceFields', () => {
    it('should return true when some fields have low confidence', () => {
      const fields = new Map<string, FieldValue>();
      fields.set('highConf', FieldValue.create('highConf', 'value', Confidence.create(0.9)));
      fields.set('lowConf', FieldValue.create('lowConf', 'value', Confidence.create(0.5)));
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      expect(extraction.hasLowConfidenceFields(0.7)).toBe(true);
    });

    it('should return false when all fields have high confidence', () => {
      const fields = new Map<string, FieldValue>();
      fields.set('field1', FieldValue.create('field1', 'value', Confidence.create(0.9)));
      fields.set('field2', FieldValue.create('field2', 'value', Confidence.create(0.85)));
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      expect(extraction.hasLowConfidenceFields(0.7)).toBe(false);
    });
  });

  describe('getLowConfidenceFields', () => {
    it('should return only fields with low confidence', () => {
      const fields = new Map<string, FieldValue>();
      fields.set('highConf', FieldValue.create('highConf', 'value1', Confidence.create(0.9)));
      fields.set('lowConf1', FieldValue.create('lowConf1', 'value2', Confidence.create(0.5)));
      fields.set('lowConf2', FieldValue.create('lowConf2', 'value3', Confidence.create(0.6)));
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      const lowConfFields = extraction.getLowConfidenceFields(0.7);

      expect(lowConfFields).toHaveLength(2);
      expect(lowConfFields.map(f => f.getName())).toContain('lowConf1');
      expect(lowConfFields.map(f => f.getName())).toContain('lowConf2');
    });

    it('should return empty array when all fields have high confidence', () => {
      const fields = new Map<string, FieldValue>();
      fields.set('field1', FieldValue.create('field1', 'value', Confidence.create(0.9)));
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      const lowConfFields = extraction.getLowConfidenceFields(0.7);

      expect(lowConfFields).toHaveLength(0);
    });
  });

  describe('getField', () => {
    it('should return field by name', () => {
      const fields = createSampleFields();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      const field = extraction.getField('accountNumber');

      expect(field).toBeDefined();
      expect(field?.getName()).toBe('accountNumber');
      expect(field?.getValue()).toBe('123456');
    });

    it('should return undefined for non-existent field', () => {
      const fields = createSampleFields();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      const field = extraction.getField('nonExistent');

      expect(field).toBeUndefined();
    });
  });

  describe('hasField', () => {
    it('should return true for existing field', () => {
      const fields = createSampleFields();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      expect(extraction.hasField('accountNumber')).toBe(true);
    });

    it('should return false for non-existent field', () => {
      const fields = createSampleFields();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      expect(extraction.hasField('nonExistent')).toBe(false);
    });
  });

  describe('getFieldNames', () => {
    it('should return all field names', () => {
      const fields = createSampleFields();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      const fieldNames = extraction.getFieldNames();

      expect(fieldNames).toHaveLength(3);
      expect(fieldNames).toContain('accountNumber');
      expect(fieldNames).toContain('bankName');
      expect(fieldNames).toContain('balance');
    });

    it('should return empty array for extraction with no fields', () => {
      const fields = new Map<string, FieldValue>();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      const fieldNames = extraction.getFieldNames();

      expect(fieldNames).toHaveLength(0);
    });
  });

  describe('hasBeenCorrected', () => {
    it('should return false for new extraction', () => {
      const fields = createSampleFields();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      expect(extraction.hasBeenCorrected()).toBe(false);
    });

    it('should return true after field update', () => {
      const fields = createSampleFields();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      extraction.updateField('accountNumber', '789012');

      expect(extraction.hasBeenCorrected()).toBe(true);
    });
  });

  describe('getFields', () => {
    it('should return copy of fields map', () => {
      const fields = createSampleFields();
      const extraction = Extraction.create('ext-1', 'doc-1', fields);

      const returnedFields = extraction.getFields();

      expect(returnedFields.size).toBe(fields.size);
      expect(returnedFields).not.toBe(fields);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute extraction from stored data', () => {
      const extractedAt = new Date('2024-01-01');
      const correctedAt = new Date('2024-01-02');
      const fields = createSampleFields();
      const confidence = Confidence.create(0.9);

      const extraction = Extraction.reconstitute({
        id: 'ext-1',
        documentId: 'doc-1',
        fields,
        overallConfidence: confidence,
        extractedAt,
        correctedAt,
      });

      expect(extraction.getId()).toBe('ext-1');
      expect(extraction.getDocumentId()).toBe('doc-1');
      expect(extraction.getOverallConfidence()).toBe(confidence);
      expect(extraction.getExtractedAt()).toBe(extractedAt);
      expect(extraction.getCorrectedAt()).toBe(correctedAt);
    });
  });
});