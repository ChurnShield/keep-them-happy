import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Link2, ArrowRight } from "lucide-react";
import { useStripeConnection } from "@/hooks/useStripeConnection";

interface StripeConnectionGateProps {
  children: ReactNode;
  feature?: string;
}

export function StripeConnectionGate({ children, feature = "this feature" }: StripeConnectionGateProps) {
  const navigate = useNavigate();
  const { isConnected, loading, error } = useStripeConnection();

  // Allow bypass in development for testing
  const isDev = import.meta.env.DEV;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // In development, show a warning but allow access
  if (isDev && !isConnected) {
    return (
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2 text-center text-sm text-yellow-600 dark:text-yellow-400 z-10">
          ⚠️ Dev Mode: Stripe not connected. Features may not work correctly.
        </div>
        <div className="pt-10">
          {children}
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Link2 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Connect Stripe to Continue</CardTitle>
            <CardDescription>
              To access {feature}, you need to connect your Stripe account first. 
              This allows ChurnShield to monitor your subscriptions and detect churn risks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => navigate('/connect-stripe')}
            >
              Connect Stripe
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => navigate('/dashboard')}
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
