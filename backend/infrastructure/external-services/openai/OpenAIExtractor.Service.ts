import type { ExtractorService, ExtractionResult } from '@/backend/application/ports/ExtractorService';
import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';
import type { LearningLoopService } from '@/backend/application/services/LearningLoop.Service';
import { FieldValue } from '@/backend/domain/value-objects/FieldValue.ValueObject';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import { loadSchema } from '@/backend/domain/schemas';
import { openai, OPENAI_MODEL } from './client';
import { buildExtractionPrompt } from './prompts';
import { retryWithExponentialBackoff, isRetriableError } from './retry-utils';
import { logger } from '@/backend/infrastructure/logger';

interface ExtractedField {
  value: string | number | boolean | null;
  confidence: number;
  page?: number | null;
}

type ExtractedFields = Record<string, ExtractedField | null | string | number | boolean>;

export class OpenAIExtractorService implements ExtractorService {
  constructor(private readonly learningLoopService: LearningLoopService) {}

  async extract(
    fileBuffer: Buffer,
    documentType: DocumentTypeValue,
    fileName: string
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    let uploadedFile: { id: string } | null = null;

    try {
      logger.info('Starting data extraction', { fileName, documentType });

      const schema = loadSchema(documentType);

      logger.debug('Uploading file to OpenAI', { fileName, size: fileBuffer.length });

      const uint8Array = new Uint8Array(fileBuffer);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      const file = await openai.files.create({
        file: new File([blob], fileName, { type: 'application/pdf' }),
        purpose: 'assistants',
      });

      uploadedFile = file;
      logger.debug('File uploaded successfully', { fileName, fileId: file.id });

      const learningExamples = await this.learningLoopService.getFieldExtractionExamples(documentType, 3);
      const prompt = buildExtractionPrompt(documentType, schema, learningExamples ? [learningExamples] : undefined);

      const response = await retryWithExponentialBackoff(
        async () => {
          return await openai.chat.completions.create({
            model: OPENAI_MODEL,
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
            max_tokens: 2000,
            temperature: 0.1,
          });
        },
        `OpenAI Extraction (${documentType})`,
        { maxRetries: 2 }
      );

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const extractedData = JSON.parse(content) as ExtractedFields;

      logger.debug('OpenAI extraction response', {
        fileName,
        documentType,
        fieldCount: Object.keys(extractedData).length,
        sampleFields: Object.keys(extractedData).slice(0, 3),
      });

      const fields = this.buildFieldsMap(extractedData);
      const overallConfidence = this.calculateOverallConfidence(fields);
      const processingTimeMs = Date.now() - startTime;

      logger.info('Data extracted successfully', {
        fileName,
        documentType,
        fieldCount: fields.size,
        overallConfidence,
        processingTimeMs,
      });

      return {
        fields,
        overallConfidence,
        processingTimeMs,
      };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const isRetriable = isRetriableError(error);

      logger.error('Extraction failed', {
        fileName,
        documentType,
        processingTimeMs,
        retriable: isRetriable,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Extraction failed: ${errorMessage}${isRetriable ? ' (retriable error)' : ''}`);
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

  private buildFieldsMap(extractedData: ExtractedFields): Map<string, FieldValue> {
    const fields = new Map<string, FieldValue>();

    for (const [fieldName, fieldData] of Object.entries(extractedData)) {
      if (fieldData === null || fieldData === undefined) {
        fields.set(
          fieldName,
          FieldValue.create(fieldName, null, Confidence.create(0.5), null, null)
        );
        continue;
      }

      if (typeof fieldData === 'object' && 'value' in fieldData) {
        const confidence = typeof fieldData.confidence === 'number'
          ? Confidence.create(fieldData.confidence)
          : Confidence.create(0.5);

        const page = typeof fieldData.page === 'number' ? fieldData.page : null;

        fields.set(
          fieldName,
          FieldValue.create(fieldName, fieldData.value, confidence, page, null)
        );
      } else {
        const value = typeof fieldData === 'string' || typeof fieldData === 'number' || typeof fieldData === 'boolean'
          ? fieldData
          : null;

        fields.set(
          fieldName,
          FieldValue.create(fieldName, value, Confidence.create(0.5), null, null)
        );
      }
    }

    return fields;
  }

  private calculateOverallConfidence(fields: Map<string, FieldValue>): number {
    if (fields.size === 0) {
      return 0;
    }

    const confidenceValues = Array.from(fields.values()).map(field =>
      field.getConfidence().getValue()
    );

    const average = confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;

    return average;
  }
}
