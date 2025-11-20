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

describe('POST /api/documents/[id]/correct', () => {
  let mockUseCase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCase = {
      execute: jest.fn(),
    };
    (container.getCorrectDocumentUseCase as jest.Mock).mockReturnValue(mockUseCase);
  });

  it('should apply corrections with documentType', async () => {
    const mockResponse = {
      correctionId: 'corr-1',
      documentId: 'doc-1',
      correctedAt: new Date(),
      success: true,
      message: 'Correction applied',
    };

    mockUseCase.execute.mockResolvedValue(mockResponse);

    const body = {
      documentType: 'bank_statement',
      correctedBy: 'user-1',
      notes: 'Updated document type',
    };

    const url = new URL('http://localhost/api/documents/doc-1/correct');
    const request = new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request, { params: { id: 'doc-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.correctionId).toBe('corr-1');
    expect(mockUseCase.execute).toHaveBeenCalledWith({
      documentId: 'doc-1',
      correctedType: 'bank_statement',
      correctedFields: undefined,
      correctedBy: 'user-1',
      notes: 'Updated document type',
    });
  });

  it('should apply corrections with fieldCorrections', async () => {
    const mockResponse = {
      correctionId: 'corr-1',
      documentId: 'doc-1',
      correctedAt: new Date(),
      success: true,
      message: 'Correction applied',
    };

    mockUseCase.execute.mockResolvedValue(mockResponse);

    const body = {
      fieldCorrections: {
        accountNumber: '1234567890',
        balance: 5000.50,
      },
      correctedBy: 'user-1',
    };

    const url = new URL('http://localhost/api/documents/doc-1/correct');
    const request = new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request, { params: { id: 'doc-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.correctionId).toBe('corr-1');
    expect(mockUseCase.execute).toHaveBeenCalledWith({
      documentId: 'doc-1',
      correctedType: undefined,
      correctedFields: {
        accountNumber: '1234567890',
        balance: 5000.50,
      },
      correctedBy: 'user-1',
      notes: undefined,
    });
  });

  it('should return 400 when neither documentType nor fieldCorrections are provided', async () => {
    const body = {
      correctedBy: 'user-1',
    };

    const url = new URL('http://localhost/api/documents/doc-1/correct');
    const request = new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request, { params: { id: 'doc-1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Either documentType or fieldCorrections must be provided');
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('should return 400 when correctedBy is missing', async () => {
    const body = {
      documentType: 'bank_statement',
    };

    const url = new URL('http://localhost/api/documents/doc-1/correct');
    const request = new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request, { params: { id: 'doc-1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('correctedBy is required');
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('should return 400 when fieldCorrections is empty object', async () => {
    const body = {
      fieldCorrections: {},
      correctedBy: 'user-1',
    };

    const url = new URL('http://localhost/api/documents/doc-1/correct');
    const request = new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request, { params: { id: 'doc-1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Either documentType or fieldCorrections must be provided');
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('should return 404 when document is not found', async () => {
    const error = new Error('Document not found');
    mockUseCase.execute.mockRejectedValue(error);

    const body = {
      documentType: 'bank_statement',
      correctedBy: 'user-1',
    };

    const url = new URL('http://localhost/api/documents/non-existent/correct');
    const request = new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request, { params: { id: 'non-existent' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Document not found');
    expect(logger.error).toHaveBeenCalled();
  });

  it('should return 500 on other errors', async () => {
    const error = new Error('Database error');
    mockUseCase.execute.mockRejectedValue(error);

    const body = {
      documentType: 'bank_statement',
      correctedBy: 'user-1',
    };

    const url = new URL('http://localhost/api/documents/doc-1/correct');
    const request = new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request, { params: { id: 'doc-1' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to apply corrections');
    expect(logger.error).toHaveBeenCalled();
  });
});

