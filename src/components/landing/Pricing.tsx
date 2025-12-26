import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { CheckoutFallbackDialog } from "@/components/CheckoutFallbackDialog";

const benefits = [
  "Pay only for saved revenue",
  "No monthly subscription",
  "Cancel anytime",
  "Zero upfront cost",
  "Full transparency dashboard",
];

export function Pricing() {
  const { createCheckoutSession, isLoading, fallbackUrl, showFallbackDialog, closeFallbackDialog } = useStripeCheckout();

  const handleStartTrial = () => {
    createCheckoutSession({
      planId: "starter",
      successUrl: `${window.location.origin}/success?checkout=success`,
      cancelUrl: `${window.location.origin}/#pricing`,
    });
  };

  return (
    <section
      id="pricing"
      className="relative bg-background text-foreground py-24 md:py-32 border-t border-border/20 overflow-hidden"
    >
      {/* Accent line animation */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-[hsl(187_85%_53%)]/60 to-transparent blur-sm animate-pulse-slow" />

      <div className="container mx-auto px-6 max-w-5xl text-center relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">
              Simple, fair pricing —
            </span>{" "}
            you only pay for results.
          </h2>
          <p className="text-muted-foreground text-lg">
            No subscriptions. No hidden fees. Just performance-based billing
            tied directly to your retained revenue.
          </p>
        </motion.div>

        {/* Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="relative max-w-lg mx-auto bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md p-10 md:p-12 shadow-xl hover:border-primary/30 transition-all duration-300 glow"
        >
          <h3 className="text-2xl font-semibold mb-2 text-foreground">Success-Aligned Plan</h3>
          <p className="text-muted-foreground mb-8">
            You're charged only on recovered revenue — $0 if we don't save you
            customers.
          </p>

          <div className="flex justify-center items-baseline gap-2 mb-10">
            <span className="text-6xl font-bold text-primary">%</span>
            <span className="text-muted-foreground text-lg">of saved revenue</span>
          </div>

          {/* Benefits */}
          <ul className="text-left inline-block mb-10 space-y-4 text-muted-foreground">
            {benefits.map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0" /> 
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <motion.div
            animate={{
              boxShadow: [
                "0 0 0px hsl(174 72% 56% / 0)",
                "0 0 25px hsl(174 72% 56% / 0.3)",
                "0 0 0px hsl(174 72% 56% / 0)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-lg"
          >
            <Button 
              onClick={handleStartTrial}
              disabled={isLoading}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-[hsl(187_85%_53%)] text-primary-foreground font-semibold hover:opacity-90 transition shadow-lg"
            >
              {isLoading ? "Loading..." : "Start My Risk-Free Trial"}
            </Button>
          </motion.div>
        </motion.div>

        {/* Secondary note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-sm text-muted-foreground/60 mt-10"
        >
          No credit card required • Cancel anytime • Backed by real results
        </motion.p>
      </div>

      <CheckoutFallbackDialog 
        open={showFallbackDialog} 
        onOpenChange={closeFallbackDialog}
        checkoutUrl={fallbackUrl || ''} 
      />
    </section>
  );
}
