import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';

export interface UpdateThresholdsDTO {
  thresholds: Record<DocumentTypeValue, number>;
}
