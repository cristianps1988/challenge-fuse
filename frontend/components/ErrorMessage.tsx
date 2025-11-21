import { AlertCircle, XCircle } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: 'error' | 'warning';
  onDismiss?: () => void;
  className?: string;
}

export function ErrorMessage({
  title = 'Error',
  message,
  variant = 'error',
  onDismiss,
  className = '',
}: ErrorMessageProps) {
  const isError = variant === 'error';

  return (
    <div
      className={`rounded-lg border p-4 ${
        isError
          ? 'bg-red-50 border-red-200'
          : 'bg-yellow-50 border-yellow-200'
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {isError ? (
            <XCircle className="h-5 w-5 text-red-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          )}
        </div>
        <div className="flex-1">
          <h3
            className={`text-sm font-semibold ${
              isError ? 'text-red-900' : 'text-yellow-900'
            }`}
          >
            {title}
          </h3>
          <p
            className={`text-sm mt-1 ${
              isError ? 'text-red-700' : 'text-yellow-700'
            }`}
          >
            {message}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${
              isError
                ? 'text-red-600 hover:text-red-800'
                : 'text-yellow-600 hover:text-yellow-800'
            }`}
            aria-label="Dismiss"
          >
            <XCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
