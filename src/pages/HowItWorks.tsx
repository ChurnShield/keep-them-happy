import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Shield,
  CheckCircle2,
  Zap,
  MessageSquare,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { PageTransition } from "@/components/onboarding/PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";
import { LegalLinks } from "@/components/LegalLinks";

const HowItWorks = () => {
  const navigate = useNavigate();
  const { markCompleted } = useOnboarding();

  useEffect(() => {
    markCompleted();
  }, [markCompleted]);

  const capabilities = [
    {
      icon: Zap,
      text: "Detects churn signals automatically",
    },
    {
      icon: MessageSquare,
      text: "Explains why a customer is at risk",
    },
    {
      icon: TrendingDown,
      text: "Recommends the best action",
    },
    {
      icon: CheckCircle2,
      text: "Helps you act before cancellation",
    },
  ];

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
            transition={{ duration: 0.4 }}
            className="absolute top-6 left-6"
          >
            <Button
              variant="ghost"
              onClick={() => navigate("/example-alert")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-lg w-full text-center"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
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

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-foreground mb-10"
            >
              This is how ChurnShield protects your revenue
            </motion.h1>

            {/* Capabilities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-card border border-border rounded-2xl p-6 mb-8 text-left"
            >
              <ul className="space-y-4">
                {capabilities.map((capability, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <capability.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-foreground text-lg">
                      {capability.text}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Transition text */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-muted-foreground text-lg mb-8"
            >
              Ready to protect your revenue? Start your free trial today.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="space-y-4"
            >
              <Button
                variant="hero"
                size="xl"
                onClick={() => navigate("/#pricing")}
                className="group w-full sm:w-auto"
              >
                Start Risk-Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/example-alert")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Go back to example
                </Button>
              </div>

              <LegalLinks className="mt-8" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default HowItWorks;
