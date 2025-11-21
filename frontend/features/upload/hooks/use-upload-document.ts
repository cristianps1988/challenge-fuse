import { useState } from 'react';

interface UploadResponse {
  documentId: string;
  filename: string;
  documentType: string;
  confidence: number;
  status: string;
  message: string;
}

interface UploadError {
  message: string;
  status?: number;
}

export function useUploadDocument() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<UploadError | null>(null);

  const uploadDocument = async (file: File): Promise<UploadResponse | null> => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError({ message: errorMessage });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setError(null);
  };

  return {
    uploadDocument,
    isUploading,
    error,
    reset,
  };
}
