import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';

export interface CorrectDocumentDTO {
  documentId: string;
  correctedType?: DocumentTypeValue;
  correctedFields?: Record<string, string | number | boolean | null>;
  correctedBy: string;
  notes?: string;
}
