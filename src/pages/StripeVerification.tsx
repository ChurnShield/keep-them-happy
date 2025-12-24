import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/onboarding/PageTransition";
import { LegalLinks } from "@/components/LegalLinks";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Eye, 
  Lock, 
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  AlertTriangle
} from "lucide-react";

const getErrorMessage = (errorCode: string | null): string | null => {
  if (!errorCode) return null;
  
  const errorMessages: Record<string, string> = {
    'access_denied': 'You denied access to your Stripe account. Please try again if you want to proceed.',
    'invalid_request': 'The authorization request was invalid. Please try again.',
    'invalid_state': 'Session expired or invalid. Please try connecting again.',
    'session_mismatch': 'Session verification failed. Please try connecting again.',
    'config': 'There was a configuration error. Please contact support.',
    'db_error': 'Failed to save your connection. Please try again.',
    'server_error': 'An unexpected error occurred. Please try again.',
    'invalid_scope': 'The requested permissions are not available. Please try again.',
  };
  
  return errorMessages[errorCode] || `Connection failed: ${errorCode}. Please try again.`;
};

const StripeVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get('error');
  const errorMessage = getErrorMessage(errorCode);

  const safetyPoints = [
    {
      icon: Eye,
      text: "Read-only access to your payment data",
    },
    {
      icon: Clock,
      text: "Scans only last 30 days of failed payments",
    },
    {
      icon: Lock,
      text: "Your credentials are never stored",
    },
  ];

  const notDoing = [
    "No emails sent",
    "No automations enabled", 
    "No changes made",
  ];

  return (
    <PageTransition>
        <div className="min-h-screen bg-background relative flex items-center justify-center">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

          <div className="relative z-10 container max-w-lg mx-auto px-6 py-6 md:py-12">
          {/* Error Alert with Retry */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="ml-2 flex items-center justify-between gap-4">
                  <span>{errorMessage}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Clear error from URL and redirect to OAuth
                      navigate('/verify-stripe', { replace: true });
                      window.location.href = `https://rdstyfaveeokocztayri.supabase.co/functions/v1/stripe-connect`;
                    }}
                    className="shrink-0 border-destructive/30 hover:bg-destructive/20"
                  >
                    Try again
                  </Button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
          {/* Shield Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-4 md:mb-6"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-5 md:mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Verify your actual revenue loss
            </h1>
            <p className="text-muted-foreground">
              We'll scan your Stripe data to show you exactly what you're losing.
              <br />
              <span className="text-foreground font-medium">Nothing else.</span>
            </p>
          </motion.div>

          {/* What we do */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-4 md:p-5 mb-3 md:mb-4"
          >
            <h2 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 md:mb-4">
              What we'll do
            </h2>
            <ul className="space-y-3">
              {safetyPoints.map((point, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <point.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground">{point.text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* What we DON'T do */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-muted/50 border border-border rounded-2xl p-4 md:p-5 mb-5 md:mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                What we won't do
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {notDoing.map((item, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="inline-flex items-center gap-1.5 bg-background border border-border rounded-full px-3 py-1.5 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  {item}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col gap-3"
          >
            <Button
              size="lg"
              onClick={() => {
                // Full page redirect to Stripe OAuth
                window.location.href = `https://rdstyfaveeokocztayri.supabase.co/functions/v1/stripe-connect`;
              }}
              className="gap-2 text-base w-full"
            >
              <Lock className="w-4 h-4" />
              Connect Stripe (read-only)
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/verification-results")}
              className="text-muted-foreground"
            >
              I already connected Stripe
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/how-it-works")}
              className="text-muted-foreground text-sm"
            >
              I'll do this later
            </Button>
          </motion.div>

          {/* Trust footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center mt-6 space-y-3"
          >
            <p className="text-muted-foreground text-xs">
              Secure OAuth connection. We never see your Stripe password.
            </p>
            <LegalLinks />
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default StripeVerification;
