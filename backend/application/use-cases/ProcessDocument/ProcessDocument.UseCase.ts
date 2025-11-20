import { Document } from '@/backend/domain/entities/Document.Entity';
import { Extraction } from '@/backend/domain/entities/Extraction.Entity';
import { DocumentType } from '@/backend/domain/value-objects/DocumentType.ValueObject';
import { FieldValue } from '@/backend/domain/value-objects/FieldValue.ValueObject';
import type { DocumentRepository } from '@/backend/application/ports/DocumentRepository';
import type { ExtractionRepository } from '@/backend/application/ports/ExtractionRepository';
import type { ClassifierService } from '@/backend/application/ports/ClassifierService';
import type { ExtractorService } from '@/backend/application/ports/ExtractorService';
import type { StorageService } from '@/backend/application/ports/StorageService';
import type { ProcessDocumentDTO } from './ProcessDocument.DTO';
import type { ProcessDocumentResponse, ExtractedField } from './ProcessDocument.Response';
import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';
import { v4 as uuidv4 } from 'uuid';

export class ProcessDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly extractionRepository: ExtractionRepository,
    private readonly classifierService: ClassifierService,
    private readonly extractorService: ExtractorService,
    private readonly storageService: StorageService
  ) {}

  async execute(dto: ProcessDocumentDTO): Promise<ProcessDocumentResponse> {
    const startTime = Date.now();

    const filePath = await this.storageService.save(dto.fileBuffer, dto.fileName);

    const classificationResult = await this.classifierService.classify(
      dto.fileBuffer,
      dto.fileName
    );

    const documentType = DocumentType.fromString(classificationResult.documentType);
    const classificationConfidence = classificationResult.confidence;

    const fileSize = dto.fileBuffer.length;
    const document = Document.create(
      uuidv4(),
      dto.fileName,
      filePath,
      fileSize
    );

    document.classify(documentType, classificationConfidence);

    const extractionResult = await this.extractorService.extract(
      dto.fileBuffer,
      classificationResult.documentType,
      dto.fileName
    );

    const extraction = Extraction.create(
      uuidv4(),
      document.getId(),
      extractionResult.fields
    );

    const defaultThreshold = 0.7;
    if (document.requiresReview(defaultThreshold)) {
      document.markAsNeedsReview();
    } else {
      document.markAsCompleted();
    }

    await this.documentRepository.save(document);
    await this.extractionRepository.save(extraction);

    const processingTimeMs = Date.now() - startTime;

    return this.buildResponse(
      document,
      extraction,
      processingTimeMs,
      defaultThreshold
    );
  }

  private buildResponse(
    document: Document,
    extraction: Extraction,
    processingTimeMs: number,
    threshold: number
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
      requiresReview: document.requiresReview(threshold),
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
}
