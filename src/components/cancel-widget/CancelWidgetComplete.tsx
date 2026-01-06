import { CheckCircle, XCircle } from 'lucide-react';

interface CancelWidgetCompleteProps {
  status: 'saved' | 'cancelled' | null;
  offerAccepted: boolean;
}

export function CancelWidgetComplete({ status, offerAccepted }: CancelWidgetCompleteProps) {
  const isSaved = status === 'saved' && offerAccepted;

  return (
    <div className="text-center py-8">
      {isSaved ? (
        <>
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Great! Your offer has been applied
          </h2>
          <p style={{ color: 'var(--widget-muted, #94a3b8)' }}>
            Thank you for staying with us. Your discount has been applied to your account.
          </p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Your subscription has been cancelled
          </h2>
          <p style={{ color: 'var(--widget-muted, #94a3b8)' }}>
            We're sorry to see you go. You'll continue to have access until the end of your billing period.
          </p>
        </>
      )}
    </div>
  );
}
