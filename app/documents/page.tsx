'use client';

import { useState } from 'react';
import { DocumentList } from '@/frontend/features/upload/components/DocumentList';
import { Button } from '@/frontend/components/ui/button';
import { FileText } from 'lucide-react';

export default function DocumentsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
          <p className="text-gray-600">
            View and manage all processed documents
          </p>
        </div>
        <Button onClick={handleRefresh}>
          <FileText className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <DocumentList refreshTrigger={refreshTrigger} />
    </div>
  );
}