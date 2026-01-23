import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  CreditCard,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useStripeConnection } from "@/hooks/useStripeConnection";
import { toast } from "@/hooks/use-toast";

const PLAN_ID = "starter";

const ConnectStripe = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasActiveSubscription, status, loading: subLoading, isTrialing, trialDaysRemaining } = useSubscription();
  const { createCheckoutSession, isLoading: checkoutLoading } = useStripeCheckout();
  const { isConnected, loading: connectionLoading, startStripeConnect } = useStripeConnection();
  const [isConnecting, setIsConnecting] = useState(false);

  // Handle Stripe Connect OAuth flow
  const handleConnectStripe = async () => {
    setIsConnecting(true);
    
    const result = await startStripeConnect();
    
    if (result.error) {
      toast({
        title: "Connection Failed",
        description: result.error,
        variant: "destructive",
      });
      setIsConnecting(false);
      return;
    }
    
    if (result.url) {
      // Redirect to Stripe OAuth
      window.location.href = result.url;
    } else {
      toast({
        title: "Connection Failed",
        description: "Could not start Stripe connection. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleStartTrial = () => {
    createCheckoutSession({
      planId: PLAN_ID,
      successUrl: `${window.location.origin}/success?checkout=success`,
      cancelUrl: `${window.location.origin}/connect-stripe`,
    });
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to connect your Stripe account.",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Redirect if already connected
  useEffect(() => {
    if (!connectionLoading && isConnected) {
      toast({
        title: "Already Connected",
        description: "Your Stripe account is already connected.",
      });
      navigate("/dashboard");
    }
  }, [isConnected, connectionLoading, navigate]);

  // Show subscription requirement message
  const renderSubscriptionRequired = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center"
    >
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      
      <h2 className="text-2xl font-bold text-foreground mb-4">
        Subscription Required
      </h2>
      
      <p className="text-muted-foreground mb-6">
        Please start your free trial before connecting your Stripe account. 
        This ensures we can properly link your data to your ChurnShield subscription.
      </p>

      <div className="space-y-3">
        <Button
          variant="hero"
          size="lg"
          onClick={handleStartTrial}
          disabled={checkoutLoading}
          className="w-full"
        >
          {checkoutLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Start Free Trial
            </>
          )}
        </Button>
        
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="w-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    </motion.div>
  );

  // Show the connect stripe form for users with active subscription
  const renderConnectForm = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg w-full mx-auto"
    >

      {/* Subscription status badge */}
      {isTrialing && trialDaysRemaining !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <CheckCircle2 className="w-4 h-4" />
            Trial Active - {trialDaysRemaining} days remaining
          </div>
        </motion.div>
      )}

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4"
      >
        Connect Your Stripe Account
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground text-center text-lg mb-8"
      >
        Link your Stripe account to start monitoring churn risks and recovering failed payments automatically.
      </motion.p>

      {/* Benefits card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-2xl p-6 mb-8"
      >
        <h3 className="font-semibold text-foreground mb-4">What happens when you connect:</h3>
        <ul className="space-y-3">
          {[
            "Read-only access to your subscription data",
            "Real-time monitoring of failed payments",
            "Automatic churn risk detection",
            "Personalized recovery recommendations",
          ].map((benefit, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-center gap-3 text-muted-foreground"
            >
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-3 h-3 text-primary" />
              </div>
              {benefit}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Connect button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="space-y-4"
      >
        <Button
          variant="hero"
          size="xl"
          onClick={handleConnectStripe}
          disabled={isConnecting}
          className="w-full group"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Connecting...
            </>
          ) : (
            <>
              Connect with Stripe
              <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          We request read-only access. Your data is encrypted and never shared.
        </p>

        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="w-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </motion.div>
    </motion.div>
  );

  const isLoading = authLoading || subLoading || connectionLoading;

  return (
    <DashboardLayout title="Connect Stripe" subtitle="Link your Stripe account to enable churn monitoring">
      <div className="p-6 md:p-8">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !hasActiveSubscription ? (
            renderSubscriptionRequired()
          ) : (
            renderConnectForm()
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ConnectStripe;
