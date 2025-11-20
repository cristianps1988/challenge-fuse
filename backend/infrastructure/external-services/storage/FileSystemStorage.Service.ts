import type { StorageService } from '@/backend/application/ports/StorageService';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '@/backend/infrastructure/logger';
import { getEnv } from '@/backend/infrastructure/config/env';

const { UPLOADS_DIR } = getEnv();

export class FileSystemStorageService implements StorageService {
  constructor() {
    this.ensureUploadsDirectory();
  }

  private async ensureUploadsDirectory(): Promise<void> {
    try {
      await fs.mkdir(UPLOADS_DIR || path.join(process.cwd(), 'data', 'uploads'), { recursive: true });
      logger.info('Uploads directory ready', { path: UPLOADS_DIR });
    } catch (error) {
      logger.error('Failed to create uploads directory', {
        path: UPLOADS_DIR,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async save(fileBuffer: Buffer, fileName: string): Promise<string> {
    try {
      const sanitizedFileName = this.sanitizeFileName(fileName);
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}-${sanitizedFileName}`;
      const filePath = path.join(UPLOADS_DIR || path.join(process.cwd(), 'data', 'uploads'), uniqueFileName);

      await fs.writeFile(filePath, fileBuffer);

      logger.info('File saved successfully', {
        fileName: uniqueFileName,
        size: fileBuffer.length,
        path: filePath,
      });

      return filePath;
    } catch (error) {
      logger.error('Failed to save file', {
        fileName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Failed to save file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async retrieve(filePath: string): Promise<Buffer> {
    try {
      const buffer = await fs.readFile(filePath);

      logger.debug('File retrieved successfully', {
        filePath,
        size: buffer.length,
      });

      return buffer;
    } catch (error) {
      logger.error('Failed to retrieve file', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Failed to retrieve file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async delete(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);

      logger.info('File deleted successfully', { filePath });
    } catch (error) {
      logger.error('Failed to delete file', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      logger.error('Failed to get file size', {
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Failed to get file size: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }
}
