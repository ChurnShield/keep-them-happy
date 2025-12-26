import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { CheckoutFallbackDialog } from "@/components/CheckoutFallbackDialog";

const PLAN_ID = "starter";

export function CTA() {
  const { createCheckoutSession, isLoading, fallbackUrl, showFallbackDialog, closeFallbackDialog } = useStripeCheckout();

  const handleStartTrial = () => {
    createCheckoutSession({
      planId: PLAN_ID,
      successUrl: `${window.location.origin}/success?checkout=success`,
      cancelUrl: `${window.location.origin}/`,
    });
  };

  return (
    <section className="relative bg-background text-foreground py-24 md:py-32 border-t border-white/10 overflow-hidden">
      {/* Animated glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-400/10 rounded-full blur-3xl animate-pulse-slow" />
      
      {/* Accent line animation */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-teal-400/60 to-transparent blur-sm animate-pulse-slow" />

      <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Glowing CTA Card */}
          <div className="relative bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md p-12 md:p-16 shadow-2xl hover:border-teal-400/30 transition">
            {/* Top glow line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
            
            {/* Radial glow behind content */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-teal-400/20 rounded-full blur-3xl" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Ready to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                  stop losing customers?
                </span>
              </h2>
              
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
                Join hundreds of SaaS companies using ChurnShield to reduce churn, 
                recover revenue, and build lasting customer relationships — with zero risk.
              </p>

              {/* Glowing CTA Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={handleStartTrial}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-teal-400 to-cyan-400 text-black font-semibold text-lg px-10 py-6 h-auto rounded-xl shadow-lg shadow-teal-400/30 hover:shadow-xl hover:shadow-teal-400/40 transition-all group"
                >
                  {isLoading ? "Loading..." : "Start My Risk-Free Trial"}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </motion.div>

              {/* Trust note */}
              <p className="mt-8 text-sm text-muted-foreground/60">
                No credit card required • Cancel anytime • Results guaranteed
              </p>
            </div>
          </div>
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
