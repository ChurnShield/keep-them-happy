import { Quote } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function Testimonials() {
  const navigate = useNavigate();

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
            Why I Built ChurnShield
          </span>
          <h2 className="text-3xl md:text-4xl font-bold">
            Your success is my success
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
              I was researching churn reduction tools for a SaaS project and found the usual suspects — Churnkey, Raaft, and others. They all wanted £300-500/month upfront, whether they saved a single customer or not.
            </p>
            <p>
              That felt backwards.
            </p>
            <p>
              Why should you pay hundreds of pounds monthly for a tool that might not work? And if it does work, why shouldn't the pricing reflect that?
            </p>
            <p>
              So I built ChurnShield myself. I tested it with real Stripe subscriptions, real cancel flows, and real retention offers. It works.
            </p>
            <p>
              The difference: <strong className="text-foreground">you only pay when it actually saves a customer.</strong> 20% of saved revenue, capped at £500/month. If ChurnShield saves nobody, you pay nothing.
            </p>
            <p>
              Your success is my success. That's how it should be.
            </p>
          </div>

          {/* Signature */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-foreground font-semibold">— Andy, Founder</p>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          <Button
            onClick={() => navigate('/auth')}
            size="lg"
            className="bg-gradient-to-r from-primary to-[hsl(187_85%_53%)] text-primary-foreground font-semibold hover:opacity-90 transition shadow-lg"
          >
            Get Started Free
          </Button>
          <p className="text-sm text-muted-foreground">
            Start saving customers today
          </p>
        </motion.div>
      </div>
    </section>
  );
}
