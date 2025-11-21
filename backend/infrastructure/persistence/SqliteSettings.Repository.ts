import type { SettingsRepository, AppSetting } from '@/backend/application/ports/SettingsRepository';
import { db } from './database';
import { logger } from '@/backend/infrastructure/logger';

interface SettingRow {
  setting_key: string;
  setting_value: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  description: string | null;
}

export class SqliteSettingsRepository implements SettingsRepository {
  async findByKey(key: string): Promise<AppSetting | null> {
    try {
      const stmt = db.prepare(`
        SELECT setting_key, setting_value, setting_type, description
        FROM app_settings
        WHERE setting_key = ?
      `);

      const row = stmt.get(key) as SettingRow | undefined;

      if (!row) {
        return null;
      }

      return {
        key: row.setting_key,
        value: row.setting_value,
        type: row.setting_type,
        description: row.description ?? undefined,
      };
    } catch (error) {
      logger.error('Failed to find setting by key', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async findAll(): Promise<AppSetting[]> {
    try {
      const stmt = db.prepare(`
        SELECT setting_key, setting_value, setting_type, description
        FROM app_settings
        ORDER BY setting_key
      `);

      const rows = stmt.all() as SettingRow[];

      return rows.map((row) => ({
        key: row.setting_key,
        value: row.setting_value,
        type: row.setting_type,
        description: row.description ?? undefined,
      }));
    } catch (error) {
      logger.error('Failed to find all settings', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async update(key: string, value: string): Promise<void> {
    try {
      const stmt = db.prepare(`
        UPDATE app_settings
        SET setting_value = ?, updated_at = datetime('now')
        WHERE setting_key = ?
      `);

      const result = stmt.run(value, key);

      if (result.changes === 0) {
        throw new Error(`Setting with key '${key}' not found`);
      }

      logger.info('Setting updated', { key, value });
    } catch (error) {
      logger.error('Failed to update setting', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async updateMany(settings: Record<string, string>): Promise<void> {
    try {
      db.transaction(() => {
        const stmt = db.prepare(`
          UPDATE app_settings
          SET setting_value = ?, updated_at = datetime('now')
          WHERE setting_key = ?
        `);

        for (const [key, value] of Object.entries(settings)) {
          stmt.run(value, key);
        }
      })();

      logger.info('Multiple settings updated', { count: Object.keys(settings).length });
    } catch (error) {
      logger.error('Failed to update multiple settings', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
