import pino from 'pino';
import { getEnv } from '@/backend/infrastructure/config/env';
import { maskLogContext } from './masking';

const { LOG_LEVEL, NODE_ENV } = getEnv();
const isDevelopment = NODE_ENV === 'development';
const logLevel = LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

const pinoLogger = pino({
  level: logLevel,
  browser: {
    asObject: true,
  },
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    if (context) {
      const maskedContext = maskLogContext(context);
      pinoLogger.info(maskedContext, message);
    } else {
      pinoLogger.info(message);
    }
  },
  error: (message: string, context?: Record<string, unknown>) => {
    if (context) {
      const maskedContext = maskLogContext(context);
      pinoLogger.error(maskedContext, message);
    } else {
      pinoLogger.error(message);
    }
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    if (context) {
      const maskedContext = maskLogContext(context);
      pinoLogger.warn(maskedContext, message);
    } else {
      pinoLogger.warn(message);
    }
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    if (context) {
      const maskedContext = maskLogContext(context);
      pinoLogger.debug(maskedContext, message);
    } else {
      pinoLogger.debug(message);
    }
  },
};

export type Logger = typeof logger;

export {
  maskValue,
  maskObject,
  maskExtractedFields,
  maskLogContext,
  maskSensitivePatterns,
  isSensitiveField,
} from './masking';
