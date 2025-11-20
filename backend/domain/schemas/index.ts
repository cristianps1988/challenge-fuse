import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';
import { DocumentType } from '@/backend/domain/document-types.constants';
import fs from 'fs';
import path from 'path';

const schemaCache = new Map<DocumentTypeValue, Record<string, unknown>>();

export function loadSchema(documentType: DocumentTypeValue): Record<string, unknown> {
  if (schemaCache.has(documentType)) {
    return schemaCache.get(documentType)!;
  }

  const schemaFileName = getSchemaFileName(documentType);
  const schemaPath = path.join(__dirname, schemaFileName);

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found for document type: ${documentType}`);
  }

  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const schema = JSON.parse(schemaContent) as Record<string, unknown>;

  schemaCache.set(documentType, schema);

  return schema;
}

function getSchemaFileName(documentType: DocumentTypeValue): string {
  const schemaFileNames: Record<DocumentTypeValue, string> = {
    [DocumentType.BANK_STATEMENT]: 'bank-statement.schema.json',
    [DocumentType.GOVERNMENT_ID]: 'government-id.schema.json',
    [DocumentType.W9]: 'w9.schema.json',
    [DocumentType.CERTIFICATE_OF_INSURANCE]: 'certificate-of-insurance.schema.json',
    [DocumentType.ARTICLES_OF_INCORPORATION]: 'articles-of-incorporation.schema.json',
  };

  return schemaFileNames[documentType];
}

export function getAllSchemas(): Map<DocumentTypeValue, Record<string, unknown>> {
  const allSchemas = new Map<DocumentTypeValue, Record<string, unknown>>();

  for (const documentType of Object.values(DocumentType)) {
    allSchemas.set(documentType as DocumentTypeValue, loadSchema(documentType as DocumentTypeValue));
  }

  return allSchemas;
}
