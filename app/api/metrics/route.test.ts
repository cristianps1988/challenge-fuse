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

describe('GET /api/metrics', () => {
  let mockUseCase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCase = {
      execute: jest.fn(),
    };
    (container.getCalculateMetricsUseCase as jest.Mock).mockReturnValue(mockUseCase);
  });

  it('should return metrics without filters', async () => {
    const mockResponse = {
      classification: {
        accuracy: 0.95,
        precision: {},
        recall: {},
        f1Score: {},
        confusionMatrix: {},
        totalDocuments: 100,
        correctPredictions: 95,
      },
      extraction: {
        fieldExactMatchRates: {},
        fieldF1Scores: {},
        overallExactMatchRate: 0.9,
        averageConfidence: 0.85,
        confidenceDistribution: {
          high: 50,
          medium: 30,
          low: 20,
        },
      },
      operational: {
        averageProcessingTimeMs: 1000,
        p50ProcessingTimeMs: 900,
        p95ProcessingTimeMs: 2000,
        p99ProcessingTimeMs: 3000,
        totalCost: 100,
        averageCostPerDocument: 1,
        reviewRate: 0.1,
        documentsNeedingReview: 10,
        totalDocumentsProcessed: 100,
      },
      learningImpact: {
        accuracyBeforeCorrections: 0.85,
        accuracyAfterCorrections: 0.95,
        improvementPercentage: 10,
        totalCorrections: 20,
        averageConfidenceImprovement: 0.05,
      },
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      calculatedAt: new Date(),
    };

    mockUseCase.execute.mockResolvedValue(mockResponse);

    const url = new URL('http://localhost/api/metrics');
    const request = new NextRequest(url);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.classification.accuracy).toBe(0.95);
    expect(mockUseCase.execute).toHaveBeenCalledWith({
      fromDate: undefined,
      toDate: undefined,
      documentType: undefined,
    });
  });

  it('should filter metrics by date range and document type', async () => {
    const mockResponse = {
      classification: {
        accuracy: 0.95,
        precision: {},
        recall: {},
        f1Score: {},
        confusionMatrix: {},
        totalDocuments: 50,
        correctPredictions: 48,
      },
      extraction: {
        fieldExactMatchRates: {},
        fieldF1Scores: {},
        overallExactMatchRate: 0.9,
        averageConfidence: 0.85,
        confidenceDistribution: {
          high: 25,
          medium: 15,
          low: 10,
        },
      },
      operational: {
        averageProcessingTimeMs: 1000,
        p50ProcessingTimeMs: 900,
        p95ProcessingTimeMs: 2000,
        p99ProcessingTimeMs: 3000,
        totalCost: 50,
        averageCostPerDocument: 1,
        reviewRate: 0.1,
        documentsNeedingReview: 5,
        totalDocumentsProcessed: 50,
      },
      learningImpact: {
        accuracyBeforeCorrections: 0.85,
        accuracyAfterCorrections: 0.95,
        improvementPercentage: 10,
        totalCorrections: 10,
        averageConfidenceImprovement: 0.05,
      },
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-15'),
      calculatedAt: new Date(),
    };

    mockUseCase.execute.mockResolvedValue(mockResponse);

    const url = new URL('http://localhost/api/metrics?fromDate=2024-01-01&toDate=2024-01-15&documentType=bank_statement');
    const request = new NextRequest(url);

    await GET(request);

    expect(mockUseCase.execute).toHaveBeenCalledWith({
      fromDate: new Date('2024-01-01'),
      toDate: new Date('2024-01-15'),
      documentType: 'bank_statement',
    });
  });

  it('should return 500 on error', async () => {
    const error = new Error('Calculation failed');
    mockUseCase.execute.mockRejectedValue(error);

    const url = new URL('http://localhost/api/metrics');
    const request = new NextRequest(url);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to calculate metrics');
    expect(logger.error).toHaveBeenCalled();
  });
});

