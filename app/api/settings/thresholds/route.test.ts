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
import { GET, PATCH } from './route';
import { container } from '@/backend/infrastructure/di/container';
import { logger } from '@/backend/infrastructure/logger';

describe('GET /api/settings/thresholds', () => {
  let mockThresholdRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockThresholdRepository = {
      findAll: jest.fn(),
    };
    (container.getThresholdRepository as jest.Mock).mockReturnValue(mockThresholdRepository);
  });

  it('should return all thresholds', async () => {
    const mockThresholds = {
      bank_statement: 0.8,
      government_id: 0.9,
      w9: 0.85,
      certificate_of_insurance: 0.75,
      articles_of_incorporation: 0.8,
    };

    mockThresholdRepository.findAll.mockResolvedValue(mockThresholds);

    const url = new URL('http://localhost/api/settings/thresholds');
    const request = new NextRequest(url);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.thresholds).toEqual(mockThresholds);
    expect(mockThresholdRepository.findAll).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Fetching confidence thresholds');
  });

  it('should return 500 on error', async () => {
    const error = new Error('Database error');
    mockThresholdRepository.findAll.mockRejectedValue(error);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch thresholds');
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('PATCH /api/settings/thresholds', () => {
  let mockUseCase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCase = {
      execute: jest.fn(),
    };
    (container.getUpdateThresholdsUseCase as jest.Mock).mockReturnValue(mockUseCase);
  });

  it('should update thresholds successfully', async () => {
    const mockResponse = {
      success: true,
      updatedThresholds: {
        bank_statement: 0.85,
        government_id: 0.9,
      },
      updatedAt: new Date(),
      message: 'Thresholds updated',
    };

    mockUseCase.execute.mockResolvedValue(mockResponse);

    const body = {
      thresholds: {
        bank_statement: 0.85,
        government_id: 0.9,
      },
    };

    const url = new URL('http://localhost/api/settings/thresholds');
    const request = new NextRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUseCase.execute).toHaveBeenCalledWith({ thresholds: body.thresholds });
    expect(logger.info).toHaveBeenCalledWith('Updating confidence thresholds', { thresholds: body.thresholds });
  });

  it('should return 400 when thresholds object is missing', async () => {
    const body = {};

    const url = new URL('http://localhost/api/settings/thresholds');
    const request = new NextRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('thresholds object is required');
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('should return 400 when thresholds is not an object', async () => {
    const body = {
      thresholds: 'invalid',
    };

    const url = new URL('http://localhost/api/settings/thresholds');
    const request = new NextRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('thresholds object is required');
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('should return 400 when threshold value is less than 0', async () => {
    const body = {
      thresholds: {
        bank_statement: -0.1,
      },
    };

    const url = new URL('http://localhost/api/settings/thresholds');
    const request = new NextRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid threshold value');
    expect(data.error).toContain('must be between 0 and 1');
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('should return 400 when threshold value is greater than 1', async () => {
    const body = {
      thresholds: {
        bank_statement: 1.5,
      },
    };

    const url = new URL('http://localhost/api/settings/thresholds');
    const request = new NextRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid threshold value');
    expect(data.error).toContain('must be between 0 and 1');
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('should return 400 when threshold value is not a number', async () => {
    const body = {
      thresholds: {
        bank_statement: 'invalid',
      },
    };

    const url = new URL('http://localhost/api/settings/thresholds');
    const request = new NextRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid threshold value');
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('should accept valid threshold values at boundaries', async () => {
    const mockResponse = {
      success: true,
      updatedThresholds: {
        bank_statement: 0,
        government_id: 1,
      },
      updatedAt: new Date(),
      message: 'Thresholds updated',
    };

    mockUseCase.execute.mockResolvedValue(mockResponse);

    const body = {
      thresholds: {
        bank_statement: 0,
        government_id: 1,
      },
    };

    const url = new URL('http://localhost/api/settings/thresholds');
    const request = new NextRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUseCase.execute).toHaveBeenCalled();
  });

  it('should return 500 on error', async () => {
    const error = new Error('Update failed');
    mockUseCase.execute.mockRejectedValue(error);

    const body = {
      thresholds: {
        bank_statement: 0.85,
      },
    };

    const url = new URL('http://localhost/api/settings/thresholds');
    const request = new NextRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update thresholds');
    expect(logger.error).toHaveBeenCalled();
  });
});

