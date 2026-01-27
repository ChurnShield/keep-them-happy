import { Button } from "@/components/ui/button";
import { Check, CreditCard, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export function Hero() {
  const navigate = useNavigate();

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
          className="inline-flex flex-col sm:flex-row items-center gap-1 sm:gap-2 rounded-2xl sm:rounded-full bg-white/10 px-4 py-2 sm:py-1.5 text-sm text-primary mb-6 backdrop-blur-sm border border-white/10"
        >
          <span className="font-medium">🛡️ Turn cancellations into saves — pay only when it works</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
        >
          When customers click{" "}
          <span className="gradient-text">'Cancel'</span>, you get one chance to save them.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
        >
          Most SaaS companies lose customers the moment they hit cancel. ChurnShield shows them a personalized retention offer based on why they're leaving — and saves 20-40% automatically.{" "}
          <span className="text-foreground font-medium">Setup takes 10 minutes.</span> You only pay when it works.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          <div className="w-full sm:w-auto rounded-lg animate-glow-pulse">
            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-[hsl(187_85%_53%)] text-primary-foreground font-semibold hover:opacity-90 transition shadow-lg"
            >
              Get Started Free
            </Button>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto border-primary/40 text-primary hover:bg-primary/10 transition"
          >
            See How It Works
          </Button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="grid grid-cols-3 gap-4 mb-12 max-w-xl mx-auto"
        >
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 hover:scale-105 transition-all duration-300 cursor-default">
            <CreditCard className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground text-center">No credit card required</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 hover:scale-105 transition-all duration-300 cursor-default">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground text-center">Cancel anytime</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 hover:scale-105 transition-all duration-300 cursor-default">
            <Check className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground text-center">Pay only for saves</span>
          </div>
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
          className="bg-white/5 rounded-2xl p-8 md:p-10 backdrop-blur-md border border-white/10 glow"
        >
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-6">
            Why founders choose ChurnShield
          </p>
          <div className="grid grid-cols-3 gap-6 md:gap-10">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">20-40%</p>
              <p className="text-sm text-muted-foreground mt-1">Average save rate</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">10 min</p>
              <p className="text-sm text-muted-foreground mt-1">Setup time</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary">£0</p>
              <p className="text-sm text-muted-foreground mt-1">Cost if we save nobody</p>
            </div>
          </div>
        </motion.div>
      </div>

    </section>
  );
}
