import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import { DomainError } from '@/backend/domain/errors/Domain.Error';

describe('Confidence Value Object', () => {
  describe('create', () => {
    it('should create valid confidence with value between 0 and 1', () => {
      const confidence = Confidence.create(0.85);
      expect(confidence.getValue()).toBe(0.85);
    });

    it('should create confidence with 0', () => {
      const confidence = Confidence.create(0);
      expect(confidence.getValue()).toBe(0);
    });

    it('should create confidence with 1', () => {
      const confidence = Confidence.create(1);
      expect(confidence.getValue()).toBe(1);
    });

    it('should throw error for negative values', () => {
      expect(() => Confidence.create(-0.1)).toThrow(DomainError);
      expect(() => Confidence.create(-0.1)).toThrow('Confidence must be between 0 and 1');
    });

    it('should throw error for values greater than 1', () => {
      expect(() => Confidence.create(1.1)).toThrow(DomainError);
      expect(() => Confidence.create(1.5)).toThrow('Confidence must be between 0 and 1');
    });
  });

  describe('factory methods', () => {
    it('should create zero confidence', () => {
      const confidence = Confidence.zero();
      expect(confidence.getValue()).toBe(0);
    });

    it('should create full confidence', () => {
      const confidence = Confidence.full();
      expect(confidence.getValue()).toBe(1);
    });
  });

  describe('requiresReview', () => {
    it('should return true when confidence is below threshold', () => {
      const confidence = Confidence.create(0.7);
      expect(confidence.requiresReview(0.8)).toBe(true);
    });

    it('should return false when confidence is above threshold', () => {
      const confidence = Confidence.create(0.9);
      expect(confidence.requiresReview(0.8)).toBe(false);
    });

    it('should return false when confidence equals threshold', () => {
      const confidence = Confidence.create(0.8);
      expect(confidence.requiresReview(0.8)).toBe(false);
    });
  });

  describe('isHigh', () => {
    it('should return true for confidence above default threshold (0.85)', () => {
      const confidence = Confidence.create(0.9);
      expect(confidence.isHigh()).toBe(true);
    });

    it('should return false for confidence below default threshold', () => {
      const confidence = Confidence.create(0.8);
      expect(confidence.isHigh()).toBe(false);
    });

    it('should use custom threshold when provided', () => {
      const confidence = Confidence.create(0.8);
      expect(confidence.isHigh(0.75)).toBe(true);
      expect(confidence.isHigh(0.85)).toBe(false);
    });
  });

  describe('isMedium', () => {
    it('should return true for confidence in medium range', () => {
      const confidence = Confidence.create(0.7);
      expect(confidence.isMedium()).toBe(true);
    });

    it('should return false for low confidence', () => {
      const confidence = Confidence.create(0.5);
      expect(confidence.isMedium()).toBe(false);
    });

    it('should return false for high confidence', () => {
      const confidence = Confidence.create(0.9);
      expect(confidence.isMedium()).toBe(false);
    });

    it('should use custom thresholds when provided', () => {
      const confidence = Confidence.create(0.5);
      expect(confidence.isMedium(0.4, 0.6)).toBe(true);
    });
  });

  describe('isLow', () => {
    it('should return true for confidence below default threshold (0.60)', () => {
      const confidence = Confidence.create(0.5);
      expect(confidence.isLow()).toBe(true);
    });

    it('should return false for confidence above default threshold', () => {
      const confidence = Confidence.create(0.7);
      expect(confidence.isLow()).toBe(false);
    });

    it('should use custom threshold when provided', () => {
      const confidence = Confidence.create(0.55);
      expect(confidence.isLow(0.5)).toBe(false);
      expect(confidence.isLow(0.6)).toBe(true);
    });
  });

  describe('toPercentage', () => {
    it('should convert to percentage', () => {
      expect(Confidence.create(0.85).toPercentage()).toBe(85);
      expect(Confidence.create(0.5).toPercentage()).toBe(50);
      expect(Confidence.create(0).toPercentage()).toBe(0);
      expect(Confidence.create(1).toPercentage()).toBe(100);
    });

    it('should round to nearest integer', () => {
      expect(Confidence.create(0.855).toPercentage()).toBe(86);
      expect(Confidence.create(0.854).toPercentage()).toBe(85);
    });
  });

  describe('equals', () => {
    it('should return true for equal confidences', () => {
      const conf1 = Confidence.create(0.85);
      const conf2 = Confidence.create(0.85);
      expect(conf1.equals(conf2)).toBe(true);
    });

    it('should return false for different confidences', () => {
      const conf1 = Confidence.create(0.85);
      const conf2 = Confidence.create(0.86);
      expect(conf1.equals(conf2)).toBe(false);
    });
  });

  describe('isGreaterThan', () => {
    it('should return true when confidence is greater', () => {
      const conf1 = Confidence.create(0.9);
      const conf2 = Confidence.create(0.8);
      expect(conf1.isGreaterThan(conf2)).toBe(true);
    });

    it('should return false when confidence is less', () => {
      const conf1 = Confidence.create(0.7);
      const conf2 = Confidence.create(0.8);
      expect(conf1.isGreaterThan(conf2)).toBe(false);
    });

    it('should return false when confidences are equal', () => {
      const conf1 = Confidence.create(0.8);
      const conf2 = Confidence.create(0.8);
      expect(conf1.isGreaterThan(conf2)).toBe(false);
    });
  });

  describe('isLessThan', () => {
    it('should return true when confidence is less', () => {
      const conf1 = Confidence.create(0.7);
      const conf2 = Confidence.create(0.8);
      expect(conf1.isLessThan(conf2)).toBe(true);
    });

    it('should return false when confidence is greater', () => {
      const conf1 = Confidence.create(0.9);
      const conf2 = Confidence.create(0.8);
      expect(conf1.isLessThan(conf2)).toBe(false);
    });

    it('should return false when confidences are equal', () => {
      const conf1 = Confidence.create(0.8);
      const conf2 = Confidence.create(0.8);
      expect(conf1.isLessThan(conf2)).toBe(false);
    });
  });
});
