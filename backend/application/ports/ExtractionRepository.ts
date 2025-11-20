import type { Extraction } from '@/backend/domain/entities/Extraction.Entity';

export interface ExtractionRepository {
  save(extraction: Extraction): Promise<void>;

  findById(id: string): Promise<Extraction | null>;

  findByDocumentId(documentId: string): Promise<Extraction | null>;

  findAllByDocumentIds(documentIds: string[]): Promise<Extraction[]>;

  update(extraction: Extraction): Promise<void>;

  delete(id: string): Promise<void>;
}