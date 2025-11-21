import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ExtractionMetrics as ExtractionMetricsType } from '../hooks/use-metrics';

interface ExtractionMetricsProps {
  metrics: ExtractionMetricsType;
}

const COLORS = {
  high: '#10b981',
  medium: '#f59e0b',
  low: '#ef4444',
};

export function ExtractionMetrics({ metrics }: ExtractionMetricsProps) {
  const confidenceData = [
    { name: 'High Confidence', value: metrics.confidenceDistribution?.high || 0, color: COLORS.high },
    { name: 'Medium Confidence', value: metrics.confidenceDistribution?.medium || 0, color: COLORS.medium },
    { name: 'Low Confidence', value: metrics.confidenceDistribution?.low || 0, color: COLORS.low },
  ];

  const avgExactMatch = metrics.overallExactMatchRate || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extraction Quality</CardTitle>
        <CardDescription>
          Average Field Exact Match: {Math.round(avgExactMatch * 100)}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={confidenceData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {confidenceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
