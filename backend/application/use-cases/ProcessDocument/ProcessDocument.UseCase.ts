import { Document } from '@/backend/domain/entities/Document.Entity';
import { Extraction } from '@/backend/domain/entities/Extraction.Entity';
import { DocumentType } from '@/backend/domain/value-objects/DocumentType.ValueObject';
import { FieldValue } from '@/backend/domain/value-objects/FieldValue.ValueObject';
import { ConfidenceCalibratorService } from '@/backend/domain/services/ConfidenceCalibrator.Service';
import type { DocumentRepository } from '@/backend/application/ports/DocumentRepository';
import type { ExtractionRepository } from '@/backend/application/ports/ExtractionRepository';
import type { ClassifierService } from '@/backend/application/ports/ClassifierService';
import type { ExtractorService } from '@/backend/application/ports/ExtractorService';
import type { StorageService } from '@/backend/application/ports/StorageService';
import type { ThresholdRepository } from '@/backend/application/ports/ThresholdRepository';
import type { ProcessDocumentDTO } from './ProcessDocument.DTO';
import type { ProcessDocumentResponse, ExtractedField } from './ProcessDocument.Response';
import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';
import { loadSchema } from '@/backend/domain/schemas';
import { logger } from '@/backend/infrastructure/logger';
import { v4 as uuidv4 } from 'uuid';

export class ProcessDocumentUseCase {
  private readonly confidenceCalibrator: ConfidenceCalibratorService;

  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly extractionRepository: ExtractionRepository,
    private readonly classifierService: ClassifierService,
    private readonly extractorService: ExtractorService,
    private readonly storageService: StorageService,
    private readonly thresholdRepository: ThresholdRepository
  ) {
    this.confidenceCalibrator = new ConfidenceCalibratorService();
  }

  async execute(dto: ProcessDocumentDTO): Promise<ProcessDocumentResponse> {
    const startTime = Date.now();

    const filePath = await this.storageService.save(dto.fileBuffer, dto.fileName);

    const classificationResult = await this.classifierService.classify(
      dto.fileBuffer,
      dto.fileName
    );

    const documentType = DocumentType.fromString(classificationResult.documentType);
    const classificationConfidence = classificationResult.confidence;

    const classificationThreshold = await this.thresholdRepository.findClassificationThreshold();

    const fileSize = dto.fileBuffer.length;
    const document = Document.create(
      uuidv4(),
      dto.fileName,
      filePath,
      fileSize
    );

    document.classify(documentType, classificationConfidence, classificationThreshold);

    if (document.getStatus() === 'rejected') {
      await this.documentRepository.save(document);
      return this.buildRejectedResponse(document);
    }

    const extractionResult = await this.extractorService.extract(
      dto.fileBuffer,
      classificationResult.documentType,
      dto.fileName
    );

    const schema = loadSchema(classificationResult.documentType);
    const calibrationResult = this.confidenceCalibrator.calibrateExtraction(
      extractionResult.fields,
      classificationResult.documentType,
      schema
    );

    logger.info('Confidence calibration completed', {
      documentId: document.getId(),
      originalConfidence: extractionResult.overallConfidence,
      calibratedConfidence: calibrationResult.overallConfidence.getValue(),
      failedValidations: calibrationResult.calibrationDetails.failedValidations.length,
      criticalFieldsConfidence: calibrationResult.calibrationDetails.criticalFieldsConfidence,
    });

    const extraction = Extraction.create(
      uuidv4(),
      document.getId(),
      calibrationResult.calibratedFields
    );

    const extractionThreshold = await this.thresholdRepository.findByType(classificationResult.documentType);
    const effectiveExtractionThreshold = extractionThreshold ?? 0.85;

    logger.debug('Applying thresholds', {
      documentId: document.getId(),
      documentType: classificationResult.documentType,
      classificationThreshold,
      extractionThreshold: effectiveExtractionThreshold,
      classificationConfidence: document.getClassificationConfidence()?.getValue(),
      extractionConfidence: calibrationResult.overallConfidence.getValue(),
      criticalFieldsConfidence: calibrationResult.calibrationDetails.criticalFieldsConfidence,
    });

    const extractionBelowThreshold = calibrationResult.overallConfidence.getValue() < effectiveExtractionThreshold;
    const criticalFieldsBelowThreshold = this.confidenceCalibrator.hasCriticalFieldsBelowThreshold(
      calibrationResult.calibratedFields,
      classificationResult.documentType,
      effectiveExtractionThreshold
    );

    if (extractionBelowThreshold || criticalFieldsBelowThreshold) {
      document.markAsNeedsReview();

      const reasons = [];
      if (extractionBelowThreshold) reasons.push('extraction confidence below threshold');
      if (criticalFieldsBelowThreshold) reasons.push('critical fields below threshold');

      logger.info('Document marked for review', {
        documentId: document.getId(),
        reasons,
        extractionThreshold: effectiveExtractionThreshold,
      });
    } else {
      document.markAsCompleted();
      logger.info('Document auto-approved', {
        documentId: document.getId(),
        extractionThreshold: effectiveExtractionThreshold,
      });
    }

    await this.documentRepository.save(document);
    await this.extractionRepository.save(extraction);

    const processingTimeMs = Date.now() - startTime;

    return this.buildResponse(
      document,
      extraction,
      processingTimeMs,
      classificationThreshold
    );
  }

  private buildResponse(
    document: Document,
    extraction: Extraction,
    processingTimeMs: number,
    classificationThreshold: number
  ): ProcessDocumentResponse {
    const extractedFields: ExtractedField[] = this.mapFields(extraction.getFields());

    const documentType = document.getType();
    const classificationConfidence = document.getClassificationConfidence();

    return {
      documentId: document.getId(),
      fileName: document.getFileName(),
      filePath: document.getFilePath(),
      documentType: (documentType?.getValue() ?? 'bank_statement') as DocumentTypeValue,
      classificationConfidence: classificationConfidence?.getValue() ?? 0,
      status: document.getStatus(),
      extractedFields,
      overallExtractionConfidence: extraction.getOverallConfidence().getValue(),
      processingTimeMs,
      requiresReview: document.requiresReview(classificationThreshold),
      createdAt: document.getUploadedAt(),
    };
  }

  private mapFields(fields: Map<string, FieldValue>): ExtractedField[] {
    return Array.from(fields.entries()).map(([name, fieldValue]) => ({
      name,
      value: fieldValue.getValue(),
      confidence: fieldValue.getConfidence().getValue(),
      valueType: this.inferValueType(fieldValue.getValue()),
    }));
  }

  private inferValueType(
    value: string | number | boolean | null
  ): 'string' | 'number' | 'boolean' | 'date' {
    if (typeof value === 'number') {
      return 'number';
    }
    if (typeof value === 'boolean') {
      return 'boolean';
    }
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return 'date';
    }
    return 'string';
  }

  private buildRejectedResponse(document: Document): ProcessDocumentResponse {
    const documentType = document.getType();
    const classificationConfidence = document.getClassificationConfidence();

    return {
      documentId: document.getId(),
      fileName: document.getFileName(),
      filePath: document.getFilePath(),
      documentType: (documentType?.getValue() ?? 'unknown') as DocumentTypeValue,
      classificationConfidence: classificationConfidence?.getValue() ?? 0,
      status: document.getStatus(),
      extractedFields: [],
      overallExtractionConfidence: 0,
      processingTimeMs: 0,
      requiresReview: false,
      createdAt: document.getUploadedAt(),
    };
  }
}
