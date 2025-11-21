import { useState, useEffect } from 'react';

export interface AppSettings {
  max_file_size_mb: number;
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const appSettings: AppSettings = {
        max_file_size_mb: parseFloat(data.settings.max_file_size_mb || '10'),
      };

      setSettings(appSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch settings';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>): Promise<boolean> => {
    setIsSaving(true);
    setError(null);

    try {
      const settingsRecord: Record<string, string> = {};
      if (newSettings.max_file_size_mb !== undefined) {
        settingsRecord.max_file_size_mb = newSettings.max_file_size_mb.toString();
      }

      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: settingsRecord }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update settings' }));
        throw new Error(errorData.error || 'Failed to update settings');
      }

      await fetchSettings();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    settings,
    isLoading,
    error,
    isSaving,
    updateSettings,
    refresh: fetchSettings,
  };
}
