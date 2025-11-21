import { useState, useEffect } from 'react';

export interface ClassificationMetrics {
  accuracy: number;
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1Score: Record<string, number>;
  confusionMatrix: Record<string, Record<string, number>>;
}

export interface ExtractionMetrics {
  fieldExactMatchRates: Record<string, number>;
  fieldF1Scores: Record<string, number>;
  overallExactMatchRate: number;
  averageConfidence: number;
  confidenceDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface OperationalMetrics {
  averageProcessingTimeMs: number;
  p50ProcessingTimeMs: number;
  p95ProcessingTimeMs: number;
  p99ProcessingTimeMs: number;
  totalCost: number;
  averageCostPerDocument: number;
  reviewRate: number;
  documentsNeedingReview: number;
  totalDocumentsProcessed: number;
}

export interface LearningImpact {
  accuracyBeforeCorrections: number;
  accuracyAfterCorrections: number;
  improvementPercentage: number;
  totalCorrections: number;
  averageConfidenceImprovement: number;
}

export interface Metrics {
  classification: ClassificationMetrics;
  extraction: ExtractionMetrics;
  operational: OperationalMetrics;
  learningImpact: LearningImpact;
}

interface UseMetricsOptions {
  fromDate?: string;
  toDate?: string;
  documentType?: string;
}

export function useMetrics(options: UseMetricsOptions = {}) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (options.fromDate) params.append('fromDate', options.fromDate);
        if (options.toDate) params.append('toDate', options.toDate);
        if (options.documentType) params.append('documentType', options.documentType);

        const response = await fetch(`/api/metrics?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metrics';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [options.fromDate, options.toDate, options.documentType]);

  return {
    metrics,
    isLoading,
    error,
  };
}
