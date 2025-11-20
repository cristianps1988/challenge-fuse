export const DocumentType = {
  BANK_STATEMENT: 'bank_statement',
  GOVERNMENT_ID: 'government_id',
  W9: 'w9',
  CERTIFICATE_OF_INSURANCE: 'certificate_of_insurance',
  ARTICLES_OF_INCORPORATION: 'articles_of_incorporation',
} as const;

export type DocumentTypeValue = typeof DocumentType[keyof typeof DocumentType];

export const DOCUMENT_TYPES = Object.values(DocumentType);

export const DocumentTypeLabel: Record<DocumentTypeValue, string> = {
  [DocumentType.BANK_STATEMENT]: 'Bank Statement',
  [DocumentType.GOVERNMENT_ID]: 'Government ID',
  [DocumentType.W9]: 'W-9 Form',
  [DocumentType.CERTIFICATE_OF_INSURANCE]: 'Certificate of Insurance',
  [DocumentType.ARTICLES_OF_INCORPORATION]: 'Articles of Incorporation',
} as const;