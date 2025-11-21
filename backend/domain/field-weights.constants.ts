import type { DocumentTypeValue } from './document-types.constants';
import { DocumentType } from './document-types.constants';

export type FieldWeight = 'critical' | 'standard' | 'optional';

export interface FieldWeightConfig {
  weight: number;
  level: FieldWeight;
}

type FieldWeights = Record<string, FieldWeightConfig>;
type DocumentFieldWeights = Record<DocumentTypeValue, FieldWeights>;

const CRITICAL_WEIGHT = 1.0;
const STANDARD_WEIGHT = 0.6;
const OPTIONAL_WEIGHT = 0.3;

export const FIELD_WEIGHTS: DocumentFieldWeights = {
  [DocumentType.BANK_STATEMENT]: {
    bank_name: { weight: CRITICAL_WEIGHT, level: 'critical' },
    account_holder_name: { weight: CRITICAL_WEIGHT, level: 'critical' },
    account_number: { weight: CRITICAL_WEIGHT, level: 'critical' },
    statement_period_start: { weight: STANDARD_WEIGHT, level: 'standard' },
    statement_period_end: { weight: STANDARD_WEIGHT, level: 'standard' },
    beginning_balance: { weight: STANDARD_WEIGHT, level: 'standard' },
    ending_balance: { weight: CRITICAL_WEIGHT, level: 'critical' },
    total_deposits: { weight: OPTIONAL_WEIGHT, level: 'optional' },
    total_withdrawals: { weight: OPTIONAL_WEIGHT, level: 'optional' },
  },
  [DocumentType.GOVERNMENT_ID]: {
    document_type: { weight: CRITICAL_WEIGHT, level: 'critical' },
    document_number: { weight: CRITICAL_WEIGHT, level: 'critical' },
    full_name: { weight: CRITICAL_WEIGHT, level: 'critical' },
    date_of_birth: { weight: CRITICAL_WEIGHT, level: 'critical' },
    expiration_date: { weight: CRITICAL_WEIGHT, level: 'critical' },
    issue_date: { weight: STANDARD_WEIGHT, level: 'standard' },
    issuing_authority: { weight: STANDARD_WEIGHT, level: 'standard' },
    address: { weight: STANDARD_WEIGHT, level: 'standard' },
    gender: { weight: OPTIONAL_WEIGHT, level: 'optional' },
    height: { weight: OPTIONAL_WEIGHT, level: 'optional' },
    eye_color: { weight: OPTIONAL_WEIGHT, level: 'optional' },
  },
  [DocumentType.W9]: {
    name: { weight: CRITICAL_WEIGHT, level: 'critical' },
    business_name: { weight: STANDARD_WEIGHT, level: 'standard' },
    federal_tax_classification: { weight: CRITICAL_WEIGHT, level: 'critical' },
    exemptions: { weight: OPTIONAL_WEIGHT, level: 'optional' },
    address: { weight: STANDARD_WEIGHT, level: 'standard' },
    city: { weight: STANDARD_WEIGHT, level: 'standard' },
    state: { weight: STANDARD_WEIGHT, level: 'standard' },
    zip: { weight: STANDARD_WEIGHT, level: 'standard' },
    taxpayer_identification_number: { weight: CRITICAL_WEIGHT, level: 'critical' },
    signature_date: { weight: CRITICAL_WEIGHT, level: 'critical' },
  },
  [DocumentType.CERTIFICATE_OF_INSURANCE]: {
    producer: { weight: STANDARD_WEIGHT, level: 'standard' },
    insured_name: { weight: CRITICAL_WEIGHT, level: 'critical' },
    policy_number: { weight: CRITICAL_WEIGHT, level: 'critical' },
    policy_effective_date: { weight: CRITICAL_WEIGHT, level: 'critical' },
    policy_expiration_date: { weight: CRITICAL_WEIGHT, level: 'critical' },
    insurance_company: { weight: CRITICAL_WEIGHT, level: 'critical' },
    coverage_type: { weight: STANDARD_WEIGHT, level: 'standard' },
    coverage_limit: { weight: STANDARD_WEIGHT, level: 'standard' },
    certificate_holder: { weight: STANDARD_WEIGHT, level: 'standard' },
  },
  [DocumentType.ARTICLES_OF_INCORPORATION]: {
    company_name: { weight: CRITICAL_WEIGHT, level: 'critical' },
    state_of_incorporation: { weight: CRITICAL_WEIGHT, level: 'critical' },
    incorporation_date: { weight: CRITICAL_WEIGHT, level: 'critical' },
    registered_agent_name: { weight: STANDARD_WEIGHT, level: 'standard' },
    registered_agent_address: { weight: STANDARD_WEIGHT, level: 'standard' },
    business_purpose: { weight: OPTIONAL_WEIGHT, level: 'optional' },
    authorized_shares: { weight: STANDARD_WEIGHT, level: 'standard' },
    incorporators: { weight: STANDARD_WEIGHT, level: 'standard' },
    filing_number: { weight: CRITICAL_WEIGHT, level: 'critical' },
  },
} as const;

export function getFieldWeight(documentType: DocumentTypeValue, fieldName: string): FieldWeightConfig {
  const weights = FIELD_WEIGHTS[documentType];
  return weights[fieldName] || { weight: STANDARD_WEIGHT, level: 'standard' };
}

export function getCriticalFields(documentType: DocumentTypeValue): string[] {
  const weights = FIELD_WEIGHTS[documentType];
  return Object.entries(weights)
    .filter(([_, config]) => config.level === 'critical')
    .map(([fieldName]) => fieldName);
}
