import type { ExtractorService, ExtractionResult } from '@/backend/application/ports/ExtractorService';
import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';
import { FieldValue } from '@/backend/domain/value-objects/FieldValue.ValueObject';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import { loadSchema } from '@/backend/domain/schemas';
import { openai, OPENAI_MODEL } from './client';
import { buildExtractionPrompt } from './prompts';
import { logger } from '@/backend/infrastructure/logger';

interface ExtractedField {
  value: string | number | boolean | null;
  confidence: number;
}

type ExtractedFields = Record<string, ExtractedField>;

export class OpenAIExtractorService implements ExtractorService {
  async extract(
    fileBuffer: Buffer,
    documentType: DocumentTypeValue,
    fileName: string
  ): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      logger.info('Starting data extraction', { fileName, documentType });

      const schema = loadSchema(documentType);
      const base64File = fileBuffer.toString('base64');
      const prompt = buildExtractionPrompt(documentType, schema);

      const response = await openai.chat.completions.create({
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
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64File}`,
                },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const extractedData = JSON.parse(content) as ExtractedFields;
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

      logger.error('Extraction failed', {
        fileName,
        documentType,
        processingTimeMs,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new Error(`Extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private buildFieldsMap(extractedData: ExtractedFields): Map<string, FieldValue> {
    const fields = new Map<string, FieldValue>();

    for (const [fieldName, fieldData] of Object.entries(extractedData)) {
      const confidence = typeof fieldData.confidence === 'number'
        ? Confidence.create(fieldData.confidence)
        : Confidence.create(0.5);

      fields.set(
        fieldName,
        FieldValue.create(fieldName, fieldData.value, confidence)
      );
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
