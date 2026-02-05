import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Link as LinkIcon, ArrowRight, Loader2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const AUTO_REDIRECT_DELAY = 3000; // 3 seconds

const Success = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [hasStripeConnected, setHasStripeConnected] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [autoRedirectCancelled, setAutoRedirectCancelled] = useState(false);

  useEffect(() => {
    const checkStripeConnection = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Not logged in, redirect to welcome
          navigate('/welcome');
          return;
        }

        // Check if user has connected Stripe
        const { data: stripeAccount } = await supabase
          .from('stripe_accounts')
          .select('connected')
          .eq('user_id', user.id)
          .maybeSingle();

        setHasStripeConnected(stripeAccount?.connected ?? false);
      } catch (error) {
        console.error('Error checking Stripe connection:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStripeConnection();
  }, [navigate]);

  // Auto-redirect countdown
  useEffect(() => {
    if (isLoading || autoRedirectCancelled) return;

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Redirect based on Stripe connection status
          if (hasStripeConnected) {
            navigate('/dashboard');
          } else {
            navigate('/welcome');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [isLoading, autoRedirectCancelled, hasStripeConnected, navigate]);

  const handleSkip = () => {
    setAutoRedirectCancelled(true);
  };

  const nextDestination = hasStripeConnected ? '/dashboard' : '/welcome';
  const nextLabel = hasStripeConnected ? 'Go to Dashboard' : 'Continue Setup';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            You're All Set!
          </h1>
          <p className="text-muted-foreground">
            Connect your Stripe account to start protecting your revenue. You'll only be charged when we save a customer for you.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-left space-y-3">
          <h3 className="font-semibold text-foreground">How ChurnShield works:</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${hasStripeConnected ? 'bg-green-500/20' : 'bg-primary/20'}`}>
                <span className={`text-xs font-bold ${hasStripeConnected ? 'text-green-600' : 'text-primary'}`}>
                  {hasStripeConnected ? '✓' : '1'}
                </span>
              </div>
              <span className={hasStripeConnected ? 'line-through text-muted-foreground/60' : ''}>
                Connect your Stripe account to start monitoring
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-primary font-bold">2</span>
              </div>
              <span>Set up your cancel flow to intercept churning customers</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-primary font-bold">3</span>
              </div>
              <span>Pay only 20% of saved revenue (capped at $500/month)</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => navigate(nextDestination)} 
            size="lg" 
            className="w-full group"
          >
            {hasStripeConnected ? null : <LinkIcon className="w-4 h-4 mr-2" />}
            {nextLabel}
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          {!autoRedirectCancelled && (
            <p className="text-sm text-muted-foreground">
              Redirecting in {countdown}s...{' '}
              <button 
                onClick={handleSkip}
                className="text-primary hover:underline font-medium"
              >
                Skip
              </button>
            </p>
          )}
          
          {hasStripeConnected && (
            <Button 
              variant="outline" 
              onClick={() => navigate('/connect-stripe')} 
              size="lg" 
              className="w-full"
            >
              Manage Stripe Connection
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          No monthly fees. No setup costs. You only pay when we save customers for you.
        </p>
      </div>
    </div>
  );
};

export default Success;
