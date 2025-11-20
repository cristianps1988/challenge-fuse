import { SqliteThresholdRepository } from './SqliteThreshold.Repository';
import { DocumentType } from '@/backend/domain/document-types.constants';
import { runMigrations, resetDatabase } from './migrations';

describe('SqliteThresholdRepository', () => {
  let repository: SqliteThresholdRepository;

  beforeAll(() => {
    runMigrations();
  });

  beforeEach(() => {
    resetDatabase();
    repository = new SqliteThresholdRepository();
  });

  describe('save', () => {
    it('should update existing thresholds', async () => {
      const thresholds = {
        [DocumentType.BANK_STATEMENT]: 0.95,
        [DocumentType.GOVERNMENT_ID]: 0.92,
        [DocumentType.W9]: 0.88,
      };

      await repository.save(thresholds);

      const found = await repository.findAll();
      expect(found[DocumentType.BANK_STATEMENT]).toBe(0.95);
      expect(found[DocumentType.GOVERNMENT_ID]).toBe(0.92);
      expect(found[DocumentType.W9]).toBe(0.88);
    });

    it('should save all document type thresholds', async () => {
      const thresholds = {
        [DocumentType.BANK_STATEMENT]: 0.91,
        [DocumentType.GOVERNMENT_ID]: 0.93,
        [DocumentType.W9]: 0.88,
        [DocumentType.CERTIFICATE_OF_INSURANCE]: 0.92,
        [DocumentType.ARTICLES_OF_INCORPORATION]: 0.87,
      };

      await repository.save(thresholds);

      const found = await repository.findAll();
      expect(found).toEqual(thresholds);
      expect(Object.keys(found)).toHaveLength(5);
    });

    it('should update existing thresholds on conflict', async () => {
      const initialThresholds = {
        [DocumentType.BANK_STATEMENT]: 0.85,
        [DocumentType.GOVERNMENT_ID]: 0.90,
      };

      await repository.save(initialThresholds);

      const updatedThresholds = {
        [DocumentType.BANK_STATEMENT]: 0.95,
        [DocumentType.GOVERNMENT_ID]: 0.88,
        [DocumentType.W9]: 0.92,
      };

      await repository.save(updatedThresholds);

      const found = await repository.findAll();
      expect(found[DocumentType.BANK_STATEMENT]).toBe(0.95);
      expect(found[DocumentType.GOVERNMENT_ID]).toBe(0.88);
      expect(found[DocumentType.W9]).toBe(0.92);
    });

    it('should save single threshold', async () => {
      const threshold = {
        [DocumentType.BANK_STATEMENT]: 0.99,
      };

      await repository.save(threshold);

      const found = await repository.findByType(DocumentType.BANK_STATEMENT);
      expect(found).toBe(0.99);
    });
  });

  describe('findAll', () => {
    it('should return default thresholds after reset', async () => {
      const thresholds = await repository.findAll();

      // Default values from schema.sql
      expect(thresholds[DocumentType.BANK_STATEMENT]).toBe(0.85);
      expect(thresholds[DocumentType.GOVERNMENT_ID]).toBe(0.90);
      expect(thresholds[DocumentType.W9]).toBe(0.85);
      expect(thresholds[DocumentType.CERTIFICATE_OF_INSURANCE]).toBe(0.80);
      expect(thresholds[DocumentType.ARTICLES_OF_INCORPORATION]).toBe(0.80);
      expect(Object.keys(thresholds)).toHaveLength(5);
    });

    it('should return all saved thresholds', async () => {
      const thresholds = {
        [DocumentType.BANK_STATEMENT]: 0.91,
        [DocumentType.GOVERNMENT_ID]: 0.92,
        [DocumentType.W9]: 0.88,
      };

      await repository.save(thresholds);

      const found = await repository.findAll();
      expect(found[DocumentType.BANK_STATEMENT]).toBe(0.91);
      expect(found[DocumentType.GOVERNMENT_ID]).toBe(0.92);
      expect(found[DocumentType.W9]).toBe(0.88);
    });

    it('should return thresholds with correct types', async () => {
      const thresholds = {
        [DocumentType.BANK_STATEMENT]: 0.85,
        [DocumentType.GOVERNMENT_ID]: 0.90,
      };

      await repository.save(thresholds);

      const found = await repository.findAll();
      expect(typeof found[DocumentType.BANK_STATEMENT]).toBe('number');
      expect(typeof found[DocumentType.GOVERNMENT_ID]).toBe('number');
    });
  });

  describe('findByType', () => {
    it('should return default threshold values', async () => {
      const threshold = await repository.findByType(DocumentType.BANK_STATEMENT);
      expect(threshold).toBe(0.85); // Default value from schema
    });

    it('should find threshold by document type', async () => {
      const thresholds = {
        [DocumentType.BANK_STATEMENT]: 0.91,
        [DocumentType.GOVERNMENT_ID]: 0.92,
        [DocumentType.W9]: 0.88,
      };

      await repository.save(thresholds);

      const bankStatementThreshold = await repository.findByType(DocumentType.BANK_STATEMENT);
      const govIdThreshold = await repository.findByType(DocumentType.GOVERNMENT_ID);
      const w9Threshold = await repository.findByType(DocumentType.W9);

      expect(bankStatementThreshold).toBe(0.91);
      expect(govIdThreshold).toBe(0.92);
      expect(w9Threshold).toBe(0.88);
    });

    it('should return default value for other document types', async () => {
      const thresholds = {
        [DocumentType.BANK_STATEMENT]: 0.99,
      };

      await repository.save(thresholds);

      const bankThreshold = await repository.findByType(DocumentType.BANK_STATEMENT);
      const govIdThreshold = await repository.findByType(DocumentType.GOVERNMENT_ID);

      expect(bankThreshold).toBe(0.99);
      expect(govIdThreshold).toBe(0.90); // Default value unchanged
    });

    it('should return updated threshold value', async () => {
      const initialThresholds = {
        [DocumentType.BANK_STATEMENT]: 0.85,
      };

      await repository.save(initialThresholds);

      const updatedThresholds = {
        [DocumentType.BANK_STATEMENT]: 0.95,
      };

      await repository.save(updatedThresholds);

      const threshold = await repository.findByType(DocumentType.BANK_STATEMENT);
      expect(threshold).toBe(0.95);
    });
  });

  describe('edge cases', () => {
    it('should handle threshold value of 0', async () => {
      const thresholds = {
        [DocumentType.BANK_STATEMENT]: 0,
      };

      await repository.save(thresholds);

      const threshold = await repository.findByType(DocumentType.BANK_STATEMENT);
      expect(threshold).toBe(0);
    });

    it('should handle threshold value of 1', async () => {
      const thresholds = {
        [DocumentType.BANK_STATEMENT]: 1,
      };

      await repository.save(thresholds);

      const threshold = await repository.findByType(DocumentType.BANK_STATEMENT);
      expect(threshold).toBe(1);
    });

    it('should handle decimal precision', async () => {
      const thresholds = {
        [DocumentType.BANK_STATEMENT]: 0.123456789,
      };

      await repository.save(thresholds);

      const threshold = await repository.findByType(DocumentType.BANK_STATEMENT);
      expect(threshold).toBeCloseTo(0.123456789, 9);
    });
  });
});
