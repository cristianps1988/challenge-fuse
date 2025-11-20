import OpenAI from 'openai';
import { getEnv } from '@/backend/infrastructure/config/env';

const { OPENAI_API_KEY } = getEnv();

export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || '',
});

export const OPENAI_MODEL = 'gpt-4o';
export const OPENAI_VISION_MODEL = 'gpt-4o';
