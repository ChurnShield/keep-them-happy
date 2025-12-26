import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
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
      {/* Hero glow effect */}
      <div className="absolute inset-0 hero-glow pointer-events-none" />
      
      <div className="container mx-auto px-6 text-center max-w-3xl relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-primary mb-6 backdrop-blur-sm border border-white/10"
        >
          <span className="font-medium">💡 Smarter pricing:</span>
          <span>Pay only for revenue you actually keep</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
        >
          Pay only for the{" "}
          <span className="gradient-text">
            customers you actually retain.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
        >
          Most retention tools charge you for churn.{" "}
          <span className="text-foreground font-medium">ChurnShield only earns when you do</span> — if we don't recover revenue, you don't pay a cent.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          <motion.div
            animate={{
              boxShadow: [
                "0 0 0px hsl(174 72% 56% / 0)",
                "0 0 30px hsl(174 72% 56% / 0.4)",
                "0 0 0px hsl(174 72% 56% / 0)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-full sm:w-auto rounded-lg"
          >
            <Button 
              onClick={handleStartTrial}
              disabled={isLoading}
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-[hsl(187_85%_53%)] text-primary-foreground font-semibold hover:opacity-90 transition shadow-lg"
            >
              {isLoading ? "Loading..." : "Start My Risk-Free Trial"}
            </Button>
          </motion.div>
          <Button
            variant="outline"
            size="lg"
            onClick={handleOpenRecovery}
            className="w-full sm:w-auto border-primary/40 text-primary hover:bg-primary/10 transition"
          >
            See Recovery Inbox
          </Button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.ul
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-muted-foreground text-sm mb-12"
        >
          <li className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-primary" /> No setup fees or lock-ins
          </li>
          <li className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-primary" /> Pay only for results
          </li>
          <li className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-primary" /> Zero-risk guarantee
          </li>
        </motion.ul>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
          className="bg-white/5 rounded-2xl p-8 md:p-10 backdrop-blur-md border border-white/10 glow"
        >
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-6">
            Trusted by leading SaaS teams — recovering millions in ARR
          </p>
          <div className="grid grid-cols-3 gap-6 md:gap-10">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">$0</p>
              <p className="text-sm text-muted-foreground mt-1">Cost if we save nothing</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">54%</p>
              <p className="text-sm text-muted-foreground mt-1">Avg. churn reduction</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">100%</p>
              <p className="text-sm text-muted-foreground mt-1">Aligned with your success</p>
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
