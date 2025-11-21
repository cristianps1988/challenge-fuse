import { ProcessDocumentUseCase } from './ProcessDocument.UseCase';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import { FieldValue } from '@/backend/domain/value-objects/FieldValue.ValueObject';
import type { DocumentRepository } from '@/backend/application/ports/DocumentRepository';
import type { ExtractionRepository } from '@/backend/application/ports/ExtractionRepository';
import type { ClassifierService, ClassificationResult } from '@/backend/application/ports/ClassifierService';
import type { ExtractorService, ExtractionResult } from '@/backend/application/ports/ExtractorService';
import type { StorageService } from '@/backend/application/ports/StorageService';
import type { ThresholdRepository } from '@/backend/application/ports/ThresholdRepository';

describe('ProcessDocumentUseCase', () => {
  let useCase: ProcessDocumentUseCase;
  let documentRepository: jest.Mocked<DocumentRepository>;
  let extractionRepository: jest.Mocked<ExtractionRepository>;
  let classifierService: jest.Mocked<ClassifierService>;
  let extractorService: jest.Mocked<ExtractorService>;
  let storageService: jest.Mocked<StorageService>;
  let thresholdRepository: jest.Mocked<ThresholdRepository>;

  beforeEach(() => {
    documentRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    extractionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByDocumentId: jest.fn(),
      findAllByDocumentIds: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    classifierService = {
      classify: jest.fn(),
    };

    extractorService = {
      extract: jest.fn(),
    };

    storageService = {
      save: jest.fn(),
      retrieve: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      getFileSize: jest.fn(),
    };

    thresholdRepository = {
      save: jest.fn(),
      findAll: jest.fn(),
      findByType: jest.fn().mockResolvedValue(0.85),
    };

    useCase = new ProcessDocumentUseCase(
      documentRepository,
      extractionRepository,
      classifierService,
      extractorService,
      storageService,
      thresholdRepository
    );
  });

  describe('execute', () => {
    it('should successfully process a document with high confidence', async () => {
      const fileBuffer = Buffer.from('test file content');
      const fileName = 'test-document.pdf';
      const filePath = 'uploads/test-document.pdf';

      const classificationResult: ClassificationResult = {
        documentType: 'bank_statement',
        confidence: Confidence.create(0.95),
        reasoning: 'Clear bank statement format detected',
      };

      const fields = new Map<string, FieldValue>([
        ['accountNumber', FieldValue.create('accountNumber', '1234567890', Confidence.create(0.9))],
        ['balance', FieldValue.create('balance', 5000.50, Confidence.create(0.85))],
      ]);

      const extractionResult: ExtractionResult = {
        fields,
        overallConfidence: 0.87,
        processingTimeMs: 1500,
      };

      storageService.save.mockResolvedValue(filePath);
      classifierService.classify.mockResolvedValue(classificationResult);
      extractorService.extract.mockResolvedValue(extractionResult);
      documentRepository.save.mockResolvedValue();
      extractionRepository.save.mockResolvedValue();

      const result = await useCase.execute({
        fileBuffer,
        fileName,
        uploadedBy: 'test-user',
      });

      expect(result.documentType).toBe('bank_statement');
      expect(result.classificationConfidence).toBe(0.95);
      expect(result.status).toBe('completed');
      expect(result.requiresReview).toBe(false);
      expect(result.extractedFields).toHaveLength(2);
      expect(result.fileName).toBe(fileName);

      expect(storageService.save).toHaveBeenCalledWith(fileBuffer, fileName);
      expect(classifierService.classify).toHaveBeenCalledWith(fileBuffer, fileName);
      expect(extractorService.extract).toHaveBeenCalledWith(fileBuffer, 'bank_statement', fileName);
      expect(documentRepository.save).toHaveBeenCalled();
      expect(extractionRepository.save).toHaveBeenCalled();
    });

    it('should mark document as needs_review when confidence is low', async () => {
      const fileBuffer = Buffer.from('test file content');
      const fileName = 'unclear-document.pdf';
      const filePath = 'uploads/unclear-document.pdf';

      const classificationResult: ClassificationResult = {
        documentType: 'w9',
        confidence: Confidence.create(0.55),
        reasoning: 'Uncertain classification',
      };

      const fields = new Map<string, FieldValue>([
        ['ein', FieldValue.create('ein', '12-3456789', Confidence.create(0.6))],
      ]);

      const extractionResult: ExtractionResult = {
        fields,
        overallConfidence: 0.6,
        processingTimeMs: 2000,
      };

      storageService.save.mockResolvedValue(filePath);
      classifierService.classify.mockResolvedValue(classificationResult);
      extractorService.extract.mockResolvedValue(extractionResult);
      documentRepository.save.mockResolvedValue();
      extractionRepository.save.mockResolvedValue();

      const result = await useCase.execute({
        fileBuffer,
        fileName,
      });

      expect(result.status).toBe('needs_review');
      expect(result.requiresReview).toBe(true);
      expect(result.classificationConfidence).toBe(0.55);
    });

    it('should handle extraction with multiple field types', async () => {
      const fileBuffer = Buffer.from('test file content');
      const fileName = 'government-id.pdf';
      const filePath = 'uploads/government-id.pdf';

      const classificationResult: ClassificationResult = {
        documentType: 'government_id',
        confidence: Confidence.create(0.98),
      };

      const fields = new Map<string, FieldValue>([
        ['fullName', FieldValue.create('fullName', 'John Doe', Confidence.create(0.95))],
        ['idNumber', FieldValue.create('idNumber', 'A1234567', Confidence.create(0.92))],
        ['dateOfBirth', FieldValue.create('dateOfBirth', '1990-01-15', Confidence.create(0.88))],
        ['isValid', FieldValue.create('isValid', true, Confidence.create(0.99))],
      ]);

      const extractionResult: ExtractionResult = {
        fields,
        overallConfidence: 0.93,
        processingTimeMs: 1800,
      };

      storageService.save.mockResolvedValue(filePath);
      classifierService.classify.mockResolvedValue(classificationResult);
      extractorService.extract.mockResolvedValue(extractionResult);
      documentRepository.save.mockResolvedValue();
      extractionRepository.save.mockResolvedValue();

      const result = await useCase.execute({
        fileBuffer,
        fileName,
      });

      expect(result.extractedFields).toHaveLength(4);

      const nameField = result.extractedFields.find(f => f.name === 'fullName');
      expect(nameField?.value).toBe('John Doe');
      expect(nameField?.valueType).toBe('string');

      const dobField = result.extractedFields.find(f => f.name === 'dateOfBirth');
      expect(dobField?.valueType).toBe('date');

      const validField = result.extractedFields.find(f => f.name === 'isValid');
      expect(validField?.valueType).toBe('boolean');
    });

    it('should propagate storage service errors', async () => {
      const fileBuffer = Buffer.from('test file content');
      const fileName = 'test-document.pdf';

      storageService.save.mockRejectedValue(new Error('Storage failed'));

      await expect(
        useCase.execute({
          fileBuffer,
          fileName,
        })
      ).rejects.toThrow('Storage failed');

      expect(classifierService.classify).not.toHaveBeenCalled();
      expect(documentRepository.save).not.toHaveBeenCalled();
    });

    it('should propagate classifier service errors', async () => {
      const fileBuffer = Buffer.from('test file content');
      const fileName = 'test-document.pdf';
      const filePath = 'uploads/test-document.pdf';

      storageService.save.mockResolvedValue(filePath);
      classifierService.classify.mockRejectedValue(new Error('Classification failed'));

      await expect(
        useCase.execute({
          fileBuffer,
          fileName,
        })
      ).rejects.toThrow('Classification failed');

      expect(extractorService.extract).not.toHaveBeenCalled();
      expect(documentRepository.save).not.toHaveBeenCalled();
    });
  });
});
