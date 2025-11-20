import { Document } from '@/backend/domain/entities/Document.Entity';
import { DocumentStatus } from '@/backend/domain/document-status.constants';
import { DocumentType } from '@/backend/domain/value-objects/DocumentType.ValueObject';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import {
  DocumentAlreadyProcessedError,
  ValidationError,
} from '@/backend/domain/errors/Domain.Error';

describe('Document Entity', () => {
  describe('create', () => {
    it('should create new document with processing status', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);

      expect(doc.getId()).toBe('doc-1');
      expect(doc.getFileName()).toBe('test.pdf');
      expect(doc.getFilePath()).toBe('/path/test.pdf');
      expect(doc.getFileSize()).toBe(1024);
      expect(doc.getStatus()).toBe(DocumentStatus.PROCESSING);
      expect(doc.getType()).toBeNull();
      expect(doc.getClassificationConfidence()).toBeNull();
      expect(doc.getProcessedAt()).toBeNull();
      expect(doc.getReviewedAt()).toBeNull();
    });

    it('should set uploaded date on creation', () => {
      const beforeCreate = new Date();
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      const afterCreate = new Date();

      const uploadedAt = doc.getUploadedAt();
      expect(uploadedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(uploadedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('classify', () => {
    it('should classify document and update status to completed for high confidence', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      const type = DocumentType.bankStatement();
      const confidence = Confidence.create(0.9);

      doc.classify(type, confidence);

      expect(doc.getType()).toBe(type);
      expect(doc.getClassificationConfidence()).toBe(confidence);
      expect(doc.getStatus()).toBe(DocumentStatus.COMPLETED);
    });

    it('should classify document and update status to needs_review for low confidence', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      const type = DocumentType.bankStatement();
      const confidence = Confidence.create(0.5);

      doc.classify(type, confidence);

      expect(doc.getType()).toBe(type);
      expect(doc.getClassificationConfidence()).toBe(confidence);
      expect(doc.getStatus()).toBe(DocumentStatus.NEEDS_REVIEW);
    });

    it('should throw error when classifying already completed document', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      doc.classify(DocumentType.bankStatement(), Confidence.create(0.9));

      expect(() => {
        doc.classify(DocumentType.governmentId(), Confidence.create(0.85));
      }).toThrow(DocumentAlreadyProcessedError);
    });

    it('should throw error when classifying already reviewed document', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      doc.classify(DocumentType.bankStatement(), Confidence.create(0.5));
      doc.markAsReviewed();

      expect(() => {
        doc.classify(DocumentType.governmentId(), Confidence.create(0.85));
      }).toThrow(DocumentAlreadyProcessedError);
    });
  });

  describe('markAsCompleted', () => {
    it('should mark document as completed and set processed date', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      const beforeComplete = new Date();

      doc.markAsCompleted();
      const afterComplete = new Date();

      expect(doc.getStatus()).toBe(DocumentStatus.COMPLETED);
      const processedAt = doc.getProcessedAt();
      expect(processedAt).not.toBeNull();
      expect(processedAt!.getTime()).toBeGreaterThanOrEqual(beforeComplete.getTime());
      expect(processedAt!.getTime()).toBeLessThanOrEqual(afterComplete.getTime());
    });
  });

  describe('markAsNeedsReview', () => {
    it('should mark document as needs review', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);

      doc.markAsNeedsReview();

      expect(doc.getStatus()).toBe(DocumentStatus.NEEDS_REVIEW);
    });
  });

  describe('markAsReviewed', () => {
    it('should mark document as reviewed when in needs_review status', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      doc.markAsNeedsReview();
      const beforeReview = new Date();

      doc.markAsReviewed();
      const afterReview = new Date();

      expect(doc.getStatus()).toBe(DocumentStatus.REVIEWED);
      const reviewedAt = doc.getReviewedAt();
      expect(reviewedAt).not.toBeNull();
      expect(reviewedAt!.getTime()).toBeGreaterThanOrEqual(beforeReview.getTime());
      expect(reviewedAt!.getTime()).toBeLessThanOrEqual(afterReview.getTime());
    });

    it('should throw error when marking non-review document as reviewed', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);

      expect(() => doc.markAsReviewed()).toThrow(ValidationError);
    });
  });

  describe('markAsFailed', () => {
    it('should mark document as failed', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);

      doc.markAsFailed();

      expect(doc.getStatus()).toBe(DocumentStatus.FAILED);
    });
  });

  describe('changeType', () => {
    it('should change type when document needs review', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      doc.classify(DocumentType.bankStatement(), Confidence.create(0.5));
      const newType = DocumentType.governmentId();

      doc.changeType(newType);

      expect(doc.getType()).toBe(newType);
    });

    it('should throw error when changing type for non-review document', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      doc.classify(DocumentType.bankStatement(), Confidence.create(0.9));

      expect(() => {
        doc.changeType(DocumentType.governmentId());
      }).toThrow(ValidationError);
    });
  });

  describe('requiresReview', () => {
    it('should return true when confidence is below threshold', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      doc.classify(DocumentType.bankStatement(), Confidence.create(0.7));

      expect(doc.requiresReview(0.8)).toBe(true);
    });

    it('should return false when confidence is above threshold', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      doc.classify(DocumentType.bankStatement(), Confidence.create(0.9));

      expect(doc.requiresReview(0.8)).toBe(false);
    });

    it('should return true when no confidence is set', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);

      expect(doc.requiresReview(0.8)).toBe(true);
    });
  });

  describe('canBeProcessed', () => {
    it('should return true for processing status', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);

      expect(doc.canBeProcessed()).toBe(true);
    });

    it('should return true for needs_review status', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      doc.markAsNeedsReview();

      expect(doc.canBeProcessed()).toBe(true);
    });

    it('should return false for completed status', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      doc.markAsCompleted();

      expect(doc.canBeProcessed()).toBe(false);
    });

    it('should return false for reviewed status', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      doc.markAsNeedsReview();
      doc.markAsReviewed();

      expect(doc.canBeProcessed()).toBe(false);
    });

    it('should return false for failed status', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      doc.markAsFailed();

      expect(doc.canBeProcessed()).toBe(false);
    });
  });

  describe('status checking methods', () => {
    it('should correctly identify processing status', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);

      expect(doc.isProcessing()).toBe(true);
      expect(doc.isCompleted()).toBe(false);
      expect(doc.isNeedsReview()).toBe(false);
      expect(doc.isReviewed()).toBe(false);
      expect(doc.isFailed()).toBe(false);
    });

    it('should correctly identify completed status', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      doc.markAsCompleted();

      expect(doc.isProcessing()).toBe(false);
      expect(doc.isCompleted()).toBe(true);
      expect(doc.isNeedsReview()).toBe(false);
      expect(doc.isReviewed()).toBe(false);
      expect(doc.isFailed()).toBe(false);
    });

    it('should correctly identify needs_review status', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      doc.markAsNeedsReview();

      expect(doc.isProcessing()).toBe(false);
      expect(doc.isCompleted()).toBe(false);
      expect(doc.isNeedsReview()).toBe(true);
      expect(doc.isReviewed()).toBe(false);
      expect(doc.isFailed()).toBe(false);
    });

    it('should correctly identify reviewed status', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      doc.markAsNeedsReview();
      doc.markAsReviewed();

      expect(doc.isProcessing()).toBe(false);
      expect(doc.isCompleted()).toBe(false);
      expect(doc.isNeedsReview()).toBe(false);
      expect(doc.isReviewed()).toBe(true);
      expect(doc.isFailed()).toBe(false);
    });

    it('should correctly identify failed status', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      doc.markAsFailed();

      expect(doc.isProcessing()).toBe(false);
      expect(doc.isCompleted()).toBe(false);
      expect(doc.isNeedsReview()).toBe(false);
      expect(doc.isReviewed()).toBe(false);
      expect(doc.isFailed()).toBe(true);
    });
  });

  describe('hasType', () => {
    it('should return false for newly created document', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);

      expect(doc.hasType()).toBe(false);
    });

    it('should return true after classification', () => {
      const doc = Document.create('doc-1', 'test.pdf', '/path/test.pdf', 1024);
      doc.classify(DocumentType.bankStatement(), Confidence.create(0.9));

      expect(doc.hasType()).toBe(true);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute document from stored data', () => {
      const uploadedAt = new Date('2024-01-01');
      const processedAt = new Date('2024-01-02');
      const type = DocumentType.bankStatement();
      const confidence = Confidence.create(0.9);

      const doc = Document.reconstitute({
        id: 'doc-1',
        fileName: 'test.pdf',
        filePath: '/path/test.pdf',
        fileSize: 1024,
        status: DocumentStatus.COMPLETED,
        type,
        classificationConfidence: confidence,
        uploadedAt,
        processedAt,
        reviewedAt: null,
      });

      expect(doc.getId()).toBe('doc-1');
      expect(doc.getFileName()).toBe('test.pdf');
      expect(doc.getStatus()).toBe(DocumentStatus.COMPLETED);
      expect(doc.getType()).toBe(type);
      expect(doc.getClassificationConfidence()).toBe(confidence);
      expect(doc.getUploadedAt()).toBe(uploadedAt);
      expect(doc.getProcessedAt()).toBe(processedAt);
      expect(doc.getReviewedAt()).toBeNull();
    });
  });
});