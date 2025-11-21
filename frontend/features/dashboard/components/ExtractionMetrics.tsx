import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine } from 'recharts';
import { ExtractionMetrics as ExtractionMetricsType } from '../hooks/use-metrics';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/frontend/components/ui/table';

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

  const fieldMetricsData = Object.keys(metrics.fieldExactMatchRates || {}).map(fieldName => ({
    field: fieldName,
    exactMatch: Math.round((metrics.fieldExactMatchRates[fieldName] || 0) * 100),
    f1Score: Math.round((metrics.fieldF1Scores[fieldName] || 0) * 100),
  }));

  const hasFieldMetrics = fieldMetricsData.length > 0;

  const confidenceByTypeData = Object.entries(metrics.confidenceByType || {}).map(([docType, histogram]) => ({
    docType,
    data: histogram.bins.map((bin, index) => ({
      binLabel: `${(bin * 100).toFixed(0)}-${((bin + 0.1) * 100).toFixed(0)}%`,
      count: histogram.counts[index],
      binValue: bin,
    })),
    average: histogram.average,
    threshold: histogram.threshold,
  }));

  const hasConfidenceByType = confidenceByTypeData.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Extraction Quality Overview</CardTitle>
          <CardDescription>
            Overall Exact Match Rate: {Math.round(avgExactMatch * 100)}% |
            Average Confidence: {Math.round((metrics.averageConfidence || 0) * 100)}%
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

      {hasFieldMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>Field-Level Performance</CardTitle>
            <CardDescription>
              Exact match and Token-F1 scores per field (based on human corrections)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fieldMetricsData.length <= 8 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={fieldMetricsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="field" angle={-45} textAnchor="end" height={100} fontSize={11} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="exactMatch" fill="#3b82f6" name="Exact Match %" />
                  <Bar dataKey="f1Score" fill="#10b981" name="Token-F1 %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field Name</TableHead>
                      <TableHead className="text-right">Exact Match</TableHead>
                      <TableHead className="text-right">Token-F1</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fieldMetricsData.map((field) => (
                      <TableRow key={field.field}>
                        <TableCell className="font-medium">{field.field}</TableCell>
                        <TableCell className="text-right">{field.exactMatch}%</TableCell>
                        <TableCell className="text-right">{field.f1Score}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {hasConfidenceByType && (
        <Card>
          <CardHeader>
            <CardTitle>Confidence Distribution by Document Type</CardTitle>
            <CardDescription>
              Histograms showing confidence score calibration for each document type with threshold lines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {confidenceByTypeData.map(({ docType, data, average, threshold }) => (
                <div key={docType} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm text-gray-700">{docType}</h4>
                    <div className="text-xs text-gray-500">
                      Average: {(average * 100).toFixed(1)}% | Threshold: {(threshold * 100).toFixed(1)}%
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="binLabel"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={10}
                      />
                      <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                      <Tooltip
                        formatter={(value: number) => [`${value} documents`, 'Count']}
                        labelFormatter={(label) => `Confidence: ${label}`}
                      />
                      <Bar dataKey="count" fill="#3b82f6" name="Documents" />
                      <ReferenceLine
                        x={`${(threshold * 100).toFixed(0)}-${((threshold + 0.1) * 100).toFixed(0)}%`}
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        label={{ value: 'Threshold', position: 'top', fill: '#ef4444', fontSize: 11 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
