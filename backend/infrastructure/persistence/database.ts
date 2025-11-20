import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from '@/backend/infrastructure/logger';

const DATABASE_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db');
const DATA_DIR = path.dirname(DATABASE_PATH);

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  logger.info('Created data directory', { path: DATA_DIR });
}

export const db = new Database(DATABASE_PATH, {
  verbose: process.env.NODE_ENV === 'development' ? (message: unknown) => logger.debug(String(message)) : undefined,
});

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

logger.info('Database connection established', { path: DATABASE_PATH });

export function closeDatabase(): void {
  db.close();
  logger.info('Database connection closed');
}

process.on('exit', closeDatabase);
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});
process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});
