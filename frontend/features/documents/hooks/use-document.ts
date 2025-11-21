import { useState, useEffect } from 'react';

interface FieldValue {
  name: string;
  value: string;
  confidence: number;
  page: number | null;
}

interface ExtractedField {
  name: string;
  value: string | null;
  confidence: number;
  page: number | null;
}

interface Extraction {
  id: string;
  fields: Record<string, FieldValue>;
  overallConfidence: number;
  extractedAt: string;
}

interface Correction {
  id: string;
  correctedBy: string;
  correctedAt: string;
  notes: string | null;
  typeCorrection: {
    from: string;
    to: string;
  } | null;
  fieldCorrections: Record<string, { from: string; to: string }> | null;
}

interface Document {
  id: string;
  filename: string;
  documentType: string;
  status: string;
  classificationConfidence: number;
  createdAt: string;
  updatedAt: string;
  extraction: Extraction | null;
  corrections: Correction[];
}

export function useDocument(documentId: string) {
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocument = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents/${documentId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Document not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const transformedData: Document = {
        id: data.id,
        filename: data.fileName,
        documentType: data.documentType,
        status: data.status,
        classificationConfidence: data.classificationConfidence,
        createdAt: data.createdAt,
        updatedAt: data.processedAt || data.createdAt,
        extraction: data.extractedFields && data.extractedFields.length > 0 ? {
          id: data.id,
          fields: data.extractedFields.reduce((acc: Record<string, FieldValue>, field: ExtractedField) => {
            acc[field.name] = {
              name: field.name,
              value: field.value ?? '',
              confidence: field.confidence,
              page: field.page ?? null,
            };
            return acc;
          }, {}),
          overallConfidence: data.overallExtractionConfidence,
          extractedAt: data.processedAt || data.createdAt,
        } : null,
        corrections: data.corrections || [],
      };

      setDocument(transformedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch document';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const refresh = () => {
    fetchDocument();
  };

  return {
    document,
    isLoading,
    error,
    refresh,
  };
}
