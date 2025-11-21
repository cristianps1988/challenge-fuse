import { Clock, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';
import { OperationalMetrics as OperationalMetricsType } from '../hooks/use-metrics';
import { MetricCard } from './MetricCard';

interface OperationalMetricsProps {
  metrics: OperationalMetricsType;
}

export function OperationalMetrics({ metrics }: OperationalMetricsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Operational Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Avg. Processing Time"
          value={`${(metrics.averageProcessingTimeMs / 1000).toFixed(1)}s`}
          subtitle={`P95: ${(metrics.p95ProcessingTimeMs / 1000).toFixed(1)}s | P99: ${(metrics.p99ProcessingTimeMs / 1000).toFixed(1)}s`}
          icon={Clock}
        />
        <MetricCard
          title="Avg. Cost per Document"
          value={`$${metrics.averageCostPerDocument.toFixed(4)}`}
          subtitle={`Total: $${metrics.totalCost.toFixed(2)}`}
          icon={DollarSign}
        />
        <MetricCard
          title="Review Rate"
          value={`${Math.round(metrics.reviewRate * 100)}%`}
          subtitle={`${metrics.documentsNeedingReview} documents need review`}
          icon={AlertCircle}
        />
        <MetricCard
          title="Throughput"
          value={metrics.totalDocumentsProcessed}
          subtitle="Documents processed"
          icon={TrendingUp}
        />
      </div>
    </div>
  );
}
