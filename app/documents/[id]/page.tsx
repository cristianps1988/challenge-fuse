'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/frontend/components/ui/button';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { LoadingSpinner } from '@/frontend/components/LoadingSpinner';
import { ErrorMessage } from '@/frontend/components/ErrorMessage';
import { StatusBadge } from '@/frontend/components/StatusBadge';
import { ConfidenceIndicator } from '@/frontend/components/ConfidenceIndicator';
import { PdfViewer } from '@/frontend/features/documents/components/PdfViewer';
import { FieldEditor } from '@/frontend/features/documents/components/FieldEditor';
import { useDocument } from '@/frontend/features/documents/hooks/use-document';
import { DocumentTypeLabel, DocumentTypeValue } from '@/backend/domain/document-types.constants';
import { DocumentStatusValue } from '@/backend/domain/document-status.constants';

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { document, isLoading, error, refresh } = useDocument(resolvedParams.id);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="py-12">
            <LoadingSpinner size="lg" text="Loading document..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="py-12">
            <ErrorMessage
              title="Failed to load document"
              message={error || 'Document not found'}
            />
            <div className="mt-6 text-center">
              <Link href="/documents">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Documents
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/upload">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{document.filename}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {DocumentTypeLabel[document.documentType as DocumentTypeValue] || document.documentType}
            </p>
          </div>
        </div>
        <StatusBadge status={document.status as DocumentStatusValue} />
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Classification Confidence</p>
              <div className="mt-2 w-64">
                <ConfidenceIndicator confidence={document.classificationConfidence} />
              </div>
            </div>
            {document.extraction && (
              <div>
                <p className="text-sm font-medium text-gray-700">Extraction Confidence</p>
                <div className="mt-2 w-64">
                  <ConfidenceIndicator confidence={document.extraction.overallConfidence} />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PdfViewer documentId={document.id} filename={document.filename} />

        {document.extraction && (
          <FieldEditor
            documentId={document.id}
            currentType={document.documentType}
            fields={document.extraction.fields}
            onSave={refresh}
          />
        )}
      </div>

      {document.corrections && document.corrections.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h3 className="text-sm font-semibold mb-3">Correction History</h3>
            <div className="space-y-2">
              {document.corrections.map((correction) => (
                <div key={correction.id} className="text-sm text-gray-600 border-l-2 border-blue-500 pl-3 py-1">
                  <p>
                    <span className="font-medium">{correction.correctedBy}</span> made corrections
                  </p>
                  <p className="text-xs text-gray-500">{new Date(correction.correctedAt).toLocaleString()}</p>
                  {correction.notes && (
                    <p className="text-xs mt-1 italic">{correction.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
