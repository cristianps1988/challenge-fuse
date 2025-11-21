'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Label } from '@/frontend/components/ui/label';
import { Slider } from '@/frontend/components/ui/slider';
import { Button } from '@/frontend/components/ui/button';
import { LoadingSpinner } from '@/frontend/components/LoadingSpinner';
import { ErrorMessage } from '@/frontend/components/ErrorMessage';
import { useAppSettings } from '../hooks/use-app-settings';
import { Save, RotateCcw } from 'lucide-react';

export function AppSettingsSliders() {
  const { settings, isLoading, error, isSaving, updateSettings } = useAppSettings();

  const initialValue = useMemo(() => {
    return settings?.max_file_size_mb ?? 10;
  }, [settings]);

  const [maxFileSizeMb, setMaxFileSizeMb] = useState(initialValue);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (initialValue !== maxFileSizeMb && !hasChanges && settings) {
    setMaxFileSizeMb(initialValue);
  }

  const handleSliderChange = (value: number[]) => {
    setMaxFileSizeMb(value[0]);
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleReset = () => {
    setMaxFileSizeMb(initialValue);
    setHasChanges(false);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);

    const success = await updateSettings({ max_file_size_mb: maxFileSizeMb });
    if (success) {
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError('Failed to save settings');
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
        <CardTitle>Upload Settings</CardTitle>
        <CardDescription>
          Configure document upload parameters
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

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Maximum File Size</h3>
            <p className="text-sm text-gray-600">
              Maximum allowed file size for document uploads. Files exceeding this limit will be rejected.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="max_file_size" className="text-base font-medium">
                Max File Size
              </Label>
              <span className="text-sm font-semibold text-gray-700 min-w-16 text-right">
                {maxFileSizeMb} MB
              </span>
            </div>
            <Slider
              id="max_file_size"
              value={[maxFileSizeMb]}
              onValueChange={handleSliderChange}
              min={1}
              max={50}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Smaller (1 MB)</span>
              <span>Larger (50 MB)</span>
            </div>
          </div>
        </div>

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
