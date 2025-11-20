import { LearningLoopService } from './LearningLoop.Service';
import { Correction } from '@/backend/domain/entities/Correction.Entity';
import { Document } from '@/backend/domain/entities/Document.Entity';
import { DocumentType } from '@/backend/domain/value-objects/DocumentType.ValueObject';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import type { CorrectionRepository } from '@/backend/application/ports/CorrectionRepository';
import type { DocumentRepository } from '@/backend/application/ports/DocumentRepository';

describe('LearningLoopService', () => {
  let service: LearningLoopService;
  let correctionRepository: jest.Mocked<CorrectionRepository>;
  let documentRepository: jest.Mocked<DocumentRepository>;

  beforeEach(() => {
    correctionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByDocumentId: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    };

    documentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    service = new LearningLoopService(correctionRepository, documentRepository);
  });

  describe('storeExample', () => {
    it('should save correction to repository', async () => {
      const correction = Correction.reconstitute({
        id: 'corr-123',
        documentId: 'doc-123',
        extractionId: 'ext-123',
        originalType: DocumentType.fromString('bank_statement'),
        correctedType: DocumentType.fromString('w9'),
        fieldCorrections: [],
        correctedBy: 'user@example.com',
        correctedAt: new Date(),
        notes: 'Test correction',
      });

      correctionRepository.save.mockResolvedValue();

      await service.storeExample(correction);

      expect(correctionRepository.save).toHaveBeenCalledWith(correction);
      expect(correctionRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('getExamplesForType', () => {
    it('should retrieve examples for specific document type', async () => {
      const correction1 = Correction.reconstitute({
        id: 'corr-1',
        documentId: 'doc-1',
        extractionId: 'ext-1',
        originalType: DocumentType.fromString('bank_statement'),
        correctedType: DocumentType.fromString('w9'),
        fieldCorrections: [
          { fieldName: 'ein', originalValue: '123', correctedValue: '12-3456789' },
        ],
        correctedBy: 'user@example.com',
        correctedAt: new Date('2025-01-01'),
        notes: null,
      });

      const correction2 = Correction.reconstitute({
        id: 'corr-2',
        documentId: 'doc-2',
        extractionId: 'ext-2',
        originalType: DocumentType.fromString('government_id'),
        correctedType: null,
        fieldCorrections: [
          { fieldName: 'idNumber', originalValue: 'ABC', correctedValue: 'ABC123' },
        ],
        correctedBy: 'user@example.com',
        correctedAt: new Date('2025-01-02'),
        notes: null,
      });

      const document1 = Document.reconstitute({
        id: 'doc-1',
        fileName: 'test1.pdf',
        filePath: 'uploads/test1.pdf',
        fileSize: 1024,
        status: 'reviewed',
        type: DocumentType.fromString('w9'),
        classificationConfidence: Confidence.create(0.8),
        uploadedAt: new Date(),
        processedAt: new Date(),
        reviewedAt: new Date(),
      });

      const document2 = Document.reconstitute({
        id: 'doc-2',
        fileName: 'test2.pdf',
        filePath: 'uploads/test2.pdf',
        fileSize: 1024,
        status: 'reviewed',
        type: DocumentType.fromString('government_id'),
        classificationConfidence: Confidence.create(0.9),
        uploadedAt: new Date(),
        processedAt: new Date(),
        reviewedAt: new Date(),
      });

      correctionRepository.findAll.mockResolvedValue([correction1, correction2]);
      documentRepository.findById.mockImplementation(async (id) => {
        if (id === 'doc-1') return document1;
        if (id === 'doc-2') return document2;
        return null;
      });

      const examples = await service.getExamplesForType('w9', 5);

      expect(examples).toHaveLength(1);
      expect(examples[0].documentId).toBe('doc-1');
      expect(examples[0].originalType).toBe('bank_statement');
      expect(examples[0].correctedType).toBe('w9');
      expect(examples[0].fieldCorrections).toHaveLength(1);
    });

    it('should limit results to specified limit', async () => {
      const corrections = Array.from({ length: 10 }, (_, i) =>
        Correction.reconstitute({
          id: `corr-${i}`,
          documentId: `doc-${i}`,
          extractionId: `ext-${i}`,
          originalType: DocumentType.fromString('w9'),
          correctedType: null,
          fieldCorrections: [],
          correctedBy: 'user@example.com',
          correctedAt: new Date(),
          notes: null,
        })
      );

      const documents = Array.from({ length: 10 }, (_, i) =>
        Document.reconstitute({
          id: `doc-${i}`,
          fileName: `test${i}.pdf`,
          filePath: `uploads/test${i}.pdf`,
          fileSize: 1024,
          status: 'reviewed',
          type: DocumentType.fromString('w9'),
          classificationConfidence: Confidence.create(0.8),
          uploadedAt: new Date(),
          processedAt: new Date(),
          reviewedAt: new Date(),
        })
      );

      correctionRepository.findAll.mockResolvedValue(corrections);
      documentRepository.findById.mockImplementation(async (id) => {
        const index = parseInt(id.split('-')[1]);
        return documents[index] || null;
      });

      const examples = await service.getExamplesForType('w9', 3);

      expect(examples).toHaveLength(3);
    });

    it('should return empty array when no corrections exist', async () => {
      correctionRepository.findAll.mockResolvedValue([]);

      const examples = await service.getExamplesForType('w9', 5);

      expect(examples).toHaveLength(0);
    });
  });

  describe('getAllExamples', () => {
    it('should retrieve all examples with default limit', async () => {
      const corrections = Array.from({ length: 5 }, (_, i) =>
        Correction.reconstitute({
          id: `corr-${i}`,
          documentId: `doc-${i}`,
          extractionId: `ext-${i}`,
          originalType: DocumentType.fromString('w9'),
          correctedType: DocumentType.fromString('bank_statement'),
          fieldCorrections: [
            { fieldName: 'field1', originalValue: 'old', correctedValue: 'new' },
          ],
          correctedBy: 'user@example.com',
          correctedAt: new Date(),
          notes: null,
        })
      );

      correctionRepository.findAll.mockResolvedValue(corrections);

      const examples = await service.getAllExamples();

      expect(examples).toHaveLength(5);
      expect(examples[0].originalType).toBe('w9');
      expect(examples[0].correctedType).toBe('bank_statement');
    });

    it('should respect custom limit', async () => {
      const corrections = Array.from({ length: 20 }, (_, i) =>
        Correction.reconstitute({
          id: `corr-${i}`,
          documentId: `doc-${i}`,
          extractionId: `ext-${i}`,
          originalType: DocumentType.fromString('w9'),
          correctedType: null,
          fieldCorrections: [],
          correctedBy: 'user@example.com',
          correctedAt: new Date(),
          notes: null,
        })
      );

      correctionRepository.findAll.mockResolvedValue(corrections);

      const examples = await service.getAllExamples(15);

      expect(correctionRepository.findAll).toHaveBeenCalledWith({ limit: 15 });
    });
  });

  describe('deriveValidationRules', () => {
    it('should derive validation rules from correction examples', async () => {
      const corrections = Array.from({ length: 10 }, (_, i) =>
        Correction.reconstitute({
          id: `corr-${i}`,
          documentId: `doc-${i}`,
          extractionId: `ext-${i}`,
          originalType: DocumentType.fromString('w9'),
          correctedType: null,
          fieldCorrections: [
            { fieldName: 'ein', originalValue: '123', correctedValue: '12-3456789' },
            { fieldName: 'businessName', originalValue: 'acme', correctedValue: 'ACME Corp' },
          ],
          correctedBy: 'user@example.com',
          correctedAt: new Date(),
          notes: null,
        })
      );

      const documents = Array.from({ length: 10 }, (_, i) =>
        Document.reconstitute({
          id: `doc-${i}`,
          fileName: `test${i}.pdf`,
          filePath: `uploads/test${i}.pdf`,
          fileSize: 1024,
          status: 'reviewed',
          type: DocumentType.fromString('w9'),
          classificationConfidence: Confidence.create(0.8),
          uploadedAt: new Date(),
          processedAt: new Date(),
          reviewedAt: new Date(),
        })
      );

      correctionRepository.findAll.mockResolvedValue(corrections);
      documentRepository.findById.mockImplementation(async (id) => {
        const index = parseInt(id.split('-')[1]);
        return documents[index] || null;
      });

      const rules = await service.deriveValidationRules('w9');

      expect(rules.length).toBeGreaterThan(0);
      const einRule = rules.find((r) => r.fieldName === 'ein');
      expect(einRule).toBeDefined();
      expect(einRule?.required).toBe(true);
    });

    it('should return empty rules for document type with no examples', async () => {
      correctionRepository.findAll.mockResolvedValue([]);

      const rules = await service.deriveValidationRules('w9');

      expect(rules).toHaveLength(0);
    });

    it('should include allowed values for fields with limited unique values', async () => {
      const corrections = Array.from({ length: 10 }, () =>
        Correction.reconstitute({
          id: 'corr-1',
          documentId: 'doc-1',
          extractionId: 'ext-1',
          originalType: DocumentType.fromString('w9'),
          correctedType: null,
          fieldCorrections: [
            { fieldName: 'status', originalValue: 'pending', correctedValue: 'active' },
          ],
          correctedBy: 'user@example.com',
          correctedAt: new Date(),
          notes: null,
        })
      );

      const document = Document.reconstitute({
        id: 'doc-1',
        fileName: 'test.pdf',
        filePath: 'uploads/test.pdf',
        fileSize: 1024,
        status: 'reviewed',
        type: DocumentType.fromString('w9'),
        classificationConfidence: Confidence.create(0.8),
        uploadedAt: new Date(),
        processedAt: new Date(),
        reviewedAt: new Date(),
      });

      correctionRepository.findAll.mockResolvedValue(corrections);
      documentRepository.findById.mockResolvedValue(document);

      const rules = await service.deriveValidationRules('w9');

      const statusRule = rules.find((r) => r.fieldName === 'status');
      expect(statusRule?.allowedValues).toBeDefined();
      expect(statusRule?.allowedValues).toContain('active');
    });
  });

  describe('getConfidenceBoost', () => {
    it('should return base confidence when no examples exist', async () => {
      correctionRepository.findAll.mockResolvedValue([]);

      const boostedConfidence = await service.getConfidenceBoost('w9', 0.7);

      expect(boostedConfidence).toBe(0.7);
    });

    it('should boost confidence based on number of examples', async () => {
      const corrections = Array.from({ length: 5 }, (_, i) =>
        Correction.reconstitute({
          id: `corr-${i}`,
          documentId: `doc-${i}`,
          extractionId: `ext-${i}`,
          originalType: DocumentType.fromString('w9'),
          correctedType: null,
          fieldCorrections: [],
          correctedBy: 'user@example.com',
          correctedAt: new Date(),
          notes: null,
        })
      );

      const documents = Array.from({ length: 5 }, (_, i) =>
        Document.reconstitute({
          id: `doc-${i}`,
          fileName: `test${i}.pdf`,
          filePath: `uploads/test${i}.pdf`,
          fileSize: 1024,
          status: 'reviewed',
          type: DocumentType.fromString('w9'),
          classificationConfidence: Confidence.create(0.8),
          uploadedAt: new Date(),
          processedAt: new Date(),
          reviewedAt: new Date(),
        })
      );

      correctionRepository.findAll.mockResolvedValue(corrections);
      documentRepository.findById.mockImplementation(async (id) => {
        const index = parseInt(id.split('-')[1]);
        return documents[index] || null;
      });

      const boostedConfidence = await service.getConfidenceBoost('w9', 0.7);

      expect(boostedConfidence).toBeGreaterThan(0.7);
      expect(boostedConfidence).toBeLessThanOrEqual(1.0);
    });

    it('should cap boosted confidence at 1.0', async () => {
      const corrections = Array.from({ length: 10 }, (_, i) =>
        Correction.reconstitute({
          id: `corr-${i}`,
          documentId: `doc-${i}`,
          extractionId: `ext-${i}`,
          originalType: DocumentType.fromString('w9'),
          correctedType: null,
          fieldCorrections: [],
          correctedBy: 'user@example.com',
          correctedAt: new Date(),
          notes: null,
        })
      );

      const documents = Array.from({ length: 10 }, (_, i) =>
        Document.reconstitute({
          id: `doc-${i}`,
          fileName: `test${i}.pdf`,
          filePath: `uploads/test${i}.pdf`,
          fileSize: 1024,
          status: 'reviewed',
          type: DocumentType.fromString('w9'),
          classificationConfidence: Confidence.create(0.8),
          uploadedAt: new Date(),
          processedAt: new Date(),
          reviewedAt: new Date(),
        })
      );

      correctionRepository.findAll.mockResolvedValue(corrections);
      documentRepository.findById.mockImplementation(async (id) => {
        const index = parseInt(id.split('-')[1]);
        return documents[index] || null;
      });

      const boostedConfidence = await service.getConfidenceBoost('w9', 0.95);

      expect(boostedConfidence).toBeLessThanOrEqual(1.0);
    });
  });
});
