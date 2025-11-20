import { GetDocumentUseCase } from './GetDocument.UseCase';
import { Document } from '@/backend/domain/entities/Document.Entity';
import { Extraction } from '@/backend/domain/entities/Extraction.Entity';
import { Correction } from '@/backend/domain/entities/Correction.Entity';
import { DocumentType } from '@/backend/domain/value-objects/DocumentType.ValueObject';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import { FieldValue } from '@/backend/domain/value-objects/FieldValue.ValueObject';
import { DocumentNotFoundError } from '@/backend/domain/errors/Domain.Error';
import type { DocumentRepository } from '@/backend/application/ports/DocumentRepository';
import type { ExtractionRepository } from '@/backend/application/ports/ExtractionRepository';
import type { CorrectionRepository } from '@/backend/application/ports/CorrectionRepository';

describe('GetDocumentUseCase', () => {
  let useCase: GetDocumentUseCase;
  let documentRepository: jest.Mocked<DocumentRepository>;
  let extractionRepository: jest.Mocked<ExtractionRepository>;
  let correctionRepository: jest.Mocked<CorrectionRepository>;

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

    correctionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByDocumentId: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new GetDocumentUseCase(
      documentRepository,
      extractionRepository,
      correctionRepository
    );
  });

  describe('execute', () => {
    it('should successfully retrieve a document with extractions and no corrections', async () => {
      const documentId = 'doc-123';

      const document = Document.reconstitute({
        id: documentId,
        fileName: 'test.pdf',
        filePath: 'uploads/test.pdf',
        fileSize: 1024,
        status: 'completed',
        type: DocumentType.fromString('bank_statement'),
        classificationConfidence: Confidence.create(0.95),
        uploadedAt: new Date('2025-01-01'),
        processedAt: new Date('2025-01-01T00:01:00'),
        reviewedAt: null,
      });

      const fields = new Map<string, FieldValue>([
        ['accountNumber', FieldValue.create('accountNumber', '1234567890', Confidence.create(0.9))],
        ['balance', FieldValue.create('balance', 5000.50, Confidence.create(0.85))],
      ]);

      const extraction = Extraction.reconstitute({
        id: 'ext-123',
        documentId,
        fields,
        overallConfidence: Confidence.create(0.87),
        extractedAt: new Date('2025-01-01'),
        correctedAt: null,
      });

      documentRepository.findById.mockResolvedValue(document);
      extractionRepository.findByDocumentId.mockResolvedValue(extraction);
      correctionRepository.findByDocumentId.mockResolvedValue([]);

      const result = await useCase.execute({ documentId });

      expect(result.id).toBe(documentId);
      expect(result.fileName).toBe('test.pdf');
      expect(result.documentType).toBe('bank_statement');
      expect(result.classificationConfidence).toBe(0.95);
      expect(result.status).toBe('completed');
      expect(result.extractedFields).toHaveLength(2);
      expect(result.corrections).toHaveLength(0);
      expect(result.overallExtractionConfidence).toBe(0.87);

      const accountField = result.extractedFields.find(f => f.name === 'accountNumber');
      expect(accountField?.value).toBe('1234567890');
      expect(accountField?.confidence).toBe(0.9);
    });

    it('should successfully retrieve a document with corrections', async () => {
      const documentId = 'doc-456';

      const document = Document.reconstitute({
        id: documentId,
        fileName: 'corrected.pdf',
        filePath: 'uploads/corrected.pdf',
        fileSize: 2048,
        status: 'reviewed',
        type: DocumentType.fromString('w9'),
        classificationConfidence: Confidence.create(0.75),
        uploadedAt: new Date('2025-01-02'),
        processedAt: new Date('2025-01-02T00:01:00'),
        reviewedAt: new Date('2025-01-02T00:05:00'),
      });

      const fields = new Map<string, FieldValue>([
        ['ein', FieldValue.create('ein', '12-3456789', Confidence.create(0.7))],
      ]);

      const extraction = Extraction.reconstitute({
        id: 'ext-456',
        documentId,
        fields,
        overallConfidence: Confidence.create(0.7),
        extractedAt: new Date('2025-01-02'),
        correctedAt: new Date('2025-01-02T00:05:00'),
      });

      const correction = Correction.reconstitute({
        id: 'corr-123',
        documentId,
        extractionId: 'ext-456',
        originalType: DocumentType.fromString('government_id'),
        correctedType: DocumentType.fromString('w9'),
        fieldCorrections: [
          {
            fieldName: 'ein',
            originalValue: '123456789',
            correctedValue: '12-3456789',
          },
        ],
        correctedBy: 'user@example.com',
        correctedAt: new Date('2025-01-02T00:05:00'),
        notes: 'Fixed EIN format',
      });

      documentRepository.findById.mockResolvedValue(document);
      extractionRepository.findByDocumentId.mockResolvedValue(extraction);
      correctionRepository.findByDocumentId.mockResolvedValue([correction]);

      const result = await useCase.execute({ documentId });

      expect(result.id).toBe(documentId);
      expect(result.status).toBe('reviewed');
      expect(result.corrections).toHaveLength(1);

      const corr = result.corrections[0];
      expect(corr.id).toBe('corr-123');
      expect(corr.correctedType).toBe('w9');
      expect(corr.correctedBy).toBe('user@example.com');
      expect(corr.notes).toBe('Fixed EIN format');
      expect(corr.correctedFields['ein']).toBe('12-3456789');
    });

    it('should retrieve a document with no extraction', async () => {
      const documentId = 'doc-789';

      const document = Document.reconstitute({
        id: documentId,
        fileName: 'processing.pdf',
        filePath: 'uploads/processing.pdf',
        fileSize: 512,
        status: 'processing',
        type: null,
        classificationConfidence: null,
        uploadedAt: new Date('2025-01-03'),
        processedAt: null,
        reviewedAt: null,
      });

      documentRepository.findById.mockResolvedValue(document);
      extractionRepository.findByDocumentId.mockResolvedValue(null);
      correctionRepository.findByDocumentId.mockResolvedValue([]);

      const result = await useCase.execute({ documentId });

      expect(result.id).toBe(documentId);
      expect(result.status).toBe('processing');
      expect(result.extractedFields).toHaveLength(0);
      expect(result.overallExtractionConfidence).toBe(0);
      expect(result.corrections).toHaveLength(0);
    });

    it('should throw DocumentNotFoundError when document does not exist', async () => {
      const documentId = 'non-existent';

      documentRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({ documentId })
      ).rejects.toThrow(DocumentNotFoundError);

      await expect(
        useCase.execute({ documentId })
      ).rejects.toThrow(`Document with id ${documentId} not found`);

      expect(extractionRepository.findByDocumentId).not.toHaveBeenCalled();
      expect(correctionRepository.findByDocumentId).not.toHaveBeenCalled();
    });

    it('should handle multiple corrections', async () => {
      const documentId = 'doc-multi';

      const document = Document.reconstitute({
        id: documentId,
        fileName: 'multi-corrected.pdf',
        filePath: 'uploads/multi-corrected.pdf',
        fileSize: 3072,
        status: 'reviewed',
        type: DocumentType.fromString('bank_statement'),
        classificationConfidence: Confidence.create(0.88),
        uploadedAt: new Date('2025-01-04'),
        processedAt: new Date('2025-01-04T00:01:00'),
        reviewedAt: new Date('2025-01-04T00:10:00'),
      });

      const fields = new Map<string, FieldValue>([
        ['accountNumber', FieldValue.create('accountNumber', '9876543210', Confidence.create(0.92))],
      ]);

      const extraction = Extraction.reconstitute({
        id: 'ext-multi',
        documentId,
        fields,
        overallConfidence: Confidence.create(0.92),
        extractedAt: new Date('2025-01-04'),
        correctedAt: new Date('2025-01-04T00:10:00'),
      });

      const correction1 = Correction.reconstitute({
        id: 'corr-1',
        documentId,
        extractionId: 'ext-multi',
        originalType: null,
        correctedType: null,
        fieldCorrections: [
          {
            fieldName: 'accountNumber',
            originalValue: '987654321',
            correctedValue: '9876543210',
          },
        ],
        correctedBy: 'user1@example.com',
        correctedAt: new Date('2025-01-04T00:08:00'),
        notes: 'Fixed account number',
      });

      const correction2 = Correction.reconstitute({
        id: 'corr-2',
        documentId,
        extractionId: 'ext-multi',
        originalType: null,
        correctedType: null,
        fieldCorrections: [
          {
            fieldName: 'balance',
            originalValue: 1000,
            correctedValue: 1000.50,
          },
        ],
        correctedBy: 'user2@example.com',
        correctedAt: new Date('2025-01-04T00:10:00'),
        notes: 'Fixed balance decimal',
      });

      documentRepository.findById.mockResolvedValue(document);
      extractionRepository.findByDocumentId.mockResolvedValue(extraction);
      correctionRepository.findByDocumentId.mockResolvedValue([correction1, correction2]);

      const result = await useCase.execute({ documentId });

      expect(result.corrections).toHaveLength(2);
      expect(result.corrections[0].correctedBy).toBe('user1@example.com');
      expect(result.corrections[1].correctedBy).toBe('user2@example.com');
    });
  });
});
