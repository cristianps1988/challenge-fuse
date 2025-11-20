import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';
import type { DocumentStatusValue } from '@/backend/domain/document-status.constants';

export interface ExtractedField {
  name: string;
  value: string | number | boolean | null;
  confidence: number;
  valueType: 'string' | 'number' | 'boolean' | 'date';
}

export interface ProcessDocumentResponse {
  documentId: string;
  fileName: string;
  filePath: string;
  documentType: DocumentTypeValue;
  classificationConfidence: number;
  status: DocumentStatusValue;
  extractedFields: ExtractedField[];
  overallExtractionConfidence: number;
  processingTimeMs: number;
  requiresReview: boolean;
  createdAt: Date;
}
