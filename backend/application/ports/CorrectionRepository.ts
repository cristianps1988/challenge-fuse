import type { Correction } from '@/backend/domain/entities/Correction.Entity';

export interface FindCorrectionsOptions {
  documentId?: string;
  correctedBy?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface CorrectionRepository {
  save(correction: Correction): Promise<void>;

  findById(id: string): Promise<Correction | null>;

  findByDocumentId(documentId: string): Promise<Correction[]>;

  findAll(options?: FindCorrectionsOptions): Promise<Correction[]>;

  count(options?: Omit<FindCorrectionsOptions, 'limit' | 'offset'>): Promise<number>;

  delete(id: string): Promise<void>;
}