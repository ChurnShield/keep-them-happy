import { ChurnSignal } from '@/hooks/useCustomers';
import { Clock, CreditCard, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignalsListProps {
  signals: ChurnSignal[];
  variant?: 'inline' | 'timeline';
}

const signalIcons: Record<ChurnSignal['type'], typeof Clock> = {
  inactive: Clock,
  past_due: CreditCard,
  recently_canceled: UserX,
};

const severityColors: Record<ChurnSignal['severity'], string> = {
  high: 'text-red-500 bg-red-500/10 border-red-500/20',
  medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  low: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20',
};

export function SignalsList({ signals, variant = 'inline' }: SignalsListProps) {
  if (signals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No risk signals detected</p>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap gap-2">
        {signals.map((signal) => {
          const Icon = signalIcons[signal.type];
          return (
            <div
              key={signal.id}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium',
                severityColors[signal.severity]
              )}
            >
              <Icon className="h-3 w-3" />
              <span>{signal.description}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Timeline variant
  return (
    <div className="space-y-4">
      {signals.map((signal, index) => {
        const Icon = signalIcons[signal.type];
        const isLast = index === signals.length - 1;

        return (
          <div key={signal.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2',
                  severityColors[signal.severity]
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              {!isLast && <div className="h-full w-0.5 bg-border mt-2" />}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground">{signal.label}</h4>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full capitalize',
                    severityColors[signal.severity]
                  )}
                >
                  {signal.severity}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{signal.description}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Triggered: {new Date(signal.triggeredAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
