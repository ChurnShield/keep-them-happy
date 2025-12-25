import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Clock, DollarSign, Inbox, ArrowRight } from 'lucide-react';
import { useRecoveryCases, getTimeRemaining, getUrgencyLevel, RecoveryCase } from '@/hooks/useRecoveryCases';
import { formatDistanceToNow } from 'date-fns';

function CountdownTimer({ deadline_at }: { deadline_at: string }) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(deadline_at));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(deadline_at));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadline_at]);

  if (timeRemaining.isExpired) {
    return <span className="text-destructive font-medium">Expired</span>;
  }

  return (
    <span className="font-mono">
      {timeRemaining.hours}h {timeRemaining.minutes}m remaining
    </span>
  );
}

function CaseCard({ recoveryCase }: { recoveryCase: RecoveryCase }) {
  const navigate = useNavigate();
  const urgency = getUrgencyLevel(recoveryCase);
  const { isExpired } = getTimeRemaining(recoveryCase.deadline_at);

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        urgency === 'high_risk' ? 'border-destructive/50 bg-destructive/5' : ''
      }`}
      onClick={() => navigate(`/recovery/${recoveryCase.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium truncate">{recoveryCase.customer_reference}</span>
              {urgency === 'high_risk' && !isExpired && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  High Risk
                </Badge>
              )}
              {isExpired && (
                <Badge variant="secondary">Expired</Badge>
              )}
              {urgency === 'normal' && !isExpired && (
                <Badge variant="outline">Normal</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {recoveryCase.amount_at_risk.toLocaleString(undefined, {
                  style: 'currency',
                  currency: recoveryCase.currency,
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <CountdownTimer deadline_at={recoveryCase.deadline_at} />
              </span>
            </div>

            {!recoveryCase.first_action_at && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                No recovery attempt made yet
              </p>
            )}
          </div>

          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No open recovery cases</h3>
        <p className="text-muted-foreground max-w-sm mb-4">
          Recovery cases are created when a customer's payment fails. 
          You have 48 hours to reach out and help them resolve the issue before 
          their subscription is at risk of churning.
        </p>
        <p className="text-sm text-muted-foreground">
          When a payment fails, a new case will appear here automatically.
        </p>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function RecoveryInbox() {
  const { getOpenCases, loading, error, stats } = useRecoveryCases();
  const openCases = getOpenCases();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Recovery Inbox</h1>
          <p className="text-muted-foreground">
            Active payment recovery cases that need your attention.
          </p>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.open}</p>
              <p className="text-xs text-muted-foreground">Open</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.recovered}</p>
              <p className="text-xs text-muted-foreground">Recovered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{stats.expired}</p>
              <p className="text-xs text-muted-foreground">Expired</p>
            </CardContent>
          </Card>
        </div>

        {/* Error state */}
        {error && (
          <Card className="border-destructive bg-destructive/10 mb-6">
            <CardContent className="p-4">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {loading && <LoadingSkeleton />}

        {/* Empty state */}
        {!loading && !error && openCases.length === 0 && <EmptyState />}

        {/* Cases list */}
        {!loading && !error && openCases.length > 0 && (
          <div className="space-y-3">
            {openCases.map((recoveryCase) => (
              <CaseCard key={recoveryCase.id} recoveryCase={recoveryCase} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
