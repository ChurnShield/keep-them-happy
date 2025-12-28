import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { CheckoutFallbackDialog } from "@/components/CheckoutFallbackDialog";
import { useNavigate } from "react-router-dom";

const PLAN_ID = "starter";

export function CTA() {
  const navigate = useNavigate();
  const { createCheckoutSession, isLoading, fallbackUrl, showFallbackDialog, closeFallbackDialog } = useStripeCheckout();

  const handleStartTrial = () => {
    createCheckoutSession({
      planId: PLAN_ID,
      successUrl: `${window.location.origin}/success?checkout=success`,
      cancelUrl: `${window.location.origin}/`,
    });
  };

  const handleHowItWorks = () => {
    const element = document.querySelector("#how-it-works");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/how-it-works");
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-card text-foreground py-28 md:py-36 border-t border-white/10">
      {/* Gradient Glow Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-transparent blur-3xl opacity-40 pointer-events-none" />

      <div className="container mx-auto px-6 text-center relative z-10 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Headline */}
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Ready to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              stop paying for churn?
            </span>
          </h2>

          {/* Subheadline */}
          <p className="text-lg text-muted-foreground mb-10">
            Start your risk-free trial today and pay only when ChurnShield
            actually retains your customers. Simple, transparent, and aligned
            with your success.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-10">
            {/* Motion Glow Button */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0px rgba(45, 212, 191, 0.0)",
                  "0 0 25px rgba(45, 212, 191, 0.4)",
                  "0 0 0px rgba(45, 212, 191, 0.0)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-full sm:w-auto rounded-lg"
            >
              <Button 
                onClick={handleStartTrial}
                disabled={isLoading}
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold hover:opacity-90 transition shadow-md"
              >
                {isLoading ? "Loading..." : "Start My Risk-Free Trial"}
              </Button>
            </motion.div>

            <Button
              variant="outline"
              onClick={handleHowItWorks}
              className="w-full sm:w-auto border-primary/60 text-primary hover:bg-primary/10 transition"
            >
              View How It Works
            </Button>
          </div>

          {/* Trust points */}
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-muted-foreground text-sm">
            <li className="flex items-center gap-1">
              <Check className="w-4 h-4 text-primary" /> No credit card needed
            </li>
            <li className="flex items-center gap-1">
              <Check className="w-4 h-4 text-primary" /> Cancel anytime
            </li>
            <li className="flex items-center gap-1">
              <Check className="w-4 h-4 text-primary" /> Zero-risk guarantee
            </li>
          </ul>
        </motion.div>
      </div>

      {/* Subtle bottom divider glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent blur-sm animate-pulse-slow" />

      <CheckoutFallbackDialog 
        open={showFallbackDialog} 
        onOpenChange={closeFallbackDialog}
        checkoutUrl={fallbackUrl || ''} 
      />
    </section>
  );
}
