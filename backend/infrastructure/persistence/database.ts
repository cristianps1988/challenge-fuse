import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { getEnv } from '@/backend/infrastructure/config/env';

const { DATABASE_PATH, NODE_ENV } = getEnv();
const isTest = NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

const dbPath = isTest ? ':memory:' : DATABASE_PATH;

const DATA_DIR = dbPath === ':memory:'
  ? ''
  : path.dirname(DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db'));

if (DATA_DIR && !fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new Database(dbPath, {
  verbose: undefined,
});

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

function ensureMigrations(): void {
  try {
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='documents'"
    ).get();

    if (!tables && !isTest) {
      console.log('📦 Database tables not found. Running migrations...');

      const schemaPath = path.join(process.cwd(), 'backend', 'infrastructure', 'persistence', 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');

      const statements = schema
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      db.transaction(() => {
        for (const statement of statements) {
          db.exec(statement);
        }
      })();

      console.log('✅ Database migrations completed');
    }
  } catch (error) {
    console.error('❌ Failed to run migrations:', error);
  }
}

if (!isTest) {
  ensureMigrations();
}

export function closeDatabase(): void {
  db.close();
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
