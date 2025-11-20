import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/backend/infrastructure/di/container';
import { logger } from '@/backend/infrastructure/logger';
import type { CalculateMetricsResponse } from '@/backend/application/use-cases/CalculateMetrics/CalculateMetrics.Response';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;
    const documentType = searchParams.get('documentType') || undefined;
    const format = searchParams.get('format') || 'json';

    logger.info('Exporting metrics', { fromDate, toDate, documentType, format });

    const useCase = container.getCalculateMetricsUseCase();
    const result = await useCase.execute({
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      documentType,
    });

    if (format === 'csv') {
      const csv = convertMetricsToCSV(result);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="metrics-${new Date().toISOString()}.csv"`,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Failed to export metrics', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Failed to export metrics' },
      { status: 500 }
    );
  }
}

function convertMetricsToCSV(metrics: CalculateMetricsResponse): string {
  const rows: string[] = [];

  rows.push('Metric Category,Metric Name,Value');
  rows.push('');

  rows.push('Classification Metrics,,');
  rows.push(`,Accuracy,${metrics.classification.accuracy.toFixed(4)}`);
  rows.push(`,Total Documents,${metrics.classification.totalDocuments}`);
  rows.push(`,Correct Predictions,${metrics.classification.correctPredictions}`);
  rows.push('');

  rows.push('Extraction Metrics,,');
  Object.entries(metrics.extraction.fieldExactMatchRates).forEach(([field, rate]) => {
    rows.push(`,${field},${rate.toFixed(4)}`);
  });
  rows.push(`,Overall Exact Match Rate,${metrics.extraction.overallExactMatchRate.toFixed(4)}`);
  rows.push(`,Average Confidence,${metrics.extraction.averageConfidence.toFixed(4)}`);
  rows.push('');

  rows.push('Operational Metrics,,');
  rows.push(`,Processing Time P50,${metrics.operational.p50ProcessingTimeMs}ms`);
  rows.push(`,Processing Time P95,${metrics.operational.p95ProcessingTimeMs}ms`);
  rows.push(`,Processing Time P99,${metrics.operational.p99ProcessingTimeMs}ms`);
  rows.push(`,Average Cost Per Document,$${metrics.operational.averageCostPerDocument.toFixed(4)}`);
  rows.push(`,Review Rate,${(metrics.operational.reviewRate * 100).toFixed(2)}%`);
  rows.push(`,Documents Needing Review,${metrics.operational.documentsNeedingReview}`);
  rows.push('');

  rows.push('Learning Impact,,');
  rows.push(`,Accuracy Before Corrections,${metrics.learningImpact.accuracyBeforeCorrections.toFixed(4)}`);
  rows.push(`,Accuracy After Corrections,${metrics.learningImpact.accuracyAfterCorrections.toFixed(4)}`);
  rows.push(`,Improvement,${metrics.learningImpact.improvementPercentage.toFixed(2)}%`);
  rows.push(`,Total Corrections,${metrics.learningImpact.totalCorrections}`);

  return rows.join('\n');
}
