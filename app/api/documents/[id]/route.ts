import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/backend/infrastructure/di/container';
import { logger } from '@/backend/infrastructure/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    logger.info('Fetching document', { documentId: id });

    const useCase = container.getGetDocumentUseCase();
    const result = await useCase.execute({ documentId: id });

    return NextResponse.json(result);
  } catch (error) {
    const { id: documentId } = await params;
    logger.error('Failed to fetch document', {
      documentId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}
