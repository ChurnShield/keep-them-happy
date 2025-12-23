import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, ArrowRight, Shield } from "lucide-react";
import { ProgressIndicator } from "@/components/onboarding/ProgressIndicator";
import { PageTransition } from "@/components/onboarding/PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";

const Welcome = () => {
  const navigate = useNavigate();
  const { isCompleted } = useOnboarding();

  // Redirect to dashboard when it's ready (currently redirects to home)
  useEffect(() => {
    if (isCompleted()) {
      // TODO: Replace "/" with "/dashboard" when dashboard is ready
      navigate("/", { replace: true });
    }
  }, [isCompleted, navigate]);

  const statusItems = [
    { label: "Account created", status: "done", icon: CheckCircle2 },
    { label: "Integrations", status: "pending", note: "coming later" },
  ];

  const nextSteps = [
    "We monitor early churn signals automatically",
    "You'll see opportunities to retain customers",
    "You stay in control — cancellations are never blocked",
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
        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute top-6 left-1/2 -translate-x-1/2"
        >
          <ProgressIndicator currentStep={1} />
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
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
          >
            Welcome to Churnshield 👋
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-muted-foreground text-lg mb-10"
          >
            We help you reduce churn before it happens — without heavy setup.
          </motion.p>

          {/* What happens next */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-card border border-border rounded-2xl p-6 mb-6 text-left"
          >
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              What happens next
            </h2>
            <ul className="space-y-3">
              {nextSteps.map((step, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                  className="flex items-start gap-3 text-foreground"
                >
                  <span className="text-primary mt-1">•</span>
                  <span>{step}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Setup status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="bg-card border border-border rounded-2xl p-6 mb-8 text-left"
          >
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Setup status
            </h2>
            <ul className="space-y-3">
              {statusItems.map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  {item.status === "done" ? (
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span
                    className={
                      item.status === "done"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {item.label}
                    {item.note && (
                      <span className="text-muted-foreground ml-1">
                        ({item.note})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <Button
              variant="hero"
              size="xl"
              onClick={() => navigate("/how-it-works")}
              className="group"
            >
              How Churnshield works
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
      </div>
    </PageTransition>
  );
};

export default Welcome;
