import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Shield,
  TrendingDown,
  Target,
  LineChart,
  Zap,
  CreditCard,
  ShieldCheck,
  Sparkles,
  FlaskConical,
  Link,
  UserCheck,
  Lock,
  Heart,
} from "lucide-react";
import { ProgressIndicator } from "@/components/onboarding/ProgressIndicator";
import { PageTransition } from "@/components/onboarding/PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";

const HowItWorks = () => {
  const navigate = useNavigate();
  const { markCompleted } = useOnboarding();

  // Mark onboarding as complete when user views this page
  useEffect(() => {
    markCompleted();
  }, [markCompleted]);

  const steps = [
    {
      number: "1",
      title: "Detect risk early",
      description:
        "We identify customers showing signs of churn before they make the decision to leave.",
      icon: TrendingDown,
    },
    {
      number: "2",
      title: "Intercept at the right moment",
      description:
        "Smart timing means the right message reaches the right customer at exactly the right time.",
      icon: Target,
    },
    {
      number: "3",
      title: "Learn what works over time",
      description:
        "Every interaction teaches the system what resonates with your customers.",
      icon: LineChart,
    },
  ];

  const automaticFeatures = [
    { label: "Churn signals", icon: Zap },
    { label: "Failed payment recovery", icon: CreditCard },
    { label: "Safe cancellation flows", icon: ShieldCheck },
  ];

  const optionalFeatures = [
    { label: "Custom offers", icon: Sparkles },
    { label: "Advanced A/B testing", icon: FlaskConical },
    { label: "Deep integrations", icon: Link },
  ];

  const trustPoints = [
    {
      icon: UserCheck,
      title: "Users stay in control",
      description: "Your customers can always cancel — we just help you understand why.",
    },
    {
      icon: Lock,
      title: "Privacy-first",
      description: "We only use the data you choose to share, and it stays yours.",
    },
    {
      icon: Heart,
      title: "No dark patterns",
      description: "Honest, transparent retention that respects your customers.",
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

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center mb-8"
        >
          <ProgressIndicator currentStep={2} />
        </motion.div>

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/welcome")}
            className="mb-8 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Welcome
          </Button>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex items-center gap-2 mb-8"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold">
            <span className="text-foreground">Churn</span>
            <span className="text-primary">Shield</span>
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold text-foreground mb-4"
        >
          How Churnshield Works
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-muted-foreground text-lg mb-12"
        >
          Reduce churn without heavy setup. We handle the complexity so you can
          focus on building your product.
        </motion.p>

        {/* 3-step flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-4 mb-12"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
              className="bg-card border border-border rounded-2xl p-5 flex gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold mb-1">
                  {step.number}. {step.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Automatic vs Optional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="grid md:grid-cols-2 gap-4 mb-12"
        >
          {/* Automatic */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
              Automatic by default
            </h3>
            <ul className="space-y-3">
              {automaticFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground">{feature.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Optional */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Optional later
            </h3>
            <ul className="space-y-3">
              {optionalFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-muted-foreground">{feature.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Trust section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="bg-card border border-border rounded-2xl p-6 mb-12"
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
            Our commitment to you
          </h3>
          <div className="space-y-5">
            {trustPoints.map((point, index) => (
              <div key={index} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <point.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-foreground font-medium mb-1">
                    {point.title}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Back to Welcome CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="text-center"
        >
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate("/welcome")}
            className="group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Welcome
          </Button>
        </motion.div>
      </div>
      </div>
    </PageTransition>
  );
};

export default HowItWorks;
