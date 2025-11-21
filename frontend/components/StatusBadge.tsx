import { Badge } from '@/frontend/components/ui/badge';
import { DocumentStatusValue, StatusConfig } from '@/backend/domain/document-status.constants';

interface StatusBadgeProps {
  status: DocumentStatusValue;
  className?: string;
}

const variantMap = {
  default: 'default',
  success: 'default',
  warning: 'secondary',
  info: 'outline',
  destructive: 'destructive',
} as const;

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = StatusConfig[status];
  const variant = variantMap[config.variant as keyof typeof variantMap];

  return (
    <Badge variant={variant} className={className}>
      {config.label}
    </Badge>
  );
}
