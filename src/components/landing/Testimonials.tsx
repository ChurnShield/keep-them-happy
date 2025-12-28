import { Quote } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { CheckoutFallbackDialog } from "@/components/CheckoutFallbackDialog";

const PLAN_ID = "starter";

export function Testimonials() {
  const { createCheckoutSession, isLoading, fallbackUrl, showFallbackDialog, closeFallbackDialog } = useStripeCheckout();

  const handleStartTrial = () => {
    createCheckoutSession({
      planId: PLAN_ID,
      successUrl: `${window.location.origin}/success?checkout=success`,
      cancelUrl: `${window.location.origin}/`,
    });
  };

  return (
    <section
      id="testimonials"
      className="relative bg-background text-foreground py-24 md:py-32 border-t border-white/10 overflow-hidden"
    >
      {/* Accent line animation */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-teal-400/60 to-transparent blur-sm animate-pulse-slow" />

      <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-12"
        >
          <span className="inline-block text-primary text-sm font-semibold uppercase tracking-widest mb-4">
            Why I Built This
          </span>
          <h2 className="text-3xl md:text-4xl font-bold">
            From frustrated founder to building the solution
          </h2>
        </motion.div>

        {/* Story Block */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 backdrop-blur-md text-left relative"
        >
          <Quote className="w-8 h-8 text-teal-400 mb-6" />
          
          <div className="space-y-6 text-muted-foreground leading-relaxed text-lg">
            <p>
              I run a small SaaS business. Every month, I watched customers cancel — and had no idea why. The tools that could help cost $250/month or more.
            </p>
            <p>
              That's when I realized: indie founders like us need enterprise-level retention without enterprise-level pricing.
            </p>
            <p>
              ChurnShield is what I wished existed. A simple cancel flow that captures feedback, makes smart save offers, and recovers failed payments. You only pay when it works.
            </p>
            <p>
              No VC funding. No sales calls. Just a tool built by a founder, for founders.
            </p>
          </div>

          {/* Signature */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-foreground font-semibold">— Andy, Founder of ChurnShield</p>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="mt-10"
        >
          <Button
            onClick={handleStartTrial}
            disabled={isLoading}
            size="lg"
            className="bg-gradient-to-r from-primary to-[hsl(187_85%_53%)] text-primary-foreground font-semibold hover:opacity-90 transition shadow-lg"
          >
            {isLoading ? "Loading..." : "Start My Risk-Free Trial"}
          </Button>
        </motion.div>
      </div>

      <CheckoutFallbackDialog 
        open={showFallbackDialog} 
        onOpenChange={closeFallbackDialog}
        checkoutUrl={fallbackUrl || ''} 
      />
    </section>
  );
}
