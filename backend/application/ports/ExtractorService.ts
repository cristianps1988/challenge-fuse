import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';
import type { FieldValue } from '@/backend/domain/value-objects/FieldValue.ValueObject';

export interface ExtractionResult {
  fields: Map<string, FieldValue>;
  overallConfidence: number;
  processingTimeMs: number;
}

export interface ExtractorService {
  extract(
    fileBuffer: Buffer,
    documentType: DocumentTypeValue,
    fileName: string
  ): Promise<ExtractionResult>;
}
