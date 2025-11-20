import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/backend/infrastructure/di/container';
import { logger } from '@/backend/infrastructure/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const { documentType, fieldCorrections, correctedBy, notes } = body;

    if (!documentType && (!fieldCorrections || Object.keys(fieldCorrections).length === 0)) {
      return NextResponse.json(
        { error: 'Either documentType or fieldCorrections must be provided' },
        { status: 400 }
      );
    }

    if (!correctedBy) {
      return NextResponse.json(
        { error: 'correctedBy is required' },
        { status: 400 }
      );
    }

    logger.info('Applying corrections to document', {
      documentId: id,
      hasTypeCorrection: !!documentType,
      fieldCount: fieldCorrections ? Object.keys(fieldCorrections).length : 0,
      correctedBy,
    });

    const useCase = container.getCorrectDocumentUseCase();
    const result = await useCase.execute({
      documentId: id,
      correctedType: documentType,
      correctedFields: fieldCorrections,
      correctedBy,
      notes,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Failed to apply corrections', {
      documentId: params.id,
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
      { error: 'Failed to apply corrections' },
      { status: 500 }
    );
  }
}
