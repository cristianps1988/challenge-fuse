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

  const getColor = (value: number) => {
    if (value >= 90) return 'bg-green-500';
    if (value >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 'h-1.5';
      case 'lg':
        return 'h-3';
      default:
        return 'h-2';
    }
  };

  const getText = () => {
    if (percentage >= 90) return 'High';
    if (percentage >= 70) return 'Medium';
    return 'Low';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1">
        <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${getHeight()}`}>
          <div
            className={`${getHeight()} ${getColor(percentage)} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      {showPercentage && (
        <span className="text-sm font-medium text-gray-700 min-w-[4rem] text-right">
          {percentage}% <span className="text-xs text-gray-500">({getText()})</span>
        </span>
      )}
    </div>
  );
}
