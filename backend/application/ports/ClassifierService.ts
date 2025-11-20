import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';
import type { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';

export interface ClassificationResult {
  documentType: DocumentTypeValue;
  confidence: Confidence;
  reasoning?: string;
  alternativePredictions?: Array<{
    documentType: DocumentTypeValue;
    confidence: Confidence;
  }>;
}

export interface ClassifierService {
  classify(fileBuffer: Buffer, fileName: string): Promise<ClassificationResult>;
}
