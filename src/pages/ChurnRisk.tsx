import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/onboarding/PageTransition";
import { ProgressIndicator } from "@/components/onboarding/ProgressIndicator";
import { AlertTriangle, Check, Zap } from "lucide-react";
import { LegalLinks } from "@/components/LegalLinks";

const ChurnRisk = () => {
  const navigate = useNavigate();

  const riskFactors = [
    "A payment fails",
    "No recovery attempt happens within 48 hours",
  ];

  const automations = [
    "Detect failed payments instantly",
    "Trigger a friendly recovery message",
    "Offer a safe retry or alternative",
    "Learn what works over time",
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-destructive/5" />
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-destructive/10 rounded-full blur-3xl" />

        <div className="relative z-10 container max-w-2xl mx-auto px-6 py-12">
          <ProgressIndicator currentStep={2} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              We've identified your first churn risk.
            </h1>
            <p className="text-muted-foreground text-lg">
              Based on how SaaS companies like yours lose revenue.
            </p>
          </motion.div>

          {/* Risk Alert Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                High-risk churn moment detected
              </h2>
            </div>

            <p className="text-muted-foreground mb-4">
              Customers are most likely to cancel when:
            </p>

            <ul className="space-y-2 mb-4">
              {riskFactors.map((factor, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-2 text-foreground"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  {factor}
                </motion.li>
              ))}
            </ul>

            <p className="text-muted-foreground text-sm italic">
              Most teams don't see this until it's too late.
            </p>
          </motion.div>

          {/* Solution Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card border border-border rounded-2xl p-6 mb-8"
          >
            <p className="text-muted-foreground mb-4">
              If ChurnShield were connected, here's what would happen automatically:
            </p>

            <ul className="space-y-3 mb-6">
              {automations.map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-3 text-foreground"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  {item}
                </motion.li>
              ))}
            </ul>

            <p className="text-primary font-medium">
              This is exactly where ChurnShield saves revenue.
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center space-y-4"
          >
            <Button
              size="lg"
              onClick={() => navigate("/calculator")}
              className="gap-2 text-base px-8"
            >
              <Zap className="w-4 h-4" />
              See what ChurnShield would recover for you
            </Button>
            <p className="text-muted-foreground text-sm">
              No integrations required yet.
            </p>
            <LegalLinks className="mt-4" />
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ChurnRisk;
