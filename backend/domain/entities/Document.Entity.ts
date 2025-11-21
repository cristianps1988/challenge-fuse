import { DocumentStatus, DocumentStatusValue } from '@/backend/domain/document-status.constants';
import { DocumentType } from '@/backend/domain/value-objects/DocumentType.ValueObject';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import {
  DocumentAlreadyProcessedError,
  ValidationError,
} from '@/backend/domain/errors/Domain.Error';

export class Document {
  private constructor(
    private readonly id: string,
    private readonly fileName: string,
    private readonly filePath: string,
    private readonly fileSize: number,
    private status: DocumentStatusValue,
    private type: DocumentType | null,
    private classificationConfidence: Confidence | null,
    private readonly uploadedAt: Date,
    private processedAt: Date | null,
    private reviewedAt: Date | null
  ) {}

  static create(
    id: string,
    fileName: string,
    filePath: string,
    fileSize: number
  ): Document {
    return new Document(
      id,
      fileName,
      filePath,
      fileSize,
      DocumentStatus.PROCESSING,
      null,
      null,
      new Date(),
      null,
      null
    );
  }

  static reconstitute(props: {
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    status: DocumentStatusValue;
    type: DocumentType | null;
    classificationConfidence: Confidence | null;
    uploadedAt: Date;
    processedAt: Date | null;
    reviewedAt: Date | null;
  }): Document {
    return new Document(
      props.id,
      props.fileName,
      props.filePath,
      props.fileSize,
      props.status,
      props.type,
      props.classificationConfidence,
      props.uploadedAt,
      props.processedAt,
      props.reviewedAt
    );
  }

  classify(type: DocumentType, confidence: Confidence): void {
    if (this.isCompleted() || this.isReviewed()) {
      throw new DocumentAlreadyProcessedError(this.id);
    }

    this.type = type;
    this.classificationConfidence = confidence;
    this.updateStatusAfterClassification();
  }

  private updateStatusAfterClassification(): void {
    if (!this.classificationConfidence) {
      return;
    }

    if (this.classificationConfidence.isLow(0.60)) {
      this.status = DocumentStatus.NEEDS_REVIEW;
    } else {
      this.status = DocumentStatus.COMPLETED;
    }
  }

  markAsCompleted(): void {
    this.status = DocumentStatus.COMPLETED;
    this.processedAt = new Date();
  }

  markAsNeedsReview(): void {
    this.status = DocumentStatus.NEEDS_REVIEW;
  }

  markAsReviewed(): void {
    if (!this.isNeedsReview()) {
      throw new ValidationError('Document must be in needs_review status to be reviewed', {
        currentStatus: this.status,
      });
    }

    this.status = DocumentStatus.REVIEWED;
    this.reviewedAt = new Date();
  }

  markAsFailed(): void {
    this.status = DocumentStatus.FAILED;
  }

  changeType(newType: DocumentType): void {
    if (!this.isNeedsReview()) {
      throw new ValidationError('Can only change type for documents that need review', {
        currentStatus: this.status,
      });
    }

    this.type = newType;
  }

  requiresReview(threshold: number): boolean {
    if (!this.classificationConfidence) {
      return true;
    }

    return this.classificationConfidence.requiresReview(threshold);
  }

  canBeProcessed(): boolean {
    return this.isProcessing() || this.isNeedsReview();
  }

  isProcessing(): boolean {
    return this.status === DocumentStatus.PROCESSING;
  }

  isCompleted(): boolean {
    return this.status === DocumentStatus.COMPLETED;
  }

  isNeedsReview(): boolean {
    return this.status === DocumentStatus.NEEDS_REVIEW;
  }

  isReviewed(): boolean {
    return this.status === DocumentStatus.REVIEWED;
  }

  isFailed(): boolean {
    return this.status === DocumentStatus.FAILED;
  }

  hasType(): boolean {
    return this.type !== null;
  }

  getId(): string {
    return this.id;
  }

  getFileName(): string {
    return this.fileName;
  }

  getFilePath(): string {
    return this.filePath;
  }

  getFileSize(): number {
    return this.fileSize;
  }

  getStatus(): DocumentStatusValue {
    return this.status;
  }

  getType(): DocumentType | null {
    return this.type;
  }

  getClassificationConfidence(): Confidence | null {
    return this.classificationConfidence;
  }

  getUploadedAt(): Date {
    return this.uploadedAt;
  }

  getProcessedAt(): Date | null {
    return this.processedAt;
  }

  getReviewedAt(): Date | null {
    return this.reviewedAt;
  }
}