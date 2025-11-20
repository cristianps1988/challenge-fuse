import OpenAI from 'openai';
import { logger } from '@/backend/infrastructure/logger';

if (!process.env.OPENAI_API_KEY) {
  logger.error('OPENAI_API_KEY environment variable is not set');
  throw new Error('OPENAI_API_KEY environment variable is required');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const OPENAI_MODEL = 'gpt-4o';
export const OPENAI_VISION_MODEL = 'gpt-4o';
