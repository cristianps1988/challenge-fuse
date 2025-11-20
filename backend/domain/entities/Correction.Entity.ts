import { DocumentType } from '@/backend/domain/value-objects/DocumentType.ValueObject';

interface FieldCorrection {
  fieldName: string;
  originalValue: string | number | boolean | null;
  correctedValue: string | number | boolean | null;
}

export class Correction {
  private constructor(
    private readonly id: string,
    private readonly documentId: string,
    private readonly extractionId: string,
    private readonly originalType: DocumentType | null,
    private readonly correctedType: DocumentType | null,
    private readonly fieldCorrections: FieldCorrection[],
    private readonly correctedBy: string,
    private readonly correctedAt: Date,
    private readonly notes: string | null
  ) {}

  static create(
    id: string,
    documentId: string,
    extractionId: string,
    originalType: DocumentType | null,
    correctedType: DocumentType | null,
    fieldCorrections: FieldCorrection[],
    correctedBy: string,
    notes: string | null = null
  ): Correction {
    return new Correction(
      id,
      documentId,
      extractionId,
      originalType,
      correctedType,
      fieldCorrections,
      correctedBy,
      new Date(),
      notes
    );
  }

  static reconstitute(props: {
    id: string;
    documentId: string;
    extractionId: string;
    originalType: DocumentType | null;
    correctedType: DocumentType | null;
    fieldCorrections: FieldCorrection[];
    correctedBy: string;
    correctedAt: Date;
    notes: string | null;
  }): Correction {
    return new Correction(
      props.id,
      props.documentId,
      props.extractionId,
      props.originalType,
      props.correctedType,
      props.fieldCorrections,
      props.correctedBy,
      props.correctedAt,
      props.notes
    );
  }

  hasTypeCorrection(): boolean {
    return (
      this.originalType !== null &&
      this.correctedType !== null &&
      !this.originalType.equals(this.correctedType)
    );
  }

  hasFieldCorrections(): boolean {
    return this.fieldCorrections.length > 0;
  }

  getFieldCorrectionCount(): number {
    return this.fieldCorrections.length;
  }

  getCorrectedFields(): string[] {
    return this.fieldCorrections.map(fc => fc.fieldName);
  }

  getFieldCorrection(fieldName: string): FieldCorrection | undefined {
    return this.fieldCorrections.find(fc => fc.fieldName === fieldName);
  }

  getId(): string {
    return this.id;
  }

  getDocumentId(): string {
    return this.documentId;
  }

  getExtractionId(): string {
    return this.extractionId;
  }

  getOriginalType(): DocumentType | null {
    return this.originalType;
  }

  getCorrectedType(): DocumentType | null {
    return this.correctedType;
  }

  getFieldCorrections(): FieldCorrection[] {
    return [...this.fieldCorrections];
  }

  getCorrectedBy(): string {
    return this.correctedBy;
  }

  getCorrectedAt(): Date {
    return this.correctedAt;
  }

  getNotes(): string | null {
    return this.notes;
  }
}