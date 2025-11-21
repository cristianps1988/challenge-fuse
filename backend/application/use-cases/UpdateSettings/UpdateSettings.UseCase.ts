import { ValidationError } from '@/backend/domain/errors/Domain.Error';
import type { SettingsRepository } from '@/backend/application/ports/SettingsRepository';
import type { UpdateSettingsDTO } from './UpdateSettings.DTO';
import type { UpdateSettingsResponse } from './UpdateSettings.Response';

export class UpdateSettingsUseCase {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async execute(dto: UpdateSettingsDTO): Promise<UpdateSettingsResponse> {
    this.validateSettings(dto.settings);

    await this.settingsRepository.updateMany(dto.settings);

    return {
      success: true,
      updatedSettings: dto.settings,
      updatedAt: new Date(),
      message: 'Settings updated successfully',
    };
  }

  private validateSettings(settings: Record<string, string>): void {
    if (settings.max_file_size_mb !== undefined) {
      const maxSize = parseFloat(settings.max_file_size_mb);
      if (isNaN(maxSize) || maxSize <= 0 || maxSize > 100) {
        throw new ValidationError(
          `Invalid max_file_size_mb value: ${settings.max_file_size_mb}. Must be between 0 and 100.`
        );
      }
    }
  }
}
