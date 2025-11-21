import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';

export function buildClassificationPrompt(learningExamples?: string[]): string {
  let prompt = `You are a document classification expert for loan origination workflows.

Classify the document into one of these types:
- bank_statement: Bank statements showing account activity
- government_id: Government-issued identification documents (passport, driver's license, state ID)
- w9: IRS Form W-9 (Request for Taxpayer Identification Number)
- certificate_of_insurance: Insurance certificates
- articles_of_incorporation: Business incorporation documents

Analyze the document carefully and provide:
1. The document type
2. A confidence score (0-1)
3. Brief reasoning for your classification

Return your response in JSON format:
{
  "type": "document_type",
  "confidence": 0.95,
  "reasoning": "Brief explanation"
}`;

  if (learningExamples && learningExamples.length > 0) {
    prompt += '\n\nLearning examples from previous corrections:\n';
    prompt += learningExamples.join('\n');
  }

  return prompt;
}

export function buildExtractionPrompt(
  documentType: DocumentTypeValue,
  schema: Record<string, unknown>,
  learningExamples?: string[]
): string {
  let prompt = `You are a data extraction expert for loan origination documents.

Extract structured data from this ${documentType.replaceAll('_', ' ')} document.

Follow these requirements:
1. Extract ALL fields defined in the schema
2. Use exact field names from the schema
3. Provide confidence scores (0-1) for each field
4. For missing or unclear fields, use null and lower confidence
5. Follow validation rules (dates, formats, patterns)

CRITICAL: Return data in this EXACT JSON format for EVERY field:
{
  "field_name": {
    "value": "extracted value or null",
    "confidence": 0.95
  }
}

Confidence scoring guidelines:
- 0.9-1.0: Text is crystal clear, perfectly readable, no ambiguity
- 0.7-0.9: Text is clear but has minor quality issues or slight ambiguity
- 0.5-0.7: Text is partially unclear, requires interpretation
- 0.3-0.5: Text is very unclear, highly uncertain
- 0.0-0.3: Cannot read or field is missing

Schema:
${JSON.stringify(schema, null, 2)}`;

  if (learningExamples && learningExamples.length > 0) {
    prompt += '\n\nLearning examples from previous corrections:\n';
    prompt += learningExamples.join('\n');
  }

  prompt += '\n\nRemember: EVERY field must have the format { "value": ..., "confidence": ... }';

  return prompt;
}

export function buildValidationRulesPrompt(corrections: unknown[]): string {
  return `Based on these corrections, what validation rules or patterns should be applied?

Corrections:
${JSON.stringify(corrections, null, 2)}

Provide actionable validation rules.`;
}
