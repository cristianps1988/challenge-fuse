import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';
import type { DocumentStatusValue } from '@/backend/domain/document-status.constants';

export interface ExtractedFieldResponse {
  name: string;
  value: string | number | boolean | null;
  confidence: number;
  valueType: 'string' | 'number' | 'boolean' | 'date';
}

export interface CorrectionResponse {
  id: string;
  correctedType?: DocumentTypeValue;
  correctedFields: Record<string, string | number | boolean | null>;
  correctedBy: string;
  correctedAt: Date;
  notes?: string;
}

export interface GetDocumentResponse {
  id: string;
  fileName: string;
  filePath: string;
  documentType: DocumentTypeValue;
  classificationConfidence: number;
  status: DocumentStatusValue;
  extractedFields: ExtractedFieldResponse[];
  overallExtractionConfidence: number;
  corrections: CorrectionResponse[];
  createdAt: Date;
  processedAt?: Date;
  reviewedAt?: Date;
}
