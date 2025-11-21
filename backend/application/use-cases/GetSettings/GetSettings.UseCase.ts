import type { SettingsRepository } from '@/backend/application/ports/SettingsRepository';
import type { GetSettingsResponse } from './GetSettings.Response';

export class GetSettingsUseCase {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async execute(): Promise<GetSettingsResponse> {
    const settings = await this.settingsRepository.findAll();

    const settingsRecord: Record<string, string> = {};
    for (const setting of settings) {
      settingsRecord[setting.key] = setting.value;
    }

    return {
      settings: settingsRecord,
    };
  }
}
