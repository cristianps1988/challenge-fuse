'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { Input } from '@/frontend/components/ui/input';
import { Label } from '@/frontend/components/ui/label';
import { Button } from '@/frontend/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select';
import { ConfidenceIndicator } from '@/frontend/components/ConfidenceIndicator';
import { LoadingSpinner } from '@/frontend/components/LoadingSpinner';
import { ErrorMessage } from '@/frontend/components/ErrorMessage';
import { DocumentType, DocumentTypeLabel, DocumentTypeValue } from '@/backend/domain/document-types.constants';
import { Save, RotateCcw } from 'lucide-react';

interface FieldValue {
  name: string;
  value: string;
  confidence: number;
}

interface FieldEditorProps {
  documentId: string;
  currentType: string;
  fields: Record<string, FieldValue>;
  onSave: () => void;
}

export function FieldEditor({ documentId, currentType, fields, onSave }: FieldEditorProps) {
  const [documentType, setDocumentType] = useState(currentType);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value]))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
    setHasChanges(true);
  };

  const handleTypeChange = (newType: string) => {
    setDocumentType(newType);
    setHasChanges(true);
  };

  const handleReset = () => {
    setDocumentType(currentType);
    setFieldValues(
      Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value]))
    );
    setHasChanges(false);
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const corrections: {
        documentType?: string;
        fieldCorrections?: Record<string, string>;
      } = {};

      if (documentType !== currentType) {
        corrections.documentType = documentType;
      }

      const changedFields: Record<string, string> = {};
      Object.entries(fieldValues).forEach(([key, value]) => {
        if (value !== fields[key]?.value) {
          changedFields[key] = value;
        }
      });

      if (Object.keys(changedFields).length > 0) {
        corrections.fieldCorrections = changedFields;
      }

      if (Object.keys(corrections).length === 0) {
        setError('No changes to save');
        return;
      }

      const response = await fetch(`/api/documents/${documentId}/correct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...corrections,
          correctedBy: 'user',
          notes: 'Manual correction from UI',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save corrections' }));
        throw new Error(errorData.error || 'Failed to save corrections');
      }

      setHasChanges(false);
      onSave();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save corrections';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Details</CardTitle>
        <CardDescription>
          Review and correct extracted data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

        <div className="space-y-2">
          <Label htmlFor="document-type">Document Type</Label>
          <Select value={documentType} onValueChange={handleTypeChange}>
            <SelectTrigger id="document-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(DocumentType).map((value) => (
                <SelectItem key={value} value={value}>
                  {DocumentTypeLabel[value as DocumentTypeValue]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold mb-4">Extracted Fields</h3>
          <div className="space-y-4">
            {Object.entries(fields).map(([key, field]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={key} className="capitalize">
                    {field.name.replace(/_/g, ' ')}
                  </Label>
                  <div className="w-48">
                    <ConfidenceIndicator confidence={field.confidence} size="sm" />
                  </div>
                </div>
                <Input
                  id={key}
                  value={fieldValues[key] || ''}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  placeholder={`Enter ${field.name.replace(/_/g, ' ')}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t">
          <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="min-w-[120px]">
            {isSaving ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges || isSaving}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
