import fs from 'fs';
import path from 'path';
import { getEnv } from '../backend/infrastructure/config/env';

const { DATABASE_PATH } = getEnv();
const dbPath = DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db');

console.log('🗑️  Resetting database...');

// Delete database files
const dbFiles = [
  dbPath,
  `${dbPath}-shm`,
  `${dbPath}-wal`,
];

dbFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`   Deleted: ${path.basename(file)}`);
  }
});

console.log('✅ Database reset complete!');
console.log('   The database will be recreated on next application start.');
process.exit(0);
