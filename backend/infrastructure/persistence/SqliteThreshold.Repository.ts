import type { ThresholdRepository } from '@/backend/application/ports/ThresholdRepository';
import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';
import { db } from './database';
import { logger } from '@/backend/infrastructure/logger';

interface ThresholdRow {
  document_type: DocumentTypeValue;
  confidence_threshold: number;
}

export class SqliteThresholdRepository implements ThresholdRepository {
  async save(thresholds: Partial<Record<DocumentTypeValue, number>>): Promise<void> {
    try {
      db.transaction(() => {
        const stmt = db.prepare(`
          INSERT INTO thresholds (document_type, confidence_threshold)
          VALUES (?, ?)
          ON CONFLICT(document_type)
          DO UPDATE SET
            confidence_threshold = excluded.confidence_threshold,
            updated_at = datetime('now')
        `);

        for (const [documentType, threshold] of Object.entries(thresholds)) {
          stmt.run(documentType, threshold);
        }
      })();

      logger.info('Thresholds saved', { count: Object.keys(thresholds).length });
    } catch (error) {
      logger.error('Failed to save thresholds', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async findAll(): Promise<Partial<Record<DocumentTypeValue, number>>> {
    try {
      const stmt = db.prepare(`
        SELECT document_type, confidence_threshold
        FROM thresholds
      `);

      const rows = stmt.all() as ThresholdRow[];
      const thresholds: Record<string, number> = {};

      for (const row of rows) {
        thresholds[row.document_type] = row.confidence_threshold;
      }

      return thresholds as Record<DocumentTypeValue, number>;
    } catch (error) {
      logger.error('Failed to find all thresholds', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async findByType(documentType: DocumentTypeValue): Promise<number | null> {
    try {
      const stmt = db.prepare(`
        SELECT confidence_threshold
        FROM thresholds
        WHERE document_type = ?
      `);

      const row = stmt.get(documentType) as { confidence_threshold: number } | undefined;

      return row?.confidence_threshold ?? null;
    } catch (error) {
      logger.error('Failed to find threshold by type', {
        documentType,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async findClassificationThreshold(): Promise<number> {
    try {
      const stmt = db.prepare(`
        SELECT confidence_threshold
        FROM thresholds
        WHERE document_type = 'classification'
      `);

      const row = stmt.get() as { confidence_threshold: number } | undefined;

      return row?.confidence_threshold ?? 0.70;
    } catch (error) {
      logger.error('Failed to find classification threshold', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async saveClassificationThreshold(threshold: number): Promise<void> {
    try {
      const stmt = db.prepare(`
        INSERT INTO thresholds (document_type, confidence_threshold)
        VALUES ('classification', ?)
        ON CONFLICT(document_type)
        DO UPDATE SET
          confidence_threshold = excluded.confidence_threshold,
          updated_at = datetime('now')
      `);

      stmt.run(threshold);

      logger.info('Classification threshold saved', { threshold });
    } catch (error) {
      logger.error('Failed to save classification threshold', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
