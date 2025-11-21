import { runMigrations } from '../backend/infrastructure/persistence/migrations';

console.log('Running database migrations...');
runMigrations();
console.log('✅ Migrations completed successfully!');
process.exit(0);
