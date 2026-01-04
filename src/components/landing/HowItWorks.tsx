import { motion } from "framer-motion";
import { Plug, Eye, MessageSquareText, TrendingUp, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: <Plug className="w-6 h-6" />,
    title: "Connect Stripe in seconds",
    description:
      "One-click integration with your Stripe account. No code, no engineers, no complex setup. You'll be live in under 2 minutes.",
    highlight: "2-minute setup",
  },
  {
    number: "02",
    icon: <Eye className="w-6 h-6" />,
    title: "See every failed payment as it happens",
    description:
      "The moment a payment fails, it appears in your dashboard - categorized by reason (expired card, insufficient funds, bank decline). No more silent failures hiding in Stripe logs.",
    highlight: "Instant visibility",
  },
  {
    number: "03",
    icon: <MessageSquareText className="w-6 h-6" />,
    title: "Know exactly what to do",
    description:
      "Each at-risk payment comes with recommended actions and ready-to-send message templates. Reach out to customers before they churn - with the right message for their specific situation.",
    highlight: "Actionable recovery",
  },
  {
    number: "04",
    icon: <TrendingUp className="w-6 h-6" />,
    title: "You only pay for results",
    description:
      "When a failed payment is recovered, we track it automatically. You see exactly what was saved - and you only pay 20% of recovered revenue. No saves, no bill.",
    highlight: "Performance-based",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative bg-gradient-to-b from-background to-card text-foreground py-24 md:py-32 border-t border-border/20 overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block text-primary text-sm font-semibold uppercase tracking-widest mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            From churn risk to{" "}
            <span className="gradient-text">recovered revenue</span> in 4 simple
            steps.
          </h2>
          <p className="text-muted-foreground text-lg">
            Stripe handles retries. We handle everything else - visibility, tracking, actions, and proof.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
              className="relative group"
            >
              <div className="flex gap-5 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-primary/30 hover:bg-white/[0.07] transition-all duration-300 h-full">
                {/* Step Number */}
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg group-hover:bg-primary/20 transition-colors">
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-primary">{step.icon}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary/80">
                      {step.highlight}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector arrow (hidden on last item and on mobile) */}
              {index < steps.length - 1 && index % 2 === 0 && (
                <div className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 text-primary/40">
                  <ArrowRight className="w-6 h-6" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA teaser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground">
            Ready to stop losing revenue to preventable churn?{" "}
            <a
              href="#pricing"
              className="text-primary hover:underline font-medium"
            >
              See our zero-risk pricing →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
