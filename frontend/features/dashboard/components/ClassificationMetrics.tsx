import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ClassificationMetrics as ClassificationMetricsType } from '../hooks/use-metrics';
import { DocumentTypeLabel, DocumentTypeValue } from '@/backend/domain/document-types.constants';

interface ClassificationMetricsProps {
  metrics: ClassificationMetricsType;
}

export function ClassificationMetrics({ metrics }: ClassificationMetricsProps) {
  const chartData = Object.entries(metrics.precision).map(([type, precision]) => ({
    type: DocumentTypeLabel[type as DocumentTypeValue] || type,
    precision: Math.round(precision * 100),
    recall: Math.round((metrics.recall[type] || 0) * 100),
    f1: Math.round((metrics.f1Score[type] || 0) * 100),
  }));

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Classification Performance</CardTitle>
        <CardDescription>
          Accuracy: {Math.round(metrics.accuracy * 100)}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" fontSize={12} />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="precision" fill="#3b82f6" name="Precision %" />
            <Bar dataKey="recall" fill="#10b981" name="Recall %" />
            <Bar dataKey="f1" fill="#8b5cf6" name="F1 Score %" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
