import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';

export interface ThresholdRepository {
  save(thresholds: Record<DocumentTypeValue, number>): Promise<void>;

  findAll(): Promise<Record<DocumentTypeValue, number>>;

  findByType(documentType: DocumentTypeValue): Promise<number | null>;
}
