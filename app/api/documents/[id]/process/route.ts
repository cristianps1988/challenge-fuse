import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/backend/infrastructure/di/container';
import { logger } from '@/backend/infrastructure/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    logger.info('Reprocessing document', { documentId: id });

    const documentRepository = container.getDocumentRepository();
    const document = await documentRepository.findById(id);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const storageService = container.getStorageService();
    const fileBuffer = await storageService.retrieve(document.getFilePath());

    const useCase = container.getProcessDocumentUseCase();
    const result = await useCase.execute({
      fileName: document.getFileName(),
      fileBuffer,
    });

    return NextResponse.json(result);
  } catch (error) {
    const { id: documentId } = await params;
    logger.error('Failed to reprocess document', {
      documentId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Failed to reprocess document' },
      { status: 500 }
    );
  }
}
