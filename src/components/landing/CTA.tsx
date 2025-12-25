import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CTA() {
  const navigate = useNavigate();

  const handleStartTrial = () => {
    // Navigate to pricing section to select a plan and start Stripe Checkout
    navigate('/#pricing');
  };
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-card/50" />
      <div className="absolute inset-0 hero-glow opacity-50" />
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative rounded-3xl border border-primary/20 bg-card/80 backdrop-blur-xl p-12 md:p-16 text-center overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
            
            <div className="relative">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg shadow-primary/30 mb-8">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>

              {/* Heading */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-balance mb-6">
                Ready to stop losing customers?
              </h2>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                Join hundreds of SaaS companies using ChurnShield to reduce churn, recover revenue, 
                and build lasting customer relationships.
              </p>

              {/* CTA Button */}
              <Button 
                variant="hero" 
                size="xl" 
                className="group"
                onClick={handleStartTrial}
              >
                Start Your Free Trial
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>

              {/* Trust note */}
              <p className="mt-8 text-sm text-muted-foreground">
                30-day free trial • No credit card required • Setup in under 2 hours
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
