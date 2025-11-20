import { DocumentNotFoundError } from '@/backend/domain/errors/Domain.Error';
import type { DocumentRepository } from '@/backend/application/ports/DocumentRepository';
import type { ExtractionRepository } from '@/backend/application/ports/ExtractionRepository';
import type { CorrectionRepository } from '@/backend/application/ports/CorrectionRepository';
import type { GetDocumentDTO } from './GetDocument.DTO';
import type { GetDocumentResponse, ExtractedFieldResponse, CorrectionResponse } from './GetDocument.Response';
import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';

export class GetDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly extractionRepository: ExtractionRepository,
    private readonly correctionRepository: CorrectionRepository
  ) {}

  async execute(dto: GetDocumentDTO): Promise<GetDocumentResponse> {
    const document = await this.documentRepository.findById(dto.documentId);

    if (!document) {
      throw new DocumentNotFoundError(`Document with id ${dto.documentId} not found`);
    }

    const extraction = await this.extractionRepository.findByDocumentId(dto.documentId);
    const corrections = await this.correctionRepository.findByDocumentId(dto.documentId);

    const extractedFields: ExtractedFieldResponse[] = extraction
      ? Array.from(extraction.getFields().entries()).map(([name, fieldValue]) => ({
          name,
          value: fieldValue.getValue(),
          confidence: fieldValue.getConfidence().getValue(),
          valueType: this.inferValueType(fieldValue.getValue()),
        }))
      : [];

    const correctionResponses: CorrectionResponse[] = corrections.map((correction) => {
      const correctedFieldsMap: Record<string, string | number | boolean | null> = {};
      correction.getFieldCorrections().forEach((fc) => {
        correctedFieldsMap[fc.fieldName] = fc.correctedValue;
      });

      return {
        id: correction.getId(),
        correctedType: correction.getCorrectedType()?.getValue(),
        correctedFields: correctedFieldsMap,
        correctedBy: correction.getCorrectedBy(),
        correctedAt: correction.getCorrectedAt(),
        notes: correction.getNotes() ?? undefined,
      };
    });

    return {
      id: document.getId(),
      fileName: document.getFileName(),
      filePath: document.getFilePath(),
      documentType: (document.getType()?.getValue() ?? 'bank_statement') as DocumentTypeValue,
      classificationConfidence: document.getClassificationConfidence()?.getValue() ?? 0,
      status: document.getStatus(),
      extractedFields,
      overallExtractionConfidence: extraction?.getOverallConfidence().getValue() ?? 0,
      corrections: correctionResponses,
      createdAt: document.getUploadedAt(),
      processedAt: document.getProcessedAt() ?? undefined,
      reviewedAt: document.getReviewedAt() ?? undefined,
    };
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
