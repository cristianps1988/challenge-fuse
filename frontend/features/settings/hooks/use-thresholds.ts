import { useState, useEffect } from 'react';

export interface Threshold {
  documentType: string;
  threshold: number;
}

export function useThresholds() {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchThresholds = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/thresholds');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const thresholdsArray: Threshold[] = data.thresholds
        ? Object.entries(data.thresholds).map(([documentType, threshold]) => ({
            documentType,
            threshold: threshold as number,
          }))
        : [];

      setThresholds(thresholdsArray);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch thresholds';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThresholds();
  }, []);

  const updateThresholds = async (newThresholds: Record<string, number>): Promise<boolean> => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/thresholds', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ thresholds: newThresholds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update thresholds' }));
        throw new Error(errorData.error || 'Failed to update thresholds');
      }

      await fetchThresholds();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update thresholds';
      setError(errorMessage);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    thresholds,
    isLoading,
    error,
    isSaving,
    updateThresholds,
    refresh: fetchThresholds,
  };
}
