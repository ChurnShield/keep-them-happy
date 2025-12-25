import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2, CreditCard, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SubscriptionGateProps {
  children: ReactNode;
  /** Feature name shown in the message */
  feature?: string;
}

export function SubscriptionGate({ children, feature = 'this feature' }: SubscriptionGateProps) {
  const navigate = useNavigate();
  const { hasActiveSubscription, status, loading, error } = useSubscription();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>
              We couldn't verify your subscription status. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute inset-0 hero-glow opacity-30" />
        <Card className="w-full max-w-md text-center relative z-10">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
              <CreditCard className="h-7 w-7 text-amber-500" />
            </div>
            <CardTitle className="text-2xl">Subscription Required</CardTitle>
            <CardDescription className="text-base">
              {status === 'canceled' 
                ? `Your subscription has been canceled. Resubscribe to access ${feature}.`
                : status === 'past_due'
                  ? `Your payment is past due. Please update your payment method to access ${feature}.`
                  : `An active subscription is required to access ${feature}. Start your free trial to get started.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => navigate('/#pricing')} 
              className="w-full"
            >
              View Pricing & Start Trial
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard')} 
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
