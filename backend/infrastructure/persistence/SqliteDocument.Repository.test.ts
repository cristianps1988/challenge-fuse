import { SqliteDocumentRepository } from './SqliteDocument.Repository';
import { Document } from '@/backend/domain/entities/Document.Entity';
import { DocumentType } from '@/backend/domain/value-objects/DocumentType.ValueObject';
import { Confidence } from '@/backend/domain/value-objects/Confidence.ValueObject';
import { DocumentStatus } from '@/backend/domain/document-status.constants';
import { runMigrations, resetDatabase } from './migrations';

describe('SqliteDocumentRepository', () => {
  let repository: SqliteDocumentRepository;

  beforeAll(() => {
    runMigrations();
  });

  beforeEach(() => {
    resetDatabase();
    repository = new SqliteDocumentRepository();
  });

  describe('save', () => {
    it('should save a new document', async () => {
      const document = Document.create(
        'doc-1',
        'test.pdf',
        '/uploads/test.pdf',
        1024
      );

      await repository.save(document);

      const found = await repository.findById('doc-1');
      expect(found).not.toBeNull();
      expect(found?.getId()).toBe('doc-1');
      expect(found?.getFileName()).toBe('test.pdf');
    });
  });

  describe('findById', () => {
    it('should return null when document does not exist', async () => {
      const found = await repository.findById('non-existent');
      expect(found).toBeNull();
    });

    it('should find a document by id', async () => {
      const document = Document.create(
        'doc-2',
        'test2.pdf',
        '/uploads/test2.pdf',
        2048
      );
      await repository.save(document);

      const found = await repository.findById('doc-2');
      expect(found).not.toBeNull();
      expect(found?.getFileName()).toBe('test2.pdf');
    });
  });

  describe('update', () => {
    it('should update a document', async () => {
      const document = Document.create(
        'doc-3',
        'test3.pdf',
        '/uploads/test3.pdf',
        3072
      );
      await repository.save(document);

      document.classify(
        DocumentType.bankStatement(),
        Confidence.create(0.95)
      );

      await repository.update(document);

      const found = await repository.findById('doc-3');
      expect(found?.getStatus()).toBe(DocumentStatus.COMPLETED);
      expect(found?.getType()?.getValue()).toBe('bank_statement');
    });

    it('should throw error when updating non-existent document', async () => {
      const document = Document.create(
        'non-existent',
        'test.pdf',
        '/uploads/test.pdf',
        1024
      );

      await expect(repository.update(document)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return all documents', async () => {
      const doc1 = Document.create('doc-4', 'test4.pdf', '/uploads/test4.pdf', 1024);
      const doc2 = Document.create('doc-5', 'test5.pdf', '/uploads/test5.pdf', 2048);

      await repository.save(doc1);
      await repository.save(doc2);

      const documents = await repository.findAll();
      expect(documents).toHaveLength(2);
    });

    it('should filter documents by status', async () => {
      const doc1 = Document.create('doc-6', 'test6.pdf', '/uploads/test6.pdf', 1024);
      const doc2 = Document.create('doc-7', 'test7.pdf', '/uploads/test7.pdf', 2048);

      doc2.markAsCompleted();

      await repository.save(doc1);
      await repository.save(doc2);

      const processing = await repository.findAll({ status: DocumentStatus.PROCESSING });
      const completed = await repository.findAll({ status: DocumentStatus.COMPLETED });

      expect(processing).toHaveLength(1);
      expect(completed).toHaveLength(1);
    });

    it('should apply limit and offset', async () => {
      for (let i = 0; i < 5; i++) {
        const doc = Document.create(`doc-${i}`, `test${i}.pdf`, `/uploads/test${i}.pdf`, 1024);
        await repository.save(doc);
      }

      const first2 = await repository.findAll({ limit: 2 });
      const next2 = await repository.findAll({ limit: 2, offset: 2 });

      expect(first2).toHaveLength(2);
      expect(next2).toHaveLength(2);
      expect(first2[0].getId()).not.toBe(next2[0].getId());
    });
  });

  describe('delete', () => {
    it('should delete a document', async () => {
      const document = Document.create(
        'doc-8',
        'test8.pdf',
        '/uploads/test8.pdf',
        1024
      );
      await repository.save(document);

      await repository.delete('doc-8');

      const found = await repository.findById('doc-8');
      expect(found).toBeNull();
    });

    it('should throw error when deleting non-existent document', async () => {
      await expect(repository.delete('non-existent')).rejects.toThrow();
    });
  });

  describe('count', () => {
    it('should count all documents', async () => {
      const doc1 = Document.create('doc-9', 'test9.pdf', '/uploads/test9.pdf', 1024);
      const doc2 = Document.create('doc-10', 'test10.pdf', '/uploads/test10.pdf', 2048);

      await repository.save(doc1);
      await repository.save(doc2);

      const count = await repository.count();
      expect(count).toBe(2);
    });

    it('should count documents by status', async () => {
      const doc1 = Document.create('doc-11', 'test11.pdf', '/uploads/test11.pdf', 1024);
      const doc2 = Document.create('doc-12', 'test12.pdf', '/uploads/test12.pdf', 2048);

      doc2.markAsCompleted();

      await repository.save(doc1);
      await repository.save(doc2);

      const processingCount = await repository.count({ status: DocumentStatus.PROCESSING });
      const completedCount = await repository.count({ status: DocumentStatus.COMPLETED });

      expect(processingCount).toBe(1);
      expect(completedCount).toBe(1);
    });
  });
});
