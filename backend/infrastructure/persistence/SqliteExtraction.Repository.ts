import type { ExtractionRepository } from '@/backend/application/ports/ExtractionRepository';
import { Extraction } from '@/backend/domain/entities/Extraction.Entity';
import { FieldValue } from '@/backend/domain/value-objects/FieldValue.ValueObject';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import { db } from './database';
import { logger } from '@/backend/infrastructure/logger';

interface ExtractionRow {
  id: string;
  document_id: string;
  fields: string;
  overall_confidence: number;
  extracted_at: string;
}

interface SerializedField {
  name: string;
  value: string | number | boolean | null;
  confidence: number;
}

interface SerializedFields {
  [key: string]: SerializedField;
}

export class SqliteExtractionRepository implements ExtractionRepository {
  async save(extraction: Extraction): Promise<void> {
    try {
      const stmt = db.prepare(`
        INSERT INTO extractions (
          id, document_id, fields, overall_confidence, extracted_at
        ) VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        extraction.getId(),
        extraction.getDocumentId(),
        this.serializeFields(extraction.getFields()),
        extraction.getOverallConfidence().getValue(),
        extraction.getExtractedAt().toISOString()
      );

      logger.info('Extraction saved', {
        extractionId: extraction.getId(),
        documentId: extraction.getDocumentId(),
      });
    } catch (error) {
      logger.error('Failed to save extraction', {
        extractionId: extraction.getId(),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async findById(id: string): Promise<Extraction | null> {
    try {
      const stmt = db.prepare(`
        SELECT
          id, document_id, fields, overall_confidence, extracted_at
        FROM extractions
        WHERE id = ?
      `);

      const row = stmt.get(id) as ExtractionRow | undefined;

      if (!row) {
        return null;
      }

      return this.mapRowToExtraction(row);
    } catch (error) {
      logger.error('Failed to find extraction', {
        extractionId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async findByDocumentId(documentId: string): Promise<Extraction | null> {
    try {
      const stmt = db.prepare(`
        SELECT
          id, document_id, fields, overall_confidence, extracted_at
        FROM extractions
        WHERE document_id = ?
        ORDER BY extracted_at DESC
        LIMIT 1
      `);

      const row = stmt.get(documentId) as ExtractionRow | undefined;

      if (!row) {
        return null;
      }

      return this.mapRowToExtraction(row);
    } catch (error) {
      logger.error('Failed to find extraction by document id', {
        documentId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async findAllByDocumentIds(documentIds: string[]): Promise<Extraction[]> {
    if (documentIds.length === 0) {
      return [];
    }

    try {
      const placeholders = documentIds.map(() => '?').join(',');
      const stmt = db.prepare(`
        SELECT
          e1.id, e1.document_id, e1.fields, e1.overall_confidence, e1.extracted_at
        FROM extractions e1
        INNER JOIN (
          SELECT document_id, MAX(extracted_at) as max_extracted_at
          FROM extractions
          WHERE document_id IN (${placeholders})
          GROUP BY document_id
        ) e2
        ON e1.document_id = e2.document_id AND e1.extracted_at = e2.max_extracted_at
      `);

      const rows = stmt.all(...documentIds) as ExtractionRow[];

      return rows.map((row) => this.mapRowToExtraction(row));
    } catch (error) {
      logger.error('Failed to find extractions by document ids', {
        documentIdsCount: documentIds.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async update(extraction: Extraction): Promise<void> {
    try {
      const stmt = db.prepare(`
        UPDATE extractions
        SET
          fields = ?,
          overall_confidence = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `);

      const result = stmt.run(
        this.serializeFields(extraction.getFields()),
        extraction.getOverallConfidence().getValue(),
        extraction.getId()
      );

      if (result.changes === 0) {
        throw new Error(`Extraction with id ${extraction.getId()} not found`);
      }

      logger.info('Extraction updated', {
        extractionId: extraction.getId(),
        documentId: extraction.getDocumentId(),
      });
    } catch (error) {
      logger.error('Failed to update extraction', {
        extractionId: extraction.getId(),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const stmt = db.prepare('DELETE FROM extractions WHERE id = ?');
      const result = stmt.run(id);

      if (result.changes === 0) {
        throw new Error(`Extraction with id ${id} not found`);
      }

      logger.info('Extraction deleted', { extractionId: id });
    } catch (error) {
      logger.error('Failed to delete extraction', {
        extractionId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private serializeFields(fields: Map<string, FieldValue>): string {
    const serialized: SerializedFields = {};

    for (const [key, fieldValue] of fields.entries()) {
      serialized[key] = {
        name: fieldValue.getName(),
        value: fieldValue.getValue(),
        confidence: fieldValue.getConfidence().getValue(),
      };
    }

    return JSON.stringify(serialized);
  }

  private deserializeFields(fieldsJson: string): Map<string, FieldValue> {
    const serialized = JSON.parse(fieldsJson) as SerializedFields;
    const fields = new Map<string, FieldValue>();

    for (const [key, field] of Object.entries(serialized)) {
      fields.set(
        key,
        FieldValue.create(
          field.name,
          field.value,
          Confidence.create(field.confidence)
        )
      );
    }

    return fields;
  }

  private mapRowToExtraction(row: ExtractionRow): Extraction {
    return Extraction.reconstitute({
      id: row.id,
      documentId: row.document_id,
      fields: this.deserializeFields(row.fields),
      overallConfidence: Confidence.create(row.overall_confidence),
      extractedAt: new Date(row.extracted_at),
      correctedAt: null,
    });
  }
}
