import { FieldValue } from '@/backend/domain/value-objects/FieldValue.ValueObject';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import { ValidationError } from '@/backend/domain/errors/Domain.Error';

export class Extraction {
  private constructor(
    private readonly id: string,
    private readonly documentId: string,
    private fields: Map<string, FieldValue>,
    private overallConfidence: Confidence,
    private readonly extractedAt: Date,
    private correctedAt: Date | null
  ) {}

  static create(
    id: string,
    documentId: string,
    fields: Map<string, FieldValue>
  ): Extraction {
    const overallConfidence = Extraction.calculateOverallConfidence(fields);

    return new Extraction(
      id,
      documentId,
      fields,
      overallConfidence,
      new Date(),
      null
    );
  }

  static reconstitute(props: {
    id: string;
    documentId: string;
    fields: Map<string, FieldValue>;
    overallConfidence: Confidence;
    extractedAt: Date;
    correctedAt: Date | null;
  }): Extraction {
    return new Extraction(
      props.id,
      props.documentId,
      props.fields,
      props.overallConfidence,
      props.extractedAt,
      props.correctedAt
    );
  }

  private static calculateOverallConfidence(fields: Map<string, FieldValue>): Confidence {
    if (fields.size === 0) {
      return Confidence.zero();
    }

    const confidenceValues = Array.from(fields.values()).map(field =>
      field.getConfidence().getValue()
    );

    const average = confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;

    return Confidence.create(average);
  }

  updateField(fieldName: string, newValue: string | number | boolean | null): void {
    const existingField = this.fields.get(fieldName);

    if (!existingField) {
      throw new ValidationError('Field does not exist', { fieldName });
    }

    const updatedField = existingField.withNewValue(newValue);
    this.fields.set(fieldName, updatedField);
    this.correctedAt = new Date();
    this.recalculateOverallConfidence();
  }

  updateFieldConfidence(fieldName: string, newConfidence: Confidence): void {
    const existingField = this.fields.get(fieldName);

    if (!existingField) {
      throw new ValidationError('Field does not exist', { fieldName });
    }

    const updatedField = existingField.withNewConfidence(newConfidence);
    this.fields.set(fieldName, updatedField);
    this.recalculateOverallConfidence();
  }

  private recalculateOverallConfidence(): void {
    this.overallConfidence = Extraction.calculateOverallConfidence(this.fields);
  }

  requiresReview(threshold: number): boolean {
    return this.overallConfidence.requiresReview(threshold);
  }

  hasLowConfidenceFields(threshold: number): boolean {
    return Array.from(this.fields.values()).some(field =>
      field.requiresReview(threshold)
    );
  }

  getLowConfidenceFields(threshold: number): FieldValue[] {
    return Array.from(this.fields.values()).filter(field =>
      field.requiresReview(threshold)
    );
  }

  getField(fieldName: string): FieldValue | undefined {
    return this.fields.get(fieldName);
  }

  hasField(fieldName: string): boolean {
    return this.fields.has(fieldName);
  }

  getFieldNames(): string[] {
    return Array.from(this.fields.keys());
  }

  hasBeenCorrected(): boolean {
    return this.correctedAt !== null;
  }

  getId(): string {
    return this.id;
  }

  getDocumentId(): string {
    return this.documentId;
  }

  getFields(): Map<string, FieldValue> {
    return new Map(this.fields);
  }

  getOverallConfidence(): Confidence {
    return this.overallConfidence;
  }

  getExtractedAt(): Date {
    return this.extractedAt;
  }

  getCorrectedAt(): Date | null {
    return this.correctedAt;
  }
}