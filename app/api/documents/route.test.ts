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
jest.mock('@/backend/infrastructure/config/env', () => ({
  getEnv: () => ({
    MAX_FILE_SIZE_MB: '10',
  }),
}));

import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { container } from '@/backend/infrastructure/di/container';
import { logger } from '@/backend/infrastructure/logger';

describe('GET /api/documents', () => {
  let mockDocumentRepository: any;
  let mockExtractionRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDocumentRepository = {
      findAll: jest.fn(),
      count: jest.fn(),
    };
    mockExtractionRepository = {
      findAllByDocumentIds: jest.fn().mockResolvedValue([]),
    };
    (container.getDocumentRepository as jest.Mock).mockReturnValue(mockDocumentRepository);
    (container.getExtractionRepository as jest.Mock).mockReturnValue(mockExtractionRepository);
  });

  it('should return documents with default pagination', async () => {
    const mockDocuments = [
      {
        getId: () => 'doc-1',
        getFileName: () => 'test.pdf',
        getFilePath: () => '/path/to/test.pdf',
        getFileSize: () => 1024,
        getStatus: () => 'processed',
        getType: () => ({ getValue: () => 'bank_statement' }),
        getClassificationConfidence: () => ({ getValue: () => 0.95 }),
        getUploadedAt: () => new Date('2024-01-01'),
        getProcessedAt: () => new Date('2024-01-01'),
      },
    ];

    mockDocumentRepository.findAll.mockResolvedValue(mockDocuments);
    mockDocumentRepository.count.mockResolvedValue(1);

    const url = new URL('http://localhost/api/documents');
    const request = new NextRequest(url);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.documents).toHaveLength(1);
    expect(data.documents[0].id).toBe('doc-1');
    expect(data.pagination.total).toBe(1);
    expect(data.pagination.limit).toBe(50);
    expect(data.pagination.offset).toBe(0);
    expect(mockDocumentRepository.findAll).toHaveBeenCalledWith({
      status: undefined,
      type: undefined,
      limit: 50,
      offset: 0,
    });
  });

  it('should filter documents by status and type', async () => {
    mockDocumentRepository.findAll.mockResolvedValue([]);
    mockDocumentRepository.count.mockResolvedValue(0);

    const url = new URL('http://localhost/api/documents?status=processed&type=bank_statement');
    const request = new NextRequest(url);

    await GET(request);

    expect(mockDocumentRepository.findAll).toHaveBeenCalledWith({
      status: 'processed',
      type: 'bank_statement',
      limit: 50,
      offset: 0,
    });
  });

  it('should handle custom pagination parameters', async () => {
    mockDocumentRepository.findAll.mockResolvedValue([]);
    mockDocumentRepository.count.mockResolvedValue(100);

    const url = new URL('http://localhost/api/documents?limit=10&offset=20');
    const request = new NextRequest(url);

    const response = await GET(request);
    const data = await response.json();

    expect(mockDocumentRepository.findAll).toHaveBeenCalledWith({
      status: undefined,
      type: undefined,
      limit: 10,
      offset: 20,
    });
    expect(data.pagination.hasMore).toBe(true);
  });

  it('should return 500 on repository error', async () => {
    const error = new Error('Database error');
    mockDocumentRepository.findAll.mockRejectedValue(error);

    const url = new URL('http://localhost/api/documents');
    const request = new NextRequest(url);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch documents');
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('POST /api/documents', () => {
  let mockUseCase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCase = {
      execute: jest.fn(),
    };
    (container.getProcessDocumentUseCase as jest.Mock).mockReturnValue(mockUseCase);
  });

  it('should process a valid PDF file', async () => {
    const fileContent = Buffer.from('PDF content');
    const file = new File([fileContent], 'test.pdf', { type: 'application/pdf' });

    const formData = new FormData();
    formData.append('file', file);

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

    mockUseCase.execute.mockResolvedValue(mockResponse);

    const url = new URL('http://localhost/api/documents');
    const request = new NextRequest(url, {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.documentId).toBe('doc-1');
    expect(mockUseCase.execute).toHaveBeenCalledWith({
      fileName: 'test.pdf',
      fileBuffer: expect.any(Buffer),
    });
  });

  it('should return 400 when no file is provided', async () => {
    const formData = new FormData();

    const url = new URL('http://localhost/api/documents');
    const request = new NextRequest(url, {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('No file provided');
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('should return 400 when file is not PDF', async () => {
    const fileContent = Buffer.from('text content');
    const file = new File([fileContent], 'test.txt', { type: 'text/plain' });

    const formData = new FormData();
    formData.append('file', file);

    const url = new URL('http://localhost/api/documents');
    const request = new NextRequest(url, {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Only PDF files are supported');
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('should return 400 when file exceeds size limit', async () => {
    const largeContent = Buffer.alloc(11 * 1024 * 1024); // 11MB (exceeds 10MB limit)
    const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });

    const formData = new FormData();
    formData.append('file', file);

    const url = new URL('http://localhost/api/documents');
    const request = new NextRequest(url, {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('exceeds');
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('should return 500 on processing error', async () => {
    const fileContent = Buffer.from('PDF content');
    const file = new File([fileContent], 'test.pdf', { type: 'application/pdf' });

    const formData = new FormData();
    formData.append('file', file);

    const error = new Error('Processing failed');
    mockUseCase.execute.mockRejectedValue(error);

    const url = new URL('http://localhost/api/documents');
    const request = new NextRequest(url, {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to process document');
    expect(logger.error).toHaveBeenCalled();
  });
});

