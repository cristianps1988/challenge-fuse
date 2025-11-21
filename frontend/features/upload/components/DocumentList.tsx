'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/frontend/components/ui/table';
import { Button } from '@/frontend/components/ui/button';
import { StatusBadge } from '@/frontend/components/StatusBadge';
import { ConfidenceIndicator } from '@/frontend/components/ConfidenceIndicator';
import { EmptyState } from '@/frontend/components/EmptyState';
import { LoadingSpinner } from '@/frontend/components/LoadingSpinner';
import { ErrorMessage } from '@/frontend/components/ErrorMessage';
import { useDocuments } from '../hooks/use-documents';
import { DocumentTypeLabel, DocumentTypeValue } from '@/backend/domain/document-types.constants';
import { DocumentStatusValue } from '@/backend/domain/document-status.constants';

interface DocumentListProps {
  refreshTrigger?: number;
}

export function DocumentList({ refreshTrigger }: DocumentListProps) {
  const { documents, isLoading, error } = useDocuments({ refreshTrigger });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <LoadingSpinner size="lg" text="Loading documents..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <ErrorMessage message={error} />
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <EmptyState
            title="No documents yet"
            description="Upload your first PDF document to get started with automated classification and extraction"
            icon={<FileText className="h-8 w-8 text-gray-400" />}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Filename</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Extraction</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.filename}</TableCell>
                <TableCell>
                  {DocumentTypeLabel[doc.documentType as DocumentTypeValue] || doc.documentType}
                </TableCell>
                <TableCell>
                  <StatusBadge status={doc.status as DocumentStatusValue} />
                </TableCell>
                <TableCell>
                  <div className="max-w-[150px]">
                    <ConfidenceIndicator
                      confidence={doc.classificationConfidence || 0}
                      size="sm"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[150px]">
                    <ConfidenceIndicator
                      confidence={doc.extractionConfidence || 0}
                      size="sm"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/documents/${doc.id}`}>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
