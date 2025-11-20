import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';

export interface UpdateThresholdsResponse {
  success: boolean;
  updatedThresholds: Record<DocumentTypeValue, number>;
  updatedAt: Date;
  message: string;
}
