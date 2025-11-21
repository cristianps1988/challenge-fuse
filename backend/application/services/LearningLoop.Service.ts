import type { Correction } from '@/backend/domain/entities/Correction.Entity';
import type { CorrectionRepository } from '@/backend/application/ports/CorrectionRepository';
import type { DocumentRepository } from '@/backend/application/ports/DocumentRepository';

export interface LearningExample {
  documentId: string;
  originalType: string;
  correctedType?: string;
  fieldCorrections: Array<{
    fieldName: string;
    originalValue: string | number | boolean | null;
    correctedValue: string | number | boolean | null;
  }>;
  correctedAt: Date;
}

export interface ValidationRule {
  fieldName: string;
  pattern?: string;
  minValue?: number;
  maxValue?: number;
  allowedValues?: Array<string | number>;
  required: boolean;
}

export class LearningLoopService {
  constructor(
    private readonly correctionRepository: CorrectionRepository,
    private readonly documentRepository: DocumentRepository
  ) {}

  async storeExample(correction: Correction): Promise<void> {
    await this.correctionRepository.save(correction);
  }

  async getExamplesForType(
    documentType: string,
    limit: number = 5
  ): Promise<LearningExample[]> {
    const corrections = await this.correctionRepository.findAll({ limit: limit * 2 });

    const examples: LearningExample[] = [];

    for (const correction of corrections) {
      const document = await this.documentRepository.findById(correction.getDocumentId());

      if (!document || document.getType()?.getValue() !== documentType) {
        continue;
      }

      examples.push({
        documentId: correction.getDocumentId(),
        originalType: correction.getOriginalType()?.getValue() ?? '',
        correctedType: correction.getCorrectedType()?.getValue(),
        fieldCorrections: correction.getFieldCorrections(),
        correctedAt: correction.getCorrectedAt(),
      });

      if (examples.length >= limit) {
        break;
      }
    }

    return examples;
  }

  async getAllExamples(limit: number = 10): Promise<LearningExample[]> {
    const corrections = await this.correctionRepository.findAll({ limit });

    return corrections.map((correction) => ({
      documentId: correction.getDocumentId(),
      originalType: correction.getOriginalType()?.getValue() ?? '',
      correctedType: correction.getCorrectedType()?.getValue(),
      fieldCorrections: correction.getFieldCorrections(),
      correctedAt: correction.getCorrectedAt(),
    }));
  }

  async deriveValidationRules(
    documentType: string
  ): Promise<ValidationRule[]> {
    const examples = await this.getExamplesForType(documentType, 20);

    if (examples.length === 0) {
      return [];
    }

    const fieldFrequency = new Map<string, number>();
    const fieldValues = new Map<string, Set<string | number | boolean | null>>();

    examples.forEach((example) => {
      example.fieldCorrections.forEach(({ fieldName, correctedValue }) => {
        fieldFrequency.set(fieldName, (fieldFrequency.get(fieldName) ?? 0) + 1);

        if (!fieldValues.has(fieldName)) {
          fieldValues.set(fieldName, new Set());
        }
        fieldValues.get(fieldName)?.add(correctedValue);
      });
    });

    const rules: ValidationRule[] = [];

    fieldFrequency.forEach((count, fieldName) => {
      const required = count / examples.length > 0.8;
      const allValues = Array.from(fieldValues.get(fieldName) ?? []);
      const values = allValues.filter(
        (v): v is string | number => typeof v === 'string' || typeof v === 'number'
      );

      const rule: ValidationRule = {
        fieldName,
        required,
      };

      if (values.length <= 10 && values.length > 0) {
        rule.allowedValues = values;
      }

      rules.push(rule);
    });

    return rules;
  }

  async getConfidenceBoost(
    documentType: string,
    baseConfidence: number
  ): Promise<number> {
    const examples = await this.getExamplesForType(documentType, 10);

    if (examples.length === 0) {
      return baseConfidence;
    }

    const learningFactor = Math.min(examples.length / 10, 0.1);

    return Math.min(baseConfidence + learningFactor, 1.0);
  }

  async getClassificationExamples(limit: number = 3): Promise<string> {
    const corrections = await this.correctionRepository.findAll({ limit: limit * 2 });

    const typeCorrections = corrections.filter((c) => c.hasTypeCorrection());

    if (typeCorrections.length === 0) {
      return '';
    }

    const examplesText = typeCorrections
      .slice(0, limit)
      .map((correction, index) => {
        const originalType = correction.getOriginalType()?.getValue() ?? 'unknown';
        const correctedType = correction.getCorrectedType()?.getValue() ?? 'unknown';

        return `Example ${index + 1}:\n- Original classification: ${originalType}\n- Corrected to: ${correctedType}\n- Notes: ${correction.getNotes() ?? 'Human correction applied'}`;
      })
      .join('\n\n');

    return `\n\nLearning from past corrections:\n${examplesText}`;
  }

  async getFieldExtractionExamples(documentType: string, limit: number = 3): Promise<string> {
    const examples = await this.getExamplesForType(documentType, limit);

    if (examples.length === 0 || examples.every((e) => e.fieldCorrections.length === 0)) {
      return '';
    }

    const examplesText = examples
      .filter((e) => e.fieldCorrections.length > 0)
      .slice(0, limit)
      .map((example, index) => {
        const fields = example.fieldCorrections
          .slice(0, 3)
          .map((fc) => {
            return `  - ${fc.fieldName}: "${fc.originalValue}" → "${fc.correctedValue}"`;
          })
          .join('\n');

        return `Example ${index + 1} (${example.originalType}):\n${fields}`;
      })
      .join('\n\n');

    return `\n\nLearning from past field corrections for ${documentType}:\n${examplesText}`;
  }
}
