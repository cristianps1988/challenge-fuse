import type { CorrectionRepository, FindCorrectionsOptions } from '@/backend/application/ports/CorrectionRepository';
import { Correction } from '@/backend/domain/entities/Correction.Entity';
import { DocumentType } from '@/backend/domain/value-objects/DocumentType.ValueObject';
import { db } from './database';
import { logger } from '@/backend/infrastructure/logger';
import type { JsonlCorrectionLog } from './JsonlCorrectionLog';

interface CorrectionRow {
  id: string;
  document_id: string;
  extraction_id: string;
  previous_type: string | null;
  corrected_type: string | null;
  previous_fields: string | null;
  corrected_fields: string | null;
  corrected_by: string;
  corrected_at: string;
  notes: string | null;
}

interface FieldCorrection {
  fieldName: string;
  originalValue: string | number | boolean | null;
  correctedValue: string | number | boolean | null;
}

interface SerializedFieldCorrections {
  [key: string]: {
    originalValue: string | number | boolean | null;
    correctedValue: string | number | boolean | null;
  };
}

export class SqliteCorrectionRepository implements CorrectionRepository {
  constructor(private readonly correctionLog: JsonlCorrectionLog) {}

  async save(correction: Correction): Promise<void> {
    try {
      const stmt = db.prepare(`
        INSERT INTO corrections (
          id, document_id, extraction_id, previous_type, corrected_type,
          previous_fields, corrected_fields, corrected_by, corrected_at, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        correction.getId(),
        correction.getDocumentId(),
        correction.getExtractionId(),
        correction.getOriginalType()?.getValue() ?? null,
        correction.getCorrectedType()?.getValue() ?? null,
        null,
        this.serializeFieldCorrections(correction.getFieldCorrections()),
        correction.getCorrectedBy(),
        correction.getCorrectedAt().toISOString(),
        correction.getNotes()
      );

      logger.info('Correction saved to SQLite', {
        correctionId: correction.getId(),
        documentId: correction.getDocumentId(),
      });

      await this.correctionLog.append({
        correctionId: correction.getId(),
        documentId: correction.getDocumentId(),
        documentType: correction.getOriginalType()?.getValue() ?? 'unknown',
        corrections: {
          type: correction.getCorrectedType()
            ? {
                from: correction.getOriginalType()?.getValue() ?? 'unknown',
                to: correction.getCorrectedType()!.getValue(),
              }
            : undefined,
          fields: correction.getFieldCorrections().map(fc => ({
            field: fc.fieldName,
            from: fc.originalValue,
            to: fc.correctedValue,
          })),
        },
        correctedBy: correction.getCorrectedBy(),
        correctedAt: correction.getCorrectedAt().toISOString(),
        notes: correction.getNotes() ?? undefined,
      });
    } catch (error) {
      logger.error('Failed to save correction', {
        correctionId: correction.getId(),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async findById(id: string): Promise<Correction | null> {
    try {
      const stmt = db.prepare(`
        SELECT
          id, document_id, extraction_id, previous_type, corrected_type,
          previous_fields, corrected_fields, corrected_by, corrected_at, notes
        FROM corrections
        WHERE id = ?
      `);

      const row = stmt.get(id) as CorrectionRow | undefined;

      if (!row) {
        return null;
      }

      return this.mapRowToCorrection(row);
    } catch (error) {
      logger.error('Failed to find correction', {
        correctionId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async findByDocumentId(documentId: string): Promise<Correction[]> {
    try {
      const stmt = db.prepare(`
        SELECT
          id, document_id, extraction_id, previous_type, corrected_type,
          previous_fields, corrected_fields, corrected_by, corrected_at, notes
        FROM corrections
        WHERE document_id = ?
        ORDER BY corrected_at DESC
      `);

      const rows = stmt.all(documentId) as CorrectionRow[];

      return rows.map((row) => this.mapRowToCorrection(row));
    } catch (error) {
      logger.error('Failed to find corrections by document id', {
        documentId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async findAll(options?: FindCorrectionsOptions): Promise<Correction[]> {
    try {
      let query = `
        SELECT
          id, document_id, extraction_id, previous_type, corrected_type,
          previous_fields, corrected_fields, corrected_by, corrected_at, notes
        FROM corrections
        WHERE 1=1
      `;

      const params: unknown[] = [];

      if (options?.documentId) {
        query += ' AND document_id = ?';
        params.push(options.documentId);
      }

      if (options?.correctedBy) {
        query += ' AND corrected_by = ?';
        params.push(options.correctedBy);
      }

      if (options?.fromDate) {
        query += ' AND corrected_at >= ?';
        params.push(options.fromDate.toISOString());
      }

      if (options?.toDate) {
        query += ' AND corrected_at <= ?';
        params.push(options.toDate.toISOString());
      }

      query += ' ORDER BY corrected_at DESC';

      if (options?.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
      }

      if (options?.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }

      const stmt = db.prepare(query);
      const rows = stmt.all(...params) as CorrectionRow[];

      return rows.map((row) => this.mapRowToCorrection(row));
    } catch (error) {
      logger.error('Failed to find corrections', {
        options,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async count(options?: Omit<FindCorrectionsOptions, 'limit' | 'offset'>): Promise<number> {
    try {
      let query = 'SELECT COUNT(*) as count FROM corrections WHERE 1=1';
      const params: unknown[] = [];

      if (options?.documentId) {
        query += ' AND document_id = ?';
        params.push(options.documentId);
      }

      if (options?.correctedBy) {
        query += ' AND corrected_by = ?';
        params.push(options.correctedBy);
      }

      if (options?.fromDate) {
        query += ' AND corrected_at >= ?';
        params.push(options.fromDate.toISOString());
      }

      if (options?.toDate) {
        query += ' AND corrected_at <= ?';
        params.push(options.toDate.toISOString());
      }

      const stmt = db.prepare(query);
      const result = stmt.get(...params) as { count: number };

      return result.count;
    } catch (error) {
      logger.error('Failed to count corrections', {
        options,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const stmt = db.prepare('DELETE FROM corrections WHERE id = ?');
      const result = stmt.run(id);

      if (result.changes === 0) {
        throw new Error(`Correction with id ${id} not found`);
      }

      logger.info('Correction deleted', { correctionId: id });
    } catch (error) {
      logger.error('Failed to delete correction', {
        correctionId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private serializeFieldCorrections(corrections: FieldCorrection[]): string | null {
    if (corrections.length === 0) {
      return null;
    }

    const serialized: SerializedFieldCorrections = {};

    for (const correction of corrections) {
      serialized[correction.fieldName] = {
        originalValue: correction.originalValue,
        correctedValue: correction.correctedValue,
      };
    }

    return JSON.stringify(serialized);
  }

  private deserializeFieldCorrections(json: string | null): FieldCorrection[] {
    if (!json) {
      return [];
    }

    const serialized = JSON.parse(json) as SerializedFieldCorrections;
    const corrections: FieldCorrection[] = [];

    for (const [fieldName, values] of Object.entries(serialized)) {
      corrections.push({
        fieldName,
        originalValue: values.originalValue,
        correctedValue: values.correctedValue,
      });
    }

    return corrections;
  }

  private mapRowToCorrection(row: CorrectionRow): Correction {
    return Correction.reconstitute({
      id: row.id,
      documentId: row.document_id,
      extractionId: row.extraction_id,
      originalType: row.previous_type ? DocumentType.fromString(row.previous_type) : null,
      correctedType: row.corrected_type ? DocumentType.fromString(row.corrected_type) : null,
      fieldCorrections: this.deserializeFieldCorrections(row.corrected_fields),
      correctedBy: row.corrected_by,
      correctedAt: new Date(row.corrected_at),
      notes: row.notes,
    });
  }
}
