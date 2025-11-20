import { DocumentNotFoundError, ExtractionNotFoundError } from '@/backend/domain/errors/Domain.Error';
import { Correction } from '@/backend/domain/entities/Correction.Entity';
import { DocumentType } from '@/backend/domain/value-objects/DocumentType.ValueObject';
import type { DocumentRepository } from '@/backend/application/ports/DocumentRepository';
import type { ExtractionRepository } from '@/backend/application/ports/ExtractionRepository';
import type { CorrectionRepository } from '@/backend/application/ports/CorrectionRepository';
import type { CorrectDocumentDTO } from './CorrectDocument.DTO';
import type { CorrectDocumentResponse } from './CorrectDocument.Response';
import { v4 as uuidv4 } from 'uuid';

export class CorrectDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly extractionRepository: ExtractionRepository,
    private readonly correctionRepository: CorrectionRepository
  ) {}

  async execute(dto: CorrectDocumentDTO): Promise<CorrectDocumentResponse> {
    const document = await this.documentRepository.findById(dto.documentId);

    if (!document) {
      throw new DocumentNotFoundError(`Document with id ${dto.documentId} not found`);
    }

    const extraction = await this.extractionRepository.findByDocumentId(dto.documentId);

    if (!extraction) {
      throw new ExtractionNotFoundError(`Extraction for document ${dto.documentId} not found`);
    }

    const correctedType = dto.correctedType
      ? DocumentType.fromString(dto.correctedType)
      : null;

    const fieldCorrections = dto.correctedFields
      ? Object.entries(dto.correctedFields).map(([fieldName, correctedValue]) => {
          const originalField = extraction.getField(fieldName);
          return {
            fieldName,
            originalValue: originalField?.getValue() ?? null,
            correctedValue,
          };
        })
      : [];

    const correction = Correction.create(
      uuidv4(),
      dto.documentId,
      extraction.getId(),
      document.getType(),
      correctedType,
      fieldCorrections,
      dto.correctedBy,
      dto.notes ?? null
    );

    if (correctedType && document.getClassificationConfidence()) {
      document.changeType(correctedType);
    }

    if (dto.correctedFields) {
      for (const [fieldName, fieldValue] of Object.entries(dto.correctedFields)) {
        extraction.updateField(fieldName, fieldValue);
      }
    }

    document.markAsReviewed();

    await this.correctionRepository.save(correction);
    await this.documentRepository.update(document);
    await this.extractionRepository.update(extraction);

    return {
      correctionId: correction.getId(),
      documentId: dto.documentId,
      correctedAt: correction.getCorrectedAt(),
      success: true,
      message: 'Document corrected successfully',
    };
  }
}
