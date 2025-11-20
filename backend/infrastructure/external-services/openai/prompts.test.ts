import {
  buildClassificationPrompt,
  buildExtractionPrompt,
  buildValidationRulesPrompt,
} from './prompts';
import { DocumentType } from '@/backend/domain/document-types.constants';

describe('prompts', () => {
  describe('buildClassificationPrompt', () => {
    it('should build basic classification prompt without learning examples', () => {
      const prompt = buildClassificationPrompt();

      expect(prompt).toContain('document classification expert');
      expect(prompt).toContain('bank_statement');
      expect(prompt).toContain('government_id');
      expect(prompt).toContain('w9');
      expect(prompt).toContain('certificate_of_insurance');
      expect(prompt).toContain('articles_of_incorporation');
      expect(prompt).toContain('"type"');
      expect(prompt).toContain('"confidence"');
      expect(prompt).toContain('"reasoning"');
    });

    it('should include learning examples when provided', () => {
      const learningExamples = [
        'Example 1: Bank statements have account numbers and transaction lists',
        'Example 2: Government IDs have photos and official seals',
      ];

      const prompt = buildClassificationPrompt(learningExamples);

      expect(prompt).toContain('Learning examples from previous corrections:');
      expect(prompt).toContain('Example 1: Bank statements have account numbers');
      expect(prompt).toContain('Example 2: Government IDs have photos');
    });

    it('should not include learning section when examples array is empty', () => {
      const prompt = buildClassificationPrompt([]);

      expect(prompt).not.toContain('Learning examples from previous corrections:');
    });

    it('should include all learning examples in order', () => {
      const learningExamples = [
        'First example',
        'Second example',
        'Third example',
      ];

      const prompt = buildClassificationPrompt(learningExamples);

      const firstIndex = prompt.indexOf('First example');
      const secondIndex = prompt.indexOf('Second example');
      const thirdIndex = prompt.indexOf('Third example');

      expect(firstIndex).toBeLessThan(secondIndex);
      expect(secondIndex).toBeLessThan(thirdIndex);
    });

    it('should include JSON format specification', () => {
      const prompt = buildClassificationPrompt();

      expect(prompt).toContain('JSON format');
      expect(prompt).toContain('document_type');
      expect(prompt).toContain('0.95');
    });
  });

  describe('buildExtractionPrompt', () => {
    it('should build extraction prompt with document type and schema', () => {
      const schema = {
        accountNumber: {
          type: 'string',
          required: true,
        },
        balance: {
          type: 'number',
          required: true,
        },
      };

      const prompt = buildExtractionPrompt(
        DocumentType.BANK_STATEMENT,
        schema
      );

      expect(prompt).toContain('data extraction expert');
      expect(prompt).toContain('bank statement');
      expect(prompt).toContain('accountNumber');
      expect(prompt).toContain('balance');
    });

    it('should replace underscores in document type with spaces', () => {
      const schema = { field: { type: 'string' } };

      const bankStatementPrompt = buildExtractionPrompt(
        DocumentType.BANK_STATEMENT,
        schema
      );
      expect(bankStatementPrompt).toContain('bank statement');

      const govIdPrompt = buildExtractionPrompt(
        DocumentType.GOVERNMENT_ID,
        schema
      );
      expect(govIdPrompt).toContain('government id');

      const articlesPrompt = buildExtractionPrompt(
        DocumentType.ARTICLES_OF_INCORPORATION,
        schema
      );
      expect(articlesPrompt).toContain('articles of incorporation');
    });

    it('should include extraction requirements', () => {
      const schema = { field: { type: 'string' } };

      const prompt = buildExtractionPrompt(DocumentType.W9, schema);

      expect(prompt).toContain('Extract ALL fields');
      expect(prompt).toContain('exact field names');
      expect(prompt).toContain('confidence scores');
      expect(prompt).toContain('missing or unclear fields');
      expect(prompt).toContain('validation rules');
    });

    it('should include schema as JSON', () => {
      const schema = {
        name: {
          type: 'string',
          required: true,
          minLength: 2,
        },
        age: {
          type: 'number',
          minimum: 0,
        },
      };

      const prompt = buildExtractionPrompt(DocumentType.W9, schema);

      expect(prompt).toContain('Schema:');
      expect(prompt).toContain('"name"');
      expect(prompt).toContain('"age"');
      expect(prompt).toContain('"minLength"');
      expect(prompt).toContain('"minimum"');
    });

    it('should include learning examples when provided', () => {
      const schema = { field: { type: 'string' } };
      const learningExamples = [
        'Example: Account numbers are always 12 digits',
        'Example: Dates should be in MM/DD/YYYY format',
      ];

      const prompt = buildExtractionPrompt(
        DocumentType.BANK_STATEMENT,
        schema,
        learningExamples
      );

      expect(prompt).toContain('Learning examples from previous corrections:');
      expect(prompt).toContain('Account numbers are always 12 digits');
      expect(prompt).toContain('Dates should be in MM/DD/YYYY format');
    });

    it('should not include learning section when examples array is empty', () => {
      const schema = { field: { type: 'string' } };

      const prompt = buildExtractionPrompt(DocumentType.W9, schema, []);

      expect(prompt).not.toContain('Learning examples from previous corrections:');
    });

    it('should handle complex nested schema', () => {
      const schema = {
        person: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
              },
            },
          },
        },
      };

      const prompt = buildExtractionPrompt(DocumentType.W9, schema);

      expect(prompt).toContain('"person"');
      expect(prompt).toContain('"address"');
      expect(prompt).toContain('"street"');
      expect(prompt).toContain('"city"');
    });
  });

  describe('buildValidationRulesPrompt', () => {
    it('should build validation rules prompt with corrections', () => {
      const corrections = [
        {
          field: 'accountNumber',
          originalValue: '12345',
          correctedValue: '123456789012',
          reason: 'Account numbers are 12 digits',
        },
        {
          field: 'date',
          originalValue: '2024-01-15',
          correctedValue: '01/15/2024',
          reason: 'Use MM/DD/YYYY format',
        },
      ];

      const prompt = buildValidationRulesPrompt(corrections);

      expect(prompt).toContain('validation rules or patterns');
      expect(prompt).toContain('Corrections:');
      expect(prompt).toContain('accountNumber');
      expect(prompt).toContain('123456789012');
      expect(prompt).toContain('date');
      expect(prompt).toContain('01/15/2024');
      expect(prompt).toContain('actionable validation rules');
    });

    it('should include all corrections in JSON format', () => {
      const corrections = [
        { field: 'field1', value: 'value1' },
        { field: 'field2', value: 'value2' },
      ];

      const prompt = buildValidationRulesPrompt(corrections);

      expect(prompt).toContain('"field1"');
      expect(prompt).toContain('"field2"');
      expect(prompt).toContain('"value1"');
      expect(prompt).toContain('"value2"');
    });

    it('should handle empty corrections array', () => {
      const prompt = buildValidationRulesPrompt([]);

      expect(prompt).toContain('Corrections:');
      expect(prompt).toContain('[]');
      expect(prompt).toContain('actionable validation rules');
    });

    it('should handle complex correction objects', () => {
      const corrections = [
        {
          documentType: 'bank_statement',
          field: 'balance',
          correction: {
            original: { value: '1000', confidence: 0.7 },
            corrected: { value: '10000', confidence: 1.0 },
            metadata: {
              correctedBy: 'user@example.com',
              timestamp: '2024-01-15T10:00:00Z',
            },
          },
        },
      ];

      const prompt = buildValidationRulesPrompt(corrections);

      expect(prompt).toContain('bank_statement');
      expect(prompt).toContain('balance');
      expect(prompt).toContain('10000');
      expect(prompt).toContain('user@example.com');
    });
  });

  describe('integration scenarios', () => {
    it('should generate consistent prompts for same inputs', () => {
      const learningExamples = ['Example 1', 'Example 2'];

      const prompt1 = buildClassificationPrompt(learningExamples);
      const prompt2 = buildClassificationPrompt(learningExamples);

      expect(prompt1).toBe(prompt2);
    });

    it('should generate different prompts for different document types', () => {
      const schema = { field: { type: 'string' } };

      const bankPrompt = buildExtractionPrompt(
        DocumentType.BANK_STATEMENT,
        schema
      );
      const w9Prompt = buildExtractionPrompt(DocumentType.W9, schema);

      expect(bankPrompt).not.toBe(w9Prompt);
      expect(bankPrompt).toContain('bank statement');
      expect(w9Prompt).toContain('w9');
    });

    it('should handle special characters in learning examples', () => {
      const learningExamples = [
        'Example with "quotes" and \'apostrophes\'',
        'Example with <tags> and &ampersands',
      ];

      const prompt = buildClassificationPrompt(learningExamples);

      expect(prompt).toContain('quotes');
      expect(prompt).toContain('apostrophes');
      expect(prompt).toContain('<tags>');
      expect(prompt).toContain('&ampersands');
    });
  });
});
