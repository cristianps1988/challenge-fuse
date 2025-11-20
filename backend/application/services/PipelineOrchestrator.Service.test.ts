import { PipelineOrchestratorService } from './PipelineOrchestrator.Service';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import { FieldValue } from '@/backend/domain/value-objects/FieldValue.ValueObject';
import type { ClassifierService, ClassificationResult } from '@/backend/application/ports/ClassifierService';
import type { ExtractorService, ExtractionResult } from '@/backend/application/ports/ExtractorService';

describe('PipelineOrchestratorService', () => {
  let service: PipelineOrchestratorService;
  let classifierService: jest.Mocked<ClassifierService>;
  let extractorService: jest.Mocked<ExtractorService>;

  beforeEach(() => {
    classifierService = {
      classify: jest.fn(),
    };

    extractorService = {
      extract: jest.fn(),
    };

    service = new PipelineOrchestratorService(classifierService, extractorService);
  });

  describe('process', () => {
    it('should successfully process a document through classification and extraction', async () => {
      const fileBuffer = Buffer.from('test file content');
      const fileName = 'test-document.pdf';

      const classificationResult: ClassificationResult = {
        documentType: 'bank_statement',
        confidence: Confidence.create(0.95),
        reasoning: 'Clear bank statement format',
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

      classifierService.classify.mockResolvedValue(classificationResult);
      extractorService.extract.mockResolvedValue(extractionResult);

      const result = await service.process(fileBuffer, fileName);

      expect(result.classification).toEqual(classificationResult);
      expect(result.extraction).toEqual(extractionResult);
      expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);

      expect(classifierService.classify).toHaveBeenCalledWith(fileBuffer, fileName);
      expect(extractorService.extract).toHaveBeenCalledWith(
        fileBuffer,
        'bank_statement',
        fileName
      );
    });

    it('should measure total processing time', async () => {
      const fileBuffer = Buffer.from('test');
      const fileName = 'test.pdf';

      const classificationResult: ClassificationResult = {
        documentType: 'w9',
        confidence: Confidence.create(0.85),
      };

      const extractionResult: ExtractionResult = {
        fields: new Map(),
        overallConfidence: 0.8,
        processingTimeMs: 1000,
      };

      classifierService.classify.mockResolvedValue(classificationResult);
      extractorService.extract.mockResolvedValue(extractionResult);

      const startTime = Date.now();
      const result = await service.process(fileBuffer, fileName);
      const endTime = Date.now();

      expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.totalTimeMs).toBeLessThanOrEqual(endTime - startTime + 10);
    });

    it('should propagate classification errors', async () => {
      const fileBuffer = Buffer.from('test');
      const fileName = 'test.pdf';

      const classificationError = new Error('Classification service unavailable');
      classifierService.classify.mockRejectedValue(classificationError);

      await expect(service.process(fileBuffer, fileName)).rejects.toThrow(
        'Classification service unavailable'
      );

      expect(extractorService.extract).not.toHaveBeenCalled();
    });

    it('should propagate extraction errors', async () => {
      const fileBuffer = Buffer.from('test');
      const fileName = 'test.pdf';

      const classificationResult: ClassificationResult = {
        documentType: 'w9',
        confidence: Confidence.create(0.85),
      };

      classifierService.classify.mockResolvedValue(classificationResult);

      const extractionError = new Error('Extraction service failed');
      extractorService.extract.mockRejectedValue(extractionError);

      await expect(service.process(fileBuffer, fileName)).rejects.toThrow(
        'Extraction service failed'
      );
    });
  });

  describe('processWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const fileBuffer = Buffer.from('test');
      const fileName = 'test.pdf';

      const classificationResult: ClassificationResult = {
        documentType: 'w9',
        confidence: Confidence.create(0.85),
      };

      const extractionResult: ExtractionResult = {
        fields: new Map(),
        overallConfidence: 0.8,
        processingTimeMs: 1000,
      };

      classifierService.classify.mockResolvedValue(classificationResult);
      extractorService.extract.mockResolvedValue(extractionResult);

      const result = await service.processWithRetry(fileBuffer, fileName, 3);

      expect(result.classification).toEqual(classificationResult);
      expect(result.extraction).toEqual(extractionResult);
      expect(classifierService.classify).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient failures and eventually succeed', async () => {
      const fileBuffer = Buffer.from('test');
      const fileName = 'test.pdf';

      const classificationResult: ClassificationResult = {
        documentType: 'w9',
        confidence: Confidence.create(0.85),
      };

      const extractionResult: ExtractionResult = {
        fields: new Map(),
        overallConfidence: 0.8,
        processingTimeMs: 1000,
      };

      classifierService.classify
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(classificationResult);

      extractorService.extract.mockResolvedValue(extractionResult);

      const result = await service.processWithRetry(fileBuffer, fileName, 3);

      expect(result.classification).toEqual(classificationResult);
      expect(classifierService.classify).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries exceeded', async () => {
      const fileBuffer = Buffer.from('test');
      const fileName = 'test.pdf';

      const error = new Error('Persistent failure');
      classifierService.classify.mockRejectedValue(error);

      await expect(service.processWithRetry(fileBuffer, fileName, 3)).rejects.toThrow(
        'Persistent failure'
      );

      expect(classifierService.classify).toHaveBeenCalledTimes(3);
    });

    it('should apply exponential backoff between retries', async () => {
      const fileBuffer = Buffer.from('test');
      const fileName = 'test.pdf';

      classifierService.classify.mockRejectedValue(new Error('Failure'));

      const startTime = Date.now();

      await expect(service.processWithRetry(fileBuffer, fileName, 3)).rejects.toThrow();

      const endTime = Date.now();
      const elapsedTime = endTime - startTime;

      expect(elapsedTime).toBeGreaterThanOrEqual(1000 + 2000);
    });

    it('should use default maxRetries of 3', async () => {
      const fileBuffer = Buffer.from('test');
      const fileName = 'test.pdf';

      classifierService.classify.mockRejectedValue(new Error('Failure'));

      await expect(service.processWithRetry(fileBuffer, fileName)).rejects.toThrow();

      expect(classifierService.classify).toHaveBeenCalledTimes(3);
    });

    it('should cap backoff time at 10 seconds', async () => {
      const fileBuffer = Buffer.from('test');
      const fileName = 'test.pdf';

      classifierService.classify.mockRejectedValue(new Error('Failure'));

      const startTime = Date.now();

      await expect(service.processWithRetry(fileBuffer, fileName, 5)).rejects.toThrow();

      const endTime = Date.now();
      const elapsedTime = endTime - startTime;

      expect(elapsedTime).toBeLessThan(40000);
    }, 60000);

    it('should handle extraction errors during retry', async () => {
      const fileBuffer = Buffer.from('test');
      const fileName = 'test.pdf';

      const classificationResult: ClassificationResult = {
        documentType: 'w9',
        confidence: Confidence.create(0.85),
      };

      classifierService.classify.mockResolvedValue(classificationResult);
      extractorService.extract
        .mockRejectedValueOnce(new Error('Extraction failed'))
        .mockRejectedValueOnce(new Error('Extraction failed'))
        .mockResolvedValueOnce({
          fields: new Map(),
          overallConfidence: 0.8,
          processingTimeMs: 1000,
        });

      const result = await service.processWithRetry(fileBuffer, fileName, 3);

      expect(result.classification).toEqual(classificationResult);
      expect(extractorService.extract).toHaveBeenCalledTimes(3);
    });
  });
});
