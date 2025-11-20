import type { ClassifierService, ClassificationResult } from '@/backend/application/ports/ClassifierService';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';
import { openai, OPENAI_VISION_MODEL } from './client';
import { buildClassificationPrompt } from './prompts';
import { logger } from '@/backend/infrastructure/logger';

interface OpenAIClassificationResponse {
  type: DocumentTypeValue;
  confidence: number;
  reasoning?: string;
}

export class OpenAIClassifierService implements ClassifierService {
  async classify(fileBuffer: Buffer, fileName: string): Promise<ClassificationResult> {
    const startTime = Date.now();

    try {
      logger.info('Starting document classification', { fileName });

      const base64File = fileBuffer.toString('base64');
      const prompt = buildClassificationPrompt();

      const response = await openai.chat.completions.create({
        model: OPENAI_VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64File}`,
                },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const classification = JSON.parse(content) as OpenAIClassificationResponse;

      const latency = Date.now() - startTime;

      logger.info('Document classified successfully', {
        fileName,
        type: classification.type,
        confidence: classification.confidence,
        latency,
      });

      return {
        documentType: classification.type,
        confidence: Confidence.create(classification.confidence),
        reasoning: classification.reasoning,
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      logger.error('Classification failed', {
        fileName,
        latency,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new Error(`Classification failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
