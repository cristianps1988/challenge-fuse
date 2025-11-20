import fs from 'fs';
import path from 'path';
import { db } from './database';
import { logger } from '@/backend/infrastructure/logger';

export function runMigrations(): void {
  logger.info('Running database migrations');

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  const statements = schema
    .split(';')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0);

  db.transaction(() => {
    for (const statement of statements) {
      try {
        db.exec(statement);
      } catch (error) {
        logger.error('Migration error', {
          statement: statement.substring(0, 100),
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }
  })();

  logger.info('Database migrations completed successfully');
}

export function resetDatabase(): void {
  logger.warn('Resetting database - all data will be lost');

  const tables = ['learning_examples', 'corrections', 'extractions', 'documents', 'thresholds'];

  db.transaction(() => {
    for (const table of tables) {
      db.exec(`DROP TABLE IF EXISTS ${table}`);
    }
  })();

  runMigrations();

  logger.info('Database reset completed');
}
