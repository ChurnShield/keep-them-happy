import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDashboardOverview, formatEventType } from '@/hooks/useChurnDashboard';
import { useSubscription } from '@/hooks/useSubscription';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: overview, isLoading, error } = useDashboardOverview();
  const { hasActiveSubscription, loading: subLoading } = useSubscription();

  // Show subscription required message
  if (!subLoading && !hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>
            <CardTitle>Subscription Required</CardTitle>
            <CardDescription>
              You need an active subscription to view churn insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sort reason counts for display
  const sortedReasons = Object.entries(overview?.topReasonCounts || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Churn Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and prevent customer churn with real-time insights
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Total Customers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overview?.totalCustomers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Monitored via Stripe
              </p>
            </CardContent>
          </Card>

          {/* At-Risk Count */}
          <Card className={overview?.atRiskCount ? 'border-orange-500/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                At-Risk Customers
              </CardTitle>
              <AlertTriangle className={`h-4 w-4 ${overview?.atRiskCount ? 'text-orange-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${overview?.atRiskCount ? 'text-orange-500' : ''}`}>
                {overview?.atRiskCount || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Risk score ≥ 50
              </p>
            </CardContent>
          </Card>

          {/* Risk Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Risk Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {overview?.totalCustomers 
                  ? Math.round((overview.atRiskCount / overview.totalCustomers) * 100) 
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Of total customers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Risk Reasons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Top Risk Signals (Last 30 Days)
              </CardTitle>
              <CardDescription>
                Most common churn risk events detected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sortedReasons.length > 0 ? (
                <div className="space-y-3">
                  {sortedReasons.map(([eventType, count]) => (
                    <div 
                      key={eventType} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <span className="font-medium">{formatEventType(eventType)}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No risk events in the last 30 days</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Navigate to detailed views
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => navigate('/dashboard/at-risk')}
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  View At-Risk Customers
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => navigate('/connect-stripe')}
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Manage Stripe Connection
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        {overview?.totalCustomers === 0 && (
          <Card className="mt-6">
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No Customers Yet</h3>
              <p className="text-muted-foreground mb-4">
                Connect your Stripe account to start monitoring customer churn risk.
              </p>
              <Button onClick={() => navigate('/connect-stripe')}>
                Connect Stripe
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
