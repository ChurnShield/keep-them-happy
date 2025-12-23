import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/onboarding/PageTransition";
import { 
  Shield, 
  Eye, 
  Lock, 
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight
} from "lucide-react";

const StripeVerification = () => {
  const navigate = useNavigate();

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
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative z-10 container max-w-lg mx-auto px-6 py-12">
          {/* Shield Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
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
            className="bg-card border border-border rounded-2xl p-5 mb-4"
          >
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
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
            className="bg-muted/50 border border-border rounded-2xl p-5 mb-8"
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
              onClick={() => navigate("/how-it-works")}
              className="gap-2 text-base w-full"
            >
              <Lock className="w-4 h-4" />
              Connect Stripe (read-only)
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/how-it-works")}
              className="text-muted-foreground"
            >
              I'll do this later
            </Button>
          </motion.div>

          {/* Trust footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center text-muted-foreground text-xs mt-6"
          >
            Secure OAuth connection. We never see your Stripe password.
          </motion.p>
        </div>
      </div>
    </PageTransition>
  );
};

export default StripeVerification;
