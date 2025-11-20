import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

const pinoLogger = pino({
  level: logLevel,
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
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
      pinoLogger.info(context, message);
    } else {
      pinoLogger.info(message);
    }
  },
  error: (message: string, context?: Record<string, unknown>) => {
    if (context) {
      pinoLogger.error(context, message);
    } else {
      pinoLogger.error(message);
    }
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    if (context) {
      pinoLogger.warn(context, message);
    } else {
      pinoLogger.warn(message);
    }
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    if (context) {
      pinoLogger.debug(context, message);
    } else {
      pinoLogger.debug(message);
    }
  },
};

export type Logger = typeof logger;
