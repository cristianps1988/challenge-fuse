import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';

export interface ThresholdRepository {
  save(thresholds: Partial<Record<DocumentTypeValue, number>>): Promise<void>;

  findAll(): Promise<Partial<Record<DocumentTypeValue, number>>>;

  findByType(documentType: DocumentTypeValue): Promise<number | null>;
}
