import type { ClassifierService, ClassificationResult } from '@/backend/application/ports/ClassifierService';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';
import type { LearningLoopService } from '@/backend/application/services/LearningLoop.Service';
import { openai, OPENAI_VISION_MODEL } from './client';
import { buildClassificationPrompt } from './prompts';
import { retryWithExponentialBackoff, isRetriableError } from './retry-utils';
import { logger } from '@/backend/infrastructure/logger';

interface OpenAIClassificationResponse {
  type: DocumentTypeValue;
  confidence: number;
  reasoning?: string;
}

export class OpenAIClassifierService implements ClassifierService {
  constructor(private readonly learningLoopService: LearningLoopService) {}

  async classify(fileBuffer: Buffer, fileName: string): Promise<ClassificationResult> {
    const startTime = Date.now();
    let uploadedFile: { id: string } | null = null;

    try {
      logger.info('Starting document classification', { fileName });

      logger.debug('Uploading file to OpenAI', { fileName, size: fileBuffer.length });

      const uint8Array = new Uint8Array(fileBuffer);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      const file = await openai.files.create({
        file: new File([blob], fileName, { type: 'application/pdf' }),
        purpose: 'assistants',
      });

      uploadedFile = file;
      logger.debug('File uploaded successfully', { fileName, fileId: file.id });

      const learningExamples = await this.learningLoopService.getClassificationExamples(3);
      const prompt = buildClassificationPrompt(learningExamples ? [learningExamples] : undefined);

      const response = await retryWithExponentialBackoff(
        async () => {
          return await openai.chat.completions.create({
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
                    type: 'file',
                    file: {
                      file_id: file.id,
                    },
                  },
                ],
              },
            ],
            response_format: { type: 'json_object' },
            max_tokens: 500,
            temperature: 0.1,
          });
        },
        'OpenAI Classification',
        { maxRetries: 2 }
      );

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
      const isRetriable = isRetriableError(error);

      logger.error('Classification failed', {
        fileName,
        latency,
        retriable: isRetriable,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Classification failed: ${errorMessage}${isRetriable ? ' (retriable error)' : ''}`);
    } finally {
      if (uploadedFile) {
        try {
          await openai.files.delete(uploadedFile.id);
          logger.debug('Cleaned up uploaded file', { fileId: uploadedFile.id });
        } catch (cleanupError) {
          logger.warn('Failed to cleanup uploaded file', {
            fileId: uploadedFile.id,
            error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
          });
        }
      }
    }
  }
}
