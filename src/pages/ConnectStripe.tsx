import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  ArrowLeft, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  CreditCard
} from "lucide-react";
import { PageTransition } from "@/components/onboarding/PageTransition";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { toast } from "@/hooks/use-toast";

const PLAN_ID = "starter";

const ConnectStripe = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasActiveSubscription, status, loading: subLoading, isTrialing, trialDaysRemaining } = useSubscription();
  const { createCheckoutSession, isLoading: checkoutLoading } = useStripeCheckout();
  const [isConnecting, setIsConnecting] = useState(false);

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
      className="max-w-lg w-full"
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
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
          onClick={() => {
            setIsConnecting(true);
            // TODO: Implement Stripe OAuth connection
            toast({
              title: "Coming Soon",
              description: "Stripe OAuth connection will be implemented next.",
            });
            setTimeout(() => setIsConnecting(false), 2000);
          }}
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

  const isLoading = authLoading || subLoading;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-6 left-6"
          >
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </motion.div>

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
    </PageTransition>
  );
};

export default ConnectStripe;
