import { CalculateMetricsUseCase } from './CalculateMetrics.UseCase';
import { Document } from '@/backend/domain/entities/Document.Entity';
import { Extraction } from '@/backend/domain/entities/Extraction.Entity';
import { Correction } from '@/backend/domain/entities/Correction.Entity';
import { DocumentType } from '@/backend/domain/value-objects/DocumentType.ValueObject';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import { FieldValue } from '@/backend/domain/value-objects/FieldValue.ValueObject';
import { DocumentStatus } from '@/backend/domain/document-status.constants';
import type { DocumentRepository } from '@/backend/application/ports/DocumentRepository';
import type { ExtractionRepository } from '@/backend/application/ports/ExtractionRepository';
import type { CorrectionRepository } from '@/backend/application/ports/CorrectionRepository';

describe('CalculateMetricsUseCase', () => {
  let useCase: CalculateMetricsUseCase;
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

    useCase = new CalculateMetricsUseCase(
      documentRepository,
      extractionRepository,
      correctionRepository
    );
  });

  describe('execute', () => {
    it('should calculate metrics with no documents', async () => {
      documentRepository.findAll.mockResolvedValue([]);
      correctionRepository.findAll.mockResolvedValue([]);
      extractionRepository.findAllByDocumentIds.mockResolvedValue([]);

      const result = await useCase.execute({});

      expect(result.classification.totalDocuments).toBe(0);
      expect(result.classification.accuracy).toBe(0);
      expect(result.extraction.averageConfidence).toBe(0);
      expect(result.operational.totalDocumentsProcessed).toBe(0);
    });

    it('should calculate classification metrics correctly', async () => {
      const documents = [
        Document.reconstitute({
          id: 'doc-1',
          fileName: 'test1.pdf',
          filePath: 'uploads/test1.pdf',
          fileSize: 1024,
          status: 'completed',
          type: DocumentType.fromString('bank_statement'),
          classificationConfidence: Confidence.create(0.95),
          uploadedAt: new Date('2025-01-01'),
          processedAt: new Date('2025-01-01T00:01:00'),
          reviewedAt: null,
        }),
        Document.reconstitute({
          id: 'doc-2',
          fileName: 'test2.pdf',
          filePath: 'uploads/test2.pdf',
          fileSize: 1024,
          status: 'completed',
          type: DocumentType.fromString('w9'),
          classificationConfidence: Confidence.create(0.90),
          uploadedAt: new Date('2025-01-02'),
          processedAt: new Date('2025-01-02T00:01:00'),
          reviewedAt: null,
        }),
      ];

      documentRepository.findAll.mockResolvedValue(documents);
      correctionRepository.findAll.mockResolvedValue([]);
      extractionRepository.findAllByDocumentIds.mockResolvedValue([]);

      const result = await useCase.execute({});

      expect(result.classification.totalDocuments).toBe(2);
      expect(result.classification.correctPredictions).toBe(2);
      expect(result.classification.accuracy).toBe(1);
    });

    it('should calculate confusion matrix with corrections', async () => {
      const documents = [
        Document.reconstitute({
          id: 'doc-1',
          fileName: 'test1.pdf',
          filePath: 'uploads/test1.pdf',
          fileSize: 1024,
          status: 'reviewed',
          type: DocumentType.fromString('bank_statement'),
          classificationConfidence: Confidence.create(0.65),
          uploadedAt: new Date(),
          processedAt: new Date(),
          reviewedAt: new Date(),
        }),
      ];

      const corrections = [
        Correction.reconstitute({
          id: 'corr-1',
          documentId: 'doc-1',
          extractionId: 'ext-1',
          originalType: DocumentType.fromString('bank_statement'),
          correctedType: DocumentType.fromString('w9'),
          fieldCorrections: [],
          correctedBy: 'user@example.com',
          correctedAt: new Date(),
          notes: 'Misclassified',
        }),
      ];

      documentRepository.findAll.mockResolvedValue(documents);
      correctionRepository.findAll.mockResolvedValue(corrections);
      extractionRepository.findAllByDocumentIds.mockResolvedValue([]);

      const result = await useCase.execute({});

      expect(result.classification.confusionMatrix).toBeDefined();
      expect(result.classification.confusionMatrix['w9']['bank_statement']).toBe(1);
    });

    it('should calculate precision, recall, and F1 scores', async () => {
      const documents = [
        Document.reconstitute({
          id: 'doc-1',
          fileName: 'test1.pdf',
          filePath: 'uploads/test1.pdf',
          fileSize: 1024,
          status: 'completed',
          type: DocumentType.fromString('bank_statement'),
          classificationConfidence: Confidence.create(0.95),
          uploadedAt: new Date(),
          processedAt: new Date(),
          reviewedAt: null,
        }),
        Document.reconstitute({
          id: 'doc-2',
          fileName: 'test2.pdf',
          filePath: 'uploads/test2.pdf',
          fileSize: 1024,
          status: 'completed',
          type: DocumentType.fromString('bank_statement'),
          classificationConfidence: Confidence.create(0.93),
          uploadedAt: new Date(),
          processedAt: new Date(),
          reviewedAt: null,
        }),
      ];

      documentRepository.findAll.mockResolvedValue(documents);
      correctionRepository.findAll.mockResolvedValue([]);
      extractionRepository.findAllByDocumentIds.mockResolvedValue([]);

      const result = await useCase.execute({});

      expect(result.classification.precision).toBeDefined();
      expect(result.classification.recall).toBeDefined();
      expect(result.classification.f1Score).toBeDefined();
      expect(result.classification.precision['bank_statement']).toBeGreaterThan(0);
    });

    it('should calculate extraction metrics with confidence distribution', async () => {
      const documents = [
        Document.reconstitute({
          id: 'doc-1',
          fileName: 'test1.pdf',
          filePath: 'uploads/test1.pdf',
          fileSize: 1024,
          status: 'completed',
          type: DocumentType.fromString('bank_statement'),
          classificationConfidence: Confidence.create(0.95),
          uploadedAt: new Date(),
          processedAt: new Date(),
          reviewedAt: null,
        }),
        Document.reconstitute({
          id: 'doc-2',
          fileName: 'test2.pdf',
          filePath: 'uploads/test2.pdf',
          fileSize: 1024,
          status: 'completed',
          type: DocumentType.fromString('w9'),
          classificationConfidence: Confidence.create(0.90),
          uploadedAt: new Date(),
          processedAt: new Date(),
          reviewedAt: null,
        }),
      ];

      const extractions = [
        Extraction.reconstitute({
          id: 'ext-1',
          documentId: 'doc-1',
          fields: new Map([
            ['field1', FieldValue.create('field1', 'value1', Confidence.create(0.9))],
          ]),
          overallConfidence: Confidence.create(0.9),
          extractedAt: new Date(),
          correctedAt: null,
        }),
        Extraction.reconstitute({
          id: 'ext-2',
          documentId: 'doc-2',
          fields: new Map([
            ['field1', FieldValue.create('field1', 'value1', Confidence.create(0.6))],
          ]),
          overallConfidence: Confidence.create(0.6),
          extractedAt: new Date(),
          correctedAt: null,
        }),
      ];

      documentRepository.findAll.mockResolvedValue(documents);
      correctionRepository.findAll.mockResolvedValue([]);
      extractionRepository.findAllByDocumentIds.mockResolvedValue(extractions);

      const result = await useCase.execute({});

      expect(result.extraction.averageConfidence).toBeCloseTo(0.75, 1);
      expect(result.extraction.confidenceDistribution.high).toBeCloseTo(0.5, 1);
      expect(result.extraction.confidenceDistribution.medium).toBeCloseTo(0.5, 1);
    });

    it('should calculate operational metrics including latency percentiles', async () => {
      const documents = [
        Document.reconstitute({
          id: 'doc-1',
          fileName: 'test1.pdf',
          filePath: 'uploads/test1.pdf',
          fileSize: 1024,
          status: 'completed',
          type: DocumentType.fromString('bank_statement'),
          classificationConfidence: Confidence.create(0.95),
          uploadedAt: new Date('2025-01-01T00:00:00'),
          processedAt: new Date('2025-01-01T00:00:01'),
          reviewedAt: null,
        }),
        Document.reconstitute({
          id: 'doc-2',
          fileName: 'test2.pdf',
          filePath: 'uploads/test2.pdf',
          fileSize: 1024,
          status: 'completed',
          type: DocumentType.fromString('w9'),
          classificationConfidence: Confidence.create(0.90),
          uploadedAt: new Date('2025-01-01T00:00:00'),
          processedAt: new Date('2025-01-01T00:00:02'),
          reviewedAt: null,
        }),
      ];

      documentRepository.findAll.mockResolvedValue(documents);
      correctionRepository.findAll.mockResolvedValue([]);
      extractionRepository.findAllByDocumentIds.mockResolvedValue([]);

      const result = await useCase.execute({});

      expect(result.operational.averageProcessingTimeMs).toBeGreaterThan(0);
      expect(result.operational.p50ProcessingTimeMs).toBeGreaterThan(0);
      expect(result.operational.p95ProcessingTimeMs).toBeGreaterThan(0);
      expect(result.operational.p99ProcessingTimeMs).toBeGreaterThan(0);
      expect(result.operational.totalDocumentsProcessed).toBe(2);
    });

    it('should calculate review rate correctly', async () => {
      const documents = [
        Document.reconstitute({
          id: 'doc-1',
          fileName: 'test1.pdf',
          filePath: 'uploads/test1.pdf',
          fileSize: 1024,
          status: DocumentStatus.NEEDS_REVIEW,
          type: DocumentType.fromString('bank_statement'),
          classificationConfidence: Confidence.create(0.55),
          uploadedAt: new Date(),
          processedAt: new Date(),
          reviewedAt: null,
        }),
        Document.reconstitute({
          id: 'doc-2',
          fileName: 'test2.pdf',
          filePath: 'uploads/test2.pdf',
          fileSize: 1024,
          status: 'completed',
          type: DocumentType.fromString('w9'),
          classificationConfidence: Confidence.create(0.95),
          uploadedAt: new Date(),
          processedAt: new Date(),
          reviewedAt: null,
        }),
      ];

      documentRepository.findAll.mockResolvedValue(documents);
      correctionRepository.findAll.mockResolvedValue([]);
      extractionRepository.findAllByDocumentIds.mockResolvedValue([]);

      const result = await useCase.execute({});

      expect(result.operational.documentsNeedingReview).toBe(1);
      expect(result.operational.reviewRate).toBe(0.5);
    });

    it('should calculate cost metrics', async () => {
      const documents = Array.from({ length: 10 }, (_, i) =>
        Document.reconstitute({
          id: `doc-${i}`,
          fileName: `test${i}.pdf`,
          filePath: `uploads/test${i}.pdf`,
          fileSize: 1024,
          status: 'completed',
          type: DocumentType.fromString('bank_statement'),
          classificationConfidence: Confidence.create(0.95),
          uploadedAt: new Date(),
          processedAt: new Date(),
          reviewedAt: null,
        })
      );

      documentRepository.findAll.mockResolvedValue(documents);
      correctionRepository.findAll.mockResolvedValue([]);
      extractionRepository.findAllByDocumentIds.mockResolvedValue([]);

      const result = await useCase.execute({});

      expect(result.operational.totalCost).toBeGreaterThan(0);
      expect(result.operational.averageCostPerDocument).toBeGreaterThan(0);
      expect(result.operational.totalCost).toBe(
        result.operational.averageCostPerDocument * documents.length
      );
    });

    it('should calculate learning impact metrics', async () => {
      const documents = [
        Document.reconstitute({
          id: 'doc-1',
          fileName: 'test1.pdf',
          filePath: 'uploads/test1.pdf',
          fileSize: 1024,
          status: 'reviewed',
          type: DocumentType.fromString('w9'),
          classificationConfidence: Confidence.create(0.75),
          uploadedAt: new Date(),
          processedAt: new Date(),
          reviewedAt: new Date(),
        }),
      ];

      const corrections = [
        Correction.reconstitute({
          id: 'corr-1',
          documentId: 'doc-1',
          extractionId: 'ext-1',
          originalType: DocumentType.fromString('bank_statement'),
          correctedType: DocumentType.fromString('w9'),
          fieldCorrections: [],
          correctedBy: 'user@example.com',
          correctedAt: new Date(),
          notes: null,
        }),
      ];

      documentRepository.findAll.mockResolvedValue(documents);
      correctionRepository.findAll.mockResolvedValue(corrections);
      extractionRepository.findAllByDocumentIds.mockResolvedValue([]);

      const result = await useCase.execute({});

      expect(result.learningImpact.totalCorrections).toBe(1);
      expect(result.learningImpact.accuracyBeforeCorrections).toBeGreaterThan(0);
      expect(result.learningImpact.accuracyAfterCorrections).toBeGreaterThan(0);
      expect(result.learningImpact.improvementPercentage).toBeGreaterThan(0);
    });

    it('should respect date range filters', async () => {
      const fromDate = new Date('2025-01-01');
      const toDate = new Date('2025-01-31');

      documentRepository.findAll.mockResolvedValue([]);
      correctionRepository.findAll.mockResolvedValue([]);
      extractionRepository.findAllByDocumentIds.mockResolvedValue([]);

      const result = await useCase.execute({ fromDate, toDate });

      expect(correctionRepository.findAll).toHaveBeenCalledWith({
        fromDate,
        toDate,
      });
      expect(result.periodStart).toEqual(fromDate);
      expect(result.periodEnd).toEqual(toDate);
    });

    it('should use default dates when not provided', async () => {
      documentRepository.findAll.mockResolvedValue([]);
      correctionRepository.findAll.mockResolvedValue([]);
      extractionRepository.findAllByDocumentIds.mockResolvedValue([]);

      const result = await useCase.execute({});

      expect(result.periodStart).toBeInstanceOf(Date);
      expect(result.periodEnd).toBeInstanceOf(Date);
      expect(result.calculatedAt).toBeInstanceOf(Date);
    });

    it('should handle empty extractions gracefully', async () => {
      const documents = [
        Document.reconstitute({
          id: 'doc-1',
          fileName: 'test1.pdf',
          filePath: 'uploads/test1.pdf',
          fileSize: 1024,
          status: 'completed',
          type: DocumentType.fromString('bank_statement'),
          classificationConfidence: Confidence.create(0.95),
          uploadedAt: new Date(),
          processedAt: new Date(),
          reviewedAt: null,
        }),
      ];

      documentRepository.findAll.mockResolvedValue(documents);
      correctionRepository.findAll.mockResolvedValue([]);
      extractionRepository.findAllByDocumentIds.mockResolvedValue([]);

      const result = await useCase.execute({});

      expect(result.extraction.averageConfidence).toBe(0);
      expect(result.extraction.confidenceDistribution.high).toBe(0);
    });
  });
});
