import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/onboarding/PageTransition";
import { ProgressIndicator } from "@/components/onboarding/ProgressIndicator";
import { DollarSign, Percent, Calculator as CalcIcon, Zap, ArrowRight } from "lucide-react";

const Calculator = () => {
  const navigate = useNavigate();
  
  // Pre-filled defaults
  const [monthlyRevenue, setMonthlyRevenue] = useState(50000);
  const [failedPaymentRate, setFailedPaymentRate] = useState(5);
  const [avgSubscriptionValue, setAvgSubscriptionValue] = useState(99);

  const recoveryEstimate = useMemo(() => {
    const failedAmount = (monthlyRevenue * failedPaymentRate) / 100;
    // ChurnShield typically recovers 40-60% of failed payments
    const recoveryRate = 0.47;
    return Math.round(failedAmount * recoveryRate);
  }, [monthlyRevenue, failedPaymentRate]);

  const annualRecovery = recoveryEstimate * 12;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="absolute top-1/3 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative z-10 container max-w-xl mx-auto px-6 py-12">
          <ProgressIndicator currentStep={3} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8 mt-8"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full mb-4">
              <CalcIcon className="w-4 h-4" />
              Recovery Calculator
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              See what you could recover
            </h1>
            <p className="text-muted-foreground text-lg">
              Based on your numbers, here's what ChurnShield would save.
            </p>
          </motion.div>

          {/* Calculator Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-6 mb-6"
          >
            <div className="space-y-5">
              {/* Monthly Revenue */}
              <div className="space-y-2">
                <Label htmlFor="revenue" className="text-sm text-muted-foreground">
                  Monthly Recurring Revenue
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="revenue"
                    type="number"
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                    className="pl-9 text-lg h-12"
                  />
                </div>
              </div>

              {/* Failed Payment Rate */}
              <div className="space-y-2">
                <Label htmlFor="failedRate" className="text-sm text-muted-foreground">
                  Failed Payment Rate (industry avg: 5-10%)
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="failedRate"
                    type="number"
                    min={0}
                    max={100}
                    value={failedPaymentRate}
                    onChange={(e) => setFailedPaymentRate(Number(e.target.value))}
                    className="pl-9 text-lg h-12"
                  />
                </div>
              </div>

              {/* Average Subscription Value */}
              <div className="space-y-2">
                <Label htmlFor="avgValue" className="text-sm text-muted-foreground">
                  Average Subscription Value
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="avgValue"
                    type="number"
                    value={avgSubscriptionValue}
                    onChange={(e) => setAvgSubscriptionValue(Number(e.target.value))}
                    className="pl-9 text-lg h-12"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Result Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-2xl p-6 mb-6 text-center"
          >
            <p className="text-muted-foreground text-sm mb-2">
              Estimated monthly recovery
            </p>
            <motion.div
              key={recoveryEstimate}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-5xl md:text-6xl font-bold text-primary mb-2"
            >
              ${recoveryEstimate.toLocaleString()}
            </motion.div>
            <p className="text-muted-foreground text-sm">
              That's <span className="text-foreground font-medium">${annualRecovery.toLocaleString()}/year</span> back in your pocket
            </p>
          </motion.div>

          {/* Context */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-muted-foreground text-sm mb-8"
          >
            Based on our average 47% recovery rate for failed payments.
            <br />
            Your actual results may vary based on your customer base.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-3"
          >
            <Button
              size="lg"
              onClick={() => navigate("/how-it-works")}
              className="gap-2 text-base w-full"
            >
              <Zap className="w-4 h-4" />
              Get a precise number by connecting Stripe
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/how-it-works")}
              className="text-muted-foreground"
            >
              Continue without connecting
            </Button>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Calculator;
