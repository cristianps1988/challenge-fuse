import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/backend/infrastructure/di/container';
import { logger } from '@/backend/infrastructure/logger';
import type { DocumentStatusValue } from '@/backend/domain/document-status.constants';
import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';
import { getEnv } from '@/backend/infrastructure/config/env';

const { MAX_FILE_SIZE_MB } = getEnv();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    logger.info('Fetching documents', { status, type, limit, offset });

    const documentRepository = container.getDocumentRepository();
    const documents = await documentRepository.findAll({
      status: status as DocumentStatusValue | undefined,
      type: type as DocumentTypeValue | undefined,
      limit,
      offset,
    });

    const total = await documentRepository.count({
      status: status as DocumentStatusValue | undefined,
      type: type as DocumentTypeValue | undefined,
    });

    return NextResponse.json({
      documents: documents.map((doc) => ({
        id: doc.getId(),
        fileName: doc.getFileName(),
        filePath: doc.getFilePath(),
        fileSize: doc.getFileSize(),
        status: doc.getStatus(),
        documentType: doc.getType()?.getValue(),
        classificationConfidence: doc.getClassificationConfidence()?.getValue(),
        createdAt: doc.getUploadedAt().toISOString(),
        processedAt: doc.getProcessedAt()?.toISOString(),
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch documents', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    const maxSize = parseInt(MAX_FILE_SIZE_MB || '10') * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE_MB || '10'}MB limit` },
        { status: 400 }
      );
    }

    logger.info('Processing document upload', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    const useCase = container.getProcessDocumentUseCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await useCase.execute({
      fileName: file.name,
      fileBuffer: buffer,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    logger.error('Failed to process document', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
