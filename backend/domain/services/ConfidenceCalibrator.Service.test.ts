import { ConfidenceCalibratorService } from './ConfidenceCalibrator.Service';
import { FieldValue } from '@/backend/domain/value-objects/FieldValue.ValueObject';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import { DocumentType } from '@/backend/domain/document-types.constants';

describe('ConfidenceCalibratorService', () => {
  let service: ConfidenceCalibratorService;

  beforeEach(() => {
    service = new ConfidenceCalibratorService();
  });

  describe('calibrateExtraction', () => {
    it('should return original confidence when all fields pass validation', () => {
      const fields = new Map([
        ['account_number', FieldValue.create('account_number', '1234567890', Confidence.create(0.95))],
        ['account_holder_name', FieldValue.create('account_holder_name', 'John Doe', Confidence.create(0.90))],
      ]);

      const schema = {
        properties: {
          account_number: {
            type: 'string',
            pattern: '^[\\d]+$',
          },
          account_holder_name: {
            type: 'string',
          },
        },
      };

      const result = service.calibrateExtraction(fields, DocumentType.BANK_STATEMENT, schema);

      expect(result.calibratedFields.get('account_number')?.getConfidence().getValue()).toBe(0.95);
      expect(result.calibratedFields.get('account_holder_name')?.getConfidence().getValue()).toBe(0.90);
      expect(result.calibrationDetails.failedValidations).toHaveLength(0);
    });

    it('should reduce confidence when field fails pattern validation', () => {
      const fields = new Map([
        ['account_number', FieldValue.create('account_number', 'ABC123', Confidence.create(0.95))],
      ]);

      const schema = {
        properties: {
          account_number: {
            type: 'string',
            pattern: '^[\\d]+$',
          },
        },
      };

      const result = service.calibrateExtraction(fields, DocumentType.BANK_STATEMENT, schema);

      const calibratedConfidence = result.calibratedFields.get('account_number')?.getConfidence().getValue();
      expect(calibratedConfidence).toBeLessThan(0.95);
      expect(calibratedConfidence).toBe(0.4);
      expect(result.calibrationDetails.failedValidations.length).toBeGreaterThan(0);
    });

    it('should reduce confidence when field fails type validation', () => {
      const fields = new Map([
        ['ending_balance', FieldValue.create('ending_balance', 'not a number', Confidence.create(0.90))],
      ]);

      const schema = {
        properties: {
          ending_balance: {
            type: 'number',
          },
        },
      };

      const result = service.calibrateExtraction(fields, DocumentType.BANK_STATEMENT, schema);

      const calibratedConfidence = result.calibratedFields.get('ending_balance')?.getConfidence().getValue();
      expect(calibratedConfidence).toBeLessThan(0.90);
    });

    it('should validate date format correctly', () => {
      const validDateField = new Map([
        ['statement_period_start', FieldValue.create('statement_period_start', '2024-01-15', Confidence.create(0.95))],
      ]);

      const invalidDateField = new Map([
        ['statement_period_start', FieldValue.create('statement_period_start', '15/01/2024', Confidence.create(0.95))],
      ]);

      const schema = {
        properties: {
          statement_period_start: {
            type: 'string',
            format: 'date',
          },
        },
      };

      const validResult = service.calibrateExtraction(validDateField, DocumentType.BANK_STATEMENT, schema);
      const invalidResult = service.calibrateExtraction(invalidDateField, DocumentType.BANK_STATEMENT, schema);

      expect(validResult.calibratedFields.get('statement_period_start')?.getConfidence().getValue()).toBe(0.95);
      expect(invalidResult.calibratedFields.get('statement_period_start')?.getConfidence().getValue()).toBeLessThan(0.95);
    });

    it('should handle null values with reduced confidence', () => {
      const fields = new Map([
        ['account_number', FieldValue.create('account_number', null, Confidence.create(0.90))],
      ]);

      const schema = {
        properties: {
          account_number: {
            type: 'string',
          },
        },
      };

      const result = service.calibrateExtraction(fields, DocumentType.BANK_STATEMENT, schema);

      expect(result.calibratedFields.get('account_number')?.getConfidence().getValue()).toBe(0.5);
    });

    it('should calculate weighted overall confidence based on field weights', () => {
      const fields = new Map([
        ['account_number', FieldValue.create('account_number', '1234567890', Confidence.create(0.95))],
        ['total_deposits', FieldValue.create('total_deposits', 1000, Confidence.create(0.70))],
      ]);

      const schema = {
        properties: {
          account_number: { type: 'string' },
          total_deposits: { type: 'number' },
        },
      };

      const result = service.calibrateExtraction(fields, DocumentType.BANK_STATEMENT, schema);

      expect(result.overallConfidence.getValue()).toBeGreaterThan(0.70);
      expect(result.overallConfidence.getValue()).toBeLessThanOrEqual(0.95);
    });
  });

  describe('hasCriticalFieldsBelowThreshold', () => {
    it('should return true when critical field is below threshold', () => {
      const fields = new Map([
        ['account_number', FieldValue.create('account_number', '123', Confidence.create(0.70))],
        ['total_deposits', FieldValue.create('total_deposits', 1000, Confidence.create(0.95))],
      ]);

      const result = service.hasCriticalFieldsBelowThreshold(fields, DocumentType.BANK_STATEMENT, 0.85);

      expect(result).toBe(true);
    });

    it('should return false when all critical fields are above threshold', () => {
      const fields = new Map([
        ['account_number', FieldValue.create('account_number', '123', Confidence.create(0.90))],
        ['account_holder_name', FieldValue.create('account_holder_name', 'John', Confidence.create(0.95))],
      ]);

      const result = service.hasCriticalFieldsBelowThreshold(fields, DocumentType.BANK_STATEMENT, 0.85);

      expect(result).toBe(false);
    });

    it('should return false when no critical fields exist', () => {
      const fields = new Map([
        ['total_deposits', FieldValue.create('total_deposits', 1000, Confidence.create(0.50))],
      ]);

      const result = service.hasCriticalFieldsBelowThreshold(fields, DocumentType.BANK_STATEMENT, 0.85);

      expect(result).toBe(false);
    });
  });

  describe('validateFormat', () => {
    it('should validate email format', () => {
      const validEmail = new Map([
        ['email', FieldValue.create('email', 'test@example.com', Confidence.create(0.95))],
      ]);

      const invalidEmail = new Map([
        ['email', FieldValue.create('email', 'not-an-email', Confidence.create(0.95))],
      ]);

      const schema = {
        properties: {
          email: { type: 'string', format: 'email' },
        },
      };

      const validResult = service.calibrateExtraction(validEmail, DocumentType.W9, schema);
      const invalidResult = service.calibrateExtraction(invalidEmail, DocumentType.W9, schema);

      expect(validResult.calibratedFields.get('email')?.getConfidence().getValue()).toBe(0.95);
      expect(invalidResult.calibratedFields.get('email')?.getConfidence().getValue()).toBeLessThan(0.95);
    });

    it('should validate URL format', () => {
      const validUrl = new Map([
        ['website', FieldValue.create('website', 'https://example.com', Confidence.create(0.95))],
      ]);

      const invalidUrl = new Map([
        ['website', FieldValue.create('website', 'not a url', Confidence.create(0.95))],
      ]);

      const schema = {
        properties: {
          website: { type: 'string', format: 'url' },
        },
      };

      const validResult = service.calibrateExtraction(validUrl, DocumentType.W9, schema);
      const invalidResult = service.calibrateExtraction(invalidUrl, DocumentType.W9, schema);

      expect(validResult.calibratedFields.get('website')?.getConfidence().getValue()).toBe(0.95);
      expect(invalidResult.calibratedFields.get('website')?.getConfidence().getValue()).toBeLessThan(0.95);
    });
  });

  describe('edge cases', () => {
    it('should handle empty fields map', () => {
      const fields = new Map<string, FieldValue>();
      const schema = { properties: {} };

      const result = service.calibrateExtraction(fields, DocumentType.BANK_STATEMENT, schema);

      expect(result.overallConfidence.getValue()).toBe(0);
      expect(result.calibrationDetails.totalFields).toBe(0);
    });

    it('should handle fields without schema properties', () => {
      const fields = new Map([
        ['unknown_field', FieldValue.create('unknown_field', 'value', Confidence.create(0.80))],
      ]);

      const schema = { properties: {} };

      const result = service.calibrateExtraction(fields, DocumentType.BANK_STATEMENT, schema);

      expect(result.calibratedFields.get('unknown_field')?.getConfidence().getValue()).toBe(0.80);
    });

    it('should handle numeric range validation', () => {
      const validNumber = new Map([
        ['age', FieldValue.create('age', 25, Confidence.create(0.95))],
      ]);

      const tooLow = new Map([
        ['age', FieldValue.create('age', 5, Confidence.create(0.95))],
      ]);

      const tooHigh = new Map([
        ['age', FieldValue.create('age', 150, Confidence.create(0.95))],
      ]);

      const schema = {
        properties: {
          age: { type: 'number', minimum: 18, maximum: 120 },
        },
      };

      const validResult = service.calibrateExtraction(validNumber, DocumentType.GOVERNMENT_ID, schema);
      const tooLowResult = service.calibrateExtraction(tooLow, DocumentType.GOVERNMENT_ID, schema);
      const tooHighResult = service.calibrateExtraction(tooHigh, DocumentType.GOVERNMENT_ID, schema);

      expect(validResult.calibratedFields.get('age')?.getConfidence().getValue()).toBe(0.95);
      expect(tooLowResult.calibratedFields.get('age')?.getConfidence().getValue()).toBeLessThan(0.95);
      expect(tooHighResult.calibratedFields.get('age')?.getConfidence().getValue()).toBeLessThan(0.95);
    });
  });
});