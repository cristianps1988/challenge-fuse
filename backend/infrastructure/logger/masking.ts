const SENSITIVE_FIELD_NAMES = new Set([
  'ssn',
  'ein',
  'ein_or_ssn',
  'social_security_number',
  'tax_id',
  'account_number',
  'account_number_masked',
  'id_number',
  'license_number',
  'passport_number',
  'credit_card',
  'card_number',
  'cvv',
  'password',
  'secret',
  'token',
  'api_key',
  'private_key',
]);

const SENSITIVE_PATTERNS = [
  { pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g, name: 'SSN' },
  { pattern: /\b\d{2}-?\d{7}\b/g, name: 'EIN' },
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, name: 'CC' },
  { pattern: /\b\d{8,17}\b/g, name: 'ACCT' },
];

export function maskValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  const str = String(value);

  if (str.includes('*')) {
    return str;
  }

  if (str.length <= 4) {
    return '****';
  }

  const lastFour = str.slice(-4);
  return `****${lastFour}`;
}

export function maskSensitivePatterns(value: string): string {
  let masked = value;

  for (const { pattern, name } of SENSITIVE_PATTERNS) {
    masked = masked.replace(pattern, (match) => {
      if (match.length > 4) {
        const lastFour = match.slice(-4);
        return `[${name}:****${lastFour}]`;
      }
      return `[${name}:****]`;
    });
  }

  return masked;
}

export function isSensitiveField(fieldName: string): boolean {
  const normalized = fieldName.toLowerCase().replace(/[_-]/g, '');

  if (SENSITIVE_FIELD_NAMES.has(fieldName.toLowerCase())) {
    return true;
  }

  const sensitiveArray = Array.from(SENSITIVE_FIELD_NAMES);
  for (let i = 0; i < sensitiveArray.length; i++) {
    const sensitive = sensitiveArray[i];
    const normalizedSensitive = sensitive.replace(/[_-]/g, '');
    if (normalized.includes(normalizedSensitive)) {
      return true;
    }
  }

  return false;
}

export function maskObject<T = unknown>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return maskSensitivePatterns(obj) as T;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => maskObject(item)) as T;
  }

  const masked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveField(key)) {
      masked[key] = maskValue(value as string | number);
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskObject(value);
    } else if (typeof value === 'string') {
      masked[key] = maskSensitivePatterns(value);
    } else {
      masked[key] = value;
    }
  }

  return masked as T;
}

export function maskExtractedFields(fields: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};

  for (const [fieldName, fieldData] of Object.entries(fields)) {
    if (isSensitiveField(fieldName)) {
      if (typeof fieldData === 'object' && fieldData !== null && 'value' in fieldData) {
        masked[fieldName] = {
          ...fieldData,
          value: maskValue((fieldData as { value: string | number }).value),
        };
      } else {
        masked[fieldName] = maskValue(fieldData as string | number);
      }
    } else {
      masked[fieldName] = typeof fieldData === 'object' ? maskObject(fieldData) : fieldData;
    }
  }

  return masked;
}

export function maskLogContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!context) {
    return undefined;
  }

  return maskObject(context);
}
