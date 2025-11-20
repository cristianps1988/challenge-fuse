import type { DocumentRepository, FindDocumentsOptions } from '@/backend/application/ports/DocumentRepository';
import { Document } from '@/backend/domain/entities/Document.Entity';
import { DocumentType } from '@/backend/domain/value-objects/DocumentType.ValueObject';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import type { DocumentStatusValue } from '@/backend/domain/document-status.constants';
import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';
import { db } from './database';
import { logger } from '@/backend/infrastructure/logger';

interface DocumentRow {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
  status: DocumentStatusValue;
  type: DocumentTypeValue | null;
  type_confidence: number | null;
  processed_at: string | null;
  error_message: string | null;
}

export class SqliteDocumentRepository implements DocumentRepository {
  async save(document: Document): Promise<void> {
    try {
      const stmt = db.prepare(`
        INSERT INTO documents (
          id, file_name, file_path, file_size, uploaded_at, status,
          type, type_confidence, processed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        document.getId(),
        document.getFileName(),
        document.getFilePath(),
        document.getFileSize(),
        document.getUploadedAt().toISOString(),
        document.getStatus(),
        document.getType()?.getValue() ?? null,
        document.getClassificationConfidence()?.getValue() ?? null,
        document.getProcessedAt()?.toISOString() ?? null
      );

      logger.info('Document saved', { documentId: document.getId() });
    } catch (error) {
      logger.error('Failed to save document', {
        documentId: document.getId(),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async findById(id: string): Promise<Document | null> {
    try {
      const stmt = db.prepare(`
        SELECT
          id, file_name, file_path, file_size, uploaded_at, status,
          type, type_confidence, processed_at
        FROM documents
        WHERE id = ?
      `);

      const row = stmt.get(id) as DocumentRow | undefined;

      if (!row) {
        return null;
      }

      return this.mapRowToDocument(row);
    } catch (error) {
      logger.error('Failed to find document', {
        documentId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async findAll(options?: FindDocumentsOptions): Promise<Document[]> {
    try {
      let query = `
        SELECT
          id, file_name, file_path, file_size, uploaded_at, status,
          type, type_confidence, processed_at
        FROM documents
        WHERE 1=1
      `;

      const params: unknown[] = [];

      if (options?.status) {
        query += ' AND status = ?';
        params.push(options.status);
      }

      if (options?.type) {
        query += ' AND type = ?';
        params.push(options.type);
      }

      query += ' ORDER BY uploaded_at DESC';

      if (options?.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
      }

      if (options?.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }

      const stmt = db.prepare(query);
      const rows = stmt.all(...params) as DocumentRow[];

      return rows.map((row) => this.mapRowToDocument(row));
    } catch (error) {
      logger.error('Failed to find documents', {
        options,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async update(document: Document): Promise<void> {
    try {
      const stmt = db.prepare(`
        UPDATE documents
        SET
          file_name = ?,
          file_path = ?,
          file_size = ?,
          status = ?,
          type = ?,
          type_confidence = ?,
          processed_at = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `);

      const result = stmt.run(
        document.getFileName(),
        document.getFilePath(),
        document.getFileSize(),
        document.getStatus(),
        document.getType()?.getValue() ?? null,
        document.getClassificationConfidence()?.getValue() ?? null,
        document.getProcessedAt()?.toISOString() ?? null,
        document.getId()
      );

      if (result.changes === 0) {
        throw new Error(`Document with id ${document.getId()} not found`);
      }

      logger.info('Document updated', { documentId: document.getId() });
    } catch (error) {
      logger.error('Failed to update document', {
        documentId: document.getId(),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const stmt = db.prepare('DELETE FROM documents WHERE id = ?');
      const result = stmt.run(id);

      if (result.changes === 0) {
        throw new Error(`Document with id ${id} not found`);
      }

      logger.info('Document deleted', { documentId: id });
    } catch (error) {
      logger.error('Failed to delete document', {
        documentId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async count(options?: Omit<FindDocumentsOptions, 'limit' | 'offset'>): Promise<number> {
    try {
      let query = 'SELECT COUNT(*) as count FROM documents WHERE 1=1';
      const params: unknown[] = [];

      if (options?.status) {
        query += ' AND status = ?';
        params.push(options.status);
      }

      if (options?.type) {
        query += ' AND type = ?';
        params.push(options.type);
      }

      const stmt = db.prepare(query);
      const result = stmt.get(...params) as { count: number };

      return result.count;
    } catch (error) {
      logger.error('Failed to count documents', {
        options,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private mapRowToDocument(row: DocumentRow): Document {
    return Document.reconstitute({
      id: row.id,
      fileName: row.file_name,
      filePath: row.file_path,
      fileSize: row.file_size,
      status: row.status,
      type: row.type ? DocumentType.fromString(row.type) : null,
      classificationConfidence: row.type_confidence !== null ? Confidence.create(row.type_confidence) : null,
      uploadedAt: new Date(row.uploaded_at),
      processedAt: row.processed_at ? new Date(row.processed_at) : null,
      reviewedAt: null,
    });
  }
}
