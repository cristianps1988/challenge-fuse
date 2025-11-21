'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Button } from '@/frontend/components/ui/button';
import { Download, FileText } from 'lucide-react';

interface PdfViewerProps {
  documentId: string;
  filename: string;
}

export function PdfViewer({ documentId, filename }: PdfViewerProps) {
  const pdfUrl = `/api/documents/${documentId}/file`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-600" />
          <CardTitle className="text-lg">{filename}</CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[600px] bg-gray-100 rounded-lg overflow-hidden border">
          <iframe
            src={`${pdfUrl}#view=FitH`}
            className="w-full h-full"
            title={filename}
          />
        </div>
      </CardContent>
    </Card>
  );
}
