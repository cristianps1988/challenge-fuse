'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Dropzone } from '@/frontend/features/upload/components/Dropzone';
import { DocumentList } from '@/frontend/features/upload/components/DocumentList';

export default function UploadPage() {
  const router = useRouter();
  const [refreshTrigger] = useState(0);

  const handleUploadSuccess = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Documents</h1>
        <p className="text-gray-600">
          Upload PDF documents for automatic classification and data extraction
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload PDF Document</CardTitle>
          <CardDescription>
            Supported document types: Bank Statements, Government IDs, W-9 Forms, Certificates of Insurance, and Articles of Incorporation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dropzone onUploadSuccess={handleUploadSuccess} />
        </CardContent>
      </Card>

      <DocumentList refreshTrigger={refreshTrigger} />
    </div>
  );
}
