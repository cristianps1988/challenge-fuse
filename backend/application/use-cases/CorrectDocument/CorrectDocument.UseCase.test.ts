import { CorrectDocumentUseCase } from './CorrectDocument.UseCase';
import { Document } from '@/backend/domain/entities/Document.Entity';
import { Extraction } from '@/backend/domain/entities/Extraction.Entity';
import { DocumentType } from '@/backend/domain/value-objects/DocumentType.ValueObject';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import { FieldValue } from '@/backend/domain/value-objects/FieldValue.ValueObject';
import { DocumentNotFoundError, ExtractionNotFoundError } from '@/backend/domain/errors/Domain.Error';
import type { DocumentRepository } from '@/backend/application/ports/DocumentRepository';
import type { ExtractionRepository } from '@/backend/application/ports/ExtractionRepository';
import type { CorrectionRepository } from '@/backend/application/ports/CorrectionRepository';

describe('CorrectDocumentUseCase', () => {
  let useCase: CorrectDocumentUseCase;
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

    useCase = new CorrectDocumentUseCase(
      documentRepository,
      extractionRepository,
      correctionRepository
    );
  });

  describe('execute', () => {
    it('should successfully correct document type', async () => {
      const documentId = 'doc-123';

      const document = Document.reconstitute({
        id: documentId,
        fileName: 'test.pdf',
        filePath: 'uploads/test.pdf',
        fileSize: 1024,
        status: 'needs_review',
        type: DocumentType.fromString('bank_statement'),
        classificationConfidence: Confidence.create(0.65),
        uploadedAt: new Date(),
        processedAt: new Date(),
        reviewedAt: null,
      });

      const fields = new Map<string, FieldValue>([
        ['ein', FieldValue.create('ein', '123456789', Confidence.create(0.7))],
      ]);

      const extraction = Extraction.reconstitute({
        id: 'ext-123',
        documentId,
        fields,
        overallConfidence: Confidence.create(0.7),
        extractedAt: new Date(),
        correctedAt: null,
      });

      documentRepository.findById.mockResolvedValue(document);
      extractionRepository.findByDocumentId.mockResolvedValue(extraction);
      correctionRepository.save.mockResolvedValue();
      documentRepository.update.mockResolvedValue();
      extractionRepository.update.mockResolvedValue();

      const result = await useCase.execute({
        documentId,
        correctedType: 'w9',
        correctedBy: 'user@example.com',
        notes: 'This is actually a W9 form',
      });

      expect(result.success).toBe(true);
      expect(result.documentId).toBe(documentId);
      expect(result.message).toBe('Document corrected successfully');
      expect(correctionRepository.save).toHaveBeenCalled();
      expect(documentRepository.update).toHaveBeenCalled();
      expect(extractionRepository.update).toHaveBeenCalled();
    });

    it('should successfully correct document fields', async () => {
      const documentId = 'doc-456';

      const document = Document.reconstitute({
        id: documentId,
        fileName: 'test.pdf',
        filePath: 'uploads/test.pdf',
        fileSize: 1024,
        status: 'needs_review',
        type: DocumentType.fromString('w9'),
        classificationConfidence: Confidence.create(0.85),
        uploadedAt: new Date(),
        processedAt: new Date(),
        reviewedAt: null,
      });

      const fields = new Map<string, FieldValue>([
        ['ein', FieldValue.create('ein', '123456789', Confidence.create(0.7))],
        ['businessName', FieldValue.create('businessName', 'Acme Corp', Confidence.create(0.9))],
      ]);

      const extraction = Extraction.reconstitute({
        id: 'ext-456',
        documentId,
        fields,
        overallConfidence: Confidence.create(0.8),
        extractedAt: new Date(),
        correctedAt: null,
      });

      documentRepository.findById.mockResolvedValue(document);
      extractionRepository.findByDocumentId.mockResolvedValue(extraction);
      correctionRepository.save.mockResolvedValue();
      documentRepository.update.mockResolvedValue();
      extractionRepository.update.mockResolvedValue();

      const result = await useCase.execute({
        documentId,
        correctedFields: {
          ein: '12-3456789',
          businessName: 'ACME Corporation',
        },
        correctedBy: 'user@example.com',
        notes: 'Fixed formatting',
      });

      expect(result.success).toBe(true);
      expect(correctionRepository.save).toHaveBeenCalled();

      const correctionArg = correctionRepository.save.mock.calls[0][0];
      expect(correctionArg.getFieldCorrections()).toHaveLength(2);
    });

    it('should correct both type and fields simultaneously', async () => {
      const documentId = 'doc-789';

      const document = Document.reconstitute({
        id: documentId,
        fileName: 'test.pdf',
        filePath: 'uploads/test.pdf',
        fileSize: 1024,
        status: 'needs_review',
        type: DocumentType.fromString('government_id'),
        classificationConfidence: Confidence.create(0.55),
        uploadedAt: new Date(),
        processedAt: new Date(),
        reviewedAt: null,
      });

      const fields = new Map<string, FieldValue>([
        ['ein', FieldValue.create('ein', '123456789', Confidence.create(0.6))],
      ]);

      const extraction = Extraction.reconstitute({
        id: 'ext-789',
        documentId,
        fields,
        overallConfidence: Confidence.create(0.6),
        extractedAt: new Date(),
        correctedAt: null,
      });

      documentRepository.findById.mockResolvedValue(document);
      extractionRepository.findByDocumentId.mockResolvedValue(extraction);
      correctionRepository.save.mockResolvedValue();
      documentRepository.update.mockResolvedValue();
      extractionRepository.update.mockResolvedValue();

      const result = await useCase.execute({
        documentId,
        correctedType: 'w9',
        correctedFields: {
          ein: '12-3456789',
        },
        correctedBy: 'user@example.com',
        notes: 'Misclassified document',
      });

      expect(result.success).toBe(true);
      expect(correctionRepository.save).toHaveBeenCalled();
      expect(documentRepository.update).toHaveBeenCalled();
      expect(extractionRepository.update).toHaveBeenCalled();
    });

    it('should throw DocumentNotFoundError when document does not exist', async () => {
      const documentId = 'non-existent';

      documentRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          documentId,
          correctedType: 'w9',
          correctedBy: 'user@example.com',
        })
      ).rejects.toThrow(DocumentNotFoundError);

      expect(extractionRepository.findByDocumentId).not.toHaveBeenCalled();
      expect(correctionRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ExtractionNotFoundError when extraction does not exist', async () => {
      const documentId = 'doc-without-extraction';

      const document = Document.reconstitute({
        id: documentId,
        fileName: 'test.pdf',
        filePath: 'uploads/test.pdf',
        fileSize: 1024,
        status: 'needs_review',
        type: DocumentType.fromString('bank_statement'),
        classificationConfidence: Confidence.create(0.65),
        uploadedAt: new Date(),
        processedAt: new Date(),
        reviewedAt: null,
      });

      documentRepository.findById.mockResolvedValue(document);
      extractionRepository.findByDocumentId.mockResolvedValue(null);

      await expect(
        useCase.execute({
          documentId,
          correctedType: 'w9',
          correctedBy: 'user@example.com',
        })
      ).rejects.toThrow(ExtractionNotFoundError);

      expect(correctionRepository.save).not.toHaveBeenCalled();
    });

    it('should mark document as reviewed after correction', async () => {
      const documentId = 'doc-review';

      const document = Document.reconstitute({
        id: documentId,
        fileName: 'test.pdf',
        filePath: 'uploads/test.pdf',
        fileSize: 1024,
        status: 'needs_review',
        type: DocumentType.fromString('w9'),
        classificationConfidence: Confidence.create(0.75),
        uploadedAt: new Date(),
        processedAt: new Date(),
        reviewedAt: null,
      });

      const fields = new Map<string, FieldValue>([
        ['ein', FieldValue.create('ein', '12-3456789', Confidence.create(0.8))],
      ]);

      const extraction = Extraction.reconstitute({
        id: 'ext-review',
        documentId,
        fields,
        overallConfidence: Confidence.create(0.8),
        extractedAt: new Date(),
        correctedAt: null,
      });

      documentRepository.findById.mockResolvedValue(document);
      extractionRepository.findByDocumentId.mockResolvedValue(extraction);
      correctionRepository.save.mockResolvedValue();
      documentRepository.update.mockResolvedValue();
      extractionRepository.update.mockResolvedValue();

      await useCase.execute({
        documentId,
        correctedFields: { ein: '12-3456789' },
        correctedBy: 'user@example.com',
      });

      expect(documentRepository.update).toHaveBeenCalled();
      const updatedDocument = documentRepository.update.mock.calls[0][0];
      expect(updatedDocument.getStatus()).toBe('reviewed');
    });

    it('should handle correction with no changes specified', async () => {
      const documentId = 'doc-no-changes';

      const document = Document.reconstitute({
        id: documentId,
        fileName: 'test.pdf',
        filePath: 'uploads/test.pdf',
        fileSize: 1024,
        status: 'needs_review',
        type: DocumentType.fromString('w9'),
        classificationConfidence: Confidence.create(0.75),
        uploadedAt: new Date(),
        processedAt: new Date(),
        reviewedAt: null,
      });

      const fields = new Map<string, FieldValue>([
        ['ein', FieldValue.create('ein', '12-3456789', Confidence.create(0.8))],
      ]);

      const extraction = Extraction.reconstitute({
        id: 'ext-no-changes',
        documentId,
        fields,
        overallConfidence: Confidence.create(0.8),
        extractedAt: new Date(),
        correctedAt: null,
      });

      documentRepository.findById.mockResolvedValue(document);
      extractionRepository.findByDocumentId.mockResolvedValue(extraction);
      correctionRepository.save.mockResolvedValue();
      documentRepository.update.mockResolvedValue();
      extractionRepository.update.mockResolvedValue();

      const result = await useCase.execute({
        documentId,
        correctedBy: 'user@example.com',
        notes: 'Everything looks correct',
      });

      expect(result.success).toBe(true);
      expect(correctionRepository.save).toHaveBeenCalled();
    });
  });
});
