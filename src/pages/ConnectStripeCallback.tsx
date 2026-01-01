import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { PageTransition } from "@/components/onboarding/PageTransition";
import { useStripeConnection } from "@/hooks/useStripeConnection";

const ConnectStripeCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refetch } = useStripeConnection();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (success === 'true') {
      setStatus('success');
      // Refresh the connection status
      refetch();
    } else if (error) {
      setStatus('error');
      setErrorMessage(message || getDefaultErrorMessage(error));
    } else {
      // No params - redirect to connect page
      navigate('/connect-stripe', { replace: true });
    }
  }, [searchParams, navigate, refetch]);

  const getDefaultErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'access_denied':
        return 'You denied access to connect your Stripe account.';
      case 'invalid_state':
        return 'Security check failed. Please try connecting again.';
      case 'state_expired':
        return 'Session expired. Please try connecting again.';
      case 'token_exchange_failed':
        return 'Failed to connect with Stripe. Please try again.';
      case 'database_error':
        return 'Could not save connection. Please try again.';
      case 'configuration_error':
        return 'Stripe is not properly configured. Please contact support.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const handleRetry = () => {
    navigate('/connect-stripe', { replace: true });
  };

  const handleContinue = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center gap-2 mb-8"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold">
              <span className="text-foreground">Churn</span>
              <span className="text-primary">Shield</span>
            </span>
          </motion.div>

          {status === 'loading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Processing your connection...</p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Stripe Connected!
              </h2>
              
              <p className="text-muted-foreground mb-6">
                Your Stripe account has been successfully connected. You can now access churn insights and payment recovery features.
              </p>

              <Button
                variant="hero"
                size="lg"
                onClick={handleContinue}
                className="w-full group"
              >
                View Churn Insights
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center"
            >
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Connection Failed
              </h2>
              
              <p className="text-muted-foreground mb-6">
                {errorMessage}
              </p>

              <div className="space-y-3">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleRetry}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default ConnectStripeCallback;
