/**
 * @jest-environment node
 */
jest.mock('@/backend/infrastructure/di/container');
jest.mock('@/backend/infrastructure/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('@/backend/infrastructure/external-services/openai/client', () => ({
  openai: {},
}));

import { NextRequest } from 'next/server';
import { POST } from './route';
import { container } from '@/backend/infrastructure/di/container';
import { logger } from '@/backend/infrastructure/logger';

describe('POST /api/documents/[id]/process', () => {
  let mockDocumentRepository: any;
  let mockStorageService: any;
  let mockUseCase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDocumentRepository = {
      findById: jest.fn(),
    };
    mockStorageService = {
      retrieve: jest.fn(),
    };
    mockUseCase = {
      execute: jest.fn(),
    };
    (container.getDocumentRepository as jest.Mock).mockReturnValue(mockDocumentRepository);
    (container.getStorageService as jest.Mock).mockReturnValue(mockStorageService);
    (container.getProcessDocumentUseCase as jest.Mock).mockReturnValue(mockUseCase);
  });

  it('should reprocess a document successfully', async () => {
    const mockDocument = {
      getFileName: () => 'test.pdf',
      getFilePath: () => '/path/to/test.pdf',
    };

    const fileBuffer = Buffer.from('PDF content');
    const mockResponse = {
      documentId: 'doc-1',
      fileName: 'test.pdf',
      filePath: '/path/to/test.pdf',
      documentType: 'bank_statement',
      classificationConfidence: 0.95,
      status: 'processed',
      extractedFields: [],
      overallExtractionConfidence: 0.9,
      processingTimeMs: 1000,
      requiresReview: false,
      createdAt: new Date(),
    };

    mockDocumentRepository.findById.mockResolvedValue(mockDocument);
    mockStorageService.retrieve.mockResolvedValue(fileBuffer);
    mockUseCase.execute.mockResolvedValue(mockResponse);

    const url = new URL('http://localhost/api/documents/doc-1/process');
    const request = new NextRequest(url, { method: 'POST' });

    const response = await POST(request, { params: { id: 'doc-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.documentId).toBe('doc-1');
    expect(mockDocumentRepository.findById).toHaveBeenCalledWith('doc-1');
    expect(mockStorageService.retrieve).toHaveBeenCalledWith('/path/to/test.pdf');
    expect(mockUseCase.execute).toHaveBeenCalledWith({
      fileName: 'test.pdf',
      fileBuffer,
    });
    expect(logger.info).toHaveBeenCalledWith('Reprocessing document', { documentId: 'doc-1' });
  });

  it('should return 404 when document is not found', async () => {
    mockDocumentRepository.findById.mockResolvedValue(null);

    const url = new URL('http://localhost/api/documents/non-existent/process');
    const request = new NextRequest(url, { method: 'POST' });

    const response = await POST(request, { params: { id: 'non-existent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Document not found');
    expect(mockStorageService.retrieve).not.toHaveBeenCalled();
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('should return 500 on storage retrieval error', async () => {
    const mockDocument = {
      getFileName: () => 'test.pdf',
      getFilePath: () => '/path/to/test.pdf',
    };

    mockDocumentRepository.findById.mockResolvedValue(mockDocument);
    const error = new Error('Storage error');
    mockStorageService.retrieve.mockRejectedValue(error);

    const url = new URL('http://localhost/api/documents/doc-1/process');
    const request = new NextRequest(url, { method: 'POST' });

    const response = await POST(request, { params: { id: 'doc-1' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to reprocess document');
    expect(logger.error).toHaveBeenCalled();
  });

  it('should return 500 on processing error', async () => {
    const mockDocument = {
      getFileName: () => 'test.pdf',
      getFilePath: () => '/path/to/test.pdf',
    };

    const fileBuffer = Buffer.from('PDF content');
    mockDocumentRepository.findById.mockResolvedValue(mockDocument);
    mockStorageService.retrieve.mockResolvedValue(fileBuffer);
    const error = new Error('Processing failed');
    mockUseCase.execute.mockRejectedValue(error);

    const url = new URL('http://localhost/api/documents/doc-1/process');
    const request = new NextRequest(url, { method: 'POST' });

    const response = await POST(request, { params: { id: 'doc-1' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to reprocess document');
    expect(logger.error).toHaveBeenCalled();
  });
});

