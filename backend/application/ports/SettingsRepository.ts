export interface AppSetting {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
}

export interface SettingsRepository {
  findByKey(key: string): Promise<AppSetting | null>;
  findAll(): Promise<AppSetting[]>;
  update(key: string, value: string): Promise<void>;
  updateMany(settings: Record<string, string>): Promise<void>;
}