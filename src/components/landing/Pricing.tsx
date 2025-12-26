import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      className="relative bg-background text-foreground py-24 md:py-32 border-t border-white/10 overflow-hidden"
    >
      {/* Accent line animation */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent blur-sm animate-pulse-slow" />

      <div className="container mx-auto px-6 max-w-5xl text-center relative z-10">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
              Simple, fair pricing —
            </span>{" "}
            you only pay for results.
          </h2>
          <p className="text-muted-foreground text-lg">
            No subscriptions. No hidden fees. Just performance-based billing
            tied directly to your retained revenue.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="relative max-w-lg mx-auto bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md p-10 md:p-12 shadow-xl hover:border-teal-400/30 transition">
          <h3 className="text-2xl font-semibold mb-2">Success-Aligned Plan</h3>
          <p className="text-muted-foreground mb-6">
            You're charged only on recovered revenue — $0 if we don't save you
            customers.
          </p>

          <div className="flex justify-center items-baseline gap-2 mb-8">
            <span className="text-5xl font-bold text-teal-400">%</span>
            <span className="text-muted-foreground">of saved revenue</span>
          </div>

          {/* Benefits */}
          <ul className="text-left inline-block mb-10 space-y-3 text-muted-foreground">
            {benefits.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-400" /> {item}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Button 
            onClick={handleStartTrial}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-teal-400 to-cyan-400 text-black font-semibold hover:opacity-90 transition"
          >
            {isLoading ? "Loading..." : "Start My Risk-Free Trial"}
          </Button>
        </div>

        {/* Secondary note */}
        <p className="text-sm text-muted-foreground/60 mt-8">
          No credit card required • Cancel anytime • Backed by real results
        </p>
      </div>

      <CheckoutFallbackDialog 
        open={showFallbackDialog} 
        onOpenChange={closeFallbackDialog}
        checkoutUrl={fallbackUrl || ''} 
      />
    </section>
  );
}
