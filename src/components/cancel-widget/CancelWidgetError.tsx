import { AlertCircle } from 'lucide-react';

interface CancelWidgetErrorProps {
  message: string;
}

export function CancelWidgetError({ message }: CancelWidgetErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold mb-2">Unable to Load</h2>
      <p style={{ color: 'var(--widget-muted, #94a3b8)' }}>{message}</p>
    </div>
  );
}
