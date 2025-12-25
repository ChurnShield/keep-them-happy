import { useParams, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  ArrowLeft,
  Loader2,
  User,
  CreditCard,
  Calendar,
  Clock,
  Lightbulb,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  useCustomerDetail, 
  formatEventType, 
  getSeverityColor,
  getScoreColor 
} from '@/hooks/useChurnDashboard';
import { useSubscription } from '@/hooks/useSubscription';
import { format, formatDistanceToNow } from 'date-fns';

export default function CustomerDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { data: customer, isLoading, error } = useCustomerDetail(userId);
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

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Customer Not Found</CardTitle>
            <CardDescription>
              {error?.message || 'Unable to load customer details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard/at-risk')} variant="outline">
              Back to At-Risk List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subscription = customer.subscription;
  const riskSnapshot = customer.riskSnapshot;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => navigate('/dashboard/at-risk')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to At-Risk Customers
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <User className="h-8 w-8" />
                {customer.email}
              </h1>
              <p className="text-muted-foreground mt-1">
                Customer ID: {customer.userId.slice(0, 8)}...
              </p>
            </div>
            
            {riskSnapshot && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <p className={`text-4xl font-bold ${getScoreColor(riskSnapshot.score)}`}>
                  {riskSnapshot.score}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Subscription Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Subscription Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge 
                        variant={
                          subscription.status === 'active' ? 'default' :
                          subscription.status === 'trialing' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {subscription.status}
                      </Badge>
                    </div>
                    
                    {subscription.cancel_at_period_end && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Cancellation</span>
                        <Badge variant="destructive">
                          Scheduled at period end
                        </Badge>
                      </div>
                    )}
                    
                    {subscription.trial_end && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Trial Ends</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(subscription.trial_end), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                    
                    {subscription.current_period_end && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Period Ends</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No subscription found</p>
                )}
              </CardContent>
            </Card>

            {/* Risk Factors */}
            {riskSnapshot && riskSnapshot.top_reasons && (riskSnapshot.top_reasons as string[]).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Risk Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(riskSnapshot.top_reasons as string[]).map((reason, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10"
                      >
                        <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommended Action */}
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Recommended Action
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{customer.recommendedAction}</p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Event Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Event Timeline
              </CardTitle>
              <CardDescription>
                Recent churn risk events (last 30 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customer.recentEvents.length > 0 ? (
                <div className="space-y-4">
                  {customer.recentEvents.map((event, idx) => (
                    <div key={event.id}>
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 h-2 w-2 rounded-full ${
                          event.severity >= 5 ? 'bg-red-500' :
                          event.severity >= 4 ? 'bg-orange-500' :
                          event.severity >= 3 ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`font-medium ${getSeverityColor(event.severity)}`}>
                              {formatEventType(event.event_type)}
                            </span>
                            <Badge variant="outline" className="shrink-0">
                              Severity {event.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(event.occurred_at), { addSuffix: true })}
                          </p>
                          {event.stripe_object_id && (
                            <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                              {event.stripe_object_id}
                            </p>
                          )}
                        </div>
                      </div>
                      {idx < customer.recentEvents.length - 1 && (
                        <Separator className="my-4" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No recent events</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
