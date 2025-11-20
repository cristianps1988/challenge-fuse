import { ValidationError } from '@/backend/domain/errors/Domain.Error';
import type { ThresholdRepository } from '@/backend/application/ports/ThresholdRepository';
import type { UpdateThresholdsDTO } from './UpdateThresholds.DTO';
import type { UpdateThresholdsResponse } from './UpdateThresholds.Response';

export class UpdateThresholdsUseCase {
  constructor(private readonly thresholdRepository: ThresholdRepository) {}

  async execute(dto: UpdateThresholdsDTO): Promise<UpdateThresholdsResponse> {
    this.validateThresholds(dto.thresholds);

    await this.thresholdRepository.save(dto.thresholds);

    return {
      success: true,
      updatedThresholds: dto.thresholds,
      updatedAt: new Date(),
      message: 'Thresholds updated successfully',
    };
  }

  private validateThresholds(
    thresholds: Record<string, number>
  ): void {
    for (const [type, threshold] of Object.entries(thresholds)) {
      if (threshold < 0 || threshold > 1) {
        throw new ValidationError(
          `Invalid threshold value for ${type}: ${threshold}. Must be between 0 and 1.`
        );
      }
    }
  }
}
