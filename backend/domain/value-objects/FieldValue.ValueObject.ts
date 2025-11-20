import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';

export class FieldValue {
  private constructor(
    private readonly name: string,
    private readonly value: string | number | boolean | null,
    private readonly confidence: Confidence
  ) {}

  static create(
    name: string,
    value: string | number | boolean | null,
    confidence: Confidence
  ): FieldValue {
    return new FieldValue(name, value, confidence);
  }

  getName(): string {
    return this.name;
  }

  getValue(): string | number | boolean | null {
    return this.value;
  }

  getConfidence(): Confidence {
    return this.confidence;
  }

  requiresReview(threshold: number): boolean {
    return this.confidence.requiresReview(threshold);
  }

  isEmpty(): boolean {
    return this.value === null || this.value === '' || this.value === undefined;
  }

  isString(): boolean {
    return typeof this.value === 'string';
  }

  isNumber(): boolean {
    return typeof this.value === 'number';
  }

  isBoolean(): boolean {
    return typeof this.value === 'boolean';
  }

  equals(other: FieldValue): boolean {
    return (
      this.name === other.name &&
      this.value === other.value &&
      this.confidence.equals(other.confidence)
    );
  }

  withNewValue(newValue: string | number | boolean | null): FieldValue {
    return new FieldValue(this.name, newValue, this.confidence);
  }

  withNewConfidence(newConfidence: Confidence): FieldValue {
    return new FieldValue(this.name, this.value, newConfidence);
  }
}