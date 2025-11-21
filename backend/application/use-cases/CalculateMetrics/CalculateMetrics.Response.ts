export interface ClassificationMetrics {
  accuracy: number;
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1Score: Record<string, number>;
  confusionMatrix: Record<string, Record<string, number>>;
  totalDocuments: number;
  correctPredictions: number;
}

export interface ConfidenceHistogram {
  bins: number[];
  counts: number[];
  average: number;
  threshold: number;
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
  confidenceByType: Record<string, ConfidenceHistogram>;
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

export interface LearningImpactMetrics {
  accuracyBeforeCorrections: number;
  accuracyAfterCorrections: number;
  improvementPercentage: number;
  totalCorrections: number;
  averageConfidenceImprovement: number;
}

export interface CalculateMetricsResponse {
  classification: ClassificationMetrics;
  extraction: ExtractionMetrics;
  operational: OperationalMetrics;
  learningImpact: LearningImpactMetrics;
  periodStart: Date;
  periodEnd: Date;
  calculatedAt: Date;
}
