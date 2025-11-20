import type { ProcessDocumentUseCase } from '@/backend/application/use-cases/ProcessDocument/ProcessDocument.UseCase';
import type { GetDocumentUseCase } from '@/backend/application/use-cases/GetDocument/GetDocument.UseCase';
import type { CorrectDocumentUseCase } from '@/backend/application/use-cases/CorrectDocument/CorrectDocument.UseCase';
import type { ProcessDocumentDTO } from '@/backend/application/use-cases/ProcessDocument/ProcessDocument.DTO';
import type { GetDocumentDTO } from '@/backend/application/use-cases/GetDocument/GetDocument.DTO';
import type { CorrectDocumentDTO } from '@/backend/application/use-cases/CorrectDocument/CorrectDocument.DTO';
import { logger } from '@/backend/infrastructure/logger';

export class DocumentController {
  constructor(
    private readonly processDocumentUseCase: ProcessDocumentUseCase,
    private readonly getDocumentUseCase: GetDocumentUseCase,
    private readonly correctDocumentUseCase: CorrectDocumentUseCase
  ) {}

  async uploadAndProcess(dto: ProcessDocumentDTO): Promise<Response> {
    try {
      logger.info('Processing document upload request', {
        fileName: dto.fileName,
        fileSize: dto.fileBuffer.length,
      });

      const result = await this.processDocumentUseCase.execute(dto);

      return new Response(JSON.stringify(result), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      logger.error('Document upload failed', {
        fileName: dto.fileName,
        error: error instanceof Error ? error.message : String(error),
      });

      return new Response(
        JSON.stringify({
          error: 'Document processing failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  async getDocument(dto: GetDocumentDTO): Promise<Response> {
    try {
      logger.info('Getting document', { documentId: dto.documentId });

      const result = await this.getDocumentUseCase.execute(dto);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      logger.error('Failed to get document', {
        documentId: dto.documentId,
        error: error instanceof Error ? error.message : String(error),
      });

      const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;

      return new Response(
        JSON.stringify({
          error: 'Failed to get document',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  async correctDocument(dto: CorrectDocumentDTO): Promise<Response> {
    try {
      logger.info('Correcting document', {
        documentId: dto.documentId,
        hasTypeCorrection: !!dto.correctedType,
        fieldCorrectionsCount: dto.correctedFields ? Object.keys(dto.correctedFields).length : 0,
      });

      const result = await this.correctDocumentUseCase.execute(dto);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      logger.error('Failed to correct document', {
        documentId: dto.documentId,
        error: error instanceof Error ? error.message : String(error),
      });

      return new Response(
        JSON.stringify({
          error: 'Failed to correct document',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
}
