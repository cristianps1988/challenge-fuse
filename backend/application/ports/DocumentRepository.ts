import type { Document } from '@/backend/domain/entities/Document.Entity';
import type { DocumentStatusValue } from '@/backend/domain/document-status.constants';
import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';

export interface FindDocumentsOptions {
  status?: DocumentStatusValue;
  type?: DocumentTypeValue;
  limit?: number;
  offset?: number;
}

export interface DocumentRepository {
  save(document: Document): Promise<void>;

  findById(id: string): Promise<Document | null>;

  findAll(options?: FindDocumentsOptions): Promise<Document[]>;

  update(document: Document): Promise<void>;

  delete(id: string): Promise<void>;

  count(options?: Omit<FindDocumentsOptions, 'limit' | 'offset'>): Promise<number>;
}