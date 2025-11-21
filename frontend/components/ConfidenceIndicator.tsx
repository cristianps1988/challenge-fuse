interface ConfidenceIndicatorProps {
  confidence: number;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ConfidenceIndicator({
  confidence,
  showPercentage = true,
  size = 'md',
  className = '',
}: ConfidenceIndicatorProps) {
  const percentage = Math.round(confidence * 100);

  const getColorClasses = (value: number) => {
    if (value >= 90) {
      return {
        bar: 'bg-green-500',
        badge: 'bg-green-100 text-green-700 border-green-200',
      };
    }
    if (value >= 70) {
      return {
        bar: 'bg-yellow-500',
        badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      };
    }
    return {
      bar: 'bg-red-500',
      badge: 'bg-red-100 text-red-700 border-red-200',
    };
  };

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 'h-2';
      case 'lg':
        return 'h-4';
      default:
        return 'h-2.5';
    }
  };

  const getText = () => {
    if (percentage >= 90) return 'High';
    if (percentage >= 70) return 'Medium';
    return 'Low';
  };

  const colors = getColorClasses(percentage);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        {showPercentage && (
          <span className="text-sm font-semibold text-gray-900">
            {percentage}%
          </span>
        )}
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${colors.badge}`}>
          {getText()}
        </span>
      </div>
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${getHeight()}`}>
        <div
          className={`${getHeight()} ${colors.bar} transition-all duration-300 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
