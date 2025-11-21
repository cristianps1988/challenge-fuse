'use client';

import { useCallback, useState } from 'react';
import { Upload, FileIcon, X } from 'lucide-react';
import { Button } from '@/frontend/components/ui/button';
import { useUploadDocument } from '../hooks/use-upload-document';
import { ErrorMessage } from '@/frontend/components/ErrorMessage';
import { LoadingSpinner } from '@/frontend/components/LoadingSpinner';

interface DropzoneProps {
  onUploadSuccess?: (documentId: string) => void;
}

export function Dropzone({ onUploadSuccess }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { uploadDocument, isUploading, error, reset } = useUploadDocument();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are supported';
    }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }
    return null;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      reset();

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const file = files[0];
        const validationError = validateFile(file);
        if (validationError) {
          return;
        }
        setSelectedFile(file);
      }
    },
    [reset]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      reset();
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        const validationError = validateFile(file);
        if (validationError) {
          return;
        }
        setSelectedFile(file);
      }
    },
    [reset]
  );

  const handleUpload = async () => {
    if (!selectedFile) return;

    const result = await uploadDocument(selectedFile);
    if (result) {
      setSelectedFile(null);
      onUploadSuccess?.(result.documentId);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    reset();
  };

  return (
    <div className="space-y-4">
      {error && (
        <ErrorMessage
          message={error.message}
          onDismiss={reset}
        />
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {!selectedFile ? (
          <>
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">
                Drop your PDF file here
              </p>
              <p className="text-sm text-gray-500">
                or
              </p>
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span className="cursor-pointer">Browse files</span>
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Supported: PDF files up to 10MB
            </p>
          </>
        ) : (
          <div className="space-y-4">
            <FileIcon className="mx-auto h-12 w-12 text-blue-600" />
            <div>
              <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="min-w-[120px]"
              >
                {isUploading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isUploading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
