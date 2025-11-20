import { ConfidenceCalculatorService } from '@/backend/domain/services/ConfidenceCalculator.Service';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import { FieldValue } from '@/backend/domain/value-objects/FieldValue.ValueObject';

describe('ConfidenceCalculator Service', () => {
  let service: ConfidenceCalculatorService;

  beforeEach(() => {
    service = new ConfidenceCalculatorService();
  });

  describe('calculateClassificationConfidence', () => {
    it('should return zero confidence for empty predictions', () => {
      const confidence = service.calculateClassificationConfidence([], []);

      expect(confidence.getValue()).toBe(0);
    });

    it('should use top prediction confidence', () => {
      const predictions = [
        { type: 'bank_statement', confidence: 0.9 },
        { type: 'government_id', confidence: 0.1 },
      ];

      const confidence = service.calculateClassificationConfidence(predictions, []);

      expect(confidence.getValue()).toBeGreaterThan(0.7);
    });

    it('should reduce confidence when margin between top predictions is small', () => {
      const predictions = [
        { type: 'bank_statement', confidence: 0.85 },
        { type: 'government_id', confidence: 0.80 },
      ];

      const confidence = service.calculateClassificationConfidence(predictions, []);

      expect(confidence.getValue()).toBeLessThan(0.85);
    });

    it('should not reduce confidence when margin is large', () => {
      const predictions = [
        { type: 'bank_statement', confidence: 0.9 },
        { type: 'government_id', confidence: 0.5 },
      ];

      const confidence = service.calculateClassificationConfidence(predictions, []);

      expect(confidence.getValue()).toBeGreaterThanOrEqual(0.9);
    });

    it('should incorporate validation results', () => {
      const predictions = [{ type: 'bank_statement', confidence: 0.8 }];
      const validations = [
        { isValid: true, confidence: 0.9 },
        { isValid: true, confidence: 0.95 },
      ];

      const confidence = service.calculateClassificationConfidence(predictions, validations);

      expect(confidence.getValue()).toBeGreaterThan(0.8);
    });
  });

  describe('calculateFieldConfidence', () => {
    it('should return low confidence for null values', () => {
      const confidence = service.calculateFieldConfidence(
        null,
        {},
        { isValid: false, confidence: 0.5 }
      );

      expect(confidence.getValue()).toBeLessThan(0.5);
    });

    it('should return low confidence for empty string', () => {
      const confidence = service.calculateFieldConfidence(
        '',
        {},
        { isValid: false, confidence: 0.5 }
      );

      expect(confidence.getValue()).toBeLessThan(0.5);
    });

    it('should use validation confidence when valid', () => {
      const confidence = service.calculateFieldConfidence(
        '123456',
        {},
        { isValid: true, confidence: 0.95 }
      );

      expect(confidence.getValue()).toBeGreaterThanOrEqual(0.8);
    });

    it('should reduce confidence when validation fails', () => {
      const confidence = service.calculateFieldConfidence(
        '123456',
        {},
        { isValid: false, confidence: 0.5 }
      );

      expect(confidence.getValue()).toBeLessThan(0.8);
    });

    it('should boost confidence for pattern-validated fields', () => {
      const schemaWithPattern = { pattern: '^[0-9]+$' };
      const confidence = service.calculateFieldConfidence(
        '123456',
        schemaWithPattern,
        { isValid: true, confidence: 0.9 }
      );

      expect(confidence.getValue()).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe('adjustConfidenceWithLearning', () => {
    it('should return base confidence when no learning examples', () => {
      const baseConfidence = Confidence.create(0.8);
      const adjusted = service.adjustConfidenceWithLearning(baseConfidence, []);

      expect(adjusted.getValue()).toBe(0.8);
    });

    it('should boost confidence when learning examples show high accuracy', () => {
      const baseConfidence = Confidence.create(0.8);
      const learningExamples = [
        { type: 'bank_statement', fields: {}, correctCount: 0.9 },
        { type: 'bank_statement', fields: {}, correctCount: 0.95 },
      ];

      const adjusted = service.adjustConfidenceWithLearning(baseConfidence, learningExamples);

      expect(adjusted.getValue()).toBeGreaterThan(0.8);
    });

    it('should reduce confidence when learning examples show low accuracy', () => {
      const baseConfidence = Confidence.create(0.8);
      const learningExamples = [
        { type: 'bank_statement', fields: {}, correctCount: 0.3 },
        { type: 'bank_statement', fields: {}, correctCount: 0.4 },
      ];

      const adjusted = service.adjustConfidenceWithLearning(baseConfidence, learningExamples);

      expect(adjusted.getValue()).toBeLessThan(0.8);
    });

    it('should not change confidence for moderate accuracy', () => {
      const baseConfidence = Confidence.create(0.8);
      const learningExamples = [
        { type: 'bank_statement', fields: {}, correctCount: 0.6 },
        { type: 'bank_statement', fields: {}, correctCount: 0.7 },
      ];

      const adjusted = service.adjustConfidenceWithLearning(baseConfidence, learningExamples);

      expect(adjusted.getValue()).toBe(0.8);
    });
  });

  describe('calculateOverallExtractionConfidence', () => {
    it('should return zero confidence for empty fields', () => {
      const confidence = service.calculateOverallExtractionConfidence([]);

      expect(confidence.getValue()).toBe(0);
    });

    it('should calculate average confidence for fields', () => {
      const fields = [
        FieldValue.create('field1', 'value1', Confidence.create(0.8)),
        FieldValue.create('field2', 'value2', Confidence.create(0.9)),
        FieldValue.create('field3', 'value3', Confidence.create(0.7)),
      ];

      const confidence = service.calculateOverallExtractionConfidence(fields);
      const expectedAvg = (0.8 + 0.9 + 0.7) / 3;

      expect(confidence.getValue()).toBeCloseTo(expectedAvg, 2);
    });

    it('should reduce confidence when variance is high', () => {
      const fields = [
        FieldValue.create('field1', 'value1', Confidence.create(0.9)),
        FieldValue.create('field2', 'value2', Confidence.create(0.2)),
      ];

      const confidence = service.calculateOverallExtractionConfidence(fields);
      const simpleAvg = (0.9 + 0.2) / 2;

      expect(confidence.getValue()).toBeLessThan(simpleAvg);
    });

    it('should reduce confidence when many low-confidence fields', () => {
      const fields = [
        FieldValue.create('field1', 'value1', Confidence.create(0.9)),
        FieldValue.create('field2', 'value2', Confidence.create(0.5)),
        FieldValue.create('field3', 'value3', Confidence.create(0.4)),
        FieldValue.create('field4', 'value4', Confidence.create(0.3)),
      ];

      const confidence = service.calculateOverallExtractionConfidence(fields);
      const simpleAvg = (0.9 + 0.5 + 0.4 + 0.3) / 4;

      expect(confidence.getValue()).toBeLessThan(simpleAvg);
    });
  });

  describe('combineConfidences', () => {
    it('should return zero confidence for empty array', () => {
      const combined = service.combineConfidences([]);

      expect(combined.getValue()).toBe(0);
    });

    it('should return same confidence for single confidence', () => {
      const confidences = [Confidence.create(0.8)];
      const combined = service.combineConfidences(confidences);

      expect(combined.getValue()).toBe(0.8);
    });

    it('should combine multiple confidences using geometric mean', () => {
      const confidences = [
        Confidence.create(0.9),
        Confidence.create(0.8),
        Confidence.create(0.85),
      ];

      const combined = service.combineConfidences(confidences);
      const geometricMean = Math.pow(0.9 * 0.8 * 0.85, 1 / 3);

      expect(combined.getValue()).toBeCloseTo(geometricMean, 5);
    });

    it('should result in lower confidence when one confidence is low', () => {
      const confidences = [
        Confidence.create(0.9),
        Confidence.create(0.9),
        Confidence.create(0.3),
      ];

      const combined = service.combineConfidences(confidences);
      const simpleAverage = (0.9 + 0.9 + 0.3) / 3;

      expect(combined.getValue()).toBeLessThan(simpleAverage);
    });
  });
});