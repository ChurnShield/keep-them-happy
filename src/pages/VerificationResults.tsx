import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/onboarding/PageTransition";
import { 
  CheckCircle2,
  AlertCircle,
  Mail,
  CreditCard,
  BadgeCheck,
  ArrowRight,
  Shield
} from "lucide-react";

const VerificationResults = () => {
  const navigate = useNavigate();

  const kpiData = [
    {
      label: "Failed payments",
      sublabel: "last 30 days",
      value: "17",
    },
    {
      label: "Estimated recoverable",
      value: "£842",
    },
    {
      label: "Potential churn saves",
      value: "6",
      sublabel: "customers",
    },
  ];

  const timelineSteps = [
    {
      day: "Day 0",
      icon: AlertCircle,
      text: "Payment fails",
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      day: "Day 1",
      icon: Mail,
      text: "Reminder email",
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      day: "Day 3",
      icon: CreditCard,
      text: "Card updated",
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      day: "Day 3",
      icon: BadgeCheck,
      text: "Revenue recovered",
      iconColor: "text-primary",
      bgColor: "bg-primary/20",
      highlight: true,
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background relative">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative z-10 container max-w-2xl mx-auto px-6 py-8 md:py-12">
          {/* Success Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-4"
          >
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Stripe connected (read-only)
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-6"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              We found revenue you could recover
            </h1>
            <p className="text-muted-foreground">
              We scanned your recent billing signals and found opportunities.
            </p>
          </motion.div>

          {/* KPI Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-3 mb-2"
          >
            {kpiData.map((kpi, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-card border border-border rounded-xl p-4 text-center"
              >
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                  {kpi.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground leading-tight">
                  {kpi.label}
                  {kpi.sublabel && (
                    <>
                      <br />
                      <span className="text-xs">{kpi.sublabel}</span>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Preview Label */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-muted-foreground mb-6"
          >
            Preview (based on typical patterns) — exact numbers update after full sync.
          </motion.p>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card border border-border rounded-2xl p-5 mb-6"
          >
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              How recovery works
            </h2>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-border" />
              
              <div className="space-y-4">
                {timelineSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center gap-4 relative"
                  >
                    <div className={`w-8 h-8 rounded-full ${step.bgColor} flex items-center justify-center flex-shrink-0 z-10 ${step.highlight ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
                      <step.icon className={`w-4 h-4 ${step.iconColor}`} />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs font-medium text-muted-foreground min-w-[45px]">
                        {step.day}
                      </span>
                      <span className={`text-sm ${step.highlight ? 'text-primary font-medium' : 'text-foreground'}`}>
                        {step.text}
                        {step.highlight && <CheckCircle2 className="inline w-4 h-4 ml-1" />}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="text-center text-sm text-muted-foreground mt-4 pt-4 border-t border-border"
            >
              This runs automatically once enabled.
            </motion.p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col gap-3"
          >
            <Button
              size="lg"
              onClick={() => navigate("/how-it-works")}
              className="gap-2 text-base w-full"
            >
              Activate recovery
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="flex items-center justify-center gap-2 text-muted-foreground text-xs mt-6"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Read-only access. No changes to customers until you confirm.</span>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default VerificationResults;
