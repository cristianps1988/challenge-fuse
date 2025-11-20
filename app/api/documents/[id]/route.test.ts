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
import { GET } from './route';
import { container } from '@/backend/infrastructure/di/container';
import { logger } from '@/backend/infrastructure/logger';

describe('GET /api/documents/[id]', () => {
  let mockUseCase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCase = {
      execute: jest.fn(),
    };
    (container.getGetDocumentUseCase as jest.Mock).mockReturnValue(mockUseCase);
  });

  it('should return document details', async () => {
    const mockResponse = {
      id: 'doc-1',
      fileName: 'test.pdf',
      filePath: '/path/to/test.pdf',
      documentType: 'bank_statement',
      classificationConfidence: 0.95,
      status: 'processed',
      extractedFields: [],
      overallExtractionConfidence: 0.9,
      corrections: [],
      createdAt: new Date('2024-01-01'),
      processedAt: new Date('2024-01-01'),
    };

    mockUseCase.execute.mockResolvedValue(mockResponse);

    const url = new URL('http://localhost/api/documents/doc-1');
    const request = new NextRequest(url);

    const response = await GET(request, { params: { id: 'doc-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('doc-1');
    expect(data.fileName).toBe('test.pdf');
    expect(mockUseCase.execute).toHaveBeenCalledWith({ documentId: 'doc-1' });
    expect(logger.info).toHaveBeenCalledWith('Fetching document', { documentId: 'doc-1' });
  });

  it('should return 404 when document is not found', async () => {
    const error = new Error('Document not found');
    mockUseCase.execute.mockRejectedValue(error);

    const url = new URL('http://localhost/api/documents/non-existent');
    const request = new NextRequest(url);

    const response = await GET(request, { params: { id: 'non-existent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Document not found');
    expect(logger.error).toHaveBeenCalled();
  });

  it('should return 500 on other errors', async () => {
    const error = new Error('Database error');
    mockUseCase.execute.mockRejectedValue(error);

    const url = new URL('http://localhost/api/documents/doc-1');
    const request = new NextRequest(url);

    const response = await GET(request, { params: { id: 'doc-1' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch document');
    expect(logger.error).toHaveBeenCalled();
  });
});

