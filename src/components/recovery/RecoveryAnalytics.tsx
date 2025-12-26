import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { RecoveryCase } from '@/hooks/useRecoveryCases';

interface RecoveryAnalyticsProps {
  cases: RecoveryCase[];
}

export function RecoveryAnalytics({ cases }: RecoveryAnalyticsProps) {
  const metrics = useMemo(() => {
    const resolved = cases.filter(c => c.status !== 'open');
    const recovered = cases.filter(c => c.status === 'recovered');
    const expired = cases.filter(c => c.status === 'expired');
    const open = cases.filter(c => c.status === 'open');
    
    // Calculate recovery rate (recovered / total resolved)
    const recoveryRate = resolved.length > 0 
      ? Math.round((recovered.length / resolved.length) * 100) 
      : 0;
    
    // Calculate total revenue recovered vs lost
    const revenueRecovered = recovered.reduce((sum, c) => sum + c.amount_at_risk, 0);
    const revenueLost = expired.reduce((sum, c) => sum + c.amount_at_risk, 0);
    const revenueAtRisk = open.reduce((sum, c) => sum + c.amount_at_risk, 0);
    
    // Calculate average time to recovery (for recovered cases)
    const avgRecoveryTime = recovered.length > 0
      ? recovered.reduce((sum, c) => {
          if (!c.resolved_at) return sum;
          const opened = new Date(c.opened_at).getTime();
          const resolved = new Date(c.resolved_at).getTime();
          return sum + (resolved - opened);
        }, 0) / recovered.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    return {
      total: cases.length,
      open: open.length,
      recovered: recovered.length,
      expired: expired.length,
      recoveryRate,
      revenueRecovered,
      revenueLost,
      revenueAtRisk,
      avgRecoveryTime: Math.round(avgRecoveryTime),
    };
  }, [cases]);

  // Don't show if no historical data
  if (metrics.total === 0) {
    return null;
  }

  const formatCurrency = (amount: number) => 
    amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Recovery Performance</CardTitle>
        <CardDescription>
          Metrics based on {metrics.total} total case{metrics.total !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Recovery Rate */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              {metrics.recoveryRate >= 50 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className="text-xs text-muted-foreground">Recovery Rate</span>
            </div>
            <p className={`text-2xl font-bold ${
              metrics.recoveryRate >= 50 ? 'text-green-600' : 'text-destructive'
            }`}>
              {metrics.recoveryRate}%
            </p>
            <p className="text-xs text-muted-foreground">
              {metrics.recovered} of {metrics.recovered + metrics.expired} resolved
            </p>
          </div>

          {/* Revenue Recovered */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Recovered</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.revenueRecovered)}
            </p>
            <p className="text-xs text-muted-foreground">
              {metrics.recovered} case{metrics.recovered !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Revenue Lost */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Lost</span>
            </div>
            <p className="text-2xl font-bold text-muted-foreground">
              {formatCurrency(metrics.revenueLost)}
            </p>
            <p className="text-xs text-muted-foreground">
              {metrics.expired} case{metrics.expired !== 1 ? 's' : ''}
            </p>
          </div>

          {/* At Risk */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">At Risk</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(metrics.revenueAtRisk)}
            </p>
            <p className="text-xs text-muted-foreground">
              {metrics.open} open case{metrics.open !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Additional insight */}
        {metrics.avgRecoveryTime > 0 && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Average recovery time: {metrics.avgRecoveryTime} hours
          </p>
        )}
      </CardContent>
    </Card>
  );
}