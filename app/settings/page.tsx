import { ThresholdSliders } from '@/frontend/features/settings/components/ThresholdSliders';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Configure system parameters and confidence thresholds
        </p>
      </div>

      <ThresholdSliders />
    </div>
  );
}
