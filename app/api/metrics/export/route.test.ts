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

describe('GET /api/metrics/export', () => {
  let mockUseCase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCase = {
      execute: jest.fn(),
    };
    (container.getCalculateMetricsUseCase as jest.Mock).mockReturnValue(mockUseCase);
  });

  const createMockMetrics = () => ({
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
      fieldExactMatchRates: {
        accountNumber: 0.98,
        balance: 0.92,
      },
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
      averageCostPerDocument: 1.5,
      reviewRate: 0.1,
      documentsNeedingReview: 10,
      totalDocumentsProcessed: 100,
    },
    learningImpact: {
      accuracyBeforeCorrections: 0.85,
      accuracyAfterCorrections: 0.95,
      improvementPercentage: 10.5,
      totalCorrections: 20,
      averageConfidenceImprovement: 0.05,
    },
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-31'),
    calculatedAt: new Date(),
  });

  it('should export metrics as JSON by default', async () => {
    const mockResponse = createMockMetrics();
    mockUseCase.execute.mockResolvedValue(mockResponse);

    const url = new URL('http://localhost/api/metrics/export');
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

  it('should export metrics as CSV when format=csv', async () => {
    const mockResponse = createMockMetrics();
    mockUseCase.execute.mockResolvedValue(mockResponse);

    const url = new URL('http://localhost/api/metrics/export?format=csv');
    const request = new NextRequest(url);

    const response = await GET(request);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/csv');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
    expect(response.headers.get('Content-Disposition')).toContain('.csv');
    expect(text).toContain('Metric Category,Metric Name,Value');
    expect(text).toContain('Accuracy,0.9500');
    expect(text).toContain('Total Documents,100');
    expect(text).toContain('accountNumber,0.9800');
    expect(text).toContain('balance,0.9200');
    expect(text).toContain('Overall Exact Match Rate,0.9000');
    expect(text).toContain('Average Confidence,0.8500');
    expect(text).toContain('Processing Time P50,900ms');
    expect(text).toContain('Processing Time P95,2000ms');
    expect(text).toContain('Processing Time P99,3000ms');
    expect(text).toContain('Average Cost Per Document,$1.5000');
    expect(text).toContain('Review Rate,10.00%');
    expect(text).toContain('Documents Needing Review,10');
    expect(text).toContain('Accuracy Before Corrections,0.8500');
    expect(text).toContain('Accuracy After Corrections,0.9500');
    expect(text).toContain('Improvement,10.50%');
    expect(text).toContain('Total Corrections,20');
  });

  it('should filter metrics by date range and document type', async () => {
    const mockResponse = createMockMetrics();
    mockUseCase.execute.mockResolvedValue(mockResponse);

    const url = new URL('http://localhost/api/metrics/export?fromDate=2024-01-01&toDate=2024-01-15&documentType=bank_statement&format=json');
    const request = new NextRequest(url);

    await GET(request);

    expect(mockUseCase.execute).toHaveBeenCalledWith({
      fromDate: new Date('2024-01-01'),
      toDate: new Date('2024-01-15'),
      documentType: 'bank_statement',
    });
  });

  it('should return 500 on error', async () => {
    const error = new Error('Export failed');
    mockUseCase.execute.mockRejectedValue(error);

    const url = new URL('http://localhost/api/metrics/export');
    const request = new NextRequest(url);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to export metrics');
    expect(logger.error).toHaveBeenCalled();
  });
});

