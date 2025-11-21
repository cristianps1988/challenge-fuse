import { useState, useEffect } from 'react';

interface Document {
  id: string;
  filename: string;
  documentType: string;
  status: string;
  classificationConfidence: number;
  extractionConfidence: number;
  createdAt: string;
}

interface UseDocumentsOptions {
  status?: string;
  type?: string;
  refreshTrigger?: number;
}

export function useDocuments({ status, type, refreshTrigger }: UseDocumentsOptions = {}) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (type) params.append('type', type);

        const response = await fetch(`/api/documents?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setDocuments(data.documents || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch documents';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [status, type, refreshTrigger]);

  return {
    documents,
    isLoading,
    error,
  };
}
