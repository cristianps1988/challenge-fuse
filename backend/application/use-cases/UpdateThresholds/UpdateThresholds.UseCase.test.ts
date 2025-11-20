import { UpdateThresholdsUseCase } from './UpdateThresholds.UseCase';
import { ValidationError } from '@/backend/domain/errors/Domain.Error';
import type { ThresholdRepository } from '@/backend/application/ports/ThresholdRepository';
import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';

describe('UpdateThresholdsUseCase', () => {
  let useCase: UpdateThresholdsUseCase;
  let thresholdRepository: jest.Mocked<ThresholdRepository>;

  beforeEach(() => {
    thresholdRepository = {
      save: jest.fn(),
      findAll: jest.fn(),
      findByType: jest.fn(),
    };

    useCase = new UpdateThresholdsUseCase(thresholdRepository);
  });

  describe('execute', () => {
    it('should successfully update thresholds with valid values', async () => {
      const thresholds: Record<DocumentTypeValue, number> = {
        bank_statement: 0.85,
        government_id: 0.90,
        w9: 0.80,
        certificate_of_insurance: 0.75,
        articles_of_incorporation: 0.70,
      };

      thresholdRepository.save.mockResolvedValue();

      const result = await useCase.execute({ thresholds });

      expect(result.success).toBe(true);
      expect(result.updatedThresholds).toEqual(thresholds);
      expect(result.message).toBe('Thresholds updated successfully');
      expect(result.updatedAt).toBeInstanceOf(Date);

      expect(thresholdRepository.save).toHaveBeenCalledWith(thresholds);
      expect(thresholdRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should successfully update thresholds with minimum valid values', async () => {
      const thresholds: Record<DocumentTypeValue, number> = {
        bank_statement: 0.0,
        government_id: 0.0,
        w9: 0.0,
        certificate_of_insurance: 0.0,
        articles_of_incorporation: 0.0,
      };

      thresholdRepository.save.mockResolvedValue();

      const result = await useCase.execute({ thresholds });

      expect(result.success).toBe(true);
      expect(thresholdRepository.save).toHaveBeenCalledWith(thresholds);
    });

    it('should successfully update thresholds with maximum valid values', async () => {
      const thresholds: Record<DocumentTypeValue, number> = {
        bank_statement: 1.0,
        government_id: 1.0,
        w9: 1.0,
        certificate_of_insurance: 1.0,
        articles_of_incorporation: 1.0,
      };

      thresholdRepository.save.mockResolvedValue();

      const result = await useCase.execute({ thresholds });

      expect(result.success).toBe(true);
      expect(thresholdRepository.save).toHaveBeenCalledWith(thresholds);
    });

    it('should throw ValidationError for threshold value below 0', async () => {
      const thresholds: Record<DocumentTypeValue, number> = {
        bank_statement: -0.1,
        government_id: 0.90,
        w9: 0.80,
        certificate_of_insurance: 0.75,
        articles_of_incorporation: 0.70,
      };

      await expect(
        useCase.execute({ thresholds })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({ thresholds })
      ).rejects.toThrow('Invalid threshold value for bank_statement: -0.1. Must be between 0 and 1.');

      expect(thresholdRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for threshold value above 1', async () => {
      const thresholds: Record<DocumentTypeValue, number> = {
        bank_statement: 0.85,
        government_id: 1.5,
        w9: 0.80,
        certificate_of_insurance: 0.75,
        articles_of_incorporation: 0.70,
      };

      await expect(
        useCase.execute({ thresholds })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCase.execute({ thresholds })
      ).rejects.toThrow('Invalid threshold value for government_id: 1.5. Must be between 0 and 1.');

      expect(thresholdRepository.save).not.toHaveBeenCalled();
    });

    it('should validate all thresholds before saving', async () => {
      const thresholds: Record<DocumentTypeValue, number> = {
        bank_statement: 0.85,
        government_id: 0.90,
        w9: 2.0,
        certificate_of_insurance: -0.5,
        articles_of_incorporation: 0.70,
      };

      await expect(
        useCase.execute({ thresholds })
      ).rejects.toThrow(ValidationError);

      expect(thresholdRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository save errors', async () => {
      const thresholds: Record<DocumentTypeValue, number> = {
        bank_statement: 0.85,
        government_id: 0.90,
        w9: 0.80,
        certificate_of_insurance: 0.75,
        articles_of_incorporation: 0.70,
      };

      const repositoryError = new Error('Database connection failed');
      thresholdRepository.save.mockRejectedValue(repositoryError);

      await expect(
        useCase.execute({ thresholds })
      ).rejects.toThrow('Database connection failed');
    });

    it('should update thresholds with different values per document type', async () => {
      const thresholds: Record<DocumentTypeValue, number> = {
        bank_statement: 0.95,
        government_id: 0.98,
        w9: 0.75,
        certificate_of_insurance: 0.85,
        articles_of_incorporation: 0.65,
      };

      thresholdRepository.save.mockResolvedValue();

      const result = await useCase.execute({ thresholds });

      expect(result.success).toBe(true);
      expect(result.updatedThresholds.bank_statement).toBe(0.95);
      expect(result.updatedThresholds.government_id).toBe(0.98);
      expect(result.updatedThresholds.w9).toBe(0.75);
      expect(result.updatedThresholds.certificate_of_insurance).toBe(0.85);
      expect(result.updatedThresholds.articles_of_incorporation).toBe(0.65);
    });
  });
});
