import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Shield, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

const PRICE_ID = "price_1SiDB0I94SrMi3IbveIokX3Y";

export function Hero() {
  const { createCheckoutSession, isLoading } = useStripeCheckout();

  const handleStartTrial = () => {
    createCheckoutSession({
      planId: PRICE_ID,
      successUrl: `${window.location.origin}/success?checkout=success`,
      cancelUrl: `${window.location.origin}/`,
    });
  };
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Background Effects */}
      <div className="absolute inset-0 hero-glow" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-primary/5 blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8"
          >
            <DollarSign className="h-4 w-4" />
            <span>Revolutionary pricing: Pay only for saved revenue</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground text-balance"
          >
            Only pay for{" "}
            <span className="gradient-text">revenue we actually save.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto text-balance"
          >
            Unlike competitors who charge % of total churn, ChurnShield only bills you for customers we actually retain. 
            Zero saved? Zero cost. It's that simple.
          </motion.p>

          {/* Value Prop Highlight - The Hero Differentiator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-8 relative"
          >
            <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl" />
            <div className="relative inline-flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-primary/30 bg-card/80 backdrop-blur-sm px-6 py-4">
              <div className="flex items-center gap-3 text-sm sm:text-base">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive">
                  <span className="font-medium">Others: % of total churn</span>
                </div>
                <ArrowRight className="h-5 w-5 text-primary hidden sm:block" />
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold">
                  <Shield className="h-4 w-4" />
                  <span>ChurnShield: % of saved revenue only</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10"
          >
            <Button 
              variant="hero" 
              size="xl" 
              className="group"
              onClick={handleStartTrial}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Start Risk-Free Trial"}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No upfront costs
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Pay only for results
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Zero risk guarantee
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8"
          >
            {[
              { value: "$0", label: "Cost if we save nothing", icon: DollarSign },
              { value: "54%", label: "Average churn reduction", icon: TrendingUp },
              { value: "100%", label: "Aligned with your success", icon: Shield },
            ].map((stat) => (
              <div
                key={stat.label}
                className="relative group"
              >
                <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 transition-all hover:border-primary/30">
                  <stat.icon className="h-8 w-8 text-primary mb-4 mx-auto" />
                  <div className="text-4xl font-bold gradient-text">{stat.value}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
