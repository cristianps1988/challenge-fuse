import { FieldValue } from '@/backend/domain/value-objects/FieldValue.ValueObject';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';

describe('FieldValue Value Object', () => {
  describe('create', () => {
    it('should create field with string value', () => {
      const confidence = Confidence.create(0.9);
      const field = FieldValue.create('accountNumber', '123456', confidence);

      expect(field.getName()).toBe('accountNumber');
      expect(field.getValue()).toBe('123456');
      expect(field.getConfidence()).toBe(confidence);
    });

    it('should create field with number value', () => {
      const confidence = Confidence.create(0.85);
      const field = FieldValue.create('balance', 1000.50, confidence);

      expect(field.getName()).toBe('balance');
      expect(field.getValue()).toBe(1000.50);
      expect(field.getConfidence()).toBe(confidence);
    });

    it('should create field with boolean value', () => {
      const confidence = Confidence.create(0.95);
      const field = FieldValue.create('isActive', true, confidence);

      expect(field.getName()).toBe('isActive');
      expect(field.getValue()).toBe(true);
      expect(field.getConfidence()).toBe(confidence);
    });

    it('should create field with null value', () => {
      const confidence = Confidence.create(0.5);
      const field = FieldValue.create('middleName', null, confidence);

      expect(field.getName()).toBe('middleName');
      expect(field.getValue()).toBe(null);
      expect(field.getConfidence()).toBe(confidence);
    });
  });

  describe('requiresReview', () => {
    it('should return true when confidence is below threshold', () => {
      const confidence = Confidence.create(0.7);
      const field = FieldValue.create('name', 'John', confidence);

      expect(field.requiresReview(0.8)).toBe(true);
    });

    it('should return false when confidence is above threshold', () => {
      const confidence = Confidence.create(0.9);
      const field = FieldValue.create('name', 'John', confidence);

      expect(field.requiresReview(0.8)).toBe(false);
    });
  });

  describe('isEmpty', () => {
    it('should return true for null value', () => {
      const field = FieldValue.create('name', null, Confidence.create(0.5));
      expect(field.isEmpty()).toBe(true);
    });

    it('should return true for empty string', () => {
      const field = FieldValue.create('name', '', Confidence.create(0.5));
      expect(field.isEmpty()).toBe(true);
    });

    it('should return false for non-empty string', () => {
      const field = FieldValue.create('name', 'John', Confidence.create(0.9));
      expect(field.isEmpty()).toBe(false);
    });

    it('should return false for number', () => {
      const field = FieldValue.create('amount', 0, Confidence.create(0.9));
      expect(field.isEmpty()).toBe(false);
    });

    it('should return false for boolean', () => {
      const field = FieldValue.create('active', false, Confidence.create(0.9));
      expect(field.isEmpty()).toBe(false);
    });
  });

  describe('type checking methods', () => {
    it('should correctly identify string type', () => {
      const field = FieldValue.create('name', 'John', Confidence.create(0.9));
      expect(field.isString()).toBe(true);
      expect(field.isNumber()).toBe(false);
      expect(field.isBoolean()).toBe(false);
    });

    it('should correctly identify number type', () => {
      const field = FieldValue.create('amount', 100, Confidence.create(0.9));
      expect(field.isString()).toBe(false);
      expect(field.isNumber()).toBe(true);
      expect(field.isBoolean()).toBe(false);
    });

    it('should correctly identify boolean type', () => {
      const field = FieldValue.create('active', true, Confidence.create(0.9));
      expect(field.isString()).toBe(false);
      expect(field.isNumber()).toBe(false);
      expect(field.isBoolean()).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for equal field values', () => {
      const conf = Confidence.create(0.9);
      const field1 = FieldValue.create('name', 'John', conf);
      const field2 = FieldValue.create('name', 'John', conf);

      expect(field1.equals(field2)).toBe(true);
    });

    it('should return false for different field names', () => {
      const conf = Confidence.create(0.9);
      const field1 = FieldValue.create('firstName', 'John', conf);
      const field2 = FieldValue.create('lastName', 'John', conf);

      expect(field1.equals(field2)).toBe(false);
    });

    it('should return false for different values', () => {
      const conf = Confidence.create(0.9);
      const field1 = FieldValue.create('name', 'John', conf);
      const field2 = FieldValue.create('name', 'Jane', conf);

      expect(field1.equals(field2)).toBe(false);
    });

    it('should return false for different confidences', () => {
      const field1 = FieldValue.create('name', 'John', Confidence.create(0.9));
      const field2 = FieldValue.create('name', 'John', Confidence.create(0.8));

      expect(field1.equals(field2)).toBe(false);
    });
  });

  describe('withNewValue', () => {
    it('should create new instance with updated value', () => {
      const original = FieldValue.create('name', 'John', Confidence.create(0.9));
      const updated = original.withNewValue('Jane');

      expect(updated.getValue()).toBe('Jane');
      expect(updated.getName()).toBe('name');
      expect(updated.getConfidence()).toBe(original.getConfidence());
      expect(original.getValue()).toBe('John');
    });

    it('should create new instance with different type value', () => {
      const original = FieldValue.create('amount', 100, Confidence.create(0.9));
      const updated = original.withNewValue('100.50');

      expect(updated.getValue()).toBe('100.50');
      expect(updated.isString()).toBe(true);
    });
  });

  describe('withNewConfidence', () => {
    it('should create new instance with updated confidence', () => {
      const original = FieldValue.create('name', 'John', Confidence.create(0.8));
      const newConfidence = Confidence.create(0.95);
      const updated = original.withNewConfidence(newConfidence);

      expect(updated.getConfidence()).toBe(newConfidence);
      expect(updated.getName()).toBe('name');
      expect(updated.getValue()).toBe('John');
      expect(original.getConfidence().getValue()).toBe(0.8);
    });
  });

  describe('immutability', () => {
    it('should not mutate original when creating new value', () => {
      const original = FieldValue.create('name', 'John', Confidence.create(0.9));
      const updated = original.withNewValue('Jane');

      expect(original.getValue()).toBe('John');
      expect(updated.getValue()).toBe('Jane');
    });

    it('should not mutate original when creating new confidence', () => {
      const original = FieldValue.create('name', 'John', Confidence.create(0.8));
      const updated = original.withNewConfidence(Confidence.create(0.95));

      expect(original.getConfidence().getValue()).toBe(0.8);
      expect(updated.getConfidence().getValue()).toBe(0.95);
    });
  });
});
