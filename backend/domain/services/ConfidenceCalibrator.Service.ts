import { FieldValue } from '@/backend/domain/value-objects/FieldValue.ValueObject';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';
import { getFieldWeight, getCriticalFields } from '@/backend/domain/field-weights.constants';

interface SchemaProperty {
  type?: string;
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
}

interface Schema {
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}

export interface CalibrationResult {
  calibratedFields: Map<string, FieldValue>;
  overallConfidence: Confidence;
  calibrationDetails: {
    totalFields: number;
    validatedFields: number;
    failedValidations: string[];
    criticalFieldsConfidence: number;
  };
}

export class ConfidenceCalibratorService {
  calibrateExtraction(
    fields: Map<string, FieldValue>,
    documentType: DocumentTypeValue,
    schema: Schema
  ): CalibrationResult {
    const calibratedFields = new Map<string, FieldValue>();
    const failedValidations: string[] = [];
    let validatedFields = 0;

    for (const [name, field] of fields) {
      const mlConfidence = field.getConfidence().getValue();
      const schemaProperty = schema.properties?.[name];

      let validationScore = 1.0;

      if (schemaProperty) {
        validationScore = this.validateField(field, schemaProperty);
        if (validationScore < 1.0) {
          failedValidations.push(`${name}: validation score ${validationScore.toFixed(2)}`);
        }
        validatedFields++;
      }

      const calibratedConfidence = Math.min(mlConfidence, validationScore);

      calibratedFields.set(
        name,
        field.withNewConfidence(Confidence.create(calibratedConfidence))
      );
    }

    const overallConfidence = this.calculateWeightedConfidence(calibratedFields, documentType);
    const criticalFieldsConfidence = this.calculateCriticalFieldsConfidence(calibratedFields, documentType);

    return {
      calibratedFields,
      overallConfidence,
      calibrationDetails: {
        totalFields: fields.size,
        validatedFields,
        failedValidations,
        criticalFieldsConfidence,
      },
    };
  }

  private validateField(field: FieldValue, schemaProperty: SchemaProperty): number {
    const value = field.getValue();
    let score = 1.0;

    if (value === null || value === undefined) {
      return 0.5;
    }

    if (schemaProperty.type) {
      const typeScore = this.validateType(value, schemaProperty.type);
      score = Math.min(score, typeScore);
    }

    if (schemaProperty.format) {
      const formatScore = this.validateFormat(value, schemaProperty.format);
      score = Math.min(score, formatScore);
    }

    if (schemaProperty.pattern && typeof value === 'string') {
      const patternScore = this.validatePattern(value, schemaProperty.pattern);
      score = Math.min(score, patternScore);
    }

    if (typeof value === 'number') {
      if (schemaProperty.minimum !== undefined && value < schemaProperty.minimum) {
        score = Math.min(score, 0.5);
      }
      if (schemaProperty.maximum !== undefined && value > schemaProperty.maximum) {
        score = Math.min(score, 0.5);
      }
    }

    if (schemaProperty.enum) {
      const enumScore = schemaProperty.enum.includes(value) ? 1.0 : 0.3;
      score = Math.min(score, enumScore);
    }

    return score;
  }

  private validateType(value: unknown, expectedType: string): number {
    const actualType = typeof value;

    switch (expectedType) {
      case 'string':
        return actualType === 'string' ? 1.0 : 0.3;
      case 'number':
        return actualType === 'number' && !isNaN(value as number) ? 1.0 : 0.3;
      case 'boolean':
        return actualType === 'boolean' ? 1.0 : 0.3;
      case 'integer':
        return actualType === 'number' && Number.isInteger(value) ? 1.0 : 0.5;
      default:
        return 1.0;
    }
  }

  private validateFormat(value: unknown, format: string): number {
    if (typeof value !== 'string') {
      return 0.5;
    }

    switch (format) {
      case 'date':
        return this.isValidDate(value) ? 1.0 : 0.4;
      case 'date-time':
        return this.isValidDateTime(value) ? 1.0 : 0.4;
      case 'email':
        return this.isValidEmail(value) ? 1.0 : 0.3;
      case 'uri':
      case 'url':
        return this.isValidUrl(value) ? 1.0 : 0.4;
      default:
        return 1.0;
    }
  }

  private validatePattern(value: string, pattern: string): number {
    try {
      const regex = new RegExp(pattern);
      return regex.test(value) ? 1.0 : 0.4;
    } catch {
      return 1.0;
    }
  }

  private isValidDate(value: string): boolean {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDateRegex.test(value)) {
      return false;
    }

    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  private isValidDateTime(value: string): boolean {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  private isValidEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  private isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  private calculateWeightedConfidence(
    fields: Map<string, FieldValue>,
    documentType: DocumentTypeValue
  ): Confidence {
    if (fields.size === 0) {
      return Confidence.zero();
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [name, field] of fields) {
      const fieldWeight = getFieldWeight(documentType, name);
      const confidence = field.getConfidence().getValue();

      weightedSum += confidence * fieldWeight.weight;
      totalWeight += fieldWeight.weight;
    }

    const weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return Confidence.create(weightedAverage);
  }

  private calculateCriticalFieldsConfidence(
    fields: Map<string, FieldValue>,
    documentType: DocumentTypeValue
  ): number {
    const criticalFieldNames = getCriticalFields(documentType);

    if (criticalFieldNames.length === 0) {
      return 1.0;
    }

    const criticalFields = criticalFieldNames
      .map(name => fields.get(name))
      .filter((field): field is FieldValue => field !== undefined);

    if (criticalFields.length === 0) {
      return 0;
    }

    const sum = criticalFields.reduce((acc, field) => {
      return acc + field.getConfidence().getValue();
    }, 0);

    return sum / criticalFields.length;
  }

  hasCriticalFieldsBelowThreshold(
    fields: Map<string, FieldValue>,
    documentType: DocumentTypeValue,
    threshold: number
  ): boolean {
    const criticalFieldNames = getCriticalFields(documentType);

    for (const fieldName of criticalFieldNames) {
      const field = fields.get(fieldName);
      if (field && field.getConfidence().getValue() < threshold) {
        return true;
      }
    }

    return false;
  }
}