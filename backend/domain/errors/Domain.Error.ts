export class DomainError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DomainError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DocumentNotFoundError extends DomainError {
  constructor(message: string = 'Document not found') {
    super(message);
    this.name = 'DocumentNotFoundError';
  }
}

export class InvalidConfidenceError extends DomainError {
  constructor(value: number) {
    super('Invalid confidence value', { value });
    this.name = 'InvalidConfidenceError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'ValidationError';
  }
}

export class InvalidDocumentTypeError extends DomainError {
  constructor(type: string) {
    super('Invalid document type', { type });
    this.name = 'InvalidDocumentTypeError';
  }
}

export class InvalidDocumentStatusError extends DomainError {
  constructor(status: string) {
    super('Invalid document status', { status });
    this.name = 'InvalidDocumentStatusError';
  }
}

export class DocumentAlreadyProcessedError extends DomainError {
  constructor(documentId: string) {
    super('Document has already been processed', { documentId });
    this.name = 'DocumentAlreadyProcessedError';
  }
}

export class ExtractionNotFoundError extends DomainError {
  constructor(message: string = 'Extraction not found') {
    super(message);
    this.name = 'ExtractionNotFoundError';
  }
}

export class CorrectionNotFoundError extends DomainError {
  constructor(correctionId: string) {
    super('Correction not found', { correctionId });
    this.name = 'CorrectionNotFoundError';
  }
}