import fs from 'fs/promises';
import path from 'path';
import { logger } from '@/backend/infrastructure/logger';

const CORRECTIONS_LOG_PATH = process.env.CORRECTIONS_LOG_PATH || path.join(process.cwd(), 'data', 'corrections.jsonl');

interface CorrectionLogEntry {
  correctionId: string;
  documentId: string;
  documentType: string;
  corrections: {
    type?: {
      from: string;
      to: string;
    };
    fields?: Array<{
      field: string;
      from: string | number | boolean | null;
      to: string | number | boolean | null;
    }>;
  };
  correctedBy: string;
  correctedAt: string;
  notes?: string;
}

export class JsonlCorrectionLog {
  constructor() {
    this.ensureLogFile();
  }

  private async ensureLogFile(): Promise<void> {
    try {
      const dir = path.dirname(CORRECTIONS_LOG_PATH);
      await fs.mkdir(dir, { recursive: true });

      try {
        await fs.access(CORRECTIONS_LOG_PATH);
      } catch {
        await fs.writeFile(CORRECTIONS_LOG_PATH, '');
        logger.info('Created corrections log file', { path: CORRECTIONS_LOG_PATH });
      }
    } catch (error) {
      logger.error('Failed to ensure corrections log file', {
        path: CORRECTIONS_LOG_PATH,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async append(entry: CorrectionLogEntry): Promise<void> {
    try {
      const jsonLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(CORRECTIONS_LOG_PATH, jsonLine, 'utf-8');

      logger.info('Correction logged to JSONL', {
        correctionId: entry.correctionId,
        documentId: entry.documentId,
      });
    } catch (error) {
      logger.error('Failed to append to corrections log', {
        correctionId: entry.correctionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async readAll(): Promise<CorrectionLogEntry[]> {
    try {
      const content = await fs.readFile(CORRECTIONS_LOG_PATH, 'utf-8');

      if (!content.trim()) {
        return [];
      }

      const lines = content.trim().split('\n');
      const entries: CorrectionLogEntry[] = [];

      for (const line of lines) {
        if (line.trim()) {
          entries.push(JSON.parse(line) as CorrectionLogEntry);
        }
      }

      return entries;
    } catch (error) {
      logger.error('Failed to read corrections log', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  async readByDocumentType(documentType: string): Promise<CorrectionLogEntry[]> {
    const allEntries = await this.readAll();
    return allEntries.filter(entry => entry.documentType === documentType);
  }

  async readByDateRange(fromDate: Date, toDate: Date): Promise<CorrectionLogEntry[]> {
    const allEntries = await this.readAll();
    return allEntries.filter(entry => {
      const correctedAt = new Date(entry.correctedAt);
      return correctedAt >= fromDate && correctedAt <= toDate;
    });
  }
}
