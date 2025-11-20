import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import { FieldValue } from '@/backend/domain/value-objects/FieldValue.ValueObject';

interface ClassificationPrediction {
  type: string;
  confidence: number;
}

interface ValidationResult {
  isValid: boolean;
  confidence: number;
}

interface LearningExample {
  type: string;
  fields: Record<string, unknown>;
  correctCount: number;
}

export class ConfidenceCalculatorService {
  calculateClassificationConfidence(
    predictions: ClassificationPrediction[],
    validations: ValidationResult[]
  ): Confidence {
    if (predictions.length === 0) {
      return Confidence.zero();
    }

    const topPrediction = predictions[0];
    let confidence = topPrediction.confidence;

    if (predictions.length > 1) {
      const secondPrediction = predictions[1];
      const margin = topPrediction.confidence - secondPrediction.confidence;

      if (margin < 0.15) {
        confidence = confidence * 0.85;
      }
    }

    if (validations.length > 0) {
      const avgValidationConfidence =
        validations.reduce((sum, v) => sum + v.confidence, 0) / validations.length;
      confidence = (confidence + avgValidationConfidence) / 2;
    }

    return Confidence.create(Math.max(0, Math.min(1, confidence)));
  }

  calculateFieldConfidence(
    value: string | number | boolean | null,
    schemaDefinition: Record<string, unknown>,
    validation: ValidationResult
  ): Confidence {
    let confidence = 0.8;

    if (value === null || value === '') {
      return Confidence.create(0.3);
    }

    if (validation.isValid) {
      confidence = Math.max(confidence, validation.confidence);
    } else {
      confidence = confidence * 0.5;
    }

    const hasPattern = schemaDefinition.pattern !== undefined;
    if (hasPattern && validation.isValid) {
      confidence = Math.min(confidence + 0.1, 1.0);
    }

    return Confidence.create(confidence);
  }

  adjustConfidenceWithLearning(
    baseConfidence: Confidence,
    learningExamples: LearningExample[]
  ): Confidence {
    if (learningExamples.length === 0) {
      return baseConfidence;
    }

    const totalCorrect = learningExamples.reduce((sum, ex) => sum + ex.correctCount, 0);
    const avgCorrectRate = totalCorrect / learningExamples.length;

    let adjustedValue = baseConfidence.getValue();

    if (avgCorrectRate > 0.8) {
      adjustedValue = Math.min(adjustedValue + 0.05, 1.0);
    } else if (avgCorrectRate < 0.5) {
      adjustedValue = Math.max(adjustedValue - 0.1, 0);
    }

    return Confidence.create(adjustedValue);
  }

  calculateOverallExtractionConfidence(fields: FieldValue[]): Confidence {
    if (fields.length === 0) {
      return Confidence.zero();
    }

    const confidenceValues = fields.map(field => field.getConfidence().getValue());

    const average = confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;

    const variance =
      confidenceValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) /
      confidenceValues.length;
    const stdDev = Math.sqrt(variance);

    let adjustedConfidence = average;
    if (stdDev > 0.2) {
      adjustedConfidence = average * 0.9;
    }

    const lowConfidenceCount = confidenceValues.filter(val => val < 0.6).length;
    const lowConfidenceRatio = lowConfidenceCount / confidenceValues.length;

    if (lowConfidenceRatio > 0.3) {
      adjustedConfidence = adjustedConfidence * 0.85;
    }

    return Confidence.create(Math.max(0, Math.min(1, adjustedConfidence)));
  }

  combineConfidences(confidences: Confidence[]): Confidence {
    if (confidences.length === 0) {
      return Confidence.zero();
    }

    if (confidences.length === 1) {
      return confidences[0];
    }

    const values = confidences.map(c => c.getValue());
    const product = values.reduce((prod, val) => prod * val, 1);
    const combinedValue = Math.pow(product, 1 / values.length);

    return Confidence.create(combinedValue);
  }
}