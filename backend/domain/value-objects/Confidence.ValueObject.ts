import { DomainError } from '@/backend/domain/errors/Domain.Error';

export class Confidence {
  private constructor(private readonly value: number) {
    if (value < 0 || value > 1) {
      throw new DomainError('Confidence must be between 0 and 1', {
        providedValue: value,
      });
    }
  }

  static create(value: number): Confidence {
    return new Confidence(value);
  }

  static zero(): Confidence {
    return new Confidence(0);
  }

  static full(): Confidence {
    return new Confidence(1);
  }

  getValue(): number {
    return this.value;
  }

  requiresReview(threshold: number): boolean {
    return this.value < threshold;
  }

  isHigh(threshold = 0.85): boolean {
    return this.value >= threshold;
  }

  isMedium(lowThreshold = 0.60, highThreshold = 0.85): boolean {
    return this.value >= lowThreshold && this.value < highThreshold;
  }

  isLow(threshold = 0.60): boolean {
    return this.value < threshold;
  }

  toPercentage(): number {
    return Math.round(this.value * 100);
  }

  equals(other: Confidence): boolean {
    return this.value === other.value;
  }

  isGreaterThan(other: Confidence): boolean {
    return this.value > other.value;
  }

  isLessThan(other: Confidence): boolean {
    return this.value < other.value;
  }
}