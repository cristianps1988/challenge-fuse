import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';

export function buildClassificationPrompt(learningExamples?: string[]): string {
  let prompt = `You are a strict document classification expert for loan origination workflows.

CRITICAL: First determine if this is a VALID financial/legal document. Reject documents that are:
- Personal photos (people, cars, vacation photos, etc.)
- Screenshots or technical diagrams
- Random images or artwork
- Marketing materials or advertisements
- Internal process documentation or flowcharts
- Handwritten notes that are not official documents
- Blank pages or test images
- Any other content that is clearly NOT an official financial or legal document

VALID document types you can classify:
- bank_statement: Official bank statements showing account activity, transactions, and balances
  * Must have: Bank name/logo, account holder name, account number, transaction list, period dates
  * Cannot be: Screenshots mentioning "bank statement", flowcharts, or diagrams about banking

- government_id: Government-issued identification documents
  * Must be: Passport, driver's license, state ID, national ID card
  * Must have: Official government format, photo, ID number, expiration date
  * Cannot be: Business cards, employee badges, or unofficial IDs

- w9: IRS Form W-9 (Request for Taxpayer Identification Number)
  * Must be: Official IRS W-9 form with signature
  * Must have: Form title "W-9", requester info, taxpayer info, TIN/SSN section

- certificate_of_insurance: Official insurance certificates
  * Must be: Insurance certificate from insurance company
  * Must have: Policy holder, policy number, coverage details, insurance company info

- articles_of_incorporation: Business incorporation documents filed with state
  * Must be: Official state-filed incorporation documents
  * Must have: Business name, state filing info, registered agent

- unknown: Use this for ANY document that doesn't clearly match the above categories OR is invalid

CLASSIFICATION RULES:
1. If you have ANY doubt about document validity, classify as "unknown" with low confidence
2. If the document mentions a valid type but isn't actually that document type (e.g., flowchart mentioning "bank statements"), classify as "unknown"
3. Personal photos, diagrams, or clearly invalid content should ALWAYS be "unknown" with confidence < 0.3
4. Only use high confidence (>0.8) if the document clearly matches ALL required elements
5. Be STRICT: When in doubt, classify as "unknown"

Return your response in JSON format:
{
  "type": "document_type",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why you classified it this way"
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
4. Include page number where the field was found (1-indexed)
5. For missing or unclear fields, use null and lower confidence
6. Follow validation rules (dates, formats, patterns)

CRITICAL: Return data in this EXACT JSON format for EVERY field:
{
  "field_name": {
    "value": "extracted value or null",
    "confidence": 0.95,
    "page": 1
  }
}

For multi-page documents, specify which page (1, 2, 3, etc.) contains each field.
If uncertain about the page, use your best estimate or null if the field is not found.

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

  prompt += '\n\nRemember: EVERY field must have the format { "value": ..., "confidence": ..., "page": ... }';

  return prompt;
}

export function buildValidationRulesPrompt(corrections: unknown[]): string {
  return `Based on these corrections, what validation rules or patterns should be applied?

Corrections:
${JSON.stringify(corrections, null, 2)}

Provide actionable validation rules.`;
}
