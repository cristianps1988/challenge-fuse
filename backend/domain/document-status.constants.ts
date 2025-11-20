export const DocumentStatus = {
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  NEEDS_REVIEW: 'needs_review',
  REVIEWED: 'reviewed',
  FAILED: 'failed',
} as const;

export type DocumentStatusValue = typeof DocumentStatus[keyof typeof DocumentStatus];

export const DOCUMENT_STATUS = DocumentStatus;

export const StatusConfig: Record<DocumentStatusValue, { label: string; variant: string }> = {
  [DocumentStatus.PROCESSING]: { label: 'Processing', variant: 'default' },
  [DocumentStatus.COMPLETED]: { label: 'Completed', variant: 'success' },
  [DocumentStatus.NEEDS_REVIEW]: { label: 'Needs Review', variant: 'warning' },
  [DocumentStatus.REVIEWED]: { label: 'Reviewed', variant: 'info' },
  [DocumentStatus.FAILED]: { label: 'Failed', variant: 'destructive' },
} as const;