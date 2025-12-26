import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { CheckoutFallbackDialog } from "@/components/CheckoutFallbackDialog";
import { useNavigate } from "react-router-dom";

const PLAN_ID = "starter";

export function Hero() {
  const navigate = useNavigate();
  const { createCheckoutSession, isLoading, fallbackUrl, showFallbackDialog, closeFallbackDialog } = useStripeCheckout();

  const handleStartTrial = () => {
    createCheckoutSession({
      planId: PLAN_ID,
      successUrl: `${window.location.origin}/success?checkout=success`,
      cancelUrl: `${window.location.origin}/`,
    });
  };

  const handleOpenRecovery = () => {
    navigate('/recovery');
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-card text-foreground py-20 md:py-28 pt-32 md:pt-36">
      <div className="container mx-auto px-6 text-center max-w-3xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-teal-300 mb-6">
          <span className="font-medium">💡 Smarter pricing:</span>
          <span>Pay only for revenue you actually keep</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
          Pay only for the{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
            customers you actually retain.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-muted-foreground mb-10">
          Most retention tools charge you for churn.{" "}
          <span className="text-foreground font-medium">ChurnShield only earns when you do</span> — if we don't recover revenue, you don't pay a cent. Simple, fair, and performance-driven.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <Button 
            onClick={handleStartTrial}
            disabled={isLoading}
            className="w-full sm:w-auto bg-gradient-to-r from-teal-400 to-cyan-400 text-black font-semibold hover:opacity-90 transition"
          >
            {isLoading ? "Loading..." : "Start My Risk-Free Trial"}
          </Button>
          <Button
            variant="outline"
            onClick={handleOpenRecovery}
            className="w-full sm:w-auto border-teal-400/60 text-teal-300 hover:bg-teal-400/10 transition"
          >
            See Recovery Inbox
          </Button>
        </div>

        {/* Trust Indicators */}
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-muted-foreground text-sm mb-10">
          <li className="flex items-center gap-1">
            <Check className="w-4 h-4 text-teal-400" /> No setup fees or lock-ins
          </li>
          <li className="flex items-center gap-1">
            <Check className="w-4 h-4 text-teal-400" /> Pay only for results
          </li>
          <li className="flex items-center gap-1">
            <Check className="w-4 h-4 text-teal-400" /> Zero-risk guarantee
          </li>
        </ul>

        {/* Social Proof + Stats */}
        <div className="bg-white/5 rounded-xl p-6 md:p-8 backdrop-blur-sm border border-white/10">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
            Trusted by leading SaaS teams — recovering millions in ARR
          </p>
          <div className="grid grid-cols-3 gap-4 md:gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-teal-400">$0</p>
              <p className="text-sm text-muted-foreground">Cost if we save nothing</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-teal-400">54%</p>
              <p className="text-sm text-muted-foreground">Avg. churn reduction</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-teal-400">100%</p>
              <p className="text-sm text-muted-foreground">Aligned with your success</p>
            </div>
          </div>
        </div>
      </div>

      <CheckoutFallbackDialog 
        open={showFallbackDialog} 
        onOpenChange={closeFallbackDialog}
        checkoutUrl={fallbackUrl || ''} 
      />
    </section>
  );
}
