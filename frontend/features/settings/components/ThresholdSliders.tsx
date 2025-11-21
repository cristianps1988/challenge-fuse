'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Label } from '@/frontend/components/ui/label';
import { Slider } from '@/frontend/components/ui/slider';
import { Button } from '@/frontend/components/ui/button';
import { LoadingSpinner } from '@/frontend/components/LoadingSpinner';
import { ErrorMessage } from '@/frontend/components/ErrorMessage';
import { useThresholds } from '../hooks/use-thresholds';
import { DocumentTypeLabel, DocumentTypeValue } from '@/backend/domain/document-types.constants';
import { Save, RotateCcw } from 'lucide-react';

export function ThresholdSliders() {
  const { thresholds, isLoading, error, isSaving, updateThresholds } = useThresholds();
  
  const initialValues = useMemo(() => {
    if (Array.isArray(thresholds) && thresholds.length > 0) {
      const values: Record<string, number> = {};
      thresholds.forEach((t) => {
        values[t.documentType] = t.threshold;
      });
      return values;
    }
    return {};
  }, [thresholds]);

  const classificationThreshold = useMemo(() => {
    return thresholds.find((t) => t.documentType === 'classification');
  }, [thresholds]);

  const extractionThresholds = useMemo(() => {
    return thresholds.filter((t) => t.documentType !== 'classification');
  }, [thresholds]);

  const [values, setValues] = useState<Record<string, number>>(() => initialValues);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (Object.keys(initialValues).length > 0 && JSON.stringify(values) !== JSON.stringify(initialValues) && !hasChanges) {
    setValues(initialValues);
  }

  const handleSliderChange = (documentType: string, value: number[]) => {
    setValues((prev) => ({ ...prev, [documentType]: value[0] }));
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleReset = () => {
    if (Array.isArray(thresholds)) {
      const initialValues: Record<string, number> = {};
      thresholds.forEach((t) => {
        initialValues[t.documentType] = t.threshold;
      });
      setValues(initialValues);
    }
    setHasChanges(false);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);

    const success = await updateThresholds(values);
    if (success) {
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError('Failed to save thresholds');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <LoadingSpinner size="lg" text="Loading settings..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <ErrorMessage message={error} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confidence Thresholds</CardTitle>
        <CardDescription>
          Configure minimum confidence levels for classification and extraction. Documents below these thresholds will be flagged for review or rejected.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {saveError && (
          <ErrorMessage message={saveError} onDismiss={() => setSaveError(null)} />
        )}

        {saveSuccess && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-800">Settings saved successfully!</p>
          </div>
        )}

        {classificationThreshold && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Classification Threshold</h3>
              <p className="text-sm text-gray-600">
                Minimum confidence for document classification. Documents classified as &quot;unknown&quot; or with confidence below this threshold will be rejected or flagged for review.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="classification" className="text-base font-medium">
                  Classification Confidence
                </Label>
                <span className="text-sm font-semibold text-gray-700 min-w-16 text-right">
                  {Math.round((values[classificationThreshold.documentType] || classificationThreshold.threshold) * 100)}%
                </span>
              </div>
              <Slider
                id="classification"
                value={[values[classificationThreshold.documentType] || classificationThreshold.threshold]}
                onValueChange={(value) => handleSliderChange(classificationThreshold.documentType, value)}
                min={0.5}
                max={0.99}
                step={0.01}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>More permissive (50%)</span>
                <span>More strict (99%)</span>
              </div>
            </div>
          </div>
        )}

        {extractionThresholds.length > 0 && (
          <div className="space-y-4 pt-6 border-t">
            <div>
              <h3 className="text-lg font-semibold mb-1">Extraction Thresholds</h3>
              <p className="text-sm text-gray-600">
                Minimum confidence for field extraction by document type. Documents with extraction confidence below these thresholds will be flagged for review.
              </p>
            </div>

            <div className="space-y-6">
              {extractionThresholds.map((threshold) => {
                const currentValue = values[threshold.documentType] || threshold.threshold;
                const percentage = Math.round(currentValue * 100);

                return (
                  <div key={threshold.documentType} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={threshold.documentType} className="text-base font-medium">
                        {DocumentTypeLabel[threshold.documentType as DocumentTypeValue] || threshold.documentType}
                      </Label>
                      <span className="text-sm font-semibold text-gray-700 min-w-16 text-right">
                        {percentage}%
                      </span>
                    </div>
                    <Slider
                      id={threshold.documentType}
                      value={[currentValue]}
                      onValueChange={(value) => handleSliderChange(threshold.documentType, value)}
                      min={0.5}
                      max={0.99}
                      step={0.01}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>More automatic (50%)</span>
                      <span>More cautious (99%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-6 border-t">
          <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="min-w-[120px]">
            {isSaving ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges || isSaving}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
