import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { container } from '@/backend/infrastructure/di/container';
import { logger } from '@/backend/infrastructure/logger';
import { DocumentNotFoundError } from '@/backend/domain/errors/Domain.Error';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: documentId } = await params;
    logger.info('Retrieving PDF file', { documentId });

    const documentRepo = container.getDocumentRepository();
    const document = await documentRepo.findById(documentId);

    if (!document) {
      logger.warn('Document not found for file retrieval', { documentId });
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const filePath = document.getFilePath();

    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${document.getFileName()}"`,
      },
    });
  } catch (error) {
    if (error instanceof DocumentNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    logger.error('Error retrieving PDF file', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Failed to retrieve PDF file' },
      { status: 500 }
    );
  }
}
