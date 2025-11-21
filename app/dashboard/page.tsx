'use client';

import { Card, CardContent } from '@/frontend/components/ui/card';
import { LoadingSpinner } from '@/frontend/components/LoadingSpinner';
import { ErrorMessage } from '@/frontend/components/ErrorMessage';
import { useMetrics } from '@/frontend/features/dashboard/hooks/use-metrics';
import { ClassificationMetrics } from '@/frontend/features/dashboard/components/ClassificationMetrics';
import { ExtractionMetrics } from '@/frontend/features/dashboard/components/ExtractionMetrics';
import { OperationalMetrics } from '@/frontend/features/dashboard/components/OperationalMetrics';
import { MetricCard } from '@/frontend/features/dashboard/components/MetricCard';
import { TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { metrics, isLoading, error } = useMetrics();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        <Card>
          <CardContent className="py-12">
            <LoadingSpinner size="lg" text="Loading metrics..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        <Card>
          <CardContent className="py-12">
            <ErrorMessage
              title="Failed to load metrics"
              message={error || 'No metrics available'}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Track classification accuracy, extraction quality, and system performance
        </p>
      </div>

      {metrics.learningImpact.totalCorrections > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Learning Impact</h3>
                <p className="text-sm text-gray-600">
                  System has learned from {metrics.learningImpact.totalCorrections} corrections
                </p>
              </div>
              <MetricCard
                title="Accuracy Improvement"
                value={`+${Math.round(metrics.learningImpact.improvementPercentage)}%`}
                subtitle={`${Math.round(metrics.learningImpact.accuracyBeforeCorrections * 100)}% → ${Math.round(metrics.learningImpact.accuracyAfterCorrections * 100)}%`}
                icon={TrendingUp}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClassificationMetrics metrics={metrics.classification} />
      </div>

      <ExtractionMetrics metrics={metrics.extraction} />

      <OperationalMetrics metrics={metrics.operational} />
    </div>
  );
}
