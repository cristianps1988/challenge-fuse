import { logger } from '@/backend/infrastructure/logger';

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

export async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === config.maxRetries) {
        logger.error('Operation failed after all retries', {
          operation: operationName,
          attempts: attempt + 1,
          error: lastError.message,
        });
        break;
      }

      const delay = Math.min(
        config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelayMs
      );

      logger.warn('Operation failed, retrying...', {
        operation: operationName,
        attempt: attempt + 1,
        maxRetries: config.maxRetries,
        retryInMs: delay,
        error: lastError.message,
      });

      await sleep(delay);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetriableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  const retriablePatterns = [
    'rate limit',
    'timeout',
    'econnreset',
    'enotfound',
    'econnrefused',
    'network',
    'fetch failed',
    '429',
    '500',
    '502',
    '503',
    '504',
  ];

  return retriablePatterns.some((pattern) => message.includes(pattern));
}