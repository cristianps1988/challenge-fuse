import type { DocumentTypeValue } from '@/backend/domain/document-types.constants';
import { DocumentType } from '@/backend/domain/document-types.constants';
import bankStatementSchema from './bank-statement.schema.json';
import governmentIdSchema from './government-id.schema.json';
import w9Schema from './w9.schema.json';
import certificateOfInsuranceSchema from './certificate-of-insurance.schema.json';
import articlesOfIncorporationSchema from './articles-of-incorporation.schema.json';

const SCHEMAS: Record<DocumentTypeValue, Record<string, unknown>> = {
  [DocumentType.BANK_STATEMENT]: bankStatementSchema,
  [DocumentType.GOVERNMENT_ID]: governmentIdSchema,
  [DocumentType.W9]: w9Schema,
  [DocumentType.CERTIFICATE_OF_INSURANCE]: certificateOfInsuranceSchema,
  [DocumentType.ARTICLES_OF_INCORPORATION]: articlesOfIncorporationSchema,
};

export function loadSchema(documentType: DocumentTypeValue): Record<string, unknown> {
  const schema = SCHEMAS[documentType];

  if (!schema) {
    throw new Error(`Schema not found for document type: ${documentType}`);
  }

  return schema;
}

export function getAllSchemas(): Map<DocumentTypeValue, Record<string, unknown>> {
  const allSchemas = new Map<DocumentTypeValue, Record<string, unknown>>();

  for (const documentType of Object.values(DocumentType)) {
    allSchemas.set(documentType as DocumentTypeValue, loadSchema(documentType as DocumentTypeValue));
  }

  return allSchemas;
}
